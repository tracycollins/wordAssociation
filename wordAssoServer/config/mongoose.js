var config = require('./config'),
	mongoose = require('mongoose');

module.exports = function() {
	var wordAssoDb = mongoose.connect(config.wordAssoDb);

	require('../app/models/admin.server.model');  
	require('../app/models/client.server.model');  
	require('../app/models/user.server.model');  
	require('../app/models/session.server.model');  
	require('../app/models/word.server.model');  

	return wordAssoDb;
};