const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const { MONGODB_URI } = require('../config');

const { Note } = require('../models/note');

// console.log('GET all, use searchTerm');
// //GET all, use searchTerm
mongoose.connect(MONGODB_URI)

//GET all, use searchTerm
	.then(() => {
		const searchTerm = 'lorem';
		let filter = {};

		if (searchTerm) {
			const re = new RegExp(searchTerm, 'i');
			filter.$or = [{'title':{ $regex: re }},{'content':{ $regex: re }}];
		}

		return Note.find(filter)
			.sort('created')
			.then(results => {
				console.log(results);
			})
			.catch(console.error);
	})

// GET by ID
	// .then(() => {
	// 	const id = '000000000000000000000003';
	// 	return Note.findByIdAndUpdate(id,
	// 		{content:'Bye bucko!'}
	// 	).then(result => {
	// 		console.log(result);
	// 	})
	// 		.catch(console.error);
	// })

// POST by ID
	// .then(() => {
	// 	return Note.create({
	// 		title:'THis Is a New Title',
	// 		content:'hey bucko!',
	// 		createdAt: new Date()
	// 	})
	// 		.then(result => {
	// 			console.log(result);
	// 		})
	// 		.catch(console.error);
	// })

// PUT by ID
	// .then(() => {
	// 	const id = '000000000000000000000003';
	// 	return Note.findByIdAndUpdate(id,
	// 		{content:'Sup mang!'},
	// 		{new: true}
	// 	).then(result => {
	// 		console.log(result);
	// 	})
	// 		.catch(console.error);
	// })

// DELETE by ID
	// .then(() => {
	// 	const id = '000000000000000000000003';
	// 	return Note.findByIdAndRemove(id)
	// 		.then(result => {
	// 			console.log(result);
	// 		})
	// 		.catch(console.error);
	// })
	.then(() => {
		return mongoose.disconnect()
			.then(() => {
				console.info('Disconnected');
			});
	})
	.catch(err => {
		console.error(`ERROR: ${err.message}`);
		console.error(err);
	});

// console.log('--------------------------------------------------------');
// console.log('GET by ID');
// //GET by ID
// mongoose.connect(MONGODB_URI)
// .then(() => {
// 	const id = '000000000000000000000003';

// 	return Note.findById(id)
// 		.then(result => {
// 			console.log(result);
// 		})
// 		.catch(console.error);
// })
// .then(() => {
// 	return mongoose.disconnect()
// 		.then(() => {
// 			console.info('Disconnected');
// 		});
// })
// .catch(err => {
// 	console.error(`ERROR: ${err.message}`);
// 	console.error(err);
// });

// console.log('--------------------------------------------------------');
// console.log('POST by ID');
// mongoose.connect(MONGODB_URI)
// .then(() => {
// 	return Note.create({
// 		title:'THis Is a New Title',
// 		content:'hey bucko!'
// 	})
// 		.then(result => {
// 			console.log(result);
// 		})
// 		.catch(console.error);
// })
// .then(() => {
// 	return mongoose.disconnect()
// 		.then(() => {
// 			console.info('Disconnected');
// 		});
// })
// .catch(err => {
// 	console.error(`ERROR: ${err.message}`);
// 	console.error(err);
// });

// console.log('PUT by ID');
// mongoose.connect(MONGODB_URI)
// .then(() => {
// 	const id = '000000000000000000000003';
// 	return Note.findByIdAndUpdate(id,
// 		{content:'Bye bucko!'}
// 	).then(result => {
// 		console.log(result);
// 	})
// 		.catch(console.error);
// })
// .then(() => {
// 	return mongoose.disconnect()
// 		.then(() => {
// 			console.info('Disconnected');
// 		});
// })
// .catch(err => {
// 	console.error(`ERROR: ${err.message}`);
// 	console.error(err);
// });
