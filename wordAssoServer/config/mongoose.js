var config = require('./config'),
	mongoose = require('mongoose');


module.exports = function() {

	var options = { 
		server: { 
      auto_reconnect: true,
			poolSize: 5,
			reconnectTries: 14000,
			socketOptions: { 
				// reconnectTries: 14000,
				keepAlive: 1,
				socketTimeoutMS: 180000,
				connectTimeoutMS: 180000 
			},
		},
    db: {
	    numberOfRetries: 1000,
	    retryMiliSeconds: 1000
    }
	};

// module.exports = function() {
	// var wordAssoDbwordAssoDb = mongoose.connect(config.wordAssoDb, options);

	var wordAssoDb = mongoose.connect(config.wordAssoDb, options, function(error){
		if (error) {
			console.log('CONNECT FAILED: ERROR: MONGOOSE default connection open to ' + config.wordAssoDb);
		}
		else {
			console.log('CONNECT: MONGOOSE default connection open to ' + config.wordAssoDb);
		}
	});

	// CONNECTION EVENTS
	// When successfully connected
	wordAssoDb.connection.on('connected', function () {  
	  console.log('MONGOOSE default connection OPEN to ' + config.wordAssoDb);
	}); 

	wordAssoDb.connection.on('close', function () {  
	  console.log('MONGOOSE default connection CLOSED to ' + config.wordAssoDb);
	}); 

	wordAssoDb.connection.on('error', function (err) {
		console.log("MONGOOSE ERROR\n" + err);
		// if (mongoose.connection.readyState == 0) wordAssoDb = mongoose.connect(config.wordAssoDb, options);
	});

	// When the connection is disconnected
	wordAssoDb.connection.on('disconnected', function () {  
	  console.log('MONGOOSE default connection disconnected');
	});


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