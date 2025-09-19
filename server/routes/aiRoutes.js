import express from 'express'
import { auth } from '../middleware/auth.js'
import { generateArticle } from '../controllers/aiController.js'
const route=express.Router()

route.post('/generate-article',auth,generateArticle)

export default route;