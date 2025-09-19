import { clerkClient } from "@clerk/express";

export const auth = async (req, res, next) => {
  try {
    const { userId, has } = req.auth();

    // If there's no userId, the user is not authenticated.
    // Return a 401 Unauthorized status with a JSON error message.
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
    } else {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: 0,
        },
      });
      req.free_usage = 0;
    }

    req.plan = hasPremiumPlan ? "Premium" : "free";
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};