// mailer.js
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST ?? "localhost",
  port: Number(process.env.MAIL_PORT ?? "1025"),
  secure: false, // MailHog doesn't require SSL
});

async function sendVerificationCode(email, code, first_name, last_name) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM ?? "Inreal App",
    to: email,
    subject: "Your Verification Code",
    text: `Hello ${first_name} ${last_name},\n\nYour verification code is: ${code}\n\nEnter this code in the app to verify your account.`,
    html: `
      <p>Hello <strong>${first_name} ${last_name}</strong>,</p>
      <p>Your verification code is: <strong>${code}</strong></p>
      <p>Enter this code in the app to verify your account.</p>
    `,
  });

  console.log(`Verification code sent to ${email}`);
}

async function sendVerificationSuccess(email, first_name, last_name) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM ?? "Inreal App",
    to: email,
    subject: "Account Verified Successfully 🎉",
    text: `Hello ${first_name} ${last_name},\n\nCongratulations! Your account has been successfully verified.\n\nYou can now log in and enjoy using Inreal App.`,
    html: `
      <p>Hello <strong>${first_name} ${last_name}</strong>,</p>
      <p>🎉 Congratulations! Your account has been successfully verified.</p>
      <p>You can now log in and enjoy using <strong>Inreal App</strong>.</p>
    `,
  });

  console.log(`Verification success email sent to ${email}`);
}

module.exports = { sendVerificationCode, sendVerificationSuccess };
