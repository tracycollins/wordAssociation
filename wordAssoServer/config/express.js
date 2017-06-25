var config = require('./config'),
	express = require('express'),
	bodyParser = require('body-parser'),
	flash = require('connect-flash'),
	path = require("path"),
	session = require('express-session');
	// MongoStore = require('connect-mongo')(session);

module.exports = function() {
	var app = express();

	app.use(bodyParser.urlencoded({
		extended: true
	}));

	app.use(bodyParser.json());

	app.set('views', './app/views');
	app.set('view engine', 'ejs');

	app.use(flash());

	require('../app/routes/admin.server.routes.js')(app);
	require('../app/routes/index.server.routes.js')(app);

	// require('../app/routes/group.server.routes.js')(app);
	// require('../app/routes/entity.server.routes.js')(app);
	// require('../app/routes/word.server.routes.js')(app);
	// require('../app/routes/phrase.server.routes.js')(app);

	// app.use('/admin', express.static(path.join(__dirname, 'admin')));
	// app.use('/admin/css', express.static(path.join(__dirname, 'admin/css')));

	// app.use(express.static('./'));
	// // app.use(express.static('./admin'));
	// // app.use(express.static('./admin/css'));
	// // app.use(express.static('./admin/js'));
	// app.use(express.static('./js'));
	// app.use(express.static('./css'));
	// app.use(express.static('./node_modules'));
	// // app.use(express.static('./assets'));
	// app.use(express.static('./public/assets/images'));
	// app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')))

	return app;
};