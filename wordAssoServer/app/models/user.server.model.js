var mongoose = require('mongoose'),
	crypto = require('crypto'),
	Schema = mongoose.Schema;

var UserSchema = new Schema({
	userId: { 
		type: String,
		trim: true,
		unique: true
	},
	screenName: {
		type: String,
		trim: true
	},
	url: { 
		type: String
	},
	profileUrl: { 
		type: String
	},
	profileImageUrl: { 
		type: String
	},
	verified: { 
		type: Boolean
	},
	createdAt: { 
		type: Date
	},
	description: { 
		type: String
	},
	lastSeen: {   
		type: String
	}
});


mongoose.model('User', UserSchema);