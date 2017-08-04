var config = require('./config'),
	mongoose = require('mongoose');

mongoose.Promise = global.Promise;

module.exports = function() {

	var options = { 
		useMongoClient: true,
		keepAlive: 1000,
		autoReconnect: true,
		reconnectTries: 1000,
		socketTimeoutMS: 180000,
		connectTimeoutMS: 180000,
		poolSize: 50,
		promiseLibrary: global.Promise
	};
	
	// var wordAssoDb = mongoose.connect(config.wordAssoDb, options, function(error){
	// 	if (error) {
	// 		console.log('CONNECT FAILED: ERROR: MONGOOSE default connection open to ' + config.wordAssoDb);
	// 	}
	// 	else {
	// 		console.log('CONNECT: MONGOOSE default connection open to ' + config.wordAssoDb);
	// 	}
	// });

	var wordAssoDb = mongoose.connect(config.wordAssoDb, options)
		.then(function(){
			console.log('CONNECT: MONGOOSE default connection open to ' + config.wordAssoDb);
		})
		.catch(function(err){
			console.log('CONNECT FAILED: ERROR: MONGOOSE default connection open to ' + config.wordAssoDb);
			console.log('CONNECT FAILED: ERROR: MONGOOSE ' + err);
		});

	require('../app/models/admin.server.model');  
	require('../app/models/viewer.server.model');  
	require('../app/models/user.server.model');  
	require('../app/models/group.server.model');  
	require('../app/models/entity.server.model');  
	require('../app/models/session.server.model');  
	require('../app/models/word.server.model');  
	require('../app/models/tweet.server.model');  
	require('../app/models/hashtag.server.model');  
	require('../app/models/media.server.model');  
	require('../app/models/url.server.model');  
	require('../app/models/place.server.model');  
	require('../app/models/phrase.server.model');  
	require('../app/models/ipAddress.server.model');  
	require('../app/models/oauth2credential.server.model'); // should probably move admin to separate database

	return wordAssoDb;
};