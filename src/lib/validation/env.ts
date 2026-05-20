import { z } from "zod";

const optionalPublicEnv = z.preprocess((value) => (value === "" ? undefined : value), z.string().optional());

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: optionalPublicEnv.pipe(z.string().url().optional()),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalPublicEnv.pipe(z.string().min(1).optional())
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export function getClientEnv(): ClientEnv {
  return clientEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  });
}
