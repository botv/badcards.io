class Card {

	constructor(text, number) {
		this.text = text;
		this.number = number;
	}

}

class WhiteCard extends Card {

	constructor(text, number) {
		super(text, number);
	}

}

class BlackCard extends Card {

	constructor(text, number, spaces) {
		super(text, number);
		this.spaces = spaces;
	}

}

module.exports = { Card: Card, WhiteCard: WhiteCard, BlackCard: BlackCard};