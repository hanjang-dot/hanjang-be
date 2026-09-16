import { z } from "zod";

export const experimentEventInputSchema = z.object({
  key: z.string().min(1).max(100),
  variant: z.enum(["control", "variant"]),
  event: z.enum(["exposure", "conversion"]),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export type ExperimentEventInput = z.infer<typeof experimentEventInputSchema>;
