const User = require('../models/User.js')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

exports.signUp = (req, res)=>{
  const email = req.body.email;
  const emailValidationMessage = emailValidation(email);
  if (emailValidationMessage){
    return res.status(400).json({ message : emailValidationMessage});
  }
  const password = req.body.password;
  const passwordValidationMessage = passwordValidation(password);
  if (passwordValidationMessage){
    return res.status(400).json({message : passwordValidationMessage})
  }
  bcrypt.hash(password, parseInt(process.env.SALT))
  .then ((hash) =>{
    const user = new User({
      email : email,
      password : hash
    });
    user.save()
    .then(()=>{res.status(201).json({message:'Utilisateur créé'})})
    .catch((error) => {res.status(400).json({error})});
  })
  .catch ((error) => {
    console.log('Le compte n\'a pas été créée');
    res.status(500).json({error})});
}

exports.logIn = (req, res)=>{
  User.findOne({email : req.body.email})
  .then ((user) =>{
    if (user === null){
      res.status(401).json({message : 'Paire id/mot de passe incorrecte'});
    }else{
      bcrypt.compare(req.body.password, user.password)
      .then ((valid) =>{
        if(!valid){
          res.status(401).json({message : 'Paire id/mot de passe incorrecte'});
        }else{
          res.status(200).json({
            userId : user._id, 
            token : jwt.sign(
              {userId : user._id},
              process.env.JWT_SECRET,
              {expiresIn : '24h'}
            )
          })
        }
      })
      .catch((error) =>{res.status(500).json({error}) });
    }
  })
  .catch((error)=>{res.status(500).json({error})});
}

function emailValidation(email){
  if(!email || email.length>254){
    return "Email obligatoire et ne pas dépasser 254 caractères"
  }
  const regex = /^[\w.-]+@[\w.-]+\.+[a-zA-Z]{2,}$/;
  const valid = regex.test(email);
  if (!valid){
    return "Format d'email invalide";
  }
  return null
}
function passwordValidation(password){
  if(!password || password.length<8 || password.length>20){
    return "Mot de passe obligatoire et compris entre 8 et 20 caractères"
  }
  return null
}