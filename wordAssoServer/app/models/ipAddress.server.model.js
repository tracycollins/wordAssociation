var mongoose = require('mongoose'),
	crypto = require('crypto'),
	Schema = mongoose.Schema,
	moment = require('moment');

var IpAddressSchema = new Schema({
	ip: {   // just use socket.id???
		type: String,
		trim: true,
		unique: true
	},
	createdAt: { 
		type: Number,
		default: moment().valueOf()
	},
	lastSeen: { 
		type: Number,
		default: moment().valueOf()
	},
	lastSession: { 
		type: String
	},
	sessions: {
		type: Object,
		default: []
	}
});

mongoose.model('IpAddress', IpAddressSchema);