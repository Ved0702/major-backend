"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const prisma = new client_1.PrismaClient();
const authRouter = express_1.default.Router();
authRouter.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        const existingUser = yield prisma.user.findUnique({
            where: {
                email: email
            }
        });
        if (existingUser) {
            res.status(400).json({ error: "User already exists" });
            return;
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const user = yield prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
            select: {
                name: true,
                email: true,
            }
        });
        res.json(user);
    }
    catch (error) {
        console.error('An error occurred:', error);
        res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
}));
authRouter.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: "Email and Password are required" });
            return;
        }
        const existingUser = yield prisma.user.findUnique({
            where: {
                email: email
            },
            select: {
                id: true,
                email: true,
                name: true,
                password: true,
            }
        });
        if (!existingUser) {
            res.status(400).json({ error: "User does not exist" });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET_KEY || "secret";
        const token = jsonwebtoken_1.default.sign({ id: existingUser.id }, jwtSecret);
        console.log(jwtSecret);
        const validPassword = yield bcrypt_1.default.compare(password, existingUser.password);
        if (!validPassword) {
            res.status(400).json({ error: "Invalid Password" });
            return;
        }
        res.json(Object.assign({ token }, existingUser));
    }
    catch (error) {
        console.error('An error occurred:', error);
        res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
}));
authRouter.get("/userJob", authMiddleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        if (!userId || typeof userId !== 'number') {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }
        const jobs = yield prisma.job.findMany({
            where: { userId },
            select: {
                title: true,
                description: true,
                category: true,
                skills: true,
                company: true,
                deadline: true,
                salary: true,
                imageUrl: true,
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        res.status(200).json(jobs);
    }
    catch (error) {
        console.error("An error occurred:", error);
        res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
}));
authRouter.get("/userDetail", authMiddleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        if (!userId || typeof userId !== 'number') {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }
        const user = yield prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                jobs: true,
                appliedJobs: true,
            }
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.status(200).json(user);
    }
    catch (error) {
        console.error("An error occurred:", error);
        res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
}));
exports.default = authRouter;
