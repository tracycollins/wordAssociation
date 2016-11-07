var mongoose = require('mongoose'),
	crypto = require('crypto'),
	Schema = mongoose.Schema;

var WordSchema = new Schema({
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
	wordChainIndex: {   
		type: Number,
		default: 0
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
	},
	isKeyword: {
		type: Boolean,
		default: false
	},
	keywords: {
		type: Object,
		default: {}
	},
	isIgnored: {
		type: Boolean,
		default: false
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
		type: String
	},
	mwDictSearched: {
		type: Boolean,
		default: false
	},
	mwDictFound: {
		type: Boolean,
		default: false
	},
	mwThesSearched: {
		type: Boolean,
		default: false
	},
	mwThesFound: {
		type: Boolean,
		default: false
	},
	mwEntry: {  // mw thesaurus
		type: Object
	},
	mwSuggestion: { // mw dictionary
		type: Object
	}
// }, { minimize: false });
});

mongoose.model('Word', WordSchema);