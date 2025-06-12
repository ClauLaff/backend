const Book = require ('../models/book.js')
const fs = require('fs')

exports.addBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;
  const book = new Book ({
  ... bookObject,
  userId : req.auth.userId,
  imageUrl: `${req.protocol}://${req.get(`host`)}/images/${req.file.filename}`
  });
  book.save()
  .then(()=>{res.status(201).json({message:'Livre enregistré'})})
  .catch((error) => {res.status(400).json({error})});
}

exports.updateBook = (req, res, next) => {
  const bookObject = req.file?{
    ... JSON.parse(req.body.book),
    imageUrl: `${req.protocol}://${req.get(`host`)}/images/${req.file.filename}`
  } : {
    ... req.body
  };
  delete bookObject._userId;
  Book.findOne({_id : req.params.id})
  .then ((book) => { 
    if (book.userId != req.auth.userId){
      res.status(401).json({message : 'Non autorisé'})
    } else {
      Book.updateOne({_id:req.params.id}, {... bookObject, _id:req.params.id})
      .then(()=>{res.status(200).json({message:'Livre modifié'})})
      .catch((error) => {res.status(400).json({error})});
    }
  })
}

exports.deleteBook = (req, res, next) => {
  Book.findOne({_id : req.params.id})
  .then((book) => {
    if (book.userId != req.auth.userId){
      res.status(401).json({message : 'Non autorisé'})
    } else {
      const filename = book.imageUrl.split ('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
        Book.deleteOne({_id:req.params.id})
        .then(()=>{res.status(200).json({message:'Livre supprimé'})})
        .catch((error) => {res.status(400).json({error})});
      })
    }
  })
  .catch((error) => {res.status(500).json({error})})
}

exports.rateBook = (req, res, next) => {
  Book.findOne({_id:req.params.id})
  .then ((book) => {
    const rating = book.ratings.find((rating)=>rating.userId === req.auth.userId);
    if (rating){
      return res.status(401).json({message : 'Vous avez déjà noté ce livre'});
    }else{
      const newRating = {
          userId : req.auth.userId,
          grade : req.body.rating
        }
      book.ratings.push(newRating)
      /**Mise à jour de la moyenne */
      let sum = 0;
      book.ratings.forEach ((rating)=>{sum = sum + parseInt(rating.grade)});
      const average = Math.round(sum/(book.ratings.length));
      book.averageRating = average;
      return book.save()
      .then(() => res.status(200).json({message: 'Évaluation ajoutée'}))
      .catch(error => res.status(500).json({error}));
    }
  })
  .catch((error) => {res.status(500).json({error})});
}

exports.getBook = (req, res, next) => {
  console.log('Requête get book!');
  Book.findOne({_id:req.params.id})
  .then((book) =>{res.status(200).json(book)})
  .catch((error) => {res.status(404).json({error})});
}

exports.getBooks = (req, res, next) => {
  console.log ('Requête get books!');
  Book.find()
  .then((books) => {
    console.log(books)
    res.status(200).json(books)
  })
  .catch((error) => {
    console.log('erreur lors de la récupération des livres');
    res.status(500).json({error})});
}