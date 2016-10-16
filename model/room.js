var mongoose = require('mongoose');
var roomSchema = new mongoose.Schema({
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
		type: Number
	},
	numPerStation: {
		type: Number,
		default: 1
	},
	map: {
		type: Array,
		default: []
	},
	created_at: {
		type: Date,
		default: Date.now
	}
});

mongoose.model('Room', roomSchema);