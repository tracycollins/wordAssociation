const config = require("./config");
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

module.exports = function() {
	const app = express();

	app.use(bodyParser.urlencoded({
		extended: true
	}));

	app.use(bodyParser.json());
	return app;
};