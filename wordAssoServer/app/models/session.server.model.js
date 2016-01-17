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
	userId: { 
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
		type: Boolean
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
		type: Object
	}
});

mongoose.model('Session', SessionSchema);