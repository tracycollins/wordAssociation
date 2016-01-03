var config = require('./config'),
	mongoose = require('mongoose');

module.exports = function() {
	var wordAssoDb = mongoose.connect(config.wordAssoDb);

	require('../app/models/admin.server.model');  // should probably move admin to separate database
	require('../app/models/client.server.model');  // should probably move client to separate database
	require('../app/models/word.server.model');  // should probably move client to separate database

	return wordAssoDb;
};