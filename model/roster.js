var mongoose = require('mongoose');
var rosterSchema = new mongoose.Schema({
	rosterName : {
		type: String,
		required: true
	},
	students : {
		type: Array,
		required: true
	},
	totalStudents: {
		type: Number,
		default: 0
	},
	created_at: {
		type: Date,
		default: Date.now
	}
});

mongoose.model('Roster', rosterSchema);