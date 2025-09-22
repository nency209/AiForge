import sql from "../config/db.js";
import { clerkClient } from "@clerk/express";
import fetch from "node-fetch";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import pdf from "pdf-parse/lib/pdf-parse.js";

export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (!prompt || !length) {
      return res.status(400).json({
        success: false,
        message: "Bad Request: 'prompt' and 'length' are required.",
      });
    }

    if (plan !== "premium" && free_usage >= 10) {
      return res.status(403).json({
        success: false,
        message: "Limit reached. Please upgrade your plan to continue.",
      });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `Write an article about the following topic: "${prompt}". The article should be approximately ${length} tokens long.`,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: length,
      },
    };

    // --- Start of Retry Logic ---
    let apiResponse;
    const maxRetries = 3;
    let attempt = 0;

    for (attempt = 1; attempt <= maxRetries; attempt++) {
      apiResponse = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // If the request was successful (e.g., status 200), exit the loop.
      if (apiResponse.ok) {
        break;
      }

      // If the error is a server overload (503), wait and retry.
      if (apiResponse.status === 503 && attempt < maxRetries) {
        console.log(
          `Attempt ${attempt}: Model is overloaded. Retrying in ${
            attempt * 2
          } seconds...`
        );
        // Wait for 2, 4 seconds before the next retry.
        await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
      } else {
        // For other errors, or on the last retry, break the loop and proceed to handle the error.
        break;
      }
    }
    // --- End of Retry Logic ---

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error("Gemini API Error:", errorData);
      return res.status(apiResponse.status).json({
        success: false,
        message: `Error from AI service: ${
          errorData.error.message || "Unknown error"
        }`,
      });
    }

    const responseData = await apiResponse.json();
    const content = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      return res.status(500).json({
        success: false,
        message: "Failed to parse content from AI response.",
      });
    }

    await sql`insert into creations (user_id,prompt,content,type) VALUES (${userId},${prompt},${content},'article')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (!prompt || !length) {
      return res.status(400).json({
        success: false,
        message: "Bad Request: 'prompt' and 'length' are required.",
      });
    }

    if (plan !== "premium" && free_usage >= 10) {
      return res.status(403).json({
        success: false,
        message: "Limit reached. Please upgrade your plan to continue.",
      });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `Write an article about the following topic: "${prompt}". The article should be approximately ${length} tokens long.`,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: length,
      },
    };

    // --- Start of Retry Logic ---
    let apiResponse;
    const maxRetries = 3;
    let attempt = 0;

    for (attempt = 1; attempt <= maxRetries; attempt++) {
      apiResponse = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // If the request was successful (e.g., status 200), exit the loop.
      if (apiResponse.ok) {
        break;
      }

      // If the error is a server overload (503), wait and retry.
      if (apiResponse.status === 503 && attempt < maxRetries) {
        console.log(
          `Attempt ${attempt}: Model is overloaded. Retrying in ${
            attempt * 2
          } seconds...`
        );
        // Wait for 2, 4 seconds before the next retry.
        await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
      } else {
        // For other errors, or on the last retry, break the loop and proceed to handle the error.
        break;
      }
    }
    // --- End of Retry Logic ---

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error("Gemini API Error:", errorData);
      return res.status(apiResponse.status).json({
        success: false,
        message: `Error from AI service: ${
          errorData.error.message || "Unknown error"
        }`,
      });
    }

    const responseData = await apiResponse.json();
    const content = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      return res.status(500).json({
        success: false,
        message: "Failed to parse content from AI response.",
      });
    }

    await sql`insert into creations (user_id,prompt,content,type) VALUES (${userId},${prompt},${content},'blog-title')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateImage = async (req, res) => {
  try {
    // 1. AUTHENTICATION & INPUT VALIDATION
    const { userId } = req.auth();
    const plan = req.plan;
    const free_usage = req.free_usage;
    const { prompt } = req.body;

    if (!prompt) {
      return res
        .status(400)
        .json({ success: false, message: "A prompt is required." });
    }

    // 2. USAGE LIMIT CHECK
    if (plan !== "premium" && free_usage >= 10) {
      return res.status(403).json({
        success: false,
        message: "Limit reached. Please upgrade your plan to continue.",
      });
    }

    // 3. IMAGE GENERATION (HUGGING FACE)
    const hfResponse = await axios.post(
      process.env.HUGGINGFACE_API_URL, // Uses the URL from your .env file
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "image/jpeg",
        },
        responseType: "arraybuffer",
      }
    );
    const imageBuffer = hfResponse.data;

    // 4. IMAGE UPLOAD (CLOUDINARY)
    const cloudinaryResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "image" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(imageBuffer);
    });

    if (!cloudinaryResult || !cloudinaryResult.secure_url) {
      throw new Error("Failed to upload image to Cloudinary.");
    }
    const imageUrl = cloudinaryResult.secure_url;

    // 5. DATABASE INSERTION
    await sql`insert into creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${imageUrl}, 'image')`;

    // 6. UPDATE USER METADATA
    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    // 7. SUCCESS RESPONSE
    res.json({ success: true, imageUrl: imageUrl });
  } catch (err) {
    // --- ROBUST ERROR HANDLING ---
    console.error("--- FULL ERROR in generateImage ---");
    console.error(err);

    if (err.response) {
      // Specifically handles Hugging Face API errors
      const errorData = Buffer.from(err.response.data).toString("utf-8");
      return res.status(err.response.status).json({
        success: false,
        message: `Hugging Face API Error: ${err.response.status}`,
        details: errorData,
      });
    }

    // Fallback for Cloudinary, DB, or other internal errors
    res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred during the image generation process.",
    });
  }
};

