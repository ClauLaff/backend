const express = require('express')
const booksCtrl = require('../controllers/books.js')
const auth = require('../middleware/auth.js')
const multer = require('../middleware/multer-config.js')
const router = express.Router()
      
router.post('/', auth, multer, booksCtrl.addBook)

router.post('/:id/rating', auth, booksCtrl.rateBook)

router.put('/:id', auth, multer, booksCtrl.updateBook)

router.delete('/:id', auth, booksCtrl.deleteBook)

router.get('/:id', booksCtrl.getBook)

router.get('/', booksCtrl.getBooks)


module.exports = router