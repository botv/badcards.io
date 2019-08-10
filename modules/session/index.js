import React from 'react';
import io from 'socket.io-client';

class Session {
	/* Combine card texts to be displayed on the screen
		 Ex:
		 		input: [["card 1", "card 2"], ["card 3", "card 4"]]
		 		output: ["card 1<hr>card 2", "card 3<hr>card 4"]
	 */
	static combineCards(cardList) {
		if (cardList.length > 0) {
			return cardList.map((cards) => {
				let text = cards[0].text;
				for (let i = 1; i < cards.length; i++) {
					text += `<hr>${cards[i].text}`;
				}
				return { id: cards[0].id, text: text };
			});
		} else {
			return cardList;
		}
	}

	static getBlankCards(cardCount) {
		return Array(cardCount).fill().map((_, index)=>{
			return {
				id: -index,
				text: ''
			}
		});
	}

	constructor(nickname) {
		this.nickname = nickname;

		// Socket
		this.socket = io.connect('/', {
			forceNew: true
		});

		// Constants (class properties not enabled)
		this.blankCard = {
			id: -999,
			text: ''
		};
	}

	join(game) {
		this.socket.emit('self.join.req', game, this.nickname);
	}

	onJoin(callback) {
		this.socket.on('self.join.res', success => {
			callback(!success);
		});
	}

	onReceiveCards(callback) {
		this.socket.on('self.cards', callback);
	}

	onReceiveGameInfo(callback) {
		this.socket.on('game.info', gameInfo => {
			if (!gameInfo.cardsAreVisible) {
				gameInfo.table = Session.getBlankCards(gameInfo.table.length);
			} else {
				gameInfo.table = Session.combineCards(gameInfo.table);
			}

			callback(gameInfo)
		});
	}

	onPlayerJoin(callback) {
		this.socket.on('game.player.join', callback);
	}

	onPlayerDisconnect(callback) {
		this.socket.on('game.player.disconnect', callback);
	}

	onReceiveChatMessage(callback) {
		this.socket.on('chat.receive', callback);
	}

	onGameStart(callback) {
		this.socket.on('game.start', callback);
	}

	onGameOver(callback) {
		this.socket.on('game.winner.player', callback);
		this.socket.on('game.winner.self', () => {
			callback(this.nickname);
		});
	}

	onRoundStart(callback) {
		this.socket.on('game.round.start', callback);
	}

	onSubmitRequest(callback) {
		this.socket.on('self.submit.req', callback);
	}

	onSelectRequest(callback) {
		this.socket.on('self.select.req', callback);
	}

	onSubmit(callback) {
		this.socket.on('game.cards.submit', callback);
	}

	onRemove(callback) {
		this.socket.on('game.cards.remove.invisible', callback);
	}

	onRemoveVisible(callback) {
		this.socket.on('game.cards.remove.visible', callback)
	}

	onShowCards(callback) {
		this.socket.on('game.cards.show', callback);
	}

	onRoundOver(callback) {
		this.socket.on('game.round.winner.player', callback);
		this.socket.on('game.round.winner.self', (cards, scores) => {
			callback(this.nickname, cards, scores)
		});
	}

	onGameDestroyed(callback) {
		this.socket.on('game.destroy', callback);
	}

	toggleCardSelection(cardId, cardText) {
		let selectedCard = {
			id: cardId,
			text: cardText
		};

		// select
		this.selectCard(selectedCard);
	}

	toggleCardSubmission(cardId, cardText, submittedCards, blackCardCount, callback) {
		let submittedCard = {
			id: cardId,
			text: cardText
		};

		// Is the card in the array?
		let index = submittedCards.findIndex((card) => {return card.id === submittedCard.id});

		// If card not in array, add to array and submit if requirements met
		// If card in array, splice it
		if (index < 0) {
			submittedCards.push(submittedCard);
			if (submittedCards.length >= blackCardCount) {
				this.submitCards(submittedCards);
				callback(submittedCards, true, true);
			} else {
				callback(submittedCards, false, true);
			}
		} else {
			submittedCards.splice(index, 1);
			callback(submittedCards, false, false);
		}
	}

	submitCards(cards) {
		this.socket.emit('self.submit.res', cards);
	}

	selectCard(card) {
		this.socket.emit('self.select.res', card);
	}
}

export default Session;