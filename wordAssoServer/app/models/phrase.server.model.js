var mongoose = require('mongoose'),
	crypto = require('crypto'),
	Schema = mongoose.Schema;

var PhraseSchema = new Schema({
	phraseId: { 
		type: String,
		unique: true
	},
	nodeId: { 
		type: String
	},
	raw: { 
		type: String
	},
	url: { 
		type: String
	},
	links: {   
		type: Object
	},
	createdAt: { 
		type: Number,
		default: moment().valueOf()
	},
	lastSeen: { 
		type: Number,
		default: moment().valueOf()
	},
	mentions: {
		type: Number,
		default: 0
	}
});

mongoose.model('Phrase', PhraseSchema);