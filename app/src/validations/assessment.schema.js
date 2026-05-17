import { z } from 'zod';

export const examCreateSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  durationMinutes: z.number().positive(),
  supervisorEmail: z.string().email(),
  scheduledAt: z.string().or(z.date()),
  track: z.string().min(1),
  totalQuestions: z.number().positive().default(60),
  passingScore: z.number().min(0).max(100).default(75),
});

export const assessmentSubmitSchema = z.object({
  examId: z.string().min(1),
  answers: z.array(z.object({
    questionId: z.string(),
    selectedOption: z.string()
  })),
});
