
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const { Folder } = require('../models/folder');
const { Note } = require('../models/note');

/* ========== GET/READ ALL ITEM ========== */
router.get('/', (req, res, next) => {
	const { searchTerm } = req.query;
	let filter = {};

	if (searchTerm) {
		const re = new RegExp(searchTerm, 'i');
		filter = {'name':{ $regex: re }};
	}

	Folder.find(filter)
		.sort('name')
		.then(results => {
			res.json(results);
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

	Folder.findById(id)
		.then(result => {
			if(result){
				res.json(result);
			} else {
				next();
			}
		})
		.catch(err => next(err));
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {

	/***** Never trust users - validate input *****/
	const { name } = req.body;

	/***** Never trust users - validate input *****/
	if (!name) {
		const err = new Error('Missing `name` in request body');
		err.status = 400;
		return next(err);
	}

	const newItem = {
		name: name
	};

	Folder.create(newItem)
		.then(result => {
			res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
		})
		.catch(err => {
			if (err.code === 11000) {
				err = new Error('The folder name already exists');
				err.status = 400;
			}
			next(err);
		});
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {

	const { id } = req.params;
	const { name } = req.body;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		const err = new Error('Invalid \':id\'');
		err.status = 400;
		return next(err);
	}

	/***** Never trust users - validate input *****/
	if (!name) {
		const err = new Error('Missing `name` in request body');
		err.status = 400;
		return next(err);
	}

	const updateItem = {name};

	Folder.findByIdAndUpdate(id, updateItem, {new:true})
		.then(result => {
			if(result) {
				res.json(result);
			} else {
				next();
			}
		})
		.catch(err => next(err));
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {

	const { id } = req.params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		const err = new Error('Invalid \':id\'');
		err.status = 400;
		return next(err);
	}

	Note.updateMany({folderId : id},{$unset: {folderId: null}})
		.then(() => {
			return Folder.findByIdAndRemove(id);
		})
		.then( result => {
			if(result) {
				res.status(204).end();
			} else {
				next();
			}
		})
		.catch(err => next(err));

});

module.exports = router;
