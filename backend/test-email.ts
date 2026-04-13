import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

console.log("Testing email with:");
console.log("User:", process.env.EMAIL_USER);
console.log("Pass defined?", !!process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function test() {
  try {
    await transporter.verify();
    console.log("✅ Nodemailer connection verified successfully!");
  } catch (error) {
    console.error("❌ Nodemailer Error:");
    console.error(error);
  }
}

test();
