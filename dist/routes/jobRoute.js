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
const client_1 = require("@prisma/client");
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const jobRouter = express_1.default.Router();
const prisma = new client_1.PrismaClient();
var Category;
(function (Category) {
    Category["WEB_DEVELOPMENT"] = "WEB_DEVELOPMENT";
    Category["APP_DEVELOPMENT"] = "APP_DEVELOPMENT";
    Category["AI_ML"] = "AI_ML";
    Category["SOCIAL_MEDIA_MARKETING"] = "SOCIAL_MEDIA_MARKETING";
    Category["VIDEO_EDITING"] = "VIDEO_EDITING";
    Category["PRODUCT_PHOTOGRAPHY"] = "PRODUCT_PHOTOGRAPHY";
    Category["GRAPHIC_DESIGN"] = "GRAPHIC_DESIGN";
    Category["LOGO_DESIGN"] = "LOGO_DESIGN";
    Category["SOFTWARE_DEVELOPMENT"] = "SOFTWARE_DEVELOPMENT";
    Category["BLOG_WRITING"] = "BLOG_WRITING";
})(Category || (Category = {}));
// Type guard for category validation
function isValidCategory(value) {
    return Object.values(Category).includes(value);
}
// POST route to create a new job
jobRouter.post("/postJob", authMiddleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description, category, skills, company, deadline, salary, imageUrl } = req.body;
    try {
        const userId = req.userId;
        if (userId === undefined || typeof userId !== 'number') {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }
        // Validate category
        if (!isValidCategory(category)) {
            res.status(400).json({ message: "Invalid category" });
            return;
        }
        const job = yield prisma.job.create({
            data: {
                title,
                description,
                category, // Category is now treated as a string
                skills,
                company,
                deadline,
                salary,
                imageUrl,
                userId,
            },
        });
        res.status(201).json(job); // Changed to 201 for created resource
    }
    catch (error) {
        console.error("An error occurred:", error);
        res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
}));
// GET route to fetch jobs for the authenticated user
jobRouter.get("/getJobs", authMiddleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const jobs = yield prisma.job.findMany({
            where: {
                userId: req.userId,
            },
        });
        res.json(jobs);
    }
    catch (error) {
        console.error("An error occurred while fetching jobs:", error);
        res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
}));
// GET route to fetch jobs by category
jobRouter.get("/getCategoryJobs/:category", authMiddleware_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { category } = req.params;
    // Validate category
    if (!isValidCategory(category)) {
        res.status(400).json({ message: "Invalid category" });
        return;
    }
    try {
        const jobs = yield prisma.job.findMany({
            where: {
                category, // Use the category as is, since it is a string
            },
        });
        res.json(jobs);
    }
    catch (error) {
        console.error("An error occurred while fetching category jobs:", error);
        res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
}));
exports.default = jobRouter;
