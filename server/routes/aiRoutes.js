import express from 'express'
import {upload} from'../config/multer.js'
import { auth } from '../middleware/auth.js'
import { generateArticle ,generateBlogTitle,generateImage, removeImageBackground, removeImageObject, reviewResume} from '../controllers/aiController.js'
const router=express.Router()

router.post('/generate-article',auth,generateArticle)
router.post('/generate-blog-title',auth,generateBlogTitle)
router.post('/generate-image',auth,generateImage)
router.post('/remove-object',upload.single('image'),auth,removeImageObject)
router.post('/remove-img-background',upload.single('image'),auth,removeImageBackground)
router.post('/review-resumeq',upload.single('resume'),auth,reviewResume)
export default router;