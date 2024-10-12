import nodemailer from "nodemailer";

const sendMail = async (email: string, subject: string, content: string): Promise<void> => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),  // Ensure port is a number
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        const mailOption = {
            from: process.env.SMTP_MAIL,
            to: email,
            subject: subject,
            html: content,
        };

        // Await the sendMail function
        const info = await transporter.sendMail(mailOption);

        // Log the messageId to confirm that the mail has been sent
        console.log("Mail Sent:", info.messageId);
    } catch (err) {
        console.error("Error sending email:", err);
    }
};

export default sendMail;