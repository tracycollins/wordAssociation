var mongoose = require('mongoose'),
	crypto = require('crypto'),
	Schema = mongoose.Schema;

var ClientSchema = new Schema({
	ip: { 
		type: String,
		unique: true
	},
	domain: { 
		type: String
	},
	socketId: { 
		type: String
	},
	referer: { 
		type: String,
		default: ''
	},
	userId: { 
		type: String,
	},
	connected: { 
		type: Boolean
	},
	connectTime: { 
		type: Number // milliseconds
	},
	disconnectTime: { 
		type: Number // milliseconds
	},
	sessions: {  
		type: Array // {socketId: sId, connectedAt: <date>, disconnectedAt: <date>, connectTime: <ms>}
	},
	createdAt: { 
		type: Number // milliseconds
	},
	lastSeen: {   
		type: Number // milliseconds
	},
	numberOfConnections: {   
		type: Number,
		default: 0
	}
});


mongoose.model('Client', ClientSchema);