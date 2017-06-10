var mongoose = require('mongoose'),
	crypto = require('crypto'),
	Schema = mongoose.Schema;

var PlaceSchema = new Schema({
	placeId: {
		type: String,
		unique: true
	},
	nodeType: { 
		type: String,
		default: 'place'
	},
	nodeId: { 
		type: String
	},
	tags: { 
		type: Object,
		default: {}
	},
	isKeyword: { 
		type: Boolean,
		default: true
	},
	keywords: {  
		type: Object,
		default: { "neutral": 100}
	},
	keywordsAuto: {
		type: Object,
		default: {}
	},
	geocodeNodeId: { 
		type: String
	},
	formattedAddress: { 
		type: String
	},
	boundingBox: { 
		type: Object
	},
	centroid: { 
		type: [Number],
		default: []
	},
	name: { 
		type: String
	},
	fullName: { 
		type: String
	},
	countryCode: { 
		type: String
	},
	country: { 
		type: String
	},
	placeType: { 
		type: String
	},
	url: {   
		type: String
	},
	sourceUrl: {   
		type: String
	},
	imageUrl: {   
		type: String
	},
	createdAt: {   
		type: Number
	},
	lastSeen: {   
		type: Number
	},
	mentions: {
		type: Number,
		default: 0
	}
});


mongoose.model('Place', PlaceSchema);