var mongoose = require('mongoose'),
	crypto = require('crypto'),
	Schema = mongoose.Schema,
	moment = require('moment');

var GroupSchema = new Schema({
	groupId: {   // 
		type: String,
		trim: true,
		unique: true
	},
	channels: {
		type: Object,
		default: []
	},
	url: { 
		type: String
	},
	profileImageUrl: { 
		type: String
	},
	addChannelArray: {
		type: Object,
		default: []
	},
	entities: {
		type: Object,
		default: []
	},
	addEntityArray: {
		type: Object,
		default: []
	},
	name: {
		type: String
	},
	colors: {
		type: Object,
		default: {}
	},
	mentions: { // number of times mentioned, by self or others
		type: Number,
		default: 0
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

mongoose.model('Group', GroupSchema);