import { Router } from 'express';
import {addBook, updateBook, deleteBook, getBook, getBooks} from '../controllers/books.js';
import auth from '../middleware/auth.js';
import multer from '../middleware/multer-config.js';
const router = Router();

router.post('/', auth, multer, addBook);

router.put('/:id', auth, multer, updateBook);

router.delete('/:id', auth, deleteBook);

router.get('/:id', getBook);

router.get('/', getBooks);

export default router