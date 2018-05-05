
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();


const { Note } = require('../models/note');

/* ========== GET/READ ALL ITEM ========== */
router.get('/', (req, res, next) => {
	const { searchTerm, folderId, tagId } = req.query;
	let filter = {};

	if (searchTerm) {
		const re = new RegExp(searchTerm, 'i');
		filter.$or = [{'title':{ $regex: re }},{'content':{ $regex: re }}];
	}

	if (folderId) {
		filter.folderId = folderId;
	}

	if (tagId) {
		filter.tags = tagId;
	}

	Note.find(filter)
		.populate('tags')
		.sort('created')
		.then(results => {
			if(results) {
				res.json(results);
			}
			next();
		})
		.catch(err => next(err));
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {

	const { id } = req.params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		const err = new Error('Invalid \':id\'');
		err.status = 400;
		return next(err);
	}

	Note.findById(id)
		.populate('tags')
		.then(result => {
			if(result){
				res.json(result);
			}
			next();
		})
		.catch(next);
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {

	const { title, content, folderId, tags = [] } = req.body;

	if (!title) {
		const err = new Error('Missing `title` in request body');
		err.status = 400;
		return next(err);
	}

	if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
		const err = new Error('The `folder id` is not valid');
		err.status = 400;
		return next(err);
	}

	if (tags) {
		tags.forEach((tag) => {
			if (!mongoose.Types.ObjectId.isValid(tag)) {
				const err = new Error('The `tag id` is not valid');
				err.status = 400;
				return next(err);
			}
		});
	}

	const newItem = {title, content, folderId, tags};

	Note.create(newItem)
		.then(result => {
			if(result) {
				res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
			}
			next();
		})
		.catch(next);
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {

	const { id } = req.params;
	const { title, content, folderId, tags = [] } = req.body;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		const err = new Error('Invalid `/:id`');
		err.status = 400;
		return next(err);
	}

	if (!title) {
		const err = new Error('Missing `title` in request body');
		err.status = 400;
		return next(err);
	}

	if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
		const err = new Error('The `folder id` is not valid');
		err.status = 400;
		return next(err);
	}

	if (tags) {
		tags.forEach((tag) => {
			if (!mongoose.Types.ObjectId.isValid(tag)) {
				const err = new Error('The `tag id` is not valid');
				err.status = 400;
				return next(err);
			}
		});
	}

	const updateItem = {title, content, folderId, tags};

	Note.findByIdAndUpdate(id, updateItem, {new:true})
		.then(result => {
			if(result) {
				res.json(result);
			}
			next();
		})
		.catch(next);
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {

	const { id } = req.params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		const err = new Error('Invalid \':id\'');
		err.status = 400;
		return next(err);
	}

	Note.findByIdAndRemove(id)
		.then( (result) => {
			if(result) {
				res.status(204).end();
			}
			next();
		})
		.catch(next);

});

module.exports = router;
