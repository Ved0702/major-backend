import express,{Response} from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import authMiddleware,{AuthenticatedRequest} from '../middleware/authMiddleware';
const prisma = new PrismaClient();
const authRouter = express.Router();
authRouter.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await prisma.user.findUnique({
            where: {
                email: email
            }
        });
        if (existingUser) {
            res.status(400).json({ error: "User already exists" });
            return;
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
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
    } catch (error: any) {
        console.error('An error occurred:', error);
        res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
});

authRouter.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({error:"Email and Password are required"});
            return;
        }
        const existingUser = await prisma.user.findUnique({
            where: {
                email: email
            },
            select: {
                id: true,
                email: true,
                name: true,
                password: true
            }
        });
        if (!existingUser) {
            res.status(400).json({ error: "User does not exist" });
            return;
        }
        const jwtSecret=process.env.JWT_SECRET_KEY || "secret";
        const token=jwt.sign({id:existingUser.id},jwtSecret);
        console.log(jwtSecret);

        const validPassword = await bcrypt.compare(password, existingUser.password);
        if (!validPassword) {
            res.status(400).json({ error: "Invalid Password" });
            return;
        }
        res.json({token,...existingUser});
    } catch (error: any) {
        console.error('An error occurred:', error);
        res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
});
authRouter.get("/userJob", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;

        if (!userId || typeof userId !== 'number') {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }
        const jobs = await prisma.job.findMany({
            where: { userId },
            select:{
                title:true,
                description:true,
                category:true,
                skills:true,
                company:true,
                deadline:true,
                salary:true,
                imageUrl:true,
                author: {
                    select:{
                        id:true,
                        name:true,
                        email:true
                    }
                }
            }
        });

        res.status(200).json(jobs);
    } catch (error: any) {
        console.error("An error occurred:", error);
        res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
});

export default authRouter;
