var mongoose = require('mongoose'),
	crypto = require('crypto'),
	Schema = mongoose.Schema;
	moment = require('moment');

var ClientSchema = new Schema({
	ip: { 
		type: String,
		unique: true
	},
	domain: { 
		type: String,
		default: ''
	},
	socketId: { 
		type: String
	},
	userId: { 
		type: String,
		default: ''
	},
	connected: { 
		type: Boolean,
		default: false
	},
	connectTime: { 
		type: Number, // milliseconds
		default: moment().valueOf()
	},
	disconnectTime: { 
		type: Number // milliseconds
	},
	sessions: {  
		type: Array // {socketId: sId, connectedAt: <date>, disconnectedAt: <date>, connectTime: <ms>}
	},
	createdAt: { 
		type: Number, // milliseconds
		default: moment().valueOf()
	},
	lastSeen: {   
		type: Number, // milliseconds
		default: moment().valueOf()
	},
	numberOfConnections: {   
		type: Number,
		default: 0
	}
});


mongoose.model('Client', ClientSchema);