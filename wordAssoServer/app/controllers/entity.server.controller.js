var S = require('string');
var chalk = require('chalk');
var util = require('util');

var chalkAlert = chalk.red;
var chalkInfo = chalk.yellow;
var chalkTest = chalk.bold.yellow;
var chalkError = chalk.bold.red;
var chalkWarn = chalk.bold.yellow;
var chalkLog = chalk.gray;
var chalkDb = chalk.gray;

var moment = require('moment');
var Entity = require('mongoose').model('Entity');
var debug = require('debug')('entity');

exports.findOneEntity = function(entity, incMentions, callback) {

	debug("findOneEntity:" + JSON.stringify(entity, null, 2));

	if (!entity.sessions) entity.sessions = 0;

	var inc = 0;
	if (incMentions) inc = 1 ;

	var query = { entityId: entity.entityId  };

	var update = {};
	// update['$addToSet'] = {};
	update['$inc'] = { mentions: inc };
	update['$set'] = { 
		entityId: entity.entityId,
		groupId: entity.groupId,
		name: entity.name,
		screenName: entity.screenName,
		// sessions: entity.sessions,
		// words: entity.words,
		isTopTerm: entity.isTopTerm,
		tags: entity.tags,
		lastSeen: moment()
	};
	update['$max'] = { words: entity.words };
	update['$max'] = { sessions: entity.sessions };

	var options = { 
		setDefaultsOnInsert: true,
		upsert: true, 
		new: true	
	};

	Entity.findOneAndUpdate(
		query,
		update,
		options,
		function(err, ent) {
			if (err) {
				console.error(Date.now() + "\n\n***** ENTITY FINDONE ERROR: " + entity.entityId + "\n" + err);
				callback("ERROR " + err, null);
			}
			else {
				debug(chalkDb("->- DB UPDATE ENTITY" 
					+ " | " + ent.entityId 
					+ " | NAME: " + ent.name 
					+ " | SNAME: " + ent.screenName 
					+ " | GROUP: " + ent.groupId 
					+ " | TOPTERM: " + ent.isTopTerm 
					+ " | CHAN: " + ent.tags.channel
					+ " | SESSIONS: " + ent.sessions 
					+ " | WORDS: " + ent.words 
					+ " | MNS: " + ent.mentions 
					+ " | CREATED: " + Date(ent.createdAt) 
					+ " | LAST SEEN: " + Date(ent.lastSeen) 
				));

				debug("> ENTITY UPDATED:" + JSON.stringify(ent, null, 2));

				callback(null, ent);

			}
		}
	);
}
