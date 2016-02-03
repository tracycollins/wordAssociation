var mongoose = require('mongoose'),
	moment = require('moment'),
	crypto = require('crypto'),
	Schema = mongoose.Schema;

var AdminSchema = new Schema({
	adminId: { 
		type: String,
		trim: true,
		unique: true
	},
	screenName: {
		type: String,
		trim: true
	},
	description: { 
		type: String,
		trim: true
	},
	url: { 
		type: String,
		trim: true
	},
	profileUrl: { 
		type: String,
		trim: true
	},
	profileImageUrl: { 
		type: String,
		trim: true
	},
	verified: { 
		type: Boolean,
		default: false
	},
	createdAt: { 
		type: Number,
		trim: true,
		default: moment().valueOf()
	},
	lastSeen: {   
		type: Number,
		trim: true,
		default: moment().valueOf()
	},
	lastSession: {   
		type: String,
		trim: true
	},
	sessions: {  
		type: [String], // Session objects
		trim: true
	}
});


mongoose.model('Admin', AdminSchema);