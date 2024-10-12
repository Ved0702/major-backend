import express,{Request,Response} from "express";
import randomize from "randomatic";
const otpRoutes = express.Router();
//@ts-ignore
import sendMail from "../mailer/mailer.js";
import { PrismaClient } from "@prisma/client";
import authMiddleware, { AuthenticatedRequest } from "../middleware/authMiddleware";
const prisma = new PrismaClient();


function generateOTP(length = 6) {
    return randomize('0', length);
}

otpRoutes.post("/getOtp", authMiddleware,async (req:AuthenticatedRequest, res:Response):Promise<void> => {
    try {
        const { email } = req.body
        if (!email) {
            res.status(400).json({ error: "Email is required" });
            return;
        }
        const user=await prisma.user.findFirst({
            where:{
                email:email,
            },
            select:{
                email:true,
            }
        })

        if(!user){
            res.status(400).json({error:"User with this email Not Found!!"});
            return;
        }

        const existingOtp=await prisma.oTP.findFirst({
            where :{
                email:email,
            }
        });
        if(existingOtp) await prisma.oTP.deleteMany({where:{email:email}});
       

        const otp = generateOTP();
        const htmlMessage = `
            <div style="width: 100%; padding: 20px; box-sizing: border-box; background-color: #f4f4f4; font-family: Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                    <h1 style="color: #333; text-align: center;">Welcome to Talent Hive</h1>
                    <p style="font-size: 16px; color: #555; text-align: center;">Dear User,</p>
                    <p style="font-size: 16px; color: #555; text-align: center;">Thank you for signing up with Adhyayan. Your account has been created successfully.</p>
                    <p style="font-size: 16px; color: #555; text-align: center;">Please use the following OTP to verify your email address:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <h2 style="font-size: 36px; color: #e74c3c; margin: 0;">${otp}</h2>
                    </div>
                    <p style="font-size: 16px; color: #555; text-align: center;">This OTP is valid for 10 minutes.</p>
                    <p style="font-size: 14px; color: #777; text-align: center;">If you did not request this, please ignore this email.</p>
                    <p style="font-size: 16px; color: #555; text-align: center;">Best regards,<br/>Adhyayan Team</p>
                </div>
            </div>
        `;



        const newOTP=await prisma.oTP.create({
            data:{
                otp:otp,
                email:email,
            }
        }) ;
        console.log("MAIL SEND");
        console.log(newOTP);
        await sendMail(email, "Welcome to Adhyayan: Your Account Has Been Successfully Created", htmlMessage);
        res.status(200).json({ msg: "Email Sent Successfully" });
    } catch (err:any) {
        console.log(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
 

otpRoutes.post("/verifyOtp", async (req:Request, res:Response):Promise<void> => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            res.status(400).json({ error: "Email and OTP are required" });
            return ;
        }

        const existingOtp = await prisma.oTP.findFirst({
            where:{
                email:email,
            }
        });

        if (!existingOtp) {
            res.status(404).json({ error: "OTP not found or already used" });
            return;
        }
        const expirationTime = new Date(existingOtp.createdAt.getTime() + 10 * 60 * 1000);

        if (expirationTime < new Date()) {
            await prisma.oTP.deleteMany({
                where:{
                    email:email,
                }
            });
            res.status(400).json({ error: "OTP expired" });
            return ;
        }

        if (existingOtp.otp !== otp) {
            res.status(400).json({ error: "Invalid OTP" });
            return;
        }


        const updateData=await prisma.user.update({
            where: { email: email },
            data: {
                isVerified: true,
            },
        });
        await prisma.oTP.deleteMany({where:{email:email}});
        console.log(otp);
        res.status(200).json({ msg: "Successfully Verified and User Created" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default otpRoutes;