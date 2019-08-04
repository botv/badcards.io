import React from 'react';
import Layout from '../components/Layout';
import WhiteCard from '../components/WhiteCard';
import Swiper from 'react-id-swiper';

class Play extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hand: [], czar: false, tableau: [], isLoaded: false };
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
			]
		});
	}

	render() {
		if (!this.state.isLoaded)	{
			return ''
		}

		return (
			<Layout>
				<div className="container-fluid vh-100">
					<div className="row vh-75 pt-nav overflow-auto">
						<div className="col-md-4 col-lg-3 pt-5">
							<div className="card bc-card text-white bg-dark">
								<div className="card-body">
									<p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
								</div>
							</div>
						</div>
						<div className="col-md-8 col-lg-9 py-5">
							<div className="card-columns">
								{this.state.tableau.map(card => <WhiteCard key={card.id} text={card.text} />)}
							</div>
						</div>
					</div>
					<div className="card-deck h-100 d-none">
						{this.state.hand.map(card => <WhiteCard key={card.id} text={card.text} />)}
					</div>
					<div className="row vh-25 border-top py-3 bg-dark">
						<Swiper
							containerClass="swiper-container nearby-listings-swiper"
							slidesPerView={6}
							spacebetween={20}
							loop={true}
							roundLengths={true}
							breakpoints={{
								1600: { slidesPerView: 6 },
								1200: { slidesPerView: 5 },
								992: { slidesPerView: 4 },
								768: { slidesPerView: 2 },
								576: { slidesPerView: 1 }
							}}
						>
							{this.state.hand.map(card => (
								<div key={card.id} className="px-2">
									<WhiteCard text={card.text} key={card.id} />
								</div>
							))}
						</Swiper>
					</div>
				</div>
			</Layout>
		);
	};
}

export default Play;