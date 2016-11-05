var S = require('string');
var chalk = require('chalk');
var util = require('util');

var chalkAdmin = chalk.bold.blue;

var chalkAlert = chalk.red;
var chalkBht = chalk.gray;
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
var chalkDb = chalk.gray;

var moment = require('moment');
var Phrase = require('mongoose').model('Phrase');
var debug = require('debug')('phrase');

exports.findOnePhrase = function(phrase, incMentions, callback) {

	if (typeof phrase.raw === 'undefined') phrase.raw = phrase.nodeId;

	debug("findOnePhrase:" + JSON.stringify(phrase, null, 2));

	var inc = 0;
	if (incMentions) inc = 1 ;

	var query = { nodeId: phrase.nodeId  };
	var update = { 
					$inc: { mentions: inc }, 
					$set: { 
						nodeId: phrase.nodeId,
						raw: phrase.raw,
						url: phrase.url,
						lastSeen: moment()
					}
				};
	var options = { 
		setDefaultsOnInsert: true,
		upsert: true, 
		new: true	
	};

	Phrase.findOneAndUpdate(
		query,
		update,
		options,
		function(err, wd) {
			if (err) {
				console.error(Date.now() + "\n\n***** PHRASE FINDONE ERROR: " + phrase.nodeId + "\n" + err);
				callback("ERROR " + err, null);
			}
			else {
				debug(chalkDb("->- DB UPDATE" 
					+ " | " + ph.nodeId 
					+ " | MENTIONS: " + ph.mentions 
					+ " | LAST SEEN: " + Date(ph.lastSeen) 
				));

				debug("> PHRASE UPDATED:" + JSON.stringify(ph, null, 2));

				callback(null, ph);
			}
		}
	);
}
