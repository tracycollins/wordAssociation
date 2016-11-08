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
var Word = require('mongoose').model('Word');
var debug = require('debug')('word');
var HashMap = require('hashmap').HashMap;

var wordTypes = [ 'noun', 'verb', 'adjective', 'adverb' ];
var wordVariations = [ 'syn', 'ant', 'rel', 'sim', 'usr' ];

function randomIntInc (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

function loadBhtResponseHash(wordObj, wordTypes, wordVariations, callback){

  var bhtWordHashMap = new HashMap();

  wordTypes.forEach(function(wordType){
    debug("wordType: " + wordType);
    if ((typeof  wordObj[wordType] !== 'undefined')
        && (wordObj[wordType] != null)){
      debug("FOUND wordType: " + wordType);
      wordVariations.forEach(function(wordVariation){
        debug("wordVariation: " + wordVariation);
        if ((typeof wordObj[wordType][wordVariation] !== 'undefined') 
          && (wordObj[wordType][wordVariation] != null)){
          debug("FOUND wordVariation: " + wordVariation);
          var wordArry = wordObj[wordType][wordVariation] ;
          wordArry.forEach(function(word){
            bhtWordHashMap.set(word, wordObj.nodeId);
            debug(wordObj.nodeId 
              + " | " + wordType
              + " | " + wordVariation
              + " | " + word
            );
          })
        }
      })
    }
  });
  callback(bhtWordHashMap);
}

exports.getWordVariation = function(word, wordTypeArray, wordVariation, callback){

	debug("getWordVariation | word: " + word);

	var query = { nodeId: word };
	var projections = {
		noun: true,
		verb: true,
		adjective: true,
		adverb: true
	};

	Word.findOne(query, function(err, wordObj) {
		if (err) {
			console.error(Date.now() + "\n\n***** WORD ANTONYM ERROR\n" + err);
			callback(err, word);
		}
		else if (wordObj) {
      debug(chalkBht("-*- BHT WORD FOUND | " + word));
			loadBhtResponseHash(wordObj, wordTypeArray, wordVariation, function(wordVarHashMap){
	      if (wordVarHashMap.count() == 0) {
	        debug(chalkBht("-v- BHT VAR MISS   | " + wordObj.nodeId));
	        callback('BHT_VAR_MISS', wordObj.nodeId);  // ?? maybe unknown wordType?
	        return;
	      }

	      var bhtWordHashMapKeys = wordVarHashMap.keys();
	      var randomIndex = randomInt(0, bhtWordHashMapKeys.length);
	      var responseWord = bhtWordHashMapKeys[randomIndex].toLowerCase();

        var responseWordObj = new Word ({
        	nodeId: responseWord,
        	lastSeen: moment().valueOf()
        });

        exports.findOneWord(responseWordObj, true, function(err2, updatedResponseWordObj){
        	if (err2){
						console.error(Date.now() + "\n\n***** WORD ANTONYM ERROR\n" + err2);
						callback(err, word);
        	}
        	else {
		        debug(chalkBht("-*- BHT VAR HIT    | " + updatedResponseWordObj.nodeId + " | " + responseWord));
			      callback('BHT_VAR_HIT', updatedResponseWordObj);
			      return;
			    }
        });

			});
		}
		else {
      debug(chalkBht("-v- BHT VAR MISS   | " + word));
      callback('BHT_VAR_MISS', word);  // ?? maybe unknown wordType?
		}
	});
}

exports.getRandomWord = function(callback){
	var query = { $sample: { size: 1 }};
	Word.aggregate(query, function(err, randomWordArray){
		if (err) {
			console.error(Date.now() + "\n\n***** WORD RANDOM ERROR\n" + err);
			callback(err, null);
		}
		else {
			debug("RANDOM WORD\n" + JSON.stringify(randomWordArray, null, 3));
			if (!randomWordArray[0]) {
				debug(chalkError("*** NULL RANDOM WORD... RETURNING black"));
				console.error(chalkError("*** NULL RANDOM WORD... RETURNING black"));
				callback(null, {nodeId: 'black'});
			}
			else {
				callback(null, randomWordArray[0]);
			}
		}
	});
}

exports.findOneWord = function(word, incMentions, callback) {

	if (typeof word.raw === 'undefined') word.raw = word.nodeId;

	// console.log("findOneWord:" + JSON.stringify(word, null, 2));

	var inc = 0;
	if (incMentions) inc = 1 ;

	var query = { nodeId: word.nodeId  };
	var update = { 
					$inc: { mentions: inc }, 
					$set: { 
						nodeId: word.nodeId,
						raw: word.raw,
						isKeyword: word.isKeyword,
						keywords: word.keywords,
						isIgnored: word.isIgnored,
						url: word.url,
						lastSeen: moment(),
						bhtAlt: word.bhtAlt,
						wapiSearched: word.wapiSearched,
						wapiFound: word.wapiFound
					},
					$max: { noun: word.noun },
					$max: { verb: word.verb },
					$max: { adjective: word.adjective },
					$max: { adverb: word.adverb },
					$max: { bhtSearched: word.bhtSearched },
					$max: { bhtFound: word.bhtFound }
					// $max: { wapiSearched: word.wapiSearched },
					// $max: { wapiFound: word.wapiFound }
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
				console.error(Date.now() + "\n\n***** WORD FINDONE ERROR: " + word.nodeId + "\n" + err);
				callback("ERROR " + err, null);
			}
			else {
				debug(chalkDb("->- DB UPDATE" 
					+ " | " + wd.nodeId 
					+ " | MENTIONS: " + wd.mentions 
					+ " | LAST SEEN: " + Date(wd.lastSeen) 
					+ " | BHT SEARCHED: " + wd.bhtSearched 
					+ " | BHT FOUND: " + wd.bhtFound 
				));

				debug("> WORD UPDATED:" + JSON.stringify(wd, null, 2));

				if ((typeof wd.noun !== 'undefined') 
					|| (typeof wd.verb !== 'undefined') 
					|| (typeof wd.adjective !== 'undefined') 
					|| (typeof wd.adverb !== 'undefined')) {

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
}
