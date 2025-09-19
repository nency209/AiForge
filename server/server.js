import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import aiRouter from './routes/aiRoutes.js'
import { clerkMiddleware} from '@clerk/express'

const app=express()
dotenv.config()
app.use(cors())
app.use(express.json())
app.use(clerkMiddleware())

app.use('/api/ai',aiRouter)

const port=process.env.PORT


app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

app.listen(port,()=>console.log(`server start on http://localhost:${port}`))