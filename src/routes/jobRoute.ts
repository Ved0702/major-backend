import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import authMiddleware, { AuthenticatedRequest } from "../middleware/authMiddleware";

const jobRouter = express.Router();
const prisma = new PrismaClient();

enum Category {
    WEB_DEVELOPMENT = "WEB_DEVELOPMENT",
    APP_DEVELOPMENT = "APP_DEVELOPMENT",
    AI_ML = "AI_ML",
    SOCIAL_MEDIA_MARKETING = "SOCIAL_MEDIA_MARKETING",
    VIDEO_EDITING = "VIDEO_EDITING",
    PRODUCT_PHOTOGRAPHY = "PRODUCT_PHOTOGRAPHY",
    GRAPHIC_DESIGN = "GRAPHIC_DESIGN",
    LOGO_DESIGN = "LOGO_DESIGN",
    SOFTWARE_DEVELOPMENT = "SOFTWARE_DEVELOPMENT",
    BLOG_WRITING = "BLOG_WRITING",
}

// Type guard for category validation
function isValidCategory(value: any): value is Category {
    return Object.values(Category).includes(value);
}

// POST route to create a new job
jobRouter.post("/postJob", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        const job = await prisma.job.create({
            data: {
                title,
                description,
                category,  // Category is now treated as a string
                skills,
                company,
                deadline,
                salary,
                imageUrl,
                userId,
            },
        });

        res.status(201).json(job); // Changed to 201 for created resource
    } catch (error: any) {
        console.error("An error occurred:", error);
        res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
});
jobRouter.get("/jobDetail", async (req: Request, res: Response): Promise<void> => {
    const { id } = req.query;
    console.log(id);
    try {
        const job = await prisma.job.findUnique({
            where: {
                id: Number(id),
            },
            include: { appliedUser: true },
        });
        if (job) {
            res.json(job);
        } else {
            res.status(404).json({ message: "Job not found" });
        }
    } catch (error: any) {
        console.error("An error occurred while fetching job details:", error);
        res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
});

// GET route to fetch jobs for the authenticated user
jobRouter.get("/getJobs", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const jobs = await prisma.job.findMany({
            where: {
                userId: req.userId,
            },
        });
        res.json(jobs);
    } catch (error: any) {
        console.error("An error occurred while fetching jobs:", error);
        res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
});


// GET route to fetch jobs by category
jobRouter.get("/getCategoryJobs/:category", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { category } = req.params;

    // Validate category
    if (!isValidCategory(category)) {
        res.status(400).json({ message: "Invalid category" });
        return;
    }

    try {
        const jobs = await prisma.job.findMany({
            where: {
                category, // Use the category as it is, since it is a string
            },
        });
        res.json(jobs);
    } catch (error: any) {
        console.error("An error occurred while fetching category jobs:", error);
        res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
});
jobRouter.patch("/applyJob", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { jobId } = req.body;
    console.log(jobId);
    
    try {
        // Check if the job already has an applied user
        const existingApplication = await prisma.job.findUnique({
            where: {
                id: Number(jobId),
            },
            select: {
                appliedUser: true,
            },
        });

        if (existingApplication?.appliedUser) {
            res.status(400).json({ message: "Job already applied by another user" });
            return;
        }

        // Update job status to "APPLIED"
        await prisma.job.update({
            where: {
                id: Number(jobId),
            },
            data: {
                status: "APPLIED",
            },
        });
        const job = await prisma.job.update({
            where: {
                id: Number(jobId),
            },
            data: {
                appliedUser: {
                    connect: { id: Number(req.userId) },
                },
            },
            include: {
                appliedUser: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });

        if (!job) {
            res.status(404).json({ message: "Job not found" });
            return;
        }

        res.json(job);
        
    } catch (error: any) {
        console.error("An error occurred while applying for the job:", error);
        res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
});
jobRouter.get("/checkStatus", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const {id}=req.query;
        console.log(id);
        const jobStatus = await prisma.job.findUnique({
            where: {
                id: Number(id),
            },
            select: {
                status: true,
            },
        });
        if (!jobStatus){
            res.status(404).json({ message: "Job not found" });
            return;
        }
        res.json(jobStatus);
        
    } catch (error: any) {
        console.error("An error occurred while checking job status:", error);
        res.status(500).json({ error: `Internal Server Error: ${error.message}` });
        
    }
});
jobRouter.patch("/completeJob", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { jobId } = req.body;
    console.log(jobId);
    
    try {
        const job = await prisma.job.update({
            where: {
                id: Number(jobId),
            },
            data: {
                status: "COMPLETED",
            },
        });
    // Check if the user making the request is the one who posted the job
    const jobDetails = await prisma.job.findUnique({
        where: {
            id: Number(jobId),
        },
        select: {
            userId: true,
        },
    });

    if (!jobDetails || jobDetails.userId !== req.userId) {
        res.status(403).json({ message: "You are not authorized to complete this job" });
        return;
    }
        if (!job) {
            res.status(404).json({ message: "Job not found" });
            return;
        }

        res.json(job);
        
    } catch (error: any) {
        console.error("An error occurred while completing the job:", error);
        res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
});
// GET route to fetch 5 recent jobs
jobRouter.get("/getRecentJobs", async (req: Request, res: Response): Promise<void> => {
    try {
        const recentJobs = await prisma.job.findMany({
            orderBy: {
                createdAt: "desc",
            },
            take: 5,
        });
        res.json(recentJobs);
    } catch (error: any) {
        console.error("An error occurred while fetching recent jobs:", error);
        res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
});


export default jobRouter;
