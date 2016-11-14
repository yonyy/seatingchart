var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var eventSchema = new Schema({
	name: {
		type: String,
		default: "Unnamed Event"
	},
	section: {
		type: String,
		default: "Undef",
		required: true
	},
	roomID: {
		type: Schema.ObjectId,
		required: true
	},
	rosterID: {
		type: Schema.ObjectId,
		required: true
	},
	seed: {
		type: Number,
		default: 1
	},
	date: {
		type: Date,
		default: Date.now
	},
	time: {
		type: Date,
		default: Date.now
	},
	created_at: {
		type: Date,
		default: Date.now
	}
});

var Event = mongoose.model('Event', eventSchema);
module.exports = Event;
