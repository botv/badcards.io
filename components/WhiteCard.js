import React from 'react';

const WhiteCard = props => (
	<div className="card bc-card mb-3 shadow-sm">
		<div className="card-body">
			<p className="card-text">{props.text}</p>
		</div>
	</div>
);

export default WhiteCard