let Game = require('../game');
const crypto = require('crypto');

class GameList {

	// In charge of managing games
	constructor() {
		// List of games
		this.games = [];
	}

	// Create a new game, game must be initialized with one player
	newGame(options) {
		// Generate gameId
		let ids = this.games.map(game => game.id);
		let id = crypto.randomBytes(20).toString('hex');

		// Make sure gameId is unique
		while (ids.includes(id)) { id = crypto.randomBytes(20).toString('hex'); }

		let newGame = new Game(id, options);

		let self = this;
		newGame.destructionCallback = (gameId)=>{
			self.destroyGame(gameId);
		};
		this.games.push(newGame);

		return newGame;
	}

	// Add player to game at request
	joinGame(gameId, socket, name) {
		let gamesWithId = this.games.filter(game => game.id === gameId);

		// If no games match id, reject
		if (gamesWithId.length < 1) {
			console.log('game not found');
			return socket.emit('self.join.res', false);
		}

		let game = gamesWithId[0];
		game.addPlayer(socket, name,(success)=>{
			// Either reject or confirm the player's success
			socket.emit('self.join.res', success);
		});
	}

	// Remove a game from the list
	destroyGame(gameId) {
		let destroyedGameIndex = this.games.findIndex(game => game.id === gameId);

		// Return if game not found
		if (destroyedGameIndex < 0) { return; }

		// Remove game from array
		this.games.splice(destroyedGameIndex, 1);
	}

	// Get a random open gameId for joining a game
	getOpenGame() {
		// Get games that have not reached max players
		let openGames = this.games.filter(game => game.players.length < (game.options.maxPlayers || Game.defaultOptions.maxPlayers));

		// If no open games, create one
		if (openGames.length < 1) {
			return this.newGame().id;
		}

		// Get a random id from these games
		return openGames[Math.floor(Math.random() * openGames.length)].id;
	}

}

module.exports = GameList;