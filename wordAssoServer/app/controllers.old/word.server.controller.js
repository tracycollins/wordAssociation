/*jslint node: true */
"use strict";

var chalk = require("chalk");
var chalkError = chalk.bold.red;
var chalkDb = chalk.gray;

var moment = require("moment");
var compactDateTimeFormat = "YYYYMMDD HHmmss";

var Word = require("mongoose").model("Word");
var debug = require("debug")("word");

function jsonPrint(obj) {
  if (obj) {
     return JSON.stringify(obj, null, 2);
  } else {
    return obj;
  }
}

exports.findOneWord = function(word, incMentions, callback) {

	debug("WHAT!! findOneWord: " + word.nodeId);

	if (word.nodeId.length > 250){
    console.log(chalkError("*** ILLEGAL WORD NODE ID (> 250 CHARS) ... SKIPPING ***" + "\nTYPE: " +  word.nodeId 
      + "\n" + jsonPrint(word)
    ));
    // quit();
	}

	if (word.raw === undefined) { word.raw = word.nodeId; }

	// console.log("findOneWord:" + JSON.stringify(word, null, 2));

	var inc = 0;
	if (incMentions) {inc = 1 ;}

	var query = { nodeId: word.nodeId  };
	var update = { 
		"$inc": { mentions: inc }, 
		"$set": { 
			nodeId: word.nodeId,
			raw: word.raw,
			rate: word.rate || 0,
			isTwitterUser: word.isTwitterUser,
			isTopTerm: word.isTopTerm,
			isTrendingTopic: word.isTrendingTopic,
			isKeyword: word.isKeyword,
			keywords: word.keywords,
			isIgnored: word.isIgnored,
			sessionId: word.sessionId,
			url: word.url,
			lastSeen: moment().valueOf(),
			bhtAlt: word.bhtAlt,
			wapiSearched: word.wapiSearched,
			wapiFound: word.wapiFound,
			tags: word.tags
		}
		// noun: { "$max": word.noun },
		// verb: { "$max": word.verb },
		// adjective: { "$max": word.adjective },
		// adverb: { "$max": word.adverb },
		// bhtSearched: { "$max": word.bhtSearched },
		// bhtFound: { "$max": word.bhtFound }
	};

	var options = { 
		setDefaultsOnInsert: true,
		upsert: true, 
		new: true	
	};

	Word.findOneAndUpdate(
		query,
		update,
		options,
		function(err, wd) {
			if (err) {
				console.log(chalkError(moment().format(compactDateTimeFormat) 
					+ " | " + "***** WORD FINDONE ERROR" 
					+ " | " + word.nodeId 
					+ "\n" + err
				));
				console.error(moment().format(compactDateTimeFormat) 
					+ " | " + "***** WORD FINDONE ERROR" 
					+ " | " + word.nodeId 
					+ "\n" + err
				);
				callback("ERROR " + err, word);
			}
			else {
				debug(chalkDb("->- DB UPDATE" 
					+ " | " + wd.nodeId 
					+ " | WPM: " + wd.rate.toFixed(2) 
					+ " | KW: " + wd.isKeyword 
					+ " | TU: " + wd.isTwitterUser 
					+ " | TOPTERM: " + wd.isTopTerm 
					+ " | TT: " + wd.isTrendingTopic 
					+ " | MENTIONS: " + wd.mentions 
					+ " | LAST SEEN: " + Date(wd.lastSeen) 
					+ " | BHT SEARCHED: " + wd.bhtSearched 
					+ " | BHT FOUND: " + wd.bhtFound 
				));

				debug("> WORD UPDATED:" + JSON.stringify(wd, null, 2));

				if ((wd.noun !== undefined) 
					|| ( wd.verb !== undefined) 
					|| ( wd.adjective !== undefined) 
					|| ( wd.adverb !== undefined)) {

					if (!wd.bhtSearched || !wd.bhtFound) {

						debug(chalkDb("??? BHT DATA NOT NULL | " + wd.nodeId + " ... UPDATING BHT FOUND/SEARCHED"));
						// console.log("==???==:" + JSON.stringify(wd, null, 2));

						update = { 
										$set: { 
											bhtSearched: true,
											bhtFound: true
										} 
									};

						Word.findOneAndUpdate(
							query,
							update,
							options,
							function(err, wdBhtUpdated) {
								if (err) {
									console.error(Date.now() + "\n\n***** WORD FINDONE ERROR: " + wd.nodeId + "\n" + err);
									callback(err, null);
								}
								else {
									callback(null, wdBhtUpdated);
								}
							}
						);
					}
					else {
						callback(null, wd);
					}
				}
				else {
					callback(null, wd);
				}
			}
		}
	);
};
