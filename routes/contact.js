const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const sendEmail = require('../utils/sendEmail');
const { body } = require('express-validator');
const logActivity = require('../utils/logActivity');

// @route   POST /api/contact
// @desc    Submit contact/support form
// @access  Public
router.post('/', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('message').trim().notEmpty().withMessage('Message is required')
], async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Save to database
        const contact = await Contact.create({
            name,
            email,
            subject,
            message,
            status: 'new',
            isRead: false
        });

        // Log activity
        await logActivity({
            type: 'contact_submitted',
            description: `New support request from "${name}" - ${subject}`,
            metadata: { contactName: name, contactEmail: email, subject }
        });

        // Send email to admin (non-blocking)
        sendEmail({
            to: process.env.ADMIN_EMAIL || 'admin@citylocal101.com',
            subject: `Support Request: ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="background-color: #4A90E2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h2 style="margin: 0; font-size: 24px;">New Support Request</h2>
                        <p style="margin: 10px 0 0 0; font-size: 14px;">CityLocal 101</p>
                    </div>
                    <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="margin-bottom: 20px;">
                            <strong style="color: #333; display: block; margin-bottom: 5px;">Name:</strong>
                            <span style="color: #666;">${name}</span>
                        </div>
                        <div style="margin-bottom: 20px;">
                            <strong style="color: #333; display: block; margin-bottom: 5px;">Email:</strong>
                            <span style="color: #666;">${email}</span>
                        </div>
                        <div style="margin-bottom: 20px;">
                            <strong style="color: #333; display: block; margin-bottom: 5px;">Subject:</strong>
                            <span style="color: #666;">${subject}</span>
                        </div>
                        <div style="margin-bottom: 20px;">
                            <strong style="color: #333; display: block; margin-bottom: 5px;">Message:</strong>
                            <div style="color: #666; background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin-top: 10px; line-height: 1.6;">
                                ${message.replace(/\n/g, '<br>')}
                            </div>
                        </div>
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #999; font-size: 12px;">
                            <p style="margin: 0;">This is an automated notification from CityLocal 101 Support System</p>
                        </div>
                    </div>
                </div>
            `,
            message: `
New support request from CityLocal 101:

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
Sent from CityLocal 101 Support System
            `
        }).catch(() => {});

        // Send confirmation email to user (non-blocking)
        sendEmail({
            to: email,
            subject: 'We Received Your Message - CityLocal 101',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="background-color: #4A90E2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h2 style="margin: 0; font-size: 24px;">Thank You for Contacting Us</h2>
                        <p style="margin: 10px 0 0 0; font-size: 14px;">CityLocal 101 Support</p>
                    </div>
                    <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Dear ${name},</p>
                        <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">Thank you for contacting CityLocal 101 Support!</p>
                        <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">We have received your message regarding: <strong>"${subject}"</strong></p>
                        <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">Our support team will review your request and respond within 24-48 hours.</p>
                        <div style="background-color: #E3F2FD; padding: 15px; border-radius: 4px; margin: 20px 0;">
                            <p style="color: #1976D2; font-size: 14px; margin: 0; font-weight: 600;">Need immediate assistance?</p>
                            <p style="color: #1976D2; font-size: 14px; margin: 5px 0 0 0;">Call us at (555) 123-4567</p>
                        </div>
                        <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 20px 0 0 0;">Best regards,<br><strong>CityLocal 101 Support Team</strong></p>
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #999; font-size: 12px;">
                            <p style="margin: 0;">This is an automated message. Please do not reply to this email.</p>
                        </div>
                    </div>
                </div>
            `,
            message: `
Dear ${name},

Thank you for contacting CityLocal 101 Support!

We have received your message regarding: "${subject}"

Our team will review your request and respond within 24-48 hours.

If you have any urgent concerns, please call us at (555) 123-4567.

Best regards,
CityLocal 101 Support Team

---
This is an automated message. Please do not reply to this email.
            `
        }).catch(() => {});

        res.json({
            success: true,
            message: 'Your message has been sent successfully. We will respond within 24 hours.',
            contact
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to send message. Please try again or call us directly.' 
        });
    }
});

// @route   POST /api/contact/business-submission
// @desc    Notify admin about new business submission
// @access  Private (called internally)
router.post('/business-submission', async (req, res) => {
    try {
        const { businessName, ownerEmail, ownerName } = req.body;

        // Send notification to admin
        await sendEmail({
            to: process.env.ADMIN_EMAIL || 'admin@citylocal101.com',
            subject: 'New Business Listing Submitted for Review',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="background-color: #27AE60; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h2 style="margin: 0; font-size: 24px;">New Business Listing</h2>
                        <p style="margin: 10px 0 0 0; font-size: 14px;">Awaiting Approval</p>
                    </div>
                    <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">A new business listing has been submitted and requires your review.</p>
                        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 4px; margin: 20px 0;">
                            <div style="margin-bottom: 15px;">
                                <strong style="color: #333; display: block; margin-bottom: 5px;">Business Name:</strong>
                                <span style="color: #666; font-size: 16px;">${businessName}</span>
                            </div>
                            <div style="margin-bottom: 15px;">
                                <strong style="color: #333; display: block; margin-bottom: 5px;">Owner Name:</strong>
                                <span style="color: #666;">${ownerName}</span>
                            </div>
                            <div style="margin-bottom: 15px;">
                                <strong style="color: #333; display: block; margin-bottom: 5px;">Owner Email:</strong>
                                <span style="color: #666;">${ownerEmail}</span>
                            </div>
                        </div>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.BASE_URL || 'http://localhost:5000'}/admin" style="background-color: #4A90E2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Review in Admin Panel</a>
                        </div>
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #999; font-size: 12px;">
                            <p style="margin: 0;">CityLocal 101 Admin System</p>
                        </div>
                    </div>
                </div>
            `,
            message: `
New business listing submitted for approval:

Business Name: ${businessName}
Owner Name: ${ownerName}
Owner Email: ${ownerEmail}

Please review and approve in the admin panel:
${process.env.BASE_URL || 'http://localhost:5000'}/admin

---
CityLocal 101 Admin System
            `
        });

        // Send confirmation to business owner
        await sendEmail({
            to: ownerEmail,
            subject: 'Business Listing Submitted - CityLocal 101',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="background-color: #4A90E2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h2 style="margin: 0; font-size: 24px;">Thank You for Submitting Your Business</h2>
                        <p style="margin: 10px 0 0 0; font-size: 14px;">CityLocal 101</p>
                    </div>
                    <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Dear ${ownerName},</p>
                        <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">Thank you for submitting <strong>"${businessName}"</strong> to CityLocal 101!</p>
                        <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">Your listing is currently under review. Our team will review your submission and approve it within 1-2 business days.</p>
                        <div style="background-color: #E3F2FD; padding: 20px; border-radius: 4px; margin: 20px 0;">
                            <p style="color: #1976D2; font-size: 15px; margin: 0 0 15px 0; font-weight: 600;">What happens next?</p>
                            <ol style="color: #1976D2; font-size: 14px; margin: 0; padding-left: 20px; line-height: 2;">
                                <li>Our team reviews your listing</li>
                                <li>Your listing gets approved</li>
                                <li>Your business appears on CityLocal 101</li>
                                <li>You can claim and manage your listing</li>
                            </ol>
                        </div>
                        <div style="background-color: #27AE60; color: white; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: center;">
                            <p style="margin: 0; font-size: 16px; font-weight: 600;">Adding your business is 100% FREE!</p>
                        </div>
                        <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 20px 0 0 0;">You will receive a notification email once your listing is approved and live on the site.</p>
                        <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 20px 0 0 0;">Best regards,<br><strong>CityLocal 101 Team</strong></p>
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #999; font-size: 12px;">
                            <p style="margin: 0;">This is an automated message. Please do not reply to this email.</p>
                        </div>
                    </div>
                </div>
            `,
            message: `
Dear ${ownerName},

Thank you for submitting "${businessName}" to CityLocal 101!

Your listing is currently under review. Our team will review your submission and approve it within 1-2 business days.

You will receive a notification email once your listing is approved and live on the site.

What happens next?
1. Our team reviews your listing
2. Your listing gets approved
3. Your business appears on CityLocal 101
4. You can claim and manage your listing

Adding your business is 100% FREE!

Best regards,
CityLocal 101 Team

---
This is an automated message. Please do not reply to this email.
            `
        });

        res.json({ success: true, message: 'Notifications sent' });
    } catch (error) {
        res.json({ success: false, message: 'Notification failed (non-critical)' });
    }
});

// @route   POST /api/contact/business-approved
// @desc    Notify business owner that listing was approved
// @access  Private (called internally)
router.post('/business-approved', async (req, res) => {
    try {
        const { businessName, ownerEmail, ownerName, businessUrl } = req.body;

        await sendEmail({
            to: ownerEmail,
            subject: 'Your Business Listing is Now Live! - CityLocal 101',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="background-color: #27AE60; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h2 style="margin: 0; font-size: 24px;">🎉 Your Business is Now Live!</h2>
                        <p style="margin: 10px 0 0 0; font-size: 14px;">CityLocal 101</p>
                    </div>
                    <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Dear ${ownerName},</p>
                        <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">Great news! Your business listing <strong>"${businessName}"</strong> has been approved and is now live on CityLocal 101!</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${businessUrl}" style="background-color: #27AE60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">View Your Listing</a>
                        </div>
                        <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 20px 0;">Your business is now visible to thousands of potential customers searching for services in your area.</p>
                        <div style="background-color: #E3F2FD; padding: 20px; border-radius: 4px; margin: 20px 0;">
                            <p style="color: #1976D2; font-size: 15px; margin: 0 0 15px 0; font-weight: 600;">Next steps:</p>
                            <ol style="color: #1976D2; font-size: 14px; margin: 0; padding-left: 20px; line-height: 2;">
                                <li>Claim your listing to manage it</li>
                                <li>Respond to customer reviews</li>
                                <li>Update your business information</li>
                                <li>Add photos and services</li>
                            </ol>
                        </div>
                        <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 20px 0 0 0;">Thank you for choosing CityLocal 101!</p>
                        <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 20px 0 0 0;">Best regards,<br><strong>CityLocal 101 Team</strong></p>
                    </div>
                </div>
            `,
            message: `
Dear ${ownerName},

Great news! Your business listing "${businessName}" has been approved and is now live on CityLocal 101!

View your listing:
${businessUrl}

Your business is now visible to thousands of potential customers searching for services in your area.

Next steps:
1. Claim your listing to manage it
2. Respond to customer reviews
3. Update your business information
4. Add photos and services

Thank you for choosing CityLocal 101!

Best regards,
CityLocal 101 Team
            `
        });

        res.json({ success: true, message: 'Approval notification sent' });
    } catch (error) {
        res.json({ success: false, message: 'Notification failed (non-critical)' });
    }
});

