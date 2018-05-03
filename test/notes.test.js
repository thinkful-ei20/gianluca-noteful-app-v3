
const  chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const { Note } = require('../models/note');
const seedNotes = require('../db/seed/notes');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Restaurants API resource', function() {

	this.timeout(5000);

	before(function () {
		return mongoose.connect(TEST_MONGODB_URI)
			.then(() => mongoose.connection.db.dropDatabase());
	});

	beforeEach(function () {
		return Note.insertMany(seedNotes)
			.then(() => Note.createIndexes());
	});

	afterEach(function () {
		return mongoose.connection.db.dropDatabase();
	});

	after(function () {
		return mongoose.disconnect();
	});

	describe('GET /api/notes', function () {
		it('should return the correct number of notes', function() {
			return Promise.all([
				Note.find(),
				chai.request(app).get('/api/notes')
			])
				.then(([data, res]) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.be.a('array');
					expect(res.body).to.have.length(data.length);
				});
		});

		it('should return notes with specific search filter', function() {

			const searchTerm = '%asd57157d1';
			const filter ={};
			const re = new RegExp(searchTerm, 'i');
			filter.$or = [{'title':{ $regex: re }},{'content':{ $regex: re }}];

			return Promise.all([
				Note.find(filter),
				chai.request(app).get(`/api/notes?searchTerm=${searchTerm}`)
			])
				.then(([data, res]) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.be.a('array');
					expect(res.body).to.have.length(data.length);
				});
		});

		it('should return an empty array for an invalid query', function () {
			const searchTerm = '%asd57157d1';
			const filter ={};
			const re = new RegExp(searchTerm, 'i');
			filter.$or = [{'title':{ $regex: re }},{'content':{ $regex: re }}];

			return Promise.all([
				Note.find(filter),
				chai.request(app).get(`/api/notes?searchTerm=${searchTerm}`)
			])
				.then(([data, res]) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.be.a('array');
					expect(res.body).to.have.length(data.length);
				});
		});
	});

	describe('GET /api/notes/:id', function () {
		it('should return correct note', function () {

			let data;

			return Note.findOne()
				.then(_data => {
					data = _data;
					return chai.request(app)
						.get(`/api/notes/${data.id}`);
				})
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;

					expect(res.body).to.be.an('object');
					expect(res.body).to.have.keys('id', 'title', 'content', 'createdAt', 'updatedAt');

					expect(res.body.id).to.equal(data.id);
					expect(res.body.title).to.equal(data.title);
					expect(res.body.content).to.equal(data.content);
				});
		});

		it('should respond with 400 for invalid \'id\'', function () {

			return chai.request(app)
				.get('/api/notes/DOES_NOT_EXIST')
				.then(res => {
					expect(res).to.have.status(400);
					expect(res).to.be.json;
				});
		});
	});

	describe('POST /api/notes', function () {
		it('should create and return a new item when provided valid data', function () {
			const newItem = {
				'title': 'The best article about cats ever!',
				'content': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...'
			};

			let res;
			return chai.request(app)
				.post('/api/notes')
				.send(newItem)
				.then(function (_res) {
					res = _res;
					expect(res).to.have.status(201);
					expect(res).to.have.header('location');
					expect(res).to.be.json;
					expect(res.body).to.be.a('object');
					expect(res.body).to.have.keys('id', 'title', 'content', 'createdAt', 'updatedAt');
					return Note.findById(res.body.id);
				})
				.then(data => {
					expect(res.body.title).to.equal(data.title);
					expect(res.body.content).to.equal(data.content);
				});
		});

		it('should return 400 status if \'title\' is not in the request body', function() {
			const newItem = {
				'content': 'I\'m a bad Post Request!'
			};

			return chai.request(app)
				.post('/api/notes')
				.send(newItem)
				.then(res => {
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.a('object');
					expect(res.body.message).to.equal('Missing `title` in request body');
				});
		});
	});

	describe('PUT /api/notes/:id', function () {
		it('should return the updated item when provided valid data', function () {
			const updateItem = {
				'title': 'I\'m a good put Request!',
				'content': 'Isn\'t that wonderful?'
			};
			let oldData;
			return Note.findOne({})
				.then(_data => {
					oldData = _data;
					return chai.request(app)
						.put(`/api/notes/${oldData.id}`)
						.send(updateItem);
				})
				.then(res => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.be.a('object');
					expect(res.body.title).to.not.equal(oldData.title);
				});
		});

		it('should respond with 400 for invalid \'id\'', function () {

			const updateItem = {
				'title': 'This has a invalid ID!',
				'content': 'Real invalid!'
			};

			return chai.request(app)
				.put('/api/notes/thisaintvalid')
				.send(updateItem)
				.then(res => {
					expect(res).to.have.status(400);
				});
		});

		it('should respond 400 status if \'title\' is not in the request body', function() {
			const updateItem = {
				'content': 'no title'
			};

			return Note.findOne({})
				.then(data => {
					return chai.request(app)
						.put(`/api/notes/${data.id}`)
						.send(updateItem);
				})
				.then(res => {
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.a('object');
					expect(res.body.message).to.equal('Missing `title` in request body');
				});
		});
	});

	describe('DELETE /api/notes/:id', function() {
		it('should respond 204 when \':id\' is deleted', function() {
			let data;
			return Note.findOne({})
				.then(_data => {
					data = _data;
					return chai.request(app)
						.delete(`/api/notes/${data.id}`);
				})
				.then(res => {
					expect(res).to.have.status(204);
				});
		});
		it('should respond with 400 for invalid \'id\'', function () {
			return chai.request(app)
				.delete('/api/notes/thisaintvalid')
				.then(res => {
					expect(res).to.have.status(400);
				});
		});
	});
});
