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

	/* INSTANCE */

	// Deck is in charge of managing all cards
	constructor() {
		// Card lists
		this.black = Deck.getBlackCards(cards);
		this.white = Deck.getWhiteCards(cards);

		// Only use discard if black & white are empty
		this.blackDiscard = [];
		this.whiteDiscard = [];

		// Cards are inactive and inaccessable when in players hands
		this.blackInHand = [];
		this.whiteInHand = [];
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
		let cardIndex = Math.floor(Math.random()*this.white.length);
		let card = this.white[cardIndex];
		this.white.splice(cardIndex, 1);

		// Push card to inHand
		this.whiteInHand.push(card);

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
		let cardIndex = Math.floor(Math.random()*this.black.length);
		let card = this.black[cardIndex];
		this.black.splice(cardIndex, 1);

		// Push card to inhand
		this.blackInHand.push(card);

		// return card
		return card;
	}

	// Discard cards
	discardWhite(discardCard) {
		// Get index of card in inHand
		let index = this.whiteInHand.findIndex(card => card.id === discardCard.id);

		// Remove card from inHand
		this.whiteInHand.splice(index, 1);

		// Add card to discard
		this.whiteDiscard.push(discardCard)
	}

	discardBlack(discardCard) {
		// Get index of card in inHand
		let index = this.blackInHand.findIndex(card => card.id === discardCard.id);

		// Remove card from inHand
		this.blackInHand.splice(index, 1);

		// Add card to discard
		this.blackDiscard.push(discardCard)
	}

}

module.exports = Deck;