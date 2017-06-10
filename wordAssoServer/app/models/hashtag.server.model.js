var mongoose = require('mongoose'),
	crypto = require('crypto'),
	Schema = mongoose.Schema;

var HashtagSchema = new Schema({
	hashtagId: { 
		type: String
	},
	nodeType: { 
		type: String,
		default: 'hashtag'
	},
	nodeId: { // for D3.js
		type: String
	},
	text: { 
		type: String,
		unique: true
	},
	lastSeen: {   // in ms
		type: String
	},
	keywords: {
		type: Object,
		default: {}
	},
	keywordsAuto: {
		type: Object, 
		default: {}
	},
	isTopTerm: {
		type: Boolean,
		default: false
	},
	isTrendingTopic: {
		type: Boolean,
		default: false
	},
	rate: {
		type: Number,
		default: 0
	},
	mentions: {
		type: Number,
		default: 0
	}
});


mongoose.model('Hashtag', HashtagSchema);