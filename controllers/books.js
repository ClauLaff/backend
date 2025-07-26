const book = require('../models/book.js')
const Book = require ('../models/book.js')
const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

exports.addBook = async (req, res) => {
  if(!req.body.book || !req.file){
    return res.status(400).json({message : 'Livre et image obligatoires'});
  }
  const bookObject = JSON.parse(req.body.book);
  /**Vérification des champs de la requête*/
  const fileName = req.file.filename;
  const bookDataValidationMessage = bookDataValidation(bookObject);
  if (bookDataValidationMessage){
    removeFile(fileName);
    return res.status(400).json({message : bookDataValidationMessage});
  }
  /**Reformatage de l'image */
  const imagePath = req.file.path;
  const formatedImageName = await formatImage(imagePath, fileName);
  if(formatedImageName === null){
    return res.status(500).json({message : `Sharp n'a pas réussi à formater l'image`});
  }
  removeFile(fileName);
  /**Enregistrement du livre */
  delete bookObject._id;
  delete bookObject._userId;
  const book = new Book ({
  ... bookObject,
  userId : req.auth.userId,
  imageUrl: `${req.protocol}://${req.get(`host`)}/images/${formatedImageName}`
  });
  book.save()
  .then(()=>{res.status(201).json({message:'Livre enregistré'})})
  .catch((error) => {res.status(400).json({error})});
}

exports.updateBook = async (req, res) => {
  Book.findOne({_id : req.params.id})
  .then (async (book) => { 
    /**Contrôle de l'autorisation*/
    if (book.userId !== req.auth.userId){
      res.status(401).json({message : 'Non autorisé'})
    } else {
      
      let bookObject = null;
      /** Requête avec une image dans file */
      if (req.file){
        bookObject = JSON.parse(req.body.book);
        /**Contrôle des champs de la requête */
         const fileName = req.file.filename;
        const bookDataValidationMessage = bookDataValidation(bookObject);
        if(bookDataValidationMessage){
          removeFile(fileName)
          return res.status(400).json({message : bookDataValidationMessage})
        }
         /**Reformatage de l'image */
        const imagePath = req.file.path;
        const formatedImageName = await formatImage(imagePath, fileName);
        if(formatedImageName === null){
          return res.status(500).json({message :`Sharp n'a pas réussi à formater l'image`});
        }
        removeFile(fileName);
        bookObject.imageUrl= `${req.protocol}://${req.get(`host`)}/images/${formatedImageName}`;
      }
      /**Requête sans image*/
      else{
        bookObject = req.body;
        /**Contrôle des champs de la requête */
        const bookDataValidationMessage = bookDataValidation(bookObject);
        if(bookDataValidationMessage){
          return res.status(400).json({message : bookDataValidationMessage})
        }
      }
      /**Mise à jour du livre */
      const previousImageName = book.imageUrl.split('/images/')[1];
      Book.updateOne({_id:req.params.id}, {... bookObject, _id:req.params.id})
      .then(()=>{ 
        if(req.file){removeFile(previousImageName)};
        res.status(200).json({message:'Livre modifié'})})
      .catch((error) => {res.status(400).json({error})});
    }
  })
  .catch((error) => {res.status(500).json({error})});
}

exports.deleteBook = (req, res) => {
  Book.findOne({_id : req.params.id})
  .then((book) => {
    /**Contrôle de l'autorisation */
    if (book.userId != req.auth.userId){
      res.status(401).json({message : 'Non autorisé'})
    } else {
      /**Supression de l'image dans le dossier 'image" et du livre dans la BDD */
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

exports.rateBook = (req, res) => {
  Book.findOne({_id:req.params.id})
  .then ((book) => {
    /**Vérification si déjà noté */
    const isRating = book.ratings.find((rating)=>rating.userId === req.auth.userId);
    if (isRating){
      res.status(401).json({message : 'Vous avez déjà noté ce livre'});
    }else{
      const rating = req.body.rating;
      /**Contrôle sur le champs rating de la requête */
      const bookRatingValidationMessage = bookRatingValidation(rating);
      if(bookRatingValidationMessage){
        return res.status(400).json({message : bookRatingValidationMessage})
      }
      /**Ajout d'un rating  au livre*/
      const newRating = {
          userId : req.auth.userId,
          grade : parseInt(rating, 10)
        };
      book.ratings.push(newRating);
      /**Mise à jour de la moyenne */
      let sum = 0;
      book.ratings.forEach ((rating)=>{sum += rating.grade});
      const average = Math.round (sum/(book.ratings.length));
      book.averageRating = average;
      /** Sauvegarde du livre mis à jour*/
      book.save()
      .then((book) => {res.status(200).json(book)})
      .catch(error => res.status(500).json({error}));
    }
  })
  .catch((error) => {res.status(500).json({error})});
}

exports.getBestRatedBooks= (req, res) =>{
  Book.find()
  .then ((books)=>{
    const sortedBooks = books.sort((b1, b2) => b2.averageRating - b1.averageRating);
    res.status(200).json(sortedBooks.slice(0,3));
  })
  .catch((error)=>{res.status(500).json({error})});
}

exports.getBook = (req, res) => {
  Book.findOne({_id:req.params.id})
  .then((book) =>{res.status(200).json(book)})
  .catch((error) => {res.status(404).json({error})});
}

exports.getBooks = (req, res) => {
  Book.find()
  .then((books) => {
    res.status(200).json(books)
  })
  .catch((error) => {
    res.status(500).json({error})});
}

function bookDataValidation (bookObject) {
  if(!bookObject.title || !bookObject.author || !bookObject.year || !bookObject.genre){
    return "Tous les champs sont obligatoires";
  }
  if( bookObject.title.length>100 || bookObject.author.length>100 || bookObject.genre.length>100 ){
   return "Ne pas dépasser 100 caractères";
  }
  if(!Number.isInteger(parseInt(bookObject.year)) || bookObject.year < 1455 || bookObject.year > new Date().getFullYear()){
    return `Date sous forme d'entier compris entre 1455 et ${new Date().getFullYear()}`;
  }
  return null;
}

function bookRatingValidation(rating){
  if(!rating || rating<1 || rating>5){
    return "Note comprise entre 1 et 5";
  }
  return null;
}

function removeFile(fileName){
  fs.unlink(`images/${fileName}`, (err) => {
    if(err){console.error(`Erreur lors de la suppression de l'image : `, err)}
  });
}

async function formatImage(imagePath, fileName){
  try{
    const name = fileName.split('.')[0] + '.webp';
    await sharp(imagePath).toFormat('webp').toFile(path.join('images', 'optimized_'+name));
    return 'optimized_'+ name
  }catch(error){ 
    console.error('Erreur formatImage:', error);
    return null;
  }
}