class Player {

	// Player holds cards but Game is in charge of managing them with funcs
	constructor(socket, name) {
		this.socket = socket;
		this.name = name;

		// Card submission control
		this.cardsSubmitted = [];
		this.hasSubmittedCard = false;

		// Card Czar control
		this.isCardCzar = false;
		this.hasChosen = false;
		this.cardChosen = null;

		// White cards
		this.cards = [];

		// Black cards won
		this.wonCards = [];

		// Set up submission / selection
		this.setUpSocket();
	}

	setUpSocket() {
		this.socket.on('self.submit.res', (cardList)=>{
			// Reject if no black card or submission completion
			if (!this.blackCard || !this.submissionCompletion) { return; }

			// Reject if the player is card czar or has already submitted a card
			if (this.hasSubmittedCard || this.isCardCzar) { return this.submissionCompletion(false); }

			// Reject if the cardNumberList is shorter than the number of spaces
			if (cardList.length < this.blackCard.spaces) { return this.submissionCompletion(false); }

			// Get all cards submitted
			for (let i = 0; i < this.blackCard.spaces; i++) {
				// Get card, reject if card numbers not in cards
				let cardChosenIndex = this.cards.findIndex(card => card.id === cardList[i].id);
				if (cardChosenIndex < 0) { return this.submissionCompletion(false) }
				let cardChosen = this.cards[cardChosenIndex];

				// Remove card from cards, add to cardsSubmitted
				this.cards.splice(cardChosenIndex, 1);
				this.cardsSubmitted.push(cardChosen);
			}
			this.hasSubmittedCard = true;

			// Send cards to player with selected cards removed
			this.sendCards();

			this.submissionCompletion(this.cardsSubmitted);
		});

		this.socket.on('self.select.res', (cardSelected)=>{
			// Return if the player is not card czar oe has already chosen
			if (this.hasChosen || !this.isCardCzar) { return; }

			this.hasChosen = true;
			let cardChosen = this.cardList.filter(card => card[0].id === cardSelected.id);

			// If card was not in cardlist, reject
			if (cardChosen.length < 0) { return this.selectionCompletion(false) }

			this.cardChosen = cardChosen[0];

			this.selectionCompletion(this.cardChosen);
		});
	}

	// Give the player a new hand
	newHand(deck, options) {
		// Set hand
		this.cards = [];
		for (let i = 0; i < options.cardsPerHand; i++) {
			this.cards.push(deck.getWhiteCard());
		}

		// Emit cards to player
		this.sendCards();
	}

	// Fill the player's current hand
	fillHand(deck, options) {
		// Fill hand
		for (let i = this.cards.length; i < options.cardsPerHand; i++) {
			this.cards.push(deck.getWhiteCard());
		}

		// Emit cards to player
		this.sendCards();
	}

	sendCards() {
		// Send event self.cards (cards)
		this.socket.emit('self.cards', this.cards);
	}

	// Set up socket for card submission
	requestCardSubmission(blackCard, completion) {
		this.blackCard = blackCard;
		this.submissionCompletion = completion;

		this.socket.emit('self.submit.req');
	}

	// Set up socket for card czar selection
	requestCardCzarSelection(cardList, completion) {
		this.cardList = cardList;
		this.selectionCompletion = completion;

		this.socket.emit('self.select.req', cardList);
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
		this.cardsSubmitted = [];

		this.isCardCzar = isCzar;
	}

}

module.exports = Player;