import sql from "../config/db.js";
import { clerkClient } from "@clerk/express";
import fetch from 'node-fetch';

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
      contents: [{
        parts: [{
          text: `Write an article about the following topic: "${prompt}". The article should be approximately ${length} tokens long.`
        }]
      }],
      generationConfig: {
        maxOutputTokens: length
      }
    };

    // --- Start of Retry Logic ---
    let apiResponse;
    const maxRetries = 3;
    let attempt = 0;

    for (attempt = 1; attempt <= maxRetries; attempt++) {
      apiResponse = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // If the request was successful (e.g., status 200), exit the loop.
      if (apiResponse.ok) {
        break;
      }
      
      // If the error is a server overload (503), wait and retry.
      if (apiResponse.status === 503 && attempt < maxRetries) {
        console.log(`Attempt ${attempt}: Model is overloaded. Retrying in ${attempt * 2} seconds...`);
        // Wait for 2, 4 seconds before the next retry.
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
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
            message: `Error from AI service: ${errorData.error.message || 'Unknown error'}`,
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

