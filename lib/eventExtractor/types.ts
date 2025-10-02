import { z } from "zod";

export const EventPayload = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  startsAt: z.string().optional(), // ISO
  endsAt: z.string().optional(),   // ISO
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  venue: z.string().optional(),
  organizer: z.string().optional(),
  canonicalUrl: z.string().url().optional(),
  sourceUrl: z.string().url(),
  raw: z.any().optional() // keep minimal raw for debugging
});

export type EventPayload = z.infer<typeof EventPayload>;
