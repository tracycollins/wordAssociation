var mongoose = require('mongoose'),
	crypto = require('crypto'),
	Schema = mongoose.Schema,
	moment = require('moment');

var EntitySchema = new Schema({
	entityId: {   // 
		type: String,
		unique: true
	},
	groupId: {
		type: String
	},
	screenName: {
		type: String
	},
	name: {
		type: String
	},
	url: {
		type: String
	},
	profileImageUrl: { 
		type: String
	},
	sessions: {  // number of sessions transmitted
		type: Number,
		default: 0
	},
	words: {  // number of words transmitted
		type: Number,
		default: 0
	},
	mentions: { // number of times mentioned, by self or others
		type: Number,
		default: 0
	},
	isTopTerm: { 
		type: Boolean,
		default: false
	},
	tags: {  // i.e., channel
		type: Object,
		default: {}
	},
	createdAt: { 
		type: Number,
		default: moment().valueOf()
	},
	lastSeen: { 
		type: Number,
		default: moment().valueOf()
	}
});

mongoose.model('Entity', EntitySchema);