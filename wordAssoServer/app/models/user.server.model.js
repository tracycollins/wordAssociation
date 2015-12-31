var mongoose = require('mongoose'),
	crypto = require('crypto'),
	Schema = mongoose.Schema;

var UserSchema = new Schema({
	userId: { 
		type: String,
		trim: true,
		unique: true
	},
	nodeId: {  // for D3.js
		type: String,
	},
	nodeType: { 
		type: String,
		default: 'user'
	},
	screenName: {
		type: String,
		trim: true
	},
	url: { 
		type: String
	},
	profileUrl: { 
		type: String
	},
	profileImageUrl: { 
		type: String
	},
	verified: { 
		type: Boolean
	},
	createdAt: { 
		type: Date
	},
	description: { 
		type: String
	},
	lastSeen: {   
		type: String
	},
	statusesCount: {
		type: Number,
		default: 0
	},
	followersCount: {
		type: Number,
		default: 0
	},
	friendsCount: {
		type: Number,
		default: 0
	},
	mentions: {
		type: Number,
		default: 0
	},
	status: Object
});


mongoose.model('User', UserSchema);