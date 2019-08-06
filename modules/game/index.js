const Player = require('../player');
const Deck = require('../deck');

class Game {

	/* STATIC */

	// Default game options
	static defaultOptions = {
		cardsPerHand: 7,
		cardsToWin: 7,
		maxPlayers: 10,
		minPlayers: 3,
		gameRestartTime: 20,
		cardSelectionTime: 90,
		cardSubmissionTime: 30
	};

	constructor(id, options) {
		this.options = options || Game.defaultOptions;

		// Players & cards
		this.players = [];
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
		let self = this;
		socket.on('chat.send', (message)=>{
			self.players.forEach((player)=>{
				// Emit chat.receive event (playerName, message
				player.socket.emit('chat.receive', player.nickname, message);
			});
		});
	}

	sendGameInfo(player) {
		let gameInfo = {
			table: this.table,
			players: this.players.map(player => player.nickname),
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
		if (this.players.count >= (this.options.minPlayers || Game.defaultOptions.minPlayers)) {
			this.startGame();
		}

		// Setup socket for disconnect
		let self = this;
		socket.on('disconnect', ()=>{
			self.removePlayer(socket, (gameIsEmpty)=>{
				// destroy self if game is empty
				if (gameIsEmpty) {
					self.destructionCallback(self.id);
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
		if (removedPlayer.isCardCzar) {
			this.deck.discardBlack(this.blackCard);

			// clear timeouts just in case
			clearTimeout(this.submissionTimeout);
			clearTimeout(this.selectionTimeout);

			this.nextRound();
		}

		// Emit removal to all other players
		this.players.forEach((player)=>{
			// Send game.player.disconnect event (name, id, skipRound)
			player.socket.emit('game.player.disconnect', removedPlayer.nickname, removedPlayer.socket.id, removedPlayer.isCardCzar);
		});

		// If player list is empty, destroy game (completion false)
		if (this.players.count === 0) { completion(false); }
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

		let self = this;
		this.players.forEach((player, index)=>{
			// Reset all players for game
			player.reset(self.deck, (self.options || Game.defaultOptions), (index === czarIndex));
			player.socket.emit('game.start', self.options || Game.defaultOptions);
		});
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
				player.socket.emit('game.winner.player', winner.nickname, winner.wonCards);
			}
		});

		// Set timeout to restart game
		let self = this;
		setTimeout(()=>{
			self.startGame();
		}, (this.options.gameRestartTime || Game.defaultOptions.gameRestartTime))
	}

	/* GAME ROUND EVENTS */

	// Start the next round
	nextRound(winnerIndex) {
		// Select czar
		let czarIndex = (winnerIndex || Math.floor(Math.random()*this.players.length));
		this.czar = this.players[czarIndex];

		// Select black card
		this.blackCard = this.deck.getBlackCard();

		// Discard all cards in the table
		this.discard();

		// Close all submissions
		this.submissionOpen = false;
		this.selectionOpen = false;

		// Start submission
		this.startRoundSubmission(czarIndex);
	}

	// Open submissions and request
	startRoundSubmission(czarIndex) {
		// Open submissions
		this.submissionOpen = true;

		let self = this;
		this.players.forEach((player, index)=>{
			// Reset all players for game
			player.resetRound(self.deck, (self.options || Game.defaultOptions), (index === czarIndex));
			player.socket.emit('game.round.start', self.blackCard, self.czar.nickname, player.isCardCzar, self.getScores());

			// Request cards from all players but czar
			if (!player.isCardCzar) {
				player.requestCardSubmission(self.blackCard, (cards)=>{
					// Return if submission time is over
					if (!self.submissionOpen) { return; }

					// Return if cards === false
					if (!cards) { return; }

					// Push cards to table
					self.table = self.table.push(cards);

					// Set first index of card selection to reference the player in tableMap
					self.tableMap[cards[0].id] = player;

					// Alert all other players that the card has been submitted
					self.players.forEach((playerNest)=>{
						// Send the game.cards.submit event (playerName, cardsPerGroup, cardGroupCount)
						playerNest.socket.emit('game.cards.submit', playerNest.nickname, self.blackCard.spaces, self.table.length);
					});

					// If this submission has filled the table, request selection
					if (self.players.length === self.table.length) {
						self.startRoundSelection();
					}
				});
			}
		});

		// Set a timeout to start the selection
		this.submissionTimeout = setTimeout(()=>{
			self.startRoundSelection();
		}, (this.options.cardSubmissionTime || Game.defaultOptions.cardSubmissionTime));
	}

	// Close submissions and request selection
	startRoundSelection() {
		// Close submissions, open selection
		this.submissionOpen = false;
		this.selectionOpen = true;

		// Send table to all players so that they can see submissions
		let self = this;
		this.players.forEach((player)=>{
			// Emit the game.cards.show event (cardList)
			player.socket.emit('game.cards.show', self.table);
		});

		// Request selection
		this.czar.requestCardCzarSelection(this.table, (card)=>{
			// Return if selection is not open
			if (!self.selectionOpen) { return; }

			// Close if no card or if card number not in table map
			if (!card || !self.tableMap.hasOwnProperty(card.id)) { return; }

			// Get winner and win card
			let winner = self.tableMap[card.id];
			winner.winCard(self.blackCard);
			let winnerIndex = self.players.findIndex(player => player.socket.id === winner.socket.id);

			// Discard black
			self.deck.discardBlack(self.blackCard);

			// End round
			self.endRound(winnerIndex);
		});

		// Set a timeout to end the round
		this.selectionTimeout = setTimeout(()=>{
			// Select a random winner
			let winnerIndex = Math.floor(Math.random()*self.players.length);
			let winner = self.players[winnerIndex];
			winner.winCard(self.blackCard);

			// Discard black
			self.deck.discardBlack(self.blackCard);

			// End round
			self.endRound(winnerIndex);
		})
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
				player.socket.emit('game.round.winner.player', winner.nickname, winner.cardsSubmitted, score);
			}
		});

		// Check to see if game is over
		let self = this;
		let gameWinnerIndex = this.players.findIndex( (player)=>{
			return player.wonCards.length >= (self.options.cardsToWin || Game.defaultOptions.cardsToWin)
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
				name: player.nickname,
				score: player.wonCards.length
			}
		})
	}

	// Discard the table
	discard() {
		let self = this;
		this.table.forEach((card)=>{
			self.deck.discardWhite(card)
		})
	}

}

module.exports = Game;