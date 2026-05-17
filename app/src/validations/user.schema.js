import { z } from 'zod';

export const userCreateSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  dob: z.string().optional(),
  phone: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  track: z.string().min(1, "Track is required"),
  mode: z.string().default('Remote'),
  role: z.enum(['intern', 'admin']).default('intern'),
  referralCodeUsed: z.string().nullable().optional(),
});

export const userUpdateSchema = userCreateSchema.partial();
