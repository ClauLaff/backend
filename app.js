const express = require ('express')
const mongoose = require('mongoose')
const booksRouter = require('./routes/books.js')
const usersRouter = require('./routes/users.js')
const path = require('path')
const cors = require('cors')

const app = express();

mongoose.connect('mongodb+srv://CL:OCProject@clusteroc.mht5l1u.mongodb.net/?retryWrites=true&w=majority&appName=ClusterOC')
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

app.use(express.json());

app.use(cors());

app.use('/api/books', booksRouter);

app.use('/api/auth', usersRouter);

app.use(('/images', express.static(path.join(__dirname,'images'))));

module.exports = app