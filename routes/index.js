const express = require('express');
const path = require('path');
const GameList = require('../modules/gamelist');
const status = require('http-status');
const socket = require('socket.io');
const router = express.Router();
const io = socket();

// Game list
let gameList = new GameList();

router.get('/*', (req, res) => {
	res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

router.post('/enter', (req, res) => {
	console.log(req.body.nickname);
	res.sendStatus(status.OK);
});

router.get('/game', (req, res) => {
	// Get gameId; if it is random, redirect to a random game
	let id = req.query.g;
	if (id === 'random') {
		res.redirect(`/game?g=${gameList.getOpenGame()}`);
	} else {
		res.render('game', {id: id});
	}
});

/* SETUP SOCKET */

io.on('connect', (socket)=>{
	// On attempt to join game
	socket.on('joinGame', (gameId, name)=>{
		gameList.joinGame(gameId, socket, name);
	});
});

router.io = io;

module.exports = router;