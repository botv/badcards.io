import React from 'react';
import Layout from '../components/Layout';

const Home = () => (
	<Layout>
		<div className="container vh-100">
			<div className="row vh-100 align-items-center">
				<div className="col-sm-9 col-md-7 col-lg-5 mx-auto">
					<h1 className="text-center">Bad Cards</h1>
					<h6 className="text-muted text-sm text-center">Shit's burnin' in the canoe. Don't look at me!</h6>
					<div className="card mt-3">
						<div className="card-body">
							<form action="/enter" method="POST" autoComplete="off">
								<div className="form-group">
									<input name="nickname" type="text" className="form-control" placeholder="Nickname" required autoFocus />
								</div>
								<button className="btn btn-secondary btn-block" type="submit">Enter the game</button>
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>
	</Layout>
);

export default Home;