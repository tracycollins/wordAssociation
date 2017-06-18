// var S = require('string');
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
var Group = require('mongoose').model('Group');
var debug = require('debug')('group');

exports.findOneGroup = function(group, incMentions, callback) {

	debug(chalkError("findOneGroup:" + JSON.stringify(group, null, 2)));

	var inc = 0;
	if (incMentions) inc = 1 ;

	var query = { groupId: group.groupId  };
	
	var update = {};
	update['$addToSet'] = {};
	update['$inc'] = { mentions: inc };
	update['$set'] = { 
		groupId: group.groupId,
		name: group.name,
		colors: group.colors,
		tags: group.tags,
		lastSeen: moment()
	};


	if (group.addEntityArray) {
		debug(chalkDb("ADD ENTITY ARRAY: " + group.addEntityArray));
		update['$addToSet'].entities = { $each: group.addEntityArray };
	}

	if (group.addChannelArray) {
		debug(chalkDb("ADD CHANNEL ARRAY: " + group.addChannelArray));
		update['$addToSet'].channels = { $each: group.addChannelArray };
	}

	var options = { 
		setDefaultsOnInsert: true,
		upsert: true, 
		new: true	
	};

	Group.findOneAndUpdate(
		query,
		update,
		options,
		function(err, grp) {
			if (err) {
				console.error(Date.now() + "\n\n***** GROUP FINDONE ERROR: " + group.group + "\n" + err);
				callback("ERROR " + err, null);
			}
			else {
				debug(chalkDb("->- DB GR" 
					+ " | " + grp.groupId 
					+ " | NAME: " + grp.name 
					+ " | ENTITIES: " + grp.entities
					+ " | CHANNELS: " + grp.channels
					+ " | MNS: " + grp.mentions 
					+ " | CREATED: " + Date(grp.createdAt) 
					+ " | LAST SEEN: " + Date(grp.lastSeen) 
				));

				debug("> GROUP UPDATED:" + JSON.stringify(grp, null, 2));

				callback(null, grp);

			}
		}
	);
}
