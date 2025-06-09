import express, { json } from 'express';
import { connect } from 'mongoose';
import booksRoutes from './routes/books.js';
import  userRoutes from './routes/user.js';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

connect('mongodb+srv://CL:OCProject@clusteroc.mht5l1u.mongodb.net/?retryWrites=true&w=majority&appName=ClusterOC')
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

app.use(json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

app.use('api/books', booksRoutes);

app.use('api/auth', userRoutes);

app.use(('/images', express.static(path.join(__dirname,'images'))));

export default app