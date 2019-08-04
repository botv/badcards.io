class Player {

	// Player holds cards but Game is in charge of managing them with funcs
	constructor(socket, name) {
		this.socket = socket;
		this.name = name;

		// Card submission control
		this.cardSubmitted = null;
		this.hasSubmittedCard = false;

		// Card Czar control
		this.isCardCzar = false;
		this.hasChosen = false;
		this.cardChosen = null;

		// White cards
		this.cards = [];

		// Black cards won
		this.wonCards = [];
	}

	// Give the player a new hand
	newHand(deck, options) {
		this.cards = [];
		for (let i = 0; i < options.cardsPerHand; i++) {
			this.cards.push(deck.getWhiteCard());
		}
	}

	// Fill the player's current hand
	fillHand(deck, options) {
		for (let i = this.cards.count; i < options.cardsPerHand; i++) {
			this.cards.push(deck.getWhiteCard());
		}
	}

	// Set up socket for card submission
	requestCardSubmission(completion) {
		let self = this;
		this.socket.on('submitCard', (cardNumber)=>{
			// Return if the player is card czar or has already submitted a card
			if (self.hasSubmittedCard || self.isCardCzar) { return; }

			self.cardSubmitted = self.cards.filter(card => card.number === cardNumber);
			self.hasSubmittedCard = true;

			completion(self.cardSubmitted);
		});

		this.socket.emit('requestCardSubmision');
	}

	// Set up socket for card czar selection
	requestCardCzarSelection(cardList, completion) {
		let self = this;
		this.socket.on('selectCard', (cardNumber)=>{
			// Return if the player is not card czar oe has already chosen
			if (self.hasChosen || !self.isCardCzar) { return; }

			self.hasChosen = true;
			self.cardChosen = cardList.filter(card => card.number === cardNumber);

			completion(self.cardChosen);
		});

		this.socket.emit('requestCardSelection', cardList);
	}

	// Callback for player winning a black card
	winCard(card) {
		this.wonCards.push(card);
	}

	// Reset for the next round
	resetRound(deck, options, isCzar) {
		// Fill hand
		this.fillHand(deck, options);

		// Reset vars
		this.resetGameVars(isCzar);
	}

	// Reset for the next game
	reset(deck, options, isCzar) {
		// Set hand
		this.newHand(deck, options);

		// Reset vars
		this.resetGameVars(isCzar);

		// Reset won cards
		this.wonCards = [];
	}

	resetGameVars(isCzar) {
		// Reset vars
		this.hasChosen = false;
		this.hasSubmittedCard = false;
		this.cardChosen = null;
		this.cardSubmitted = null;

		this.isCardCzar = isCzar;
	}

}

module.exports = Player;