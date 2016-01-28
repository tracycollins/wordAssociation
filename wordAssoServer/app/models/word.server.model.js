var mongoose = require('mongoose'),
	crypto = require('crypto'),
	Schema = mongoose.Schema;

var WordSchema = new Schema({
	nodeId: { 
		type: String,
		unique: true
	},
	createdAt: { 
		type: Date
	},
	lastSeen: {   
		type: Number
	},
	mentions: {
		type: Number,
		default: 0
	},
	noun: {
		type: Object
	},
	verb: {
		type: Object
	},
	adjective: {
		type: Object
	},
	adverb: {
		type: Object
	},
	bhtSearched: {
		type: Boolean,
		default: false
	},
	bhtFound: {
		type: Boolean,
		default: false
	},
	bhtAlt: {  // 303 Redirected
		type: String  // alternate word
	},
	mwSearched: {
		type: Boolean,
		default: false
	},
	mwFound: {
		type: Boolean,
		default: false
	},
	mwEntry: {
		type: Object
	}
});

mongoose.model('Word', WordSchema);