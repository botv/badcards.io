import React from 'react';

const WhiteCard = props => (
	<div className={`card bc-card shadow-sm ${props.className} ${props.isActive ? 'active' : ''}`}>
		<a className="card-block stretched-link text-decoration-none" onClick={() => props.handleClick(props.cardId, props.text)}>
			<div className="card-body">
				<p className="card-text">{props.text}</p>
			</div>
		</a>
	</div>
);

export default WhiteCard;