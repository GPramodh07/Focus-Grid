exports.verifyUser = (req, res, next) => {
    // Example middleware to protect routes using user_id
    // This checks if user_id is passed in the query or body
    const userId = (req.body && req.body.user_id) || (req.query && req.query.user_id);

    if (!userId) {
        console.error("[AUTH-MIDDLEWARE] FAILED: user_id is required");
        return res.status(401).json({ success: false, message: "Unauthorized: user_id is required" });
    }

    req.user = { id: userId };
    next();
};