// @route   POST /api/contact/review-notification
// @desc    Notify business owner about new review
// @access  Private (called internally)
router.post('/review-notification', async (req, res) => {
    try {
        const { businessName, ownerEmail, rating, reviewText, reviewerName } = req.body;

        await sendEmail({
            to: ownerEmail,
            subject: `New ${rating}-Star Review for ${businessName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="background-color: #FFD700; color: #333; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h2 style="margin: 0; font-size: 24px;">⭐ New Review Received</h2>
                        <p style="margin: 10px 0 0 0; font-size: 14px;">CityLocal 101</p>
                    </div>
                    <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Dear Business Owner,</p>
                        <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">You have received a new <strong>${rating}-star</strong> review for <strong>${businessName}</strong>!</p>
                        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 4px; margin: 20px 0;">
                            <div style="margin-bottom: 15px;">
                                <strong style="color: #333; display: block; margin-bottom: 5px;">Reviewer:</strong>
                                <span style="color: #666;">${reviewerName}</span>
                            </div>
                            <div style="margin-bottom: 15px;">
                                <strong style="color: #333; display: block; margin-bottom: 5px;">Rating:</strong>
                                <span style="color: #FFD700; font-size: 20px;">${'⭐'.repeat(rating)}${'☆'.repeat(5 - rating)}</span>
                            </div>
                            <div>
                                <strong style="color: #333; display: block; margin-bottom: 10px;">Review:</strong>
                                <div style="color: #666; background-color: white; padding: 15px; border-radius: 4px; border-left: 4px solid #4A90E2; line-height: 1.6;">
                                    "${reviewText}"
                                </div>
                            </div>
                        </div>
                        <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 20px 0;">Respond to this review in your business dashboard to show customers you value their feedback.</p>
                        <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 20px 0 0 0;">Best regards,<br><strong>CityLocal 101 Team</strong></p>
                    </div>
                </div>
            `,
            message: `
Dear Business Owner,

You have received a new ${rating}-star review for ${businessName}!

Reviewer: ${reviewerName}
Rating: ${'⭐'.repeat(rating)}

Review:
"${reviewText}"

Respond to this review in your business dashboard to show customers you value their feedback.

Best regards,
CityLocal 101 Team
            `
        });

        res.json({ success: true, message: 'Review notification sent' });
    } catch (error) {
        res.json({ success: false, message: 'Notification failed (non-critical)' });
    }
});

module.exports = router;

