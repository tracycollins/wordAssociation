const config = require("./config");
const express = require("express");
const bodyParser = require("body-parser");
	// flash = require("connect-flash"),
const path = require("path");
	// session = require("express-session");
	// MongoStore = require("connect-mongo")(session);

module.exports = function() {
	const app = express();

	app.use(bodyParser.urlencoded({
		extended: true
	}));

	app.use(bodyParser.json());

	// app.set("views", "./app/views");
	// app.set("view engine", "ejs");

	// app.use(flash());

	// require("../app/routes/admin.server.routes.js")(app);
	// require("../app/routes/index.server.routes.js")(app);

	return app;
};