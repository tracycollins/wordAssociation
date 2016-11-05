var mongoose = require('mongoose'),
	crypto = require('crypto'),
	Schema = mongoose.Schema;

var PhraseSchema = new Schema({
	nodeId: { 
		type: String,
		unique: true
	},
	raw: { 
		type: String
	},
	url: { 
		type: String
	},
	createdAt: { 
		type: Date
	},
	links: {   
		type: Object
	},
	lastSeen: {   
		type: Number
	},
	mentions: {
		type: Number,
		default: 0
	}
});

mongoose.model('Phrase', PhraseSchema);