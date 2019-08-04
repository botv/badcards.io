import React from 'react';

const WhiteCard = props => (
	<div className={`card bc-card shadow-sm ${props.className}`}>
		<div className="card-body">
			<p className="card-text">{props.text}</p>
		</div>
	</div>
);

export default WhiteCard