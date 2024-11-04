"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        res.status(401).json({ message: 'No token, authorization denied' });
        return;
    }
    try {
        const jwtSecret = process.env.JWT_SECRET_KEY || "secret";
        console.log(jwtSecret);
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        console.log(decoded);
        req.userId = decoded.id;
        next();
    }
    catch (err) {
        res.status(400).json({ message: `Token is not valid ${err.message}` });
    }
};
exports.default = authMiddleware;
