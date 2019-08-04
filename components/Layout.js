import React from 'react';
import { Link } from 'react-router-dom';

const Layout = props => (
	<React.Fragment>
		<nav className="navbar navbar-dark bg-dark fixed-top">
			<Link to="/" className="navbar-brand"><h1>Bad Cards</h1></Link>
		</nav>
		{props.children}
	</React.Fragment>
);

export default Layout