import express from 'express'
import { getUserCrations,getPublishedCrations } from '../controllers/userController.js';
import { auth } from '../middleware/auth.js';
const Userrouter=express.Router()

Userrouter.get('/get-user-creations',auth,getUserCrations)
Userrouter.post('/get-publish-craetions',auth,getPublishedCrations)

export default Userrouter;