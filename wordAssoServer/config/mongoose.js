var config = require('./config'),
	mongoose = require('mongoose');

module.exports = function() {
	var options = { 
		server: { 
      auto_reconnect: true,
			poolSize: 50,
			socketOptions: { 
				reconnectTries: 1000,
				keepAlive: 1000,
				socketTimeoutMS: 180000,
				connectTimeoutMS: 180000 
			},
		},
    db: {
	    numberOfRetries: 20,
	    retryMiliSeconds: 1000
    }
	};

// module.exports = function() {
	// var wordAssoDbwordAssoDb = mongoose.connect(config.wordAssoDb, options);

	var wordassOdb = mongoose.connect(config.wordassOdb, options, function(error){
		if (error) {
			console.log('CONNECT FAILED: ERROR: MONGOOSE default connection open to ' + config.wordassOdb);
		}
		else {
			console.log('CONNECT: MONGOOSE default connection open to ' + config.wordassOdb);
		}
	});

	// CONNECTION EVENTS
	// When successfully connected
	wordassOdb.connection.on('connected', function () {  
	  console.log('MONGOOSE default connection OPEN to ' + config.wordassOdb);
	}); 

	wordassOdb.connection.on('close', function () {  
	  console.log('MONGOOSE default connection CLOSED to ' + config.wordassOdb);
	}); 

	wordassOdb.connection.on('error', function (err) {
		console.log("MONGOOSE ERROR\n" + err);
		// if (mongoose.connection.readyState == 0) wordassOdb = mongoose.connect(config.wordassOdb, options);
	});

	// When the connection is disconnected
	wordassOdb.connection.on('disconnected', function (err) {  
	  console.log('MONGOOSE default connection disconnected\n' + err);
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