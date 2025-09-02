const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
   host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.MAIL_USER || "degamoaljune14@gmail.com",
        pass: process.env.MAIL_PASS || "pgrf fjzm dhel mzql",
    },
    tls: {
        rejectUnauthorized: false // Allow self-signed certificates
    }
});

const sendVerificationCode = async (email, code, firstName, lastName) => {
    await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: email,
        subject: "Your Verification Code",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Email Verification</h2>
                <p>Hello <strong>${firstName} ${lastName}</strong>,</p>
                <p>Your verification code is:</p>
                <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                    <h1 style="color: #007bff; font-size: 32px; margin: 0;">${code}</h1>
                </div>
                <p>This code will expire in 15 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            </div>
        `,
        text: `Hello ${firstName} ${lastName}, your verification code is ${code}.`,
    });
};

const sendVerificationSuccess = async (email, firstName, lastName) => {
    await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: email,
        subject: "Account Verified Successfully",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #28a745;">Account Verified! ✅</h2>
                <p>Hello <strong>${firstName} ${lastName}</strong>,</p>
                <p>Congratulations! Your account has been successfully verified.</p>
                <p>You can now access all features of your account.</p>
                <p>Thank you for joining us!</p>
            </div>
        `,
        text: `Hello ${firstName} ${lastName}, your account has been successfully verified!`,
    });
};


const sendPasswordResetCode = async (email, code, firstName, lastName) => {
    await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: email,
        subject: "Password Reset Code",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc3545;">Password Reset Request</h2>
                <p>Hello <strong>${firstName} ${lastName}</strong>,</p>
                <p>We received a request to reset your password. Your reset code is:</p>
                <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                    <h1 style="color: #dc3545; font-size: 32px; margin: 0;">${code}</h1>
                </div>
                <p>This code will expire in 15 minutes.</p>
                <p><strong>If you didn't request this password reset, please ignore this email and your password will remain unchanged.</strong></p>
            </div>
        `,
        text: `Hello ${firstName} ${lastName}, your password reset code is ${code}. This code will expire in 15 minutes.`,
    });
};

const sendPasswordResetSuccess = async (email, firstName, lastName) => {
    await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: email,
        subject: "Password Reset Successful",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #28a745;">Password Reset Successful! ✅</h2>
                <p>Hello <strong>${firstName} ${lastName}</strong>,</p>
                <p>Your password has been successfully reset.</p>
                <p>If you didn't make this change, please contact our support team immediately.</p>
                <p>For security, please make sure to:</p>
                <ul>
                    <li>Use a strong, unique password</li>
                    <li>Keep your login credentials secure</li>
                    <li>Log out from shared devices</li>
                </ul>
            </div>
        `,
        text: `Hello ${firstName} ${lastName}, your password has been successfully reset.`,
    });
};


module.exports = { 
    sendVerificationCode, 
    sendVerificationSuccess,
    sendPasswordResetCode,
    sendPasswordResetSuccess
};

