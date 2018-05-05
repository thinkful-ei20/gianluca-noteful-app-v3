
const mongoose = require('mongoose');

const tagSchema = mongoose.Schema({
	name:{ type: String, unique:true, required:true }
},{
	timestamps:true
});

tagSchema.set('toObject', {
	transform: function (doc, ret) {
		ret.id = ret._id;
		delete ret._id;
		delete ret.__v;
	}
});

const Tag = mongoose.model('Tag',tagSchema);

module.exports = { Tag };
