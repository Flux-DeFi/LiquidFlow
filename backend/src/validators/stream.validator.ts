import { z } from 'zod';

// Stellar public keys: G-prefixed, base32 characters, exactly 56 characters total.
const stellarAddressSchema = z
  .string()
  .regex(
    /^G[A-Z2-7]{55}$/,
    'Must be a valid Stellar public key (G-prefixed, 56 characters)',
  );

export const createStreamSchema = z
  .object({
    sender: stellarAddressSchema,
    recipient: stellarAddressSchema,
    amount: z.number().positive('Amount must be positive'),
    token: z.string().min(1, 'Token is required'),
    startTime: z.number().optional(),
    endTime: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.startTime !== undefined &&
      data.endTime !== undefined &&
      data.endTime <= data.startTime
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'endTime must be strictly greater than startTime',
      });
    }
  });

export type CreateStreamInput = z.infer<typeof createStreamSchema>;
