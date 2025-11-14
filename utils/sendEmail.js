// Email sending utility
// This is a placeholder for email functionality
// To enable, install nodemailer and configure with your email service

/*
SETUP INSTRUCTIONS:

1. Install nodemailer:
   npm install nodemailer

2. Configure environment variables in .env:
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=CityLocal 101 <noreply@citylocal101.com>

3. For Gmail:
   - Enable 2-factor authentication
   - Generate app password: https://myaccount.google.com/apppasswords
   - Use app password in EMAIL_PASSWORD

4. Uncomment the code below
*/

const nodemailer = require('nodemailer');
require('dotenv').config();

const sendEmail = async (options) => {
    try {
        // Check if email credentials are configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            return Promise.resolve({ 
                success: true, 
                message: 'Email simulated (configure EMAIL_USER and EMAIL_PASSWORD in .env to enable)' 
            });
        }

        // Create transporter
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Email options
        const mailOptions = {
            from: process.env.EMAIL_FROM || `CityLocal 101 <${process.env.EMAIL_USER}>`,
            to: options.to,
            subject: options.subject,
            text: options.message,
            html: options.html || options.message.replace(/\n/g, '<br>')
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        // Don't throw error - email failure shouldn't break the app
        return Promise.resolve({ 
            success: false, 
            error: error.message 
        });
    }
};

module.exports = sendEmail;

