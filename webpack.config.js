const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
	mode: process.env.NODE_ENV || 'development',
	performance: {hints: false},
	entry: {
		'application': './public/js/index.js',
		'style': './scss/style.scss'
	},
	output: {
		filename: 'js/[name].js',
		path: path.resolve(__dirname, 'dist')
	},
	module: {
		rules: [
			{
				test: /.(js|jsx)$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader'
				}
			},
			{
				test: /\.(sa|sc|c)ss$/,
				use: [
					'style-loader',
					'css-loader',
					'sass-loader'
				]
			}
		]
	},
	plugins: [
		new CopyWebpackPlugin([
			{from: 'public/img/', to: 'img/'},
			{from: 'public/favicon/', to: 'favicon/'},
			{from: 'public/index.html', to: 'index.html'}
		])
	]
};
