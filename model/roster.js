var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var rosterSchema = new Schema({
	name : {
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

var Roster = mongoose.model('Roster', rosterSchema);
module.exports = Roster;