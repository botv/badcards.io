const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const enforce = require('express-sslify');
const session = require('express-session');

// Create express app
const app = express();

// Set up development environment
if (process.env.NODE_ENV !== 'production') {
	console.log('Running in development mode');
	require('dotenv').config();
	app.use(require('morgan')('dev'));
} else {
	console.log('Running in production mode');
	app.use(enforce.HTTPS({ trustProtoHeader: true }));
}

// Session
app.set('trust proxy', 1);
app.use(session({
	secret: process.env.SESSION_KEY,
	resave: false,
	saveUninitialized: true,
	cookie: { secure: true }
}));

// Define routers
const indexRouter = require('./routes/index');

// Set up app
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'dist')));

// Set up routers
app.use('/', indexRouter);

// Socket io
app.io = indexRouter.io;

module.exports = app;
