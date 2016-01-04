var S = require('string');
var chalk = require('chalk');

var chalkAdmin = chalk.bold.blue;

var chalkAlert = chalk.red;
var chalkInfo = chalk.yellow;
var chalkTest = chalk.bold.yellow;
var chalkError = chalk.bold.red;
var chalkWarn = chalk.bold.yellow;
var chalkLog = chalk.gray;
var chalkConnect = chalk.bold.green;
var chalkConnectAdmin = chalk.bold.cyan;
var chalkDisconnect = chalk.blue;
var chalkTwitter = chalk.blue;
var chalkPlace = chalk.bold.green;

var moment = require('moment');
var Word = require('mongoose').model('Word');
var debug = require('debug')('word');

exports.getRandomWord = function(callback){
	var query = { $sample: { size: 1 }};
	Word.aggregate(query, function(err, randomWordArray){
		if (err) {
			console.error(Date.now() + "\n\n***** WORD RANDOM ERROR\n" + err);
			callback(err, null);
		}
		else {
			console.log("RANDOM WORD\n" + JSON.stringify(randomWordArray, null, 3));
			callback(null, randomWordArray[0]);
		}
	});
}

exports.findOneWord = function(word, testMode, callback) {

	var inc = 1;
	if (testMode) inc = 0 ;

	var query = { nodeId: word.nodeId  };
	var update = { 
					$inc: { mentions: inc }, 
					$set: { 
						nodeId: word.nodeId,
						noun: word.noun,
						verb: word.verb,
						adjective: word.adjective,
						adverb: word.adverb,
						lastSeen: Date.now() 
					} 
				};
	var options = { upsert: true, new: true	};

	Word.findOneAndUpdate(
		query,
		update,
		options,
		function(err, wd) {
			if (err) {
				console.error(Date.now() + "\n\n***** WORD FINDONE ERROR: " + word.nodeId + "\n" + err);
				callback(err, null);
			}
			else {
				debug("> WORD UPDATED" 
					+ " | " + wd.nodeId 
					+ " | MENTIONS: " + wd.mentions 
					+ " | LAST SEEN: " + Date(wd.lastSeen) 
					);
				callback(null, wd);
			}

		}
	);
}
