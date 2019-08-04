const express = require('express');
const path = require('path');
const game = require('../modules/game');
const status = require('http-status');
const router = express.Router();

router.get('/*', (req, res) => {
	res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

router.post('/enter', (req, res) => {
	console.log(req.body.nickname);
	res.sendStatus(status.OK);
});

module.exports = router;