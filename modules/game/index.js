const Player = require('../player');
const Deck = require('../deck');

class Game {

	/* STATIC */

	// Default game options
	// static defaultOptions = {
	// 	cardsPerHand: 7,
	// 	cardsToWin: 7,
	// 	maxPlayers: 10,
	// 	minPlayers: 3,
	// 	gameRestartTime: 20,
	// 	cardSelectionTime: 90,
	// 	cardSubmissionTime: 30
	// };
	// DEV:
	static defaultOptions = {
		cardsPerHand: 7,
		cardsToWin: 2,
		maxPlayers: 5,
		minPlayers: 3,
		gameRestartTime: 20,
		cardSelectionTime: 1000,
		cardSubmissionTime: 1000
	};

	constructor(id, options) {
		this.options = options || Game.defaultOptions;

		// Players & cards
		this.players = [];
		this.playersInRound = 0;
		this.czar = null;
		this.deck = new Deck();

		// Black card for the round
		this.blackCard = null;

		// White cards on the table
		this.table = [];

		// Assign card numbers on table to players so that the player can be received by their card submission
		this.tableMap = {};

		// Timeout for card submission (players)
		this.submissionTimeout = null;
		this.submissionOpen = false;

		// Timeout for card selection (card czar)
		this.selectionTimeout = null;
		this.selectionOpen = false;

		// Game state
		this.gameHasStarted = false;
		this.gameHasEnded = false;

		// Game id
		this.id = id;

		// Destruction callback will be set by the game_list post init
		this.destructionCallback = ()=>{};
	}


	/* RENDERING / INFO / UTILITY */

	setupChat(socket) {
		// Relay message from socket to all players
		socket.on('chat.send', (message)=>{
			this.players.forEach((player)=>{
				// Emit chat.receive event (playerName, message
				player.socket.emit('chat.receive', player.name, message);
			});
		});
	}

	sendGameInfo(player) {
		let gameInfo = {
			table: this.table,
			players: this.players.map(player => player.name),
			blackCard: this.blackCard,
			gameHasStarted: this.gameHasStarted,
			cardsAreVisible: this.selectionOpen,
			scores: this.getScores()
		};

		// Send game info
		player.socket.emit('game.info', gameInfo);
	}

	/* GAME START AND END EVENTS */

	addPlayer(socket, name, completion) {
		let newPlayer;
		// If max players has not been reached, send game id and add to list
		// Otherwise, reject join
		if (this.players.length !== (this.options.maxPlayers || Game.defaultOptions.maxPlayers)) {
			newPlayer = new Player(socket, name);
			this.players.push(newPlayer);
			completion(true);
		} else {
			return completion(false)
		}

		// Log player join to all other players
		this.players.forEach((player)=>{
			// Send game.player.join event (name, id)
			player.socket.emit('game.player.join', newPlayer.name, newPlayer.socket.id);
		});

		// If min players has been reached, start the game
		if ((this.players.length >= (this.options.minPlayers || Game.defaultOptions.minPlayers)) && !this.gameHasStarted) {
			this.startGame();
		}

		// Setup socket for disconnect
		socket.on('disconnect', ()=>{
			this.removePlayer(socket, (gameIsEmpty)=>{
				// destroy self if game is empty
				if (gameIsEmpty) {
					this.destructionCallback(this.id);
				}
			});
		});

		// Setup chat
		this.setupChat(socket);

		// Send game info
		this.sendGameInfo(newPlayer);
	}

	removePlayer(socket, completion) {
		// Remove player from list
		let removedPlayerIndex = this.players.findIndex(player => player.socket.id === socket.id);
		let removedPlayer = this.players[removedPlayerIndex];
		this.players.splice(removedPlayerIndex, 1);

		// If player was czar, skip round and discard black card
		// Otherwise, remove their card from the table
		if (removedPlayer.isCardCzar) {
			this.deck.discardBlack(this.blackCard);

			// clear timeouts just in case
			clearTimeout(this.submissionTimeout);
			clearTimeout(this.selectionTimeout);

			this.nextRound();
		} else {
			if (removedPlayer.cardsSubmitted.length > 0) {
				let cardId = removedPlayer.cardsSubmitted[0].id;
				let cardIndex = this.table.findIndex(cardList=>cardList[0].id === cardId);
				if (cardIndex >=0 ) {
					this.table.splice(cardIndex, 1);
					this.players.forEach((player)=>{
						if (this.submissionOpen) {
							player.socket.emit('game.cards.remove.inisible', removedPlayer.name, this.blackCard.spaces, this.table.length);
						} else {
							player.socket.emit('game.cards.remove.visible', removedPlayer.name, this.table);
						}
					})
				}
			}
		}

		// Emit removal to all other players
		this.players.forEach((player)=>{
			// Send game.player.disconnect event (name, id, skipRound)
			player.socket.emit('game.player.disconnect', removedPlayer.name, removedPlayer.socket.id, removedPlayer.isCardCzar);
		});

		// If player list is empty, destroy game (completion false)
		if (this.players.length === 0) { completion(false); }
	}

	// Start the game
	startGame() {
		this.gameHasEnded = false;
		this.gameHasStarted = true;

		// Select czar
		let czarIndex = Math.floor(Math.random()*this.players.length);
		this.czar = this.players[czarIndex];

		// Reset deck
		this.deck = new Deck();

		this.players.forEach((player, index)=>{
			// Reset all players for game
			player.reset(this.deck, (this.options || Game.defaultOptions), (index === czarIndex));
			player.socket.emit('game.start', this.options || Game.defaultOptions);
		});

		// Start the round
		this.nextRound()
	}

