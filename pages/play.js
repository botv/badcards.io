import React from 'react';
import Layout from '../components/Layout';
import WhiteCard from '../components/WhiteCard';
import Swiper from 'react-id-swiper';
import BlackCard from '../components/BlackCard';
import {Redirect, withRouter} from "react-router-dom";
import {parse} from 'query-string';
import Player from '../modules/player_client';

class Play extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hand: [], czar: false, tableau: [], isLoaded: false, blackCard: {} };
	}

	componentDidMount() {
		this.setState({
			isLoaded: true,
			hand: [
				{ id: 1, text: 'Coat hanger abortions.' },
				{ id: 2, text: 'Man meat.' },
				{ id: 3, text: 'Autocannibalism.' },
				{ id: 4, text: 'Vigorous jazz hands.' },
				{ id: 5, text: 'Flightless birds.' },
				{ id: 6, text: 'Pictures of boobs.' },
				{ id: 7, text: 'The violation of our most basic human rights.' }
			],
			tableau: [
				{ id: 1, text: 'Coat hanger abortions.' },
				{ id: 2, text: 'Man meat.' },
				{ id: 3, text: 'Autocannibalism.' },
				{ id: 4, text: 'Vigorous jazz hands.' },
				{ id: 5, text: 'Flightless birds.' },
				{ id: 6, text: 'Pictures of boobs.' },
				{ id: 7, text: 'The violation of our most basic human rights.' }
			],
			blackCard: { id: 1, text: 'What do I smell?' }
		});


		// Set up player for game info managing and rendering
		const game = this.props.match.params.game;
		const name = parse(this.props.location.search).name || 'noname';

		// Set up player
		let player = new Player(name, this);

		// Join game
		player.join(game);
	}

	redirect(url) {
		this.setState({
			redirecting: true,
			redirectTarget: url
		})
	}

	renderRedirect() {
		if (this.state.redirecting) {
			return <Redirect to={this.state.redirectTarget} />
		}
	}

	render() {
		if (!this.state.isLoaded)	{
			return ''
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
								{this.state.tableau.map(card => <WhiteCard key={card.id} text={card.text} className="mb-3" />)}
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
				<div>
					{this.renderRedirect()}
				</div>
			</Layout>
		);
	};
}

export default withRouter(Play);