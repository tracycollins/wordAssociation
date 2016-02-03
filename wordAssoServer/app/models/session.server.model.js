var mongoose = require('mongoose'),
	crypto = require('crypto'),
	Schema = mongoose.Schema,
	moment = require('moment');

var SessionSchema = new Schema({
	sessionId: {   // just use socket.id???
		type: String,
		trim: true,
		unique: true
	},
	ip: { 
		type: String,
		trim: true
	},
	domain: { 
		type: String,
		trim: true
	},
	userId: { 
		type: String
	},
	namespace: { 
		type: String
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
	wordChain: {
		type: Object,
		default: []
	}
});

mongoose.model('Session', SessionSchema);