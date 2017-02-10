var mongoose = require('mongoose'),
	crypto = require('crypto'),
	Schema = mongoose.Schema,
	moment = require('moment');

var SessionSchema = new Schema({
	sessionId: {   // just use socket.id???
		type: String,
		unique: true
	},
	config: {
		type: Object, // SESSION MODES: RANDOM, ANTONYM, SYNONYM, SCRIPT, USER-USER, GROUP  ( session.config.mode )
		default: { type: 'USER', mode: 'SYNONYM'} // SESSION TYPES: ADMIN, USER, UTIL, TEST_USER, TEST_VIEWER, VIEWER
	},
	ip: { 
		type: String,
		default: null
	},
	domain: { 
		type: String,
		default: null
	},
	userId: { 
		type: String,
		default: null
	},
	user: { 
		type: Object
	},
	url: { 
		type: String
	},
	profileImageUrl: { 
		type: String
	},
	tags: { 
		type: Object
	},
	namespace: { 
		type: String,
		default: null
	},
	createdAt: { 
		type: Number,
		default: moment().valueOf()
	},
	lastSeen: { 
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
	linkHashMap: {
		type: Object,
		default: []
	},
	wordChainIndex: {
		type: Number,
		default: 0
	},
	wordChain: {
		type: Object,
		default: []
	},
	fixedNodeId: {
		type: String
	}
});

mongoose.model('Session', SessionSchema);