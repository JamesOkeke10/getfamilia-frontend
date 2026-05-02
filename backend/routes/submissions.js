const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Submission = require("../models/Submission");
const { sendSubmissionEmail } = require("../utils/email");

// POST /api/submissions
router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Name is required")
      .isLength({ min: 2, max: 80 }).withMessage("Name must be 2–80 characters"),

    body("email").trim().notEmpty().withMessage("Email is required")
      .isEmail().withMessage("Email must be valid")
      .normalizeEmail(),

    body("inquiryType").trim().notEmpty().withMessage("Inquiry type is required")
      .isIn(["Artist Submission", "Booking", "Collaboration", "Media", "Other"])
      .withMessage("Invalid inquiry type"),

    body("links").optional({ checkFalsy: true }).trim()
      .isLength({ max: 300 }).withMessage("Links field is too long"),

    body("message").trim().notEmpty().withMessage("Message is required")
      .isLength({ min: 10, max: 2000 }).withMessage("Message must be 10–2000 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
        });
      }

      const { name, email, inquiryType, links, message } = req.body;

      const submission = await Submission.create({
        name,
        email,
        inquiryType,
        links: links || "",
        message,
      });

      // Email sending visibility
      let emailStatus = { sent: false };

      try {
        const result = await sendSubmissionEmail({ name, email, inquiryType, links, message });
        emailStatus = { sent: true, ...result };
      } catch (emailErr) {
        console.error("Email sending failed (FULL):", emailErr);
        emailStatus = {
          sent: false,
          error: emailErr?.message || String(emailErr),
        };
      }

      return res.status(201).json({
        success: true,
        message: "Submission received successfully.",
        submissionId: submission._id,
        emailStatus,
      });
    } catch (err) {
      console.error("Submission error:", err);
      return res.status(500).json({
        success: false,
        message: "Server error. Please try again.",
      });
    }
  }
);

module.exports = router;
