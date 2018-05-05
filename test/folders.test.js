
require('dotenv').config();
const  chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');
const app = require('../server');

const { Folder } = require('../models/folder');
const { Note } = require('../models/note');

const seedFolders = require('../db/seed/folders');
const seedNotes = require('../db/seed/notes');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Folders API resource', function() {

	before(function () {
		return mongoose.connect(TEST_MONGODB_URI)
			.then(() => mongoose.connection.db.dropDatabase());
	});

	beforeEach(function () {
		return Folder.insertMany(seedFolders)
			.then(() => Folder.createIndexes());
	});

	afterEach(function () {
		return mongoose.connection.db.dropDatabase();
	});

	after(function () {
		return mongoose.disconnect();
	});

	describe('GET /api/folders', function () {

		it('should return the correct number of folders and fields, sorted by `name`', function() {
			return Promise.all([
				Folder.find().sort('name'), // returns the size of the collection
				chai.request(app).get('/api/folders')
			])
				.then(([data, res]) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.be.a('array');
					expect(res.body).to.have.length(data.length); // compare the "size" of the collection to the length of the response
					res.body.forEach(function(item, i){
						expect(item).to.be.a('object');
						expect(item).to.have.keys('id', 'name', 'createdAt', 'updatedAt');
						expect(item.id).to.equal(data[i].id);
						expect(item.name).to.equal(data[i].name);
						expect(new Date(item.updatedAt).getTime()).to.equal(data[i].updatedAt.getTime());
						expect(new Date(item.createdAt).getTime()).to.equal(data[i].createdAt.getTime());
					});
				});
		});

		it('should return folders with specific search query', function() {

			const searchTerm = '%asd57157d1';
			const re = new RegExp(searchTerm, 'i');
			const filter = {'name':{ $regex: re }};

			return Promise.all([
				Folder.find(filter),
				chai.request(app).get(`/api/folders?searchTerm=${searchTerm}`)
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
			const re = new RegExp(searchTerm, 'i');
			const filter = {'name':{ $regex: re }};

			return Promise.all([
				Folder.find(filter),
				chai.request(app).get(`/api/folders?searchTerm=${searchTerm}`)
			])
				.then(([data, res]) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.be.a('array');
					expect(res.body).to.have.length(data.length);
				});
		});
	});

	describe('GET /api/folders/:id', function () {

		it('should return correct folder', function () {

			let data;

			return Folder.findOne()
				.then(_data => {
					data = _data;
					return chai.request(app)
						.get(`/api/folders/${data.id}`);
				})
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.be.an('object');
					expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');
					expect(res.body.id).to.equal(data.id);
					expect(res.body.name).to.equal(data.name);
				});
		});

		it('should respond with 400 for invalid \'id\'', function () {

			return chai.request(app)
				.get('/api/folders/DOES_NOT_EXIST')
				.then(res => {
					expect(res).to.have.status(400);
					expect(res).to.be.json;
				});
		});

		it('should respond with 404 for non-existant \'id\'', function () {

			const id = '999999999999999999999999';

			return chai.request(app)
				.get(`/api/folders/${id}`)
				.then(res => {
					expect(res).to.have.status(404);
					expect(res).to.be.json;
				});
		});
	});

	describe('POST /api/folders', function () {

		it('should create and return a new folder when provided valid data', function () {

			const newItem = {
				'name': 'This is a good POST request',
			};
			let res;

			return chai.request(app)
				.post('/api/folders')
				.send(newItem)
				.then(function (_res) {
					res = _res;
					expect(res).to.have.status(201);
					expect(res).to.have.header('location');
					expect(res).to.be.json;
					expect(res.body).to.be.a('object');
					expect(res.body).to.have.keys('id', 'name', 'createdAt', 'updatedAt');
					return Folder.findById(res.body.id);
				})
				.then(data => {
					expect(res.body.name).to.equal(data.name);
				});
		});

		it('should return 400 status if \'name\' is not in the request body', function() {

			const newItem = {
				'not_a_name': 'I\'m a bad POST Request!'
			};

			return chai.request(app)
				.post('/api/folders')
				.send(newItem)
				.then(res => {
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.a('object');
					expect(res.body.message).to.equal('Missing `name` in request body');
				});
		});

		it('should return 400 if folder name already exists', function() {

			return chai.request(app)
				.get('/api/folders')
				.then(data => {

					const newItem = {
						name: data.body[0].name
					};

					return chai.request(app)
						.post('/api/folders')
						.send(newItem);
				})
				.then(res => {
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.a('object');
					expect(res.body.message).to.equal('The folder name already exists');
				});
		});
	});

	describe('PUT /api/folders/:id', function () {

		it('should return the updated folder when provided valid data', function () {

			const updateItem = {
				'name': 'I\'m a good put Request!',
			};
			let oldData;

			return Folder.findOne({})
				.then(_data => {
					oldData = _data;
					return chai.request(app)
						.put(`/api/folders/${oldData.id}`)
						.send(updateItem);
				})
				.then(res => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.be.a('object');
					expect(res.body.name).to.not.equal(oldData.name);
				});
		});

		it('should respond with 400 for invalid \'id\'', function () {

			const updateItem = {
				'name': 'This has a invalid ID!',
			};

			return chai.request(app)
				.put('/api/folders/thisaintvalid')
				.send(updateItem)
				.then(res => {
					expect(res).to.have.status(400);
				});
		});

		it('should respond 400 status if \'name\' is not in the request body', function() {

			const updateItem = {
				'nothing': 'no name'
			};

			return Folder.findOne({})
				.then(data => {
					return chai.request(app)
						.put(`/api/folders/${data.id}`)
						.send(updateItem);
				})
				.then(res => {
					expect(res).to.have.status(400);
					expect(res).to.be.json;
					expect(res.body).to.be.a('object');
					expect(res.body.message).to.equal('Missing `name` in request body');
				});
		});

		it('should respond with 404 for non-existant \'id\'', function () {

			const id = '999999999999999999999999';

			return chai.request(app)
				.get(`/api/folders/${id}`)
				.then(res => {
					expect(res).to.have.status(404);
					expect(res).to.be.json;
				});
		});
	});

	describe('DELETE /api/folders/:id', function() {

		before(function () {
			return Note.insertMany(seedNotes);
		});

		it('should respond 204 when a folder at \':id\' is deleted and set that folders references to `null`', function() {

			let data;

			return Folder.findOne({})
				.then(_data => {
					data = _data;
					return chai.request(app)
						.delete(`/api/folders/${data.id}`);
				})
				.then(res => {
					expect(res).to.have.status(204);
					return Note.find({folderId: data.id}).count();
				})
				.then(count => {
					expect(count).to.be.equal(0);
				});
		});

		it('should respond with 400 for invalid \'id\'', function () {

			return chai.request(app)
				.delete('/api/folders/thisaintvalid')
				.then(res => {
					expect(res).to.have.status(400);
				});
		});

		it('should respond with 404 for non-existant \'id\'', function () {

			const id = '999999999999999999999999';

			return chai.request(app)
				.delete(`/api/folders/${id}`)
				.then(res => {
					expect(res).to.have.status(404);
					expect(res).to.be.json;
				});
		});
	});
});