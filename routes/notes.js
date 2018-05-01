

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
mongoose.Promise = global.Promise;

const { Note } = require('../models/note');

/* ========== GET/READ ALL ITEM ========== */
router.get('/', (req, res, next) => {
	const {searchTerm} = req.query;
	let filter = {};

	if (searchTerm) {
		const re = new RegExp(searchTerm, 'i');
		filter.$or = [{'title':{ $regex: re }},{'content':{ $regex: re }}];
	}
	Note.find(filter)
		.sort('created')
		.then(results => {
			res.json(results);
		})
		.catch(err => next(err));
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {

	const id = req.params.id;

	Note.findById(id)
		.then(results => {
			res.json(results);
		})
		.catch(err => next(err));

});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {

	/***** Never trust users - validate input *****/
	const { title, content } = req.body;

	/***** Never trust users - validate input *****/
	if (!title) {
		const err = new Error('Missing `title` in request body');
		err.status = 400;
		return next(err);
	}

	const newItem = {
		title: title,
		content: content,
	};

	Note.create(newItem)
		.then(result => {
			res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
		})
		.catch(err => next(err));
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {

	const id = req.params.id;

	/***** Never trust users - validate input *****/
	const updateObj = {};
	const updateableFields = ['title', 'content'];

	updateableFields.forEach(field => {
		if (field in req.body) {
			updateObj[field] = req.body[field];
		}
	});

	/***** Never trust users - validate input *****/
	if (!updateObj.title) {
		const err = new Error('Missing `title` in request body');
		err.status = 400;
		return next(err);
	}

	Note.findByIdAndUpdate(id, updateObj, {new:true})
		.then(result => {
			res.json(result);
		})
		.catch(err => next(err));
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {

	const id = req.params.id;

	Note.findByIdAndRemove(id)
		.then( () => {
			res.status(204).end();
		})
		.catch(err => next(err));

});

module.exports = router;