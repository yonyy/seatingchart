var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var eventSchema = new Schema({
	name: {
		type: String,
		default: "Unnamed Event"
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
	created_at: {
		type: Date,
		default: Date.now
	}
});

var Event = mongoose.model('Event', eventSchema);
module.exports = Event;