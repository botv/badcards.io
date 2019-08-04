import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Home from '../pages/index';
import ScrollToTop from 'react-router-scroll-top';

class App extends React.Component {
	render() {
		return (
			<BrowserRouter>
				<ScrollToTop>
					<Switch>
						<Route exact path='/' component={Home} />
					</Switch>
				</ScrollToTop>
			</BrowserRouter>
		);
	}
}

export default App;
