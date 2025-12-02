const nodemailer = require('nodemailer');
require('dotenv').config();

const sendEmail = async (options) => {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('Email credentials not configured. Please set EMAIL_USER and EMAIL_PASSWORD in .env');
      return Promise.resolve({ 
        success: false, 
        message: 'Email credentials not configured' 
      });
    }

    // Create transporter with custom SMTP settings for franchisenavigator.net
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'franchisenavigator.net',
      port: parseInt(process.env.EMAIL_PORT || '465'),
      secure: true, // Use SSL/TLS for port 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        // Do not fail on invalid certificates
        rejectUnauthorized: false
      }
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || `CityLocal 101 <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || options.message,
      html: options.html || options.message?.replace(/\n/g, '<br>')
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    // Log error but don't throw - email failure shouldn't break the app
    console.error('Email sending error:', error);
    return Promise.resolve({ 
      success: false, 
      error: error.message 
    });
  }
};

module.exports = sendEmail;

