import { z } from "zod";

export const submitSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(120),
  inquiryType: z.string().min(2).max(80),
  links: z.string().max(300).optional().or(z.literal("")),
  message: z.string().min(10).max(2000),
  turnstileToken: z.string().min(10),
});

export const newsletterSchema = z.object({
  email: z.string().email().max(120),
  turnstileToken: z.string().min(10),
});
