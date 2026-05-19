import { z } from 'zod';

export const worklogCreateSchema = z.object({
  content: z.string().optional().default(''),
  links: z.array(z.string().url("Invalid link URL")).optional().default([]),
  status: z.enum(['Present', 'Absent']).default('Present'),
}).refine(data => {
  if (data.status === 'Present' && (!data.content || data.content.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Daily worklog content is required",
  path: ["content"]
});