	// End the game and restart in 20 seconds
	endGame(winner) {
		this.gameHasEnded = true;
		this.gameHasStarted = false;

		// Tell the players the winner
		this.players.forEach((player)=>{
			if (winner.socket.id === player.socket.id) {
				// Emit game.winner.self event (wonCards)
				player.socket.emit('game.winner.self', winner.wonCards);
			} else {
				// Emit game.winner.player event (name, wonCards)
				player.socket.emit('game.winner.player', winner.name, winner.wonCards);
			}
		});

		// Set timeout to restart game
		setTimeout(()=>{
			this.startGame();
		}, (this.options.gameRestartTime || Game.defaultOptions.gameRestartTime) * 1000)
	}

	/* GAME ROUND EVENTS */

	// Start the next round
	nextRound(winnerIndex) {
		// Select czar
		let czarIndex = winnerIndex == null ? Math.floor(Math.random()*this.players.length) : winnerIndex;
		this.czar = this.players[czarIndex];

		// Set player count
		this.playersInRound = this.players.length;

		// Select black card
		this.blackCard = this.deck.getBlackCard();

		// Discard all cards in the table
		this.discard();

		// Close all submissions
		this.submissionOpen = false;
		this.selectionOpen = false;

		// Reset table
		this.table = [];
		this.tableMap = {};

		this.players.forEach((player, index)=>{
			player.resetRound(this.deck, (this.options || Game.defaultOptions), (index === czarIndex));
		});

		// Start submission
		this.startRoundSubmission();
	}

	// Open submissions and request
	startRoundSubmission() {
		// Open submissions
		this.submissionOpen = true;

		this.players.forEach((player)=>{
			// Reset all players for game
			player.socket.emit('game.round.start', this.blackCard, this.czar.name, player.isCardCzar, this.getScores());

			// Request cards from all players but czar
			if (!player.isCardCzar) {
				player.requestCardSubmission(this.blackCard, (cards)=>{
					// Return if submission time is over
					if (!this.submissionOpen) { return; }

					// Return if cards === false
					if (!cards) { return; }

					// Push cards to table
					this.table.push(cards);

					// Set first index of card selection to reference the player in tableMap
					this.tableMap[cards[0].id] = player;

					// Alert all other players that the card has been submitted
					this.players.forEach((playerNest)=>{
						// Send the game.cards.submit event (playerName, cardsPerGroup, cardGroupCount)
						playerNest.socket.emit('game.cards.submit', player.name, this.blackCard.spaces, this.table.length);
					});

					// If this submission has filled the table, request selection
					if (this.playersInRound - 1 === this.table.length) {
						this.startRoundSelection();
					}
				});
			}
		});

		// Set a timeout to start the selection
		this.submissionTimeout = setTimeout(()=>{
			this.startRoundSelection();
		}, (this.options.cardSubmissionTime || Game.defaultOptions.cardSubmissionTime) * 1000);
	}

	// Close submissions and request selection
	startRoundSelection() {
		// Close submissions, open selection
		this.submissionOpen = false;
		this.selectionOpen = true;

		// Send table to all players so that they can see submissions
		this.players.forEach((player)=>{
			// Emit the game.cards.show event (cardList)
			player.socket.emit('game.cards.show', this.table);
		});

		// Request selection
		this.czar.requestCardCzarSelection(this.table, (cardList)=>{
			// Return if selection is not open
			if (!this.selectionOpen) { return; }

			// Close if no card or if card number not in table map
			if (!cardList || cardList.length < 1 || !this.tableMap.hasOwnProperty(cardList[0].id)) { return; }

			// Get winner and win card
			let winner = this.tableMap[cardList[0].id];
			winner.winCard(this.blackCard);
			let winnerIndex = this.players.findIndex(player => player.socket.id === winner.socket.id);

			// Discard black
			this.deck.discardBlack(this.blackCard);

			// End round
			this.endRound(winnerIndex);
		});

		// Set a timeout to end the round
		this.selectionTimeout = setTimeout(()=>{
			// Select a random winner
			let winnerIndex = Math.floor(Math.random()*this.playersInRound);
			let winner = this.players[winnerIndex];
			winner.winCard(this.blackCard);

			// Discard black
			this.deck.discardBlack(this.blackCard);

			// End round
			this.endRound(winnerIndex);
		}, (this.options.cardSelectionTime || Game.defaultOptions.cardSelectionTime) * 1000)
	}

	// End a round
	endRound(winnerIndex) {
		// Close selection & kill timeout
		this.selectionOpen = false;
		clearTimeout(this.selectionTimeout);

		// Update score
		let score = this.getScores();

		// Emit winner and their cards to all players
		let winner = this.players[winnerIndex];
		this.players.forEach((player)=>{
			if (winner.socket.id === player.socket.id) {
				// Emit game.round.winner.self event (winnerCards, gameScore)
				player.socket.emit('game.round.winner.self', winner.cardsSubmitted, score);
			} else {
				// Emit game.round.winner.player event (winnerName, winnerCards, gameScore)
				player.socket.emit('game.round.winner.player', winner.name, winner.cardsSubmitted, score);
			}
		});

		// Check to see if game is over
		let gameWinnerIndex = this.players.findIndex( (player)=>{
			return player.wonCards.length >= (this.options.cardsToWin || Game.defaultOptions.cardsToWin)
		});
		// If no game winner, next round
		if (gameWinnerIndex < 0) {
			// Start next round
			this.nextRound(winnerIndex);
		} else {
			// End game
			this.endGame(this.players[gameWinnerIndex]);
		}
	}

	// Get score array
	getScores() {
		return this.players.map((player) => {
			return {
				name: player.name,
				score: player.wonCards.length
			}
		})
	}

	// Discard the table
	discard() {
		this.table.forEach((card)=>{
			this.deck.discardWhite(card)
		})
	}

}

module.exports = Game;