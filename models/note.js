
const mongoose = require('mongoose');

const noteSchema = mongoose.Schema({
	title: {type: String, required: true},
	content: String,
	createdAt: Date,
	updatedAt: Date
});

const Note = mongoose.model('Note', noteSchema);

module.exports = {Note};