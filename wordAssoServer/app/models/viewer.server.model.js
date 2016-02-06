var mongoose = require('mongoose'),
	moment = require('moment'),
	crypto = require('crypto'),
	Schema = mongoose.Schema;

var ViewerSchema = new Schema({
	viewerId: { 
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
		default: moment().valueOf()
	},
	connected: { 
		type: Boolean,
		default: false
	},
	connectTime: { 
		type: Number,
		default: 0
	},
	disconnectTime: { 
		type: Number,
		default: 0
	},
	sessionId: {   // ??????? KLUDGE: for admin updates of sessions/users/admins
		type: String,
		trim: true
	},
	namespace: {   // ??????? KLUDGE: for admin updates of sessions/users/admins
		type: String,
		trim: true
	},
	ip: {   // ??????? KLUDGE: for admin updates of sessions/users/admins
		type: String,
		trim: true
	},
	domain: {   // ??????? KLUDGE: for admin updates of sessions/users/admins
		type: String,
		trim: true
	},
	lastSeen: {   
		type: Number,
		default: moment().valueOf()
	},
	lastSession: {   
		type: String
	},
	sessions: {  
		type: [String]// Session objects
	}
});


mongoose.model('Viewer', ViewerSchema);