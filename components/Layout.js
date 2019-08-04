import React from 'react';
import { Link } from 'react-router-dom';

const Layout = props => (
	<React.Fragment>
		<nav className="navbar navbar-dark bg-dark fixed-top">
			<Link to="/" className="navbar-brand"><h2 className="header">Bad Cards</h2></Link>
		</nav>
		{props.children}
	</React.Fragment>
);

export default Layout