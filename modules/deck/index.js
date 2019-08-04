const { WhiteCard, BlackCard } = require('../card');
const cards = require('./cards');

class Deck {

	/* STATIC */

	// Helpers to get all cards
	static getBlackCards(cards) {
		let blackCards = [];

		for (let i = 0; i < cards.blackCards.length; i++) {
			let card = cards.blackCards[i];
			let cardNumber = cards.Base.black[i];
			blackCards.push(new BlackCard(card.text, cardNumber, card.pick));
		}

		return blackCards;
	}

	static getWhiteCards(cards) {
		let whiteCards = [];

		for (let i = 0; i < cards.whiteCards.length; i++) {
			let cardText = cards.whiteCards[i];
			let cardNumber = cards.Base.white[i];
			whiteCards.push(new WhiteCard(cardText, cardNumber));
		}

		return whiteCards;
	}

	// Deck is in charge of managing all cards
	constructor() {
		// Card lists
		this.black = this.getBlackCards(cards);
		this.white = this.getWhiteCards(cards);

		// Only use discard if black & white are empty
		this.blackDiscard = [];
		this.whiteDiscard = [];
	}

	// Get cards, move them to discard
	getWhiteCard() {
		// If white list is empty, reset it
		if (this.white.length === 0) {
			// Use .slice() to copy array, objects do not need to be copied
			this.white = this.whiteDiscard.slice();
			this.whiteDiscard = [];
		}

		// Random choice from white
		let card = this.white.pop(Math.floor(Math.random()*this.white.length));

		// Push card to discard
		this.whiteDiscard.push(card);

		// return card
		return card;
	}

	getBlackCard() {
		// If black list is empty, reset it
		if (this.black.length === 0) {
			// Use .slice() to copy array, objects do not need to be copied
			this.black = this.blackDiscard.slice();
			this.blackDiscard = [];
		}

		// Random choice from black
		let card = this.black.pop(Math.floor(Math.random()*this.black.length));

		// Push card to discard
		this.blackDiscard.push(card);

		// return card
		return card;
	}

}

module.exports = Deck;