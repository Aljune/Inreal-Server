const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.MAIL_USER || "",
        pass: process.env.MAIL_PASS || "",
    },
});

const sendVerificationCode = async (email, code, firstName, lastName) => {
    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: "Your Verification Code",
        text: `Hello ${firstName} ${lastName}, your verification code is ${code}.`,
    });
};

const sendVerificationSuccess = async (email, firstName, lastName) => {
    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: "Account Verified",
        text: `Hello ${firstName} ${lastName}, your account has been successfully verified!`,
    });
};

module.exports = { sendVerificationCode, sendVerificationSuccess };

