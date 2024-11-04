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
const randomatic_1 = __importDefault(require("randomatic"));
const otpRoutes = express_1.default.Router();
//@ts-ignore
const mailer_js_1 = __importDefault(require("../mailer/mailer.js"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function generateOTP(length = 6) {
    return (0, randomatic_1.default)('0', length);
}
otpRoutes.post("/getOtp", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: "Email is required" });
            return;
        }
        const user = yield prisma.user.findFirst({
            where: {
                email: email,
            },
            select: {
                email: true,
            }
        });
        if (!user) {
            res.status(400).json({ error: "User with this email Not Found!!" });
            return;
        }
        const existingOtp = yield prisma.oTP.findFirst({
            where: {
                email: email,
            }
        });
        if (existingOtp)
            yield prisma.oTP.deleteMany({ where: { email: email } });
        const otp = generateOTP();
        const htmlMessage = `
            <div style="width: 100%; padding: 20px; box-sizing: border-box; background-color: #f4f4f4; font-family: Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                    <h1 style="color: #333; text-align: center;">Welcome to WorkMonkey</h1>
                    <p style="font-size: 16px; color: #555; text-align: center;">Dear User,</p>
                    <p style="font-size: 16px; color: #555; text-align: center;">Thank you for signing up with WorkMonkey. Your account has been created successfully.</p>
                    <p style="font-size: 16px; color: #555; text-align: center;">Please use the following OTP to verify your email address:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <h2 style="font-size: 36px; color: #e74c3c; margin: 0;">${otp}</h2>
                    </div>
                    <p style="font-size: 16px; color: #555; text-align: center;">This OTP is valid for 10 minutes.</p>
                    <p style="font-size: 14px; color: #777; text-align: center;">If you did not request this, please ignore this email.</p>
                    <p style="font-size: 16px; color: #555; text-align: center;">Best regards,<br/>WorkMonkey</p>
                </div>
            </div>
        `;
        const newOTP = yield prisma.oTP.create({
            data: {
                otp: otp,
                email: email,
            }
        });
        console.log("MAIL SEND");
        console.log(newOTP);
        yield (0, mailer_js_1.default)(email, "Welcome to Adhyayan: Your Account Has Been Successfully Created", htmlMessage);
        res.status(200).json({ msg: "Email Sent Successfully" });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
otpRoutes.post("/verifyOtp", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            res.status(400).json({ error: "Email and OTP are required" });
            return;
        }
        const existingOtp = yield prisma.oTP.findFirst({
            where: {
                email: email,
            }
        });
        if (!existingOtp) {
            res.status(404).json({ error: "OTP not found or already used" });
            return;
        }
        const expirationTime = new Date(existingOtp.createdAt.getTime() + 10 * 60 * 1000);
        if (expirationTime < new Date()) {
            yield prisma.oTP.deleteMany({
                where: {
                    email: email,
                }
            });
            res.status(400).json({ error: "OTP expired" });
            return;
        }
        if (existingOtp.otp !== otp) {
            res.status(400).json({ error: "Invalid OTP" });
            return;
        }
        const updateData = yield prisma.user.update({
            where: { email: email },
            data: {
                isVerified: true,
            },
        });
        yield prisma.oTP.deleteMany({ where: { email: email } });
        console.log(otp);
        res.status(200).json({ msg: "Successfully Verified and User Created" });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
exports.default = otpRoutes;
