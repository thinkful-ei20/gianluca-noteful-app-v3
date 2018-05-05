
require('dotenv').config();
const chai = require('chai');
const chaiHtpp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');
const app = require('../server');

const { Tag } = require('../models/tag');
const { Note } = require('../models/note');

const seedTags = require('../db/seed/tags');
const seedNotes = require('../db/seed/notes');

const expect = chai.expect;
chai.use(chaiHtpp);

describe('Tags API resource', () => {

	before(() => {
		return mongoose.connect(TEST_MONGODB_URI)
			.then(() => mongoose.connection.db.dropDatabase());
	});

	beforeEach(() => {
		return Tag.insertMany(seedTags)
			.then(() => Tag.createIndexes());
	});

	afterEach(() => {
		return mongoose.connection.db.dropDatabase();
	});

	after(() => {
		return mongoose.disconnect();
	});

	describe('GET /api/tags', () => {
		it('should respond with the correct number of Tags with the correct fields, sorted by `name`', () => {

			return Promise.all([
				Tag.find().sort('name'),
				chai.request(app).get('/api/tags'),
			])
				.then(([data, res]) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.be.an('array');
					expect(res.body).to.have.length(data.length);
					res.body.forEach((item, i) => {
						expect(item).to.be.an('object');
						expect(item).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
						expect(item.id).to.be.equal(data[i].id);
						expect(item.name).to.be.equal(data[i].name);
						expect(new Date(item.updatedAt).getTime()).to.be.equal(new Date(data[i].updatedAt).getTime());
						expect(new Date(item.createdAt).getTime()).to.be.equal(new Date(data[i].createdAt).getTime());
					});
				});
		});


		it('should respond with and array of Tags using a valid search query', () => {

			const searchTerm = 'foo';
			const filter = {name: {$regex : new RegExp(searchTerm, 'i')}};

			return Promise.all([
				// Tag.find(filter).sort('name').lean(),
				Tag.find(filter).sort('name'),
				chai.request(app).get(`/api/tags?searchTerm=${searchTerm}`)
			])
				.then(([data, res]) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.be.an('array');
					expect(res.body).to.have.length(data.length);
					res.body.forEach((item, i) => {
						expect(item).to.be.an('object');
						expect(item).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
						// expect(item).to.equal(data[i]);
						// console.log(item);
						// console.log(data[i]);
						expect(item.id).to.be.equal(data[i].id);
						expect(item.name).to.be.equal(data[i].name);
						expect(new Date(item.updatedAt).getTime()).to.be.equal(new Date(data[i].updatedAt).getTime());
						expect(new Date(item.createdAt).getTime()).to.be.equal(new Date(data[i].createdAt).getTime());
					});
				});
		});

		it('should return an `empty` array of Tags using an invalid search query', () => {

			const searchTerm = '$5asd65gk';

			chai.request(app).get(`/api/tags?searchTerm=${searchTerm}`)
				.then(res => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.be.an('array');
					expect(res.body).to.have.empty;
				});
		});
	});

	describe('GET /api/tags/:id', () => {
		it('should respond with the correct Tag using a valid /:id paramater', () => {

			let data;

			return Tag.findOne()
				.then( _data => {
					data = _data;
					return chai.request(app).get(`/api/tags/${data.id}`);
				})
				.then(res => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body).to.have.all.keys('id','name','createdAt', 'updatedAt');
					expect(res.body.id).to.be.equal(data.id);
					expect(res.body.name).to.be.equal(data.name);
					expect(new Date(res.body.updatedAt).getTime()).to.be.equal(new Date(data.updatedAt).getTime());
					expect(new Date(res.body.createdAt).getTime()).to.be.equal(new Date(data.createdAt).getTime());
				});
		});

		it('should respond with 400 for an `invalid` /:id paramater', () => {

			const id = 'hey, I am a bad ID!';

			return chai.request(app).get(`/api/tags/${id}`)
				.then(res => {
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body.message).to.be.equal('Invalid \':id\'');
				});
		});

		it('should respond with 404 for a not found /:id paramater', () => {

			const id = '999999999999999999999999';

			return chai.request(app).get(`/api/tags/${id}`)
				.then(res => {
					expect(res).to.have.status(404);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
				});
		});
	});

	describe('POST /api/tags', () => {
		it('should create and return a new tag when provided valid data', () => {
			const newItem = {
				'name': 'This is a good POST request',
			};

			let res;
			return chai.request(app)
				.post('/api/tags')
				.send(newItem)
				.then(function (_res) {
					res = _res;
					expect(res).to.have.status(201);
					expect(res).to.have.header('location');
					expect(res).to.be.json;
					expect(res.body).to.be.a('object');
					expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');
					return Tag.findById(res.body.id);
				})
				.then(data => {
					expect(res.body.name).to.equal(data.name);
				});
		});

		it('should return 400 status if `name` is not in the request body', () => {
			const newItem = {
				'not_a_name': 'I\'m a bad POST Request!'
			};

			return chai.request(app)
				.post('/api/tags')
				.send(newItem)
				.then(res => {
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.a('object');
					expect(res.body.message).to.equal('Missing `name` in request body');
				});
		});

		it('should return 400 if tag name already exists', () => {
			let _name;
			return chai.request(app)
				.get('/api/tags')
				.then(data => {
					_name = data.body[0].name;
					const newItem = {
						name: _name
					};
					return chai.request(app)
						.post('/api/tags')
						.send(newItem);
				})
				.then(res => {
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.a('object');
					expect(res.body.message).to.equal(`The Tag 'name': ${_name} already exists`);
				});
		});
	});

	describe('PUT /api/tags/:id', () => {
		it('should return the updated folder when provided valid data', () => {
			const updateItem = {
				'name': 'I\'m a good put Request!',
			};
			let oldData;
			return Tag.findOne({})
				.then(_data => {
					oldData = _data;
					return chai.request(app)
						.put(`/api/tags/${oldData.id}`)
						.send(updateItem);
				})
				.then(res => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.be.a('object');
					expect(res.body.name).to.not.equal(oldData.name);
				});
		});

		it('should respond with 400 for invalid /:id', () => {

			const updateItem = {
				'name': 'This has a invalid ID!',
			};

			return chai.request(app)
				.put('/api/tags/thisaintvalid')
				.send(updateItem)
				.then(res => {
					expect(res).to.have.status(400);
				});
		});

		it('should respond 400 status if `name` is not in the request body', () => {
			const updateItem = {
				'nothing': 'no name'
			};

			return Tag.findOne({})
				.then(data => {
					return chai.request(app)
						.put(`/api/tags/${data.id}`)
						.send(updateItem);
				})
				.then(res => {
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.a('object');
					expect(res.body.message).to.equal('Missing `name` in request body');
				});
		});

		it('should respond with 404 for non-existant /:id', () => {
			const id = '999999999999999999999999';
			return chai.request(app)
				.get(`/api/tags/${id}`)
				.then(res => {
					expect(res).to.have.status(404);
					expect(res).to.be.json;
				});
		});
	});

	describe('DELETE /api/tags/:id', () => {
		before(() => {
			return Note.insertMany(seedNotes);
		});

		it('should respond 204 when a tag at /:id is deleted and set that tags references to `null`', () => {
			let data;
			return Tag.findOne({})
				.then(_data => {
					data = _data;
					return chai.request(app)
						.delete(`/api/tags/${data.id}`);
				})
				.then(res => {
					expect(res).to.have.status(204);
					return Note.find({tags:{ $elemMatch:{ _id: data.id}}}).count();
				})
				.then(result => {
					expect(result).to.be.equal(0);
				});
		});

		it('should respond with 400 for invalid /:id', () => {
			return chai.request(app)
				.delete('/api/tags/thisaintvalid')
				.then(res => {
					expect(res).to.have.status(400);
				});
		});

		it('should respond with 404 for non-existant /:id', () => {
			const id = '999999999999999999999999';
			return chai.request(app)
				.delete(`/api/tags/${id}`)
				.then(res => {
					expect(res).to.have.status(404);
					expect(res).to.be.json;
				});
		});
	});
});
