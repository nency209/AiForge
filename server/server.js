import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import aiRouter from './routes/aiRoutes.js'
import { clerkMiddleware} from '@clerk/express'
import connectCloudinary from './config/cloudinary.js'
import Userrouter from './routes/userRoute.js'

const app=express()
dotenv.config()
app.use(cors(({
  origin: 'http://localhost:5173' 
})))
app.use(express.json())
app.use(clerkMiddleware())
connectCloudinary()
app.use('/api/ai',aiRouter)
app.use('/api/ai',Userrouter)

const port=process.env.PORT


app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

app.listen(port,()=>console.log(`server start on http://localhost:${port}`))