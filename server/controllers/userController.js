import sql from "../config/db.js";

export const getUserCrations = async (req, res) => {
  try {
    const { userId } = req.auth();
    const creations =
      await sql`SELECT * FROM creations WHERE user_id=${userId} ORDER BY created_at DESC`;
    res.json({ success: true, creations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getPublishedCrations = async (req, res) => {
  try {

    const creations =
      await sql`SELECT * FROM creations WHERE publish=true ORDER BY created_at DESC`;
    res.json({ success: true, creations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
