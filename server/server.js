import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import aiRouter from './routes/aiRoutes.js'
import { clerkMiddleware} from '@clerk/express'
import connectCloudinary from './config/cloudinary.js'
import Userrouter from './routes/userRoute.js'

const app=express()
dotenv.config()

// --- PROPER CORS CONFIGURATION ---
// Define the list of allowed origins
const allowedOrigins = [
  'http://localhost:5173', // Your local frontend
  process.env.FRONTEND_URL    // Your deployed frontend URL from Vercel env variables
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
};

app.use(cors(corsOptions));
// --- END OF CORS FIX ---

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

