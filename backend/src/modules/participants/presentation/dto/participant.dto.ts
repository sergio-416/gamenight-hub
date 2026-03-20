import { z } from 'zod';

export const ParticipantStatusSchema = z.enum(['joined', 'cancelled']);

export type ParticipantStatus = z.infer<typeof ParticipantStatusSchema>;
