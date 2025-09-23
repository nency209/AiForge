import sql from "../config/db.js";
import { clerkClient } from "@clerk/express";
import fetch from "node-fetch";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import pdf from "pdf-parse/lib/pdf-parse.js";

export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth; // Assuming auth middleware attaches auth object
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    console.log("Received request:", { userId, prompt, length, plan, free_usage });

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
    if (!GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not set in environment variables.");
        return res.status(500).json({ success: false, message: "Server configuration error: AI service is not configured." });
    }
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    // This prompt is now clean because it receives just the topic from the frontend
    const finalPrompt = `Write a comprehensive, well-structured article on the topic: "${prompt}". The article should be engaging, informative, and approximately ${length} tokens in length. Format the output in markdown.`;

    const payload = {
      contents: [
        {
          parts: [{ text: finalPrompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: length,
        temperature: 0.7,
        topP: 1,
      },
    };
    
    console.log("Sending payload to Gemini:", JSON.stringify(payload, null, 2));


    const apiResponse = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const responseText = await apiResponse.text(); // Get raw text to avoid JSON parse errors on non-JSON responses

    if (!apiResponse.ok) {
        console.error("Gemini API Error Status:", apiResponse.status);
        console.error("Gemini API Error Response:", responseText);
        let errorMessage = "An unknown error occurred with the AI service.";
        try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
            errorMessage = "Could not parse error response from AI service.";
        }
      return res.status(apiResponse.status).json({
        success: false,
        message: `Error from AI service: ${errorMessage}`,
      });
    }

    const responseData = JSON.parse(responseText);
    const content = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.error("Failed to parse content from valid API response:", responseData);
      return res.status(500).json({
        success: false,
        message: "Failed to parse content from AI response, even though the request was successful.",
      });
    }

    await sql`insert into creations (user_id,prompt,content,type) VALUES (${userId},${prompt},${content},'article')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: (free_usage || 0) + 1,
        },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error("Server Error in generateArticle:", error);

    // Improved error handling to detect network issues
    if (error.cause) {
      // This block catches specific network errors (e.g., DNS resolution, connection refused)
      return res.status(500).json({
        success: false,
        message: `Network error: Unable to connect to the AI service. Please check the server's internet connection and firewall rules. Details: ${error.message}`,
      });
    }

    // Fallback for other types of errors
    res.status(500).json({ success: false, message: "An internal server error occurred." });
  }
};

export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt ,category} = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (!prompt ) {
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
              text: `Write an Blog title: "${prompt}" for this ${category}`,
            },
          ],
        },
      ],
      
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
    const { userId } = req.auth();
    const plan = req.plan;
    const free_usage = req.free_usage;
    // Destructure ispublic from the request body
    const { prompt, ispublic } = req.body;

    if (!prompt) {
      return res
        .status(400)
        .json({ success: false, message: "A prompt is required." });
    }

    if (plan !== "premium" && free_usage >= 10) {
      return res.status(403).json({
        success: false,
        message: "Limit reached. Please upgrade your plan to continue.",
      });
    }

    const hfResponse = await axios.post(
      process.env.HUGGINGFACE_API_URL,
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
    
    // You can now use the `ispublic` variable, for example, by adding a tag.
    const cloudinaryResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "image", tags: ispublic ? ['public'] : ['private'] },
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
    
    // Save the imageUrl as the 'content' for consistency
    await sql`insert into creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${imageUrl}, 'image')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: (free_usage || 0) + 1 },
      });
    }

    // Send the correct field name that the frontend expects
    res.json({ success: true, imageUrl: imageUrl });
  } catch (err) {
    console.error("--- FULL ERROR in generateImage ---", err);

    if (err.response) {
      const errorData = Buffer.from(err.response.data).toString("utf-8");
      return res.status(err.response.status).json({
        success: false,
        message: `Hugging Face API Error: ${err.response.status}`,
        details: errorData,
      });
    }
    
    res.status(500).json({
      success: false,
      message:
        "An unexpected error occurred during the image generation process.",
    });
  }
};

export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth;
    const plan = req.plan;
    const free_usage = req.free_usage;

    // 1. Validate that a file was uploaded by the middleware
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Bad Request: No image file was provided.",
      });
    }

    // 2. Check user's plan and usage limits
    if (plan !== "premium" && free_usage >= 10) {
      return res.status(403).json({
        success: false,
        message: "Limit reached. Please upgrade your plan to continue.",
      });
    }

    // 3. Upload the image to Cloudinary and apply the background removal effect
    const { secure_url } = await cloudinary.uploader.upload(req.file.path, {
      // The effect transformation removes the background
      effect: "background_removal",
    });
    
    // Check if the upload and transformation were successful
    if (!secure_url) {
        throw new Error('Cloudinary failed to process the image.');
    }

    // 4. Record the creation in the database
    await sql`INSERT INTO creations (user_id, prompt, content, type) 
              VALUES (${userId}, 'Background Removal', ${secure_url}, 'image')`;

    // 5. Update the user's free usage count if they are not a premium user
    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: (free_usage || 0) + 1,
        },
      });
    }

    // 6. Send a success response with the URL of the new image
    res.json({ success: true, imageUrl: secure_url });
    
  } catch (error) {
    console.error("Server Error in removeImageBackground:", error);
    res.status(500).json({ success: false, message: "An internal server error occurred." });
  }
};



export const reviewResume = async (req, res) => {
  try {
    const { userId } = req.auth;
    const resume = req.file;
    const plan = req.plan;

    // 1. Check for premium plan
    if (plan !== "premium") {
      return res.status(403).json({
        success: false,
        message: "This feature is only available for premium subscribers.",
      });
    }

    // 2. Validate that a file was uploaded
    if (!resume) {
      return res.status(400).json({
        success: false,
        message: "Bad Request: No resume file was provided.",
      });
    }

    // 3. Validate file size (e.g., max 5MB)
    if (resume.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Resume file size exceeds the 5MB limit.",
      });
    }

    // 4. Read and parse the PDF file to extract text
    const dataBuffer = fs.readFileSync(resume.path);
    const pdfData = await pdf(dataBuffer);
    
    // Clean up the temporary file
    fs.unlinkSync(resume.path); 

    if (!pdfData.text) {
        return res.status(500).json({
            success: false,
            message: "Could not extract text from the provided PDF."
        });
    }

    // 5. Call the Gemini API to review the resume text
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    
    const prompt = `Review the following resume and provide constructive feedback. Analyze its strengths, weaknesses, and areas for improvement. Format the feedback clearly using Markdown. Resume Content:\n\n${pdfData.text}`;
    
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500,
        },
    };

    const apiResponse = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.error("Gemini API Error:", errorData);
        return res.status(500).json({ success: false, message: "Error from AI service." });
    }

    const responseData = await apiResponse.json();
    const content = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
        return res.status(500).json({ success: false, message: "Failed to parse content from AI response." });
    }

    // 6. Save the result to the database
    await sql`INSERT INTO creations (user_id, prompt, content, type) 
              VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')`;

    // 7. Send the analysis back to the client
    res.json({ success: true, content });

  } catch (error) {
    console.error("Server Error in reviewResume:", error);
    res.status(500).json({ success: false, message: "An internal server error occurred." });
  }
};
