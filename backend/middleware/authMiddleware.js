const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "change-this-jwt-secret";

exports.verifyUser = (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ success: false, message: "Unauthorized: missing token" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = Number(decoded.userId);

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized: invalid token" });
        }

        req.user = {
            id: userId,
            username: decoded.username || null
        };

        return next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Unauthorized: invalid or expired token" });
    }
};
