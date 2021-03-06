import React from 'react';
import Layout from '../components/Layout';
import WhiteCard from '../components/WhiteCard';
import Swiper from 'react-id-swiper';
import BlackCard from '../components/BlackCard';
import { withRouter } from 'react-router-dom';
import { parse } from 'query-string';
import Session from '../modules/session';
import shortid from 'shortid';

class Play extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hand: [], czar: false, tableau: [], blackCard: {}, scores: [], isCzar: false, session: null };
	}

	componentDidMount() {
		// Set up player for game info managing and rendering
		const gameId = this.props.match.params.gameId;
		const name = parse(this.props.location.search).name || `user${shortid.generate()}`;

		// Set up player
		const session = new Session(name, this);

		// Join game
		session.join(gameId);

		// When player joins the game
		session.onJoin(err => {
			if (err) {
				return this.props.history.push('/');
			}

			console.log('Successfully joined the game!');
		});

		// When player receives a hand
		session.onReceiveCards(cards => {
			this.setState({ hand: cards });
		});

		// When game information is received
		session.onReceiveGameInfo(gameInfo => {
			this.setState({
				tableau: gameInfo.table,
				blackCard: gameInfo.blackCard || session.blankCard,
				scores: gameInfo.scores
			});
		});

		// When another player joins
		session.onPlayerJoin(nickname => {
			console.log(`${nickname} joined the game`);
		});

		// When another player disconnects
		session.onPlayerDisconnect(nickname => {
			console.log(`${nickname} left the game`);
		});

		// When a chat message is received
		session.onReceiveChatMessage((nickname, message) => {
			console.log(`${nickname}: ${message}`);
		});

		// When the game is started
		session.onGameStart(config => {
			console.log('The game is starting...');
			this.setState({
				config: config,
				winnerBlackCards: [],
				round: 0,
				instructions: 'Loading...',
				gameActive: true
			});
		});

		// When the game ends
		session.onGameOver(winner => {
			console.log(`${winner} won the game`);
		});

		// When the round starts
		session.onRoundStart((blackCard, czar, isCzar, scores) => {
			console.log('The round is starting');
			console.log(`${czar} is the Card Czar!`);
			// Set session again, it has been updated
			this.setState({
				blackCard,
				czar,
				isCzar,
				scores,
				tableau: [],
				submittedCards: [],
				session,
				hasSubmittedCard: false,
				hasSelectedCard: false,
				instructions: isCzar
					? 'Wait for the people to submit their cards'
					: 'The round is starting...'
			});
		});

		// When the server asks for a white card submission
		session.onSubmitRequest(() => {
			console.log('Submit a card for judging');
			this.setState({ canSubmit: true, instructions: 'Pick a white card for the Czar to judge.' });
		});

		// When the server asks the Czar to select a winning card
		session.onSelectRequest(() => {
			console.log('Select a winning card');
			this.setState({
				canSelect: true,
				canSubmit: false,
				instructions: 'Select the winning card.'
			});
		});

		// When a player submits their card
		session.onSubmit((player, spaces, count) => {
			console.log(`${player} submitted a card for judging`);
			this.setState({
				tableau: Session.getBlankCards(count)
			});
		});

		// When a card is removed from the tableau before they are revealed (player disconnect)
		session.onRemove((player, spaces, count) => {
			console.log(`${player}'s card was removed`);
			this.setState({
				tableau: Session.getBlankCards(count)
			});
		});

		session.onRemoveVisible((player, cards) => {
			console.log(`${player}'s card was removed`);
			this.setState({
				tableau: Session.combineCards(cards)
			});
		});

		// When everyone has submitted their cards
		session.onShowCards(cards => {
			console.log('Everyone has submitted their cards');
			let combinedCards = Session.combineCards(cards);
			this.setState({
				tableau: combinedCards,
				instructions: 'Just a minute while the Czar picks a winner.'
			});
		});

		// When someone wins the round
		session.onRoundOver((winner, cards, scores) => {
			console.log(`${winner} won the round`);
			this.setState({ scores });
		});

		// When the game room is destroyed
		session.onGameDestroyed(() => {
			return this.props.history.push('/');
		});

		this.handleCardClick = (id, text) => {
			if (!this.state.isCzar && !this.state.hasSubmittedCard) {
				session.toggleCardSubmission(id, text, this.state.submittedCards || [], this.state.blackCard.spaces, (cards, hasSubmitted) => {
					this.setState({
						submittedCards: cards,
						hasSubmittedCard: hasSubmitted,
						instructions: 'Now wait for everyone else to submit their cards.'
					});
				});
			}
		};

		this.onTableClick = (id, text) => {
			if (this.state.isCzar && !this.state.hasSelectedCard) {
				session.toggleCardSelection(id, text);
			}
		};

		this.setState({ session });
	}

	render() {
		const state = this.state;

		if (!state.session) {
			return '';
		}

		if (!state.gameActive) {
			return (
				<Layout>
					<div className="container vh-100">
						<div className="row vh-100 align-items-center">
							<div className="col-sm-9 col-md-7 col-lg-5 mx-auto">
								<h6 className="text-muted text-sm text-center">Waiting for players...</h6>
							</div>
						</div>
					</div>
				</Layout>
			);
		}

		return (
			<Layout>
				<div className="container-fluid vh-100">
					<div className="row vh-75 pt-nav overflow-auto">
						<div className="col-md-4 col-lg-3 pt-5 border-right">
							<BlackCard key={state.blackCard.id} text={state.blackCard.text} />
							<hr />
							<p className="text-muted">{state.instructions}</p>
						</div>
						<div className="col-md-8 col-lg-9 pt-5 pb-4">
							<div className="card-columns">
								{state.tableau.map(card =>
									<WhiteCard
										cardId={card.id} text={card.text} className="mb-3" key={card.id}
										handleClick={this.onTableClick}
									/>
								)}
							</div>
						</div>
					</div>
					<div className="row vh-25 border-top pt-3 bg-dark">
						<Swiper
							slidesPerView={6}
							spacebetween={20}
							loop={true}
							roundLengths={true}
							breakpoints={{
								1600: { slidesPerView: 6 },
								1200: { slidesPerView: 5 },
								992: { slidesPerView: 4 },
								768: { slidesPerView: 3 },
								576: { slidesPerView: 2 }
							}}
						>
							{state.hand.map(card => (
								<div key={card.id} className="px-2">
									<WhiteCard
										text={card.text}
										cardId={card.id}
										isActive={false}
										className={`h-100 rounded-top ${card.isSelected ? 'card-selected' : ''}`}
										handleClick={this.handleCardClick}
									/>
								</div>
							))}
						</Swiper>
					</div>
				</div>
			</Layout>
		);
	};
}

export default withRouter(Play);