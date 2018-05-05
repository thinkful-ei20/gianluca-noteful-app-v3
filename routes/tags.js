
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const { Tag } = require('../models/tag');
const { Note } = require('../models/note');

// ENDPOINTS GO HERE

/* ========== GET/READ ALL ITEM ========== */
router.get('/', (req, res, next) => {

	const { searchTerm } = req.query;
	const filter = searchTerm ? { name: {$regex : new RegExp(searchTerm, 'i')}} : {};

	Tag.find(filter).sort('name')
		.then((result) => {
			if(result) {
				res.json(result);
			}
			next();
		})
		.catch(next);
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {

	const { id } = req.params;

	if( !mongoose.Types.ObjectId.isValid(id) ) {
		const err = new Error('Invalid \':id\'');
		err.status = 400;
		next(err);
	}

	Tag.findById(id)
		.then(result => {
			if(result) {
				res.json(result);
			}
			next();
		})
		.catch(next);
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {

	const { name } = req.body;

	if(!name) {
		const err = new Error('Missing `name` in request body');
		err.status = 400;
		next(err);
	}

	const newItem = { name };

	Tag.create(newItem)
		.then(result => {
			if(result) {
				res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
			}
			next();
		}).catch(err => {
			if (err.code === 11000) {
				err = new Error(`The Tag 'name': ${name} already exists`);
				err.status = 400;
			}
			next(err);
		});
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {

	const { id } = req.params;
	const{ name } = req.body;

	if(!name) {
		const err = new Error('Missing `name` in request body');
		err.status = 400;
		next(err);
	}

	if(!mongoose.Types.ObjectId.isValid(id)){
		const err = new Error(`Invalid '/:id' : ${id}`);
		err.status = 400;
		next(err);
	}

	const updateItem = { name: name };

	Tag.findByIdAndUpdate(id, updateItem, {new:true})
		.then(result => {
			if(result) {
				res.json(result);
			}
			next();
		}).catch(err => {
			if(err.code === 11000) {
				err = new Error(`The Tag 'name': ${name} already exists`);
				err.status = 400;
			}
			next(err);
		});
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */

router.delete('/:id', (req, res, next) => {

	const { id } = req.params;

	if(!mongoose.Types.ObjectId.isValid(id)){
		const err = new Error(`Invalid '/:id' : ${id}`);
		err.status = 400;
		next(err);
	}

	//no filter because we are looking at all `notes` that reference the `tag`
	const action = { $pull : { tags:{ _id: id } } };

	Note.updateMany({}, action)
		.then(() => {
			return Tag.findByIdAndRemove(id);
		})
		.then( result => {
			if(result) {
				res.status(204).end();
			}
			next();
		})
		.catch(next);
});

module.exports = router;
