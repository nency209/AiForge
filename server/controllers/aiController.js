import sql from "../config/db.js";
import { clerkClient } from "@clerk/express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import pdf from "pdf-parse/lib/pdf-parse.js";

// --- Initialize the Google AI SDK ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Use the correct model (replace everywhere)
const AI_MODEL = "models/gemini-2.5-flash";

// --- ARTICLE GENERATION ---
export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (!prompt || !length) {
      return res.status(400).json({
        success: false,
        message: "'prompt' and 'length' are required.",
      });
    }

    if (plan !== "premium" && free_usage >= 10) {
      return res
        .status(403)
        .json({ success: false, message: "Limit reached. Upgrade your plan." });
    }

    const finalPrompt = `Write a comprehensive, well-structured article on: "${prompt}". Approx ${length} tokens. Format in Markdown.`;

    const model = genAI.getGenerativeModel({ model: AI_MODEL });
    const result = await model.generateContent(finalPrompt);
    const content = result.response.text();

    if (!content)
      return res
        .status(500)
        .json({ success: false, message: "Failed to parse AI content." });

    await sql`INSERT INTO creations (user_id,prompt,content,type) VALUES (${userId},${prompt},${content},'article')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: (free_usage || 0) + 1 },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error("Server Error in generateArticle:", error);
    res.status(500).json({
      success: false,
      message: `An internal server error occurred: ${error.message}`,
    });
  }
};

// --- BLOG TITLE GENERATION ---
export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { prompt, category } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (!prompt)
      return res
        .status(400)
        .json({ success: false, message: "'prompt' is required." });
    if (plan !== "premium" && free_usage >= 10)
      return res
        .status(403)
        .json({ success: false, message: "Limit reached." });

    const finalPrompt = `Write a Blog title for "${prompt}" in category ${category}`;

    const model = genAI.getGenerativeModel({ model: AI_MODEL });
    const result = await model.generateContent(finalPrompt);
    const content = result.response.text();

    if (!content)
      return res
        .status(500)
        .json({ success: false, message: "Failed to parse AI content." });

    await sql`INSERT INTO creations (user_id,prompt,content,type) VALUES (${userId},${prompt},${content},'blog-title')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: (free_usage || 0) + 1 },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error("Server Error in generateBlogTitle:", error);
    res.status(500).json({
      success: false,
      message: `An internal server error occurred: ${error.message}`,
    });
  }
};

// --- IMAGE GENERATION (no Gemini changes) ---
export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { prompt, ispublic } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (!prompt)
      return res
        .status(400)
        .json({ success: false, message: "Prompt required." });
    if (plan !== "premium" && free_usage >= 10)
      return res
        .status(403)
        .json({ success: false, message: "Limit reached." });

    const hfResponse = await axios.post(
      process.env.HUGGINGFACE_API_URL,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    const cloudinaryResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "image", tags: ispublic ? ["public"] : ["private"] },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      uploadStream.end(hfResponse.data);
    });

    const imageUrl = cloudinaryResult.secure_url;
    await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${imageUrl}, 'image')`;

    if (plan !== "premium")
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: (free_usage || 0) + 1 },
      });

    res.json({ success: true, imageUrl });
  } catch (err) {
    console.error("Error in generateImage:", err);
    res
      .status(500)
      .json({ success: false, message: "Image generation failed." });
  }
};

// --- BACKGROUND REMOVAL (no Gemini changes) ---
export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { plan, free_usage } = req;

    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "No image provided." });
    if (plan !== "premium" && free_usage >= 10)
      return res
        .status(403)
        .json({ success: false, message: "Limit reached." });

    const { secure_url } = await cloudinary.uploader.upload(req.file.path, {
      effect: "background_removal",
    });
    if (!secure_url) throw new Error("Cloudinary failed.");

    await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, 'Background Removal', ${secure_url}, 'image')`;
    if (plan !== "premium")
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: (free_usage || 0) + 1 },
      });

    res.json({ success: true, imageUrl: secure_url });
  } catch (err) {
    console.error("Error in removeImageBackground:", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// --- RESUME REVIEW ---
export const reviewResume = async (req, res) => {
  try {
    const { userId } = req.auth;
    const resume = req.file;
    const plan = req.plan;

    if (plan !== "premium")
      return res.status(403).json({ success: false, message: "Premium only." });
    if (!resume)
      return res
        .status(400)
        .json({ success: false, message: "No resume uploaded." });
    if (resume.size > 5 * 1024 * 1024)
      return res
        .status(400)
        .json({ success: false, message: "File too large." });

    const pdfData = await pdf(fs.readFileSync(resume.path));
    fs.unlinkSync(resume.path);

    if (!pdfData.text)
      return res
        .status(500)
        .json({ success: false, message: "Failed to parse PDF." });

    const finalPrompt = `Review this resume:\n\n${pdfData.text}`;

    const model = genAI.getGenerativeModel({ model: AI_MODEL });
    const result = await model.generateContent(finalPrompt);
    const content = result.response.text();

    if (!content)
      return res
        .status(500)
        .json({ success: false, message: "AI failed to generate feedback." });

    await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, 'Resume Review', ${content}, 'resume-review')`;
    res.json({ success: true, content });
  } catch (err) {
    console.error("Error in reviewResume:", err);
    res.status(500).json({
      success: false,
      message: `An internal server error occurred: ${err.message}`,
    });
  }
};