export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { image } = req.file;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (!prompt || !length) {
      return res.status(400).json({
        success: false,
        message: "Bad Request: 'prompt' and 'length' are required.",
      });
    }

    if (plan !== "premium" && free_usage >= 10) {
      return res.status(403).json({
        success: false,
        message: "Limit reached. Please upgrade your plan to continue.",
      });
    }

    const { secure_url } = await cloudinary.uploader.upload(image.path, {
      transformation: [
        {
          effect: "background_removal",
          background_removal: "remove_the_background",
        },
      ],
    });

    await sql`insert into creations (user_id,prompt,content,type) VALUES (${userId},'Remove background from image',${secure_url},'image')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { object } = req.body;
    const { image } = req.file;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (!prompt || !length) {
      return res.status(400).json({
        success: false,
        message: "Bad Request: 'prompt' and 'length' are required.",
      });
    }

    if (plan !== "premium" && free_usage >= 10) {
      return res.status(403).json({
        success: false,
        message: "Limit reached. Please upgrade your plan to continue.",
      });
    }

    const { public_id } = await cloudinary.uploader.upload(image.path);
    const imageUrl = cloudinary.url(public_id, {
      transformation: [{ effect: `gen_remove:${object}` }],
      resource_type: "image",
    });

    await sql`insert into creations (user_id,prompt,content,type) VALUES (${userId},${`removed ${object} from image`},${imageUrl},'image')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }

    res.json({ success: true, content: imageUrl });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewResume = async (req, res) => {
  try {
    const { userId } = req.auth();
    constresume = req.file;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "this features is only availble for premium subscription",
      });
    }

    if (resume.size > 5 * 1024 * 1024) {
      return res.json({
        success: false,
        message: "Resume file size exceeds allowed size (5mb)",
      });
    }

    const dataBuffer = fs.readFileSync(resume.path);
    const pdfData = await pdf(dataBuffer);

    const prompt = `Review the following resume and provide constructive feedback on its strength,weaknesses and areas for improvement.Resume Content:\n\n${pdfData.text}`;

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: prompt }],
      tempertaure: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;

    await sql`insert into creations (user_id,prompt,content,type) VALUES (${userId},'Review the uploaded resume',${content},'resume-review')`;

    res.json({ success: true, content });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
