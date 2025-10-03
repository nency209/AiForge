import { clerkClient } from "@clerk/express";

export const auth = async (req, res, next) => {
  try {
    // FIX: req.auth is an object, not a function
    const { userId, has } = req.auth; 
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No active session.",
      });
    }

    const hasPremiumPlan = await has({ plan: "premium" });
    const user = await clerkClient.users.getUser(userId);

    if (!hasPremiumPlan && user.privateMetadata.free_usage) {
      req.free_usage = user.privateMetadata.free_usage;
    } else if (!hasPremiumPlan) { // Handle case where metadata is not set yet
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: 0,
        },
      });
      req.free_usage = 0;
    } else {
        // For premium users, usage can be considered irrelevant or 0
        req.free_usage = 0; 
    }

    req.plan = hasPremiumPlan ? "Premium" : "free";
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
