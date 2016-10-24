var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var roomSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	height: {
		type: Number,
		required: true
	},
	width: { 
		type: Number,
		required: true
	},
	type: {
		type: String,
		enum: ["Class", "Lab"],
		required: true
	},
	ghostSeats: {
		type: Array,
		default: []
	},
	leftSeats: {
		type: Array,
		default: []
	},
	aisleSeats: {
		type: Array,
		default: []
	},
	totalSeats: { 
		type: Number,
		default: 0
	},
	numPerStation: {
		type: Number,
		default: 1
	},
	vmap: {
		type: Array,
		default: []
	},
	pmap: {
		type: Array,
		default: []
	},
	created_at: {
		type: Date,
		default: Date.now
	}
});

var Room = mongoose.model('Room', roomSchema);
module.exports = Room;