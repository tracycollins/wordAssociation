var config = require('./config'),
	mongoose = require('mongoose');

var options = { 
	server: { 
		auto_reconnect: true,
		poolSize: 20,
		socketOptions: { 
			// reconnectTries: Number.MAX_VALUE,
			keepAlive: 1,
			// keepAlive: 300000,
			// socketTimeoutMS: 180000,
			// connectTimeoutMS: 180000 
		},
	},
	db: {
	    numberOfRetries: 20,
	    retryMiliSeconds: 1000
	}
};

module.exports = function() {
	var wordAssoDb = mongoose.connect(config.wordAssoDb, options);

	require('../app/models/admin.server.model');  
	require('../app/models/viewer.server.model');  
	require('../app/models/user.server.model');  

	require('../app/models/group.server.model');  
	require('../app/models/entity.server.model');  
	require('../app/models/session.server.model');  
	require('../app/models/word.server.model');  
	require('../app/models/phrase.server.model');  

	require('../app/models/ipAddress.server.model');  
	require('../app/models/oauth2credential.server.model'); // should probably move admin to separate database

	return wordAssoDb;
};