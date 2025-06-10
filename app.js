const express = require ('express')
const mongoose = require('mongoose')
const booksRoutes = require('./routes/books.js')
const usersRoutes = require('./routes/users.js')
const path = require('path')
const cors = require('cors')

const app = express();

mongoose.connect('mongodb+srv://CL:OCProject@clusteroc.mht5l1u.mongodb.net/?retryWrites=true&w=majority&appName=ClusterOC')
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

app.use(express.json());

app.use(cors());

app.use('api/books', booksRoutes);

app.use('api/auth', usersRoutes);

app.use(('/images', express.static(path.join(__dirname,'images'))));

module.exports = app