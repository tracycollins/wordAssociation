var mongoose = require('mongoose'),
	crypto = require('crypto'),
	Schema = mongoose.Schema;

var WordSchema = new Schema({
	wordId: { 
		type: String,
		trim: true,
		unique: true
	},
	createdAt: { 
		type: Date
	},
	lastSeen: {   
		type: String
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
	}
});

mongoose.model('Word', WordSchema);