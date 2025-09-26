🧠 AI Forge – AI-Powered Content Creation Platform

AI Forge is a Full-Stack SaaS Application that empowers users to generate articles, images, blog titles, and resumes using advanced AI services.
It combines a modern frontend, scalable backend, and powerful AI integrations to deliver a smooth and intelligent content creation experience.

✨ Features

✅ AI-Powered Content Generation – Generate articles, blog titles, resumes, and images.
✅ Responsive Frontend – Built with React, Vite, TailwindCSS, and Formik.
✅ Scalable Backend – Node.js, Express.js, and Vercel Serverless Functions.
✅ AI Integrations – Google Gemini API & Hugging Face for text and image generation.
✅ Media Hosting – Cloudinary integration for storing and delivering images.
✅ Authentication & Subscription – Secure auth with Clerk + tier-based subscription plans.
✅ Database – PostgreSQL powered by Neon for reliability and scalability.

🏗️ Tech Stack
Frontend

⚛️ React

⚡ Vite

🎨 TailwindCSS

✅ Formik + Yup

Backend

🟢 Node.js

🚀 Express.js

🔥 Vercel Serverless Functions

AI & Media

🤖 Google Gemini API

🤗 Hugging Face

🌩️ Cloudinary

Auth & Database

🔑 Clerk (Authentication, Subscription)

🐘 Neon (PostgreSQL)

🚀 Getting Started
1️⃣ Clone Repository
git clone https://github.com/your-username/ai-forge.git
cd ai-forge

2️⃣ Install Dependencies

Frontend:

cd frontend
npm install


Backend:

cd backend
npm install

3️⃣ Environment Variables

Create a .env file in backend/ and add:

PORT=5000
DATABASE_URL=your_neon_postgres_url
CLERK_API_KEY=your_clerk_api_key
GEMINI_API_KEY=your_google_gemini_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

4️⃣ Run Development Server

Frontend:

cd frontend
npm run dev


Backend:

cd backend
npm run dev
