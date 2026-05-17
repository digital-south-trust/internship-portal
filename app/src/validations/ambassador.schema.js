import { z } from 'zod';

export const ambassadorCreateSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(10, "Phone number must be valid"),
  collegeName: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  referralCode: z.string().min(3, "Referral code must be at least 3 characters"),
});

export const ambassadorUpdateSchema = ambassadorCreateSchema.partial();
