import React from 'react';
import io from 'socket.io-client';
import {Redirect} from "react-router-dom";

class PlayerClient {

	/* STATIC func */
	static combineCards(cardList) {
		if (cardList.length > 0) {
			return cardList.map((cards) => {
				let text = cards[0].text;
				for (let i = 1; i < cards.length; i++) {
					text += `<hr>${cards[i].text}`;
				}
				return {id: cards[0].id, text: text};
			});
		} else {
			return cardList;
		}
	}

	/* INSTANCE */
	constructor(name, component) {
		this.name = name;

		// Interval refs for countdown
		this.submitCountdown = null;
		this.selectCountdown = null;

		// Keep a reference to the component
		this.component = component;

		// Constants (class properties not enabled)
		this.blankCard = {
			id: -1,
			text: ''
		};

		// Socket
		this.socket = io.connect('/', {
			forceNew: true
		});
		this.setUpSocket();
	}

	// Join a game
	join(game) {
		this.socket.emit('self.join.req', game, this.name);
	}

	// Log a message
	log(message) {
		// Log in the chat
		this.component.setState({
			chat: (this.component.state.chat || []).concat(message)
		});
		// DEV: console log
		console.log(message);
	}

	// Log more important messages in a separate, bigger area
	alert(message) {
		// Add to game alerts
		this.component.setState({
			gameAlerts: (this.component.state.gameAlerts || []).concat(message)
		});
		// DEV: console log
	}

	getBlankCards(cardCount) {
		let self = this;
		return Array(cardCount).map(_=>self.blankCard);
	}

	// Set up socket for all events
	setUpSocket() {
		let player = this;

		// On join, redirect if failed
		this.socket.on('self.join.res', (success) => {
			console.log(`success: ${success}`);
			if (!success) {
				// Redirect to home page
				player.component.redirect('/');
			}
		});

		// On receiving cards, update hand
		this.socket.on('self.cards', (cards) => {
			// Set state
			player.component.setState({
				hand: cards
			});
		});

		// On game info, update meaningful vars
		this.socket.on('game.info', (gameInfo) => {
			// If cards are not visible, remove text from cards
			if (!gameInfo.cardsAreVisible) {
				gameInfo.table = player.getBlankCards(gameInfo.table.length);
			} else {
				// Parse texts from multiple cards into one
				gameInfo.table = PlayerClient.combineCards(gameInfo.table);
			}

			player.component.setState({
				tableau: gameInfo.table,
				blackCard: gameInfo.blackCard || player.blankCard,
				scores: gameInfo.scores
			});
		});

		// On player join, log name
		this.socket.on('game.player.join', (name)=>{
			player.log(`<b>${name} has joined the game.</b>`);
		});

		// On disconnect, log name and isCzar
		this.socket.on('game.player.disconnect', (name, id, isCzar)=>{
			player.log(`<b>${name} has left the game.</b>`);
			if (isCzar) { player.log('<b>They were the Card Czar, so the last round has been skipped.</b>'); }
		});

		// On chat receive, log name and message
		this.socket.on('chat.receive', (name, message)=>{
			player.log(`<b>${name}:</b> ${message}`)
		});

		// On game start, add to game alerts and set game config, reset winner black cards, reset round count
		this.socket.on('game.start', (gameConfig)=>{
			player.component.setState({
				gameConfig: gameConfig,
				winnerBlackCards: [],
				round: 0
			});
			player.alert('A New Game is Starting');
		});

		// On winner, end game and alert winner
		this.socket.on('game.winner.player', (name, cards)=>{
			player.alert(`${name} Won the Game!`);
			// Set state to show the winner's black cards
			player.component.setState({
				winnerBlackCards: cards
			});
		});

		this.socket.on('game.winner.self', (cards)=>{
			player.alert('You Won the Game!');
			// Set state to show the winner's black cards
			player.component.setState({
				winnerBlackCards: cards
			})
		});

		// On round start, update round count, add to game alerts, set black card, and reset winner white cards, clear tableau
		this.socket.on('game.round.start', (blackCard, cardCzarName, isCardCzar, scores)=>{
			player.component.setState({
				round: player.component.state.round + 1,
				blackCard: blackCard,
				winnerWhiteCards: [],
				isCardCzar: isCardCzar,
				scoreboard: scores,
				tableau: []
			});
			player.alert(`Round ${player.component.state.round}: ${cardCzarName} is the Card Czar`);
		});

		// On card submit req, set state to allow card submission, set submit countdown
		this.socket.on('self.submit.req', ()=>{
			player.component.setState({
				canSubmitCard: true
			});

			player.setSubmitCountdown()
		});

		// On select req, set state to allow card selection and disable card submission, set select countdown
		this.socket.on('self.select.req', ()=>{
			player.component.setState({
				canSelectCard: true,
				canSubmitCard: false
			});
			player.setSelectCountdown();
		});

		// On submit cards, log that the player has submitted their cards, add blank card to tableau
		this.socket.on('game.cards.submit', (name, spaces, cardCount)=>{
			player.log(`<b>${name} has submitted their card${spaces > 1 ? 's' : ''}.</b>`);
			player.component.setState({
				tableau: player.getBlankCards(player.component.tableau.length)
			});
		});

		// On show cards, alert that cards have been submitted, set the tableau, clear the countdown
		this.socket.on('game.cards.show', (cards)=>{
			let newCards = PlayerClient.combineCards(cards);
			player.component.setState({
				tableau: newCards,
				submitCountdownTime: 0
			});
			clearInterval(player.submitCountdown);
			player.alert('All Players have Submitted their Cards')
		});

		// On round winner and round won, set canSelectCard to false, show winner, show cards, clear countdown
		this.socket.on('game.round.winner.player', (name, cards, scores)=>{
			player.component.setState({
				winnerWhiteCards: cards,
				scoreboard: scores,
				selectCountdownTime: 0
			});
			clearInterval(player.selectCountdown);
			player.alert(`${name} Won the Round!`);
		});

		this.socket.on('game.round.winner.self', (cards, scores)=>{
			player.component.setState({
				winnerWhiteCards: cards,
				scoreboard: scores,
				selectCountdownTime: 0
			});
			clearInterval(player.selectCountdown);
			player.alert(`You Won the Round!`);
		});
	}

	setSubmitCountdown() {
		// Get time and set state
		let time = this.component.state.gameConfig.cardSubmissionTime;
		this.component.setState({
			submitCountdownTime: time
		});

		// Set interval to subtract 1 from time each second
		let self = this;
		this.submitCountdown = setInterval(()=>{
			let currentTime = self.component.state.submitCountdownTime - 1;
			self.component.setState({
				submitCountdownTime: currentTime
			});

			// Clear interval if timer is over
			if (currentTime === 0) {
				clearInterval(self.submitCountdown)
			}
		}, 1000);
	}

	setSelectCountdown() {
		// Get time and set state
		let time = this.component.state.gameConfig.cardSelectionTime;
		this.component.setState({
			selectCountdownTime: time
		});

		// Set interval to subtract 1 from time each second
		let self = this;
		this.selectCountdown = setInterval(()=>{
			let currentTime = self.component.state.selectCountdownTime - 1;
			self.component.setState({
				selectCountdownTime: currentTime
			});

			// Clear interval if timer is over
			if (currentTime === 0) {
				clearInterval(self.selectCountdown)
			}
		}, 1000);
	}

	submitCard(cards) {
		this.socket.emit('self.submit.res', cards);
	}

	selectCard(card) {
		this.socket.emit('self.select.res', card);
	}
}

export default PlayerClient;