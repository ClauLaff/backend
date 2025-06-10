const express = require('express')
const router = express.Router()
const usersCtrl = require('../controllers/users.js')

const usersRoutes = ()=>{
        
    router.post('/signup', usersCtrl.signUp)

    router.post('/login', usersCtrl.logIn)

}

module.exports = usersRoutes