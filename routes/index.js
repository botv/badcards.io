const express = require('express');
const path = require('path');
const GameList = require('../modules/game_list');
const status = require('http-status');
const socket = require('socket.io');
const router = express.Router();
const io = socket();

// Game list
let gameList = new GameList();

router.get('/*', (req, res) => {
	res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

router.post('/play', (req, res) => {
	req.session.nickname = req.body.nickname;
	res.redirect(`/play/${gameList.getOpenGame()}?name=${req.body.nickname}`);
});

/* SETUP SOCKET */

io.on('connect', (socket)=>{
	// On attempt to join game
	socket.on('self.join.req', (gameId, name)=>{
		gameList.joinGame(gameId, socket, name);
	});
});

router.io = io;

module.exports = router;