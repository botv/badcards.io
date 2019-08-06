import React from 'react';
import io from 'socket.io-client';

class Session {
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

	constructor(nickname) {
		this.nickname = nickname;

		// Constants (class properties not enabled)
		this.blankCard = { id: -1, text: '' };

		// Socket
		this.socket = io.connect('/', {
			forceNew: true
		});
	}

	join(game) {
		this.socket.emit('self.join.req', game, this.nickname);
	}

	getBlankCards(cardCount) {
		let self = this;
		return Array(cardCount).map(() => self.blankCard);
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
				gameInfo.table = this.getBlankCards(gameInfo.table.length);
			} else {
				gameInfo.table = this.combineCards(gameInfo.table);
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

	onShowCards(callback) {
		this.socket.on('game.cards.show', callback);
	}

	onRoundOver(callback) {
		this.socket.on('game.round.winner.player', callback);
		this.socket.on('game.round.winner.self', (cards, scores) => {
			callback(this.nickname, cards, scores)
		});
	}

	submitCard(card) {
		this.socket.emit('self.submit.res', card);
	}

	selectCard(card) {
		this.socket.emit('self.select.res', card);
	}
}

export default Session;