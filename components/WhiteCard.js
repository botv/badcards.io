import React from 'react';

const WhiteCard = props => (
	<div className={`card bc-card shadow-sm ${props.className}`}>
		<a className="card-block stretched-link text-decoration-none" onClick={() => props.handleClick(props.id)}>
			<div className="card-body">
				<p className="card-text">{props.text}</p>
			</div>
		</a>
	</div>
);

export default WhiteCard;