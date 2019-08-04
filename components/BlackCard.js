import React from 'react';

const BlackCard = props => (
	<div className={`card bc-card text-white bg-dark shadow-sm ${props.className}`}>
		<div className="card-body">
			<p className="card-text">{props.text}</p>
		</div>
	</div>
);

export default BlackCard