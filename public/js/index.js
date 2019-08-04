import React from 'react';
import { render } from 'react-dom';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import Home from '../../pages';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

// Initialize Font Awesome
library.add(fas);

// Render the app
render((
	<BrowserRouter>
		<Switch>
			<Route exact path='/' component={Home} />
		</Switch>
	</BrowserRouter>
), document.getElementById('root'));
