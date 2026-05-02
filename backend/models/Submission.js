const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [80, "Name is too long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      maxlength: [120, "Email is too long"],
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    inquiryType: {
      type: String,
      enum: ["Artist Submission", "Booking", "Collaboration", "Media", "Other"],
      required: [true, "Inquiry type is required"],
    },
    links: {
      type: String,
      trim: true,
      maxlength: [300, "Links field is too long"],
      default: "",
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [10, "Message must be at least 10 characters"],
      maxlength: [2000, "Message is too long"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
