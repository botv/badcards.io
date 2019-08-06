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
		const game = this.props.match.params.game;
		const name = parse(this.props.location.search).name || `user${shortid.generate()}`;

		// Set up player
		const session = new Session(name, this);

		// Join game
		session.join(game);

		// When player joins the game
		session.onJoin(() => {
			console.log('Successfully joined the game!');
		});

		// When player receives a hand
		session.onReceiveCards(cards => {
			this.setState({ hand: cards });
		});

		// When game information is received
		session.onReceiveGameInfo(gameInfo => {
			console.log(gameInfo);

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
				gameConfig: config,
				winnerBlackCards: [],
				round: 0
			});
		});

		// When the game ends
		session.onGameOver(winner => {
			console.log(`${winner} won the game`);
		});

		// When the round starts
		session.onRoundStart((blackCard, czar, isCzar, scores) => {
			console.log('The round is starting');
			this.setState({ blackCard, czar, isCzar, scores });
		});

		// When the server asks for a white card submission
		session.onSubmitRequest(() => {
			console.log('Submit a card for judging');
			this.setState({ canSubmit: true });
		});

		// When the server asks the Czar to select a black card
		session.onSelectRequest(() => {
			console.log('Select a winning card');
			this.setState({
				canSelect: true,
				canSubmit: false
			});
		});

		// When the player submits their card
		session.onSubmit(() => {
			console.log('You submitted a card for judging');
			this.setState({
				tableau: session.getBlankCards(this.state.tableau.length + 1)
			});
		});

		// When everyone has submitted their cards
		session.onShowCards(cards => {
			console.log('Everyone has submitted their cards');
			cards = session.combineCards(cards);
			this.setState({
				tableau: cards
			});
		});

		// When someone wins the round
		session.onRoundOver((winner, cards, scores) => {
			console.log(`${winner} won the round`);
			this.setState({ scores });
		});

		this.setState({ session })
	}

	render() {
		if (!this.state.session) {
			return '';
		}

		return (
			<Layout>
				<div className="container-fluid vh-100">
					<div className="row vh-75 pt-nav overflow-auto">
						<div className="col-md-4 col-lg-3 pt-5 border-right">
							<BlackCard key={this.state.blackCard.id} text={this.state.blackCard.text} />
						</div>
						<div className="col-md-8 col-lg-9 pt-5 pb-4">
							<div className="card-columns">
								{this.state.tableau.map(card =>
									<WhiteCard
										key={card.id} text={card.text} className="mb-3"
										onClick={cardId => {
											if (this.state.isCzar) {
												this.state.session.selectCard(cardId)
											} else {
												this.state.session.submitCard(cardId)
											}
										}}
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
							{this.state.hand.map(card => (
								<div key={card.id} className="px-2">
									<WhiteCard text={card.text} key={card.id} className="h-100 rounded-top" />
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