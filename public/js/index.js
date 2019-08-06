import React from 'react';
import { render } from 'react-dom';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import Home from '../../pages';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Play from '../../pages/play';

// Initialize Font Awesome
library.add(fas);

// Render the app
render((
	<BrowserRouter>
		<Switch>
			<Route exact path='/' component={Home} />
			<Route exact path='/play/:gameId' component={Play} />
		</Switch>
	</BrowserRouter>
), document.getElementById('root'));
