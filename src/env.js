import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    QSTASH_URL: z.string().url(),
    QSTASH_TOKEN: z.string(),

    OPENAI_API_KEY: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),

    // App
    NEXT_PUBLIC_APP_URL: z
      .preprocess((str) => str ?? process.env.VERCEL_URL, z.string())
      .transform((val) => {
        if (val?.includes("vercel") && !val?.startsWith("https://")) {
          val = "https://" + val;
        }

        return val;
      })
      .pipe(z.string().url()),

    NEXT_PUBLIC_VERCEL_URL: z
      .preprocess((str) => process.env.VERCEL_URL ?? str, z.string().optional())
      .transform((val) => {
        if (val?.includes("vercel") && !val?.startsWith("https://")) {
          val = "https://" + val;
        }
        return val;
      })
      .pipe(z.string().url().optional()),

    NEXT_PUBLIC_LOCAL_TUNNEL_URL: z.string().url().optional(),

    NEXT_PUBLIC_NODE_ENV: z
      .string()
      .optional()
      .transform((val) => val ?? process.env.NODE_ENV)
      .pipe(z.enum(["development", "test", "production"]).optional()),

    NEXT_PUBLIC_VERCEL_ENV: z
      .enum(["development", "preview", "production"])
      .optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV,
    NODE_ENV: process.env.NODE_ENV,

    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    QSTASH_URL: process.env.QSTASH_URL,
    QSTASH_TOKEN: process.env.QSTASH_TOKEN,

    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,

    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
    NEXT_PUBLIC_LOCAL_TUNNEL_URL: process.env.NEXT_PUBLIC_LOCAL_TUNNEL_URL,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
