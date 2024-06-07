// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import {
  index,
  jsonb,
  pgEnum,
  pgTableCreator,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { type Prediction } from "replicate";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `campaign_${name}`);

export const generation_statuses = [
  "pending",
  "processing",
  "completed",
  "failed",
  "flagged",
] as const;

export const generationStatusPgEnum = pgEnum("status", generation_statuses);

export const aiGenerations = createTable(
  "aiGenerations",
  {
    id: varchar("id", { length: 256 }).primaryKey(),

    shareId: varchar("shareId", { length: 256 })
      .unique()
      .notNull()
      .$defaultFn(() => nanoid()),

    prediction: jsonb("prediction").$type<Prediction>(),
    status: generationStatusPgEnum("status").notNull(),

    failureReason: text("failureReason"),

    userName: text("userName").default(""),
    userEmail: text("userEmail").default(""),

    photoUrl: text("photoUrl"),
    photoKey: varchar("photoKey", { length: 256 }).notNull(), // S3 like key

    photoUploadConfirmedAt: timestamp("photoUploadConfirmedAt", {
      withTimezone: true,
    }),

    flaggedReason: text("flaggedReason"),

    generationFinishedAt: timestamp("imageGeneratedAt", { withTimezone: true }),
    finalOutputUrl: text("finalOutputUrl"),

    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    shareIdIdx: index("imageGenerations_shareId_idx").on(table.id),

    imageGeneratedAtIdx: index("imageGenerations_imageGeneratedAt_idx").on(
      table.generationFinishedAt,
    ),
    createdAtimageGeneratedAtIdx: index(
      "imageGenerations_createdAtimageGeneratedAt_idx",
    ).on(table.createdAt, table.generationFinishedAt),

    statusIdx: index("imageGenerations_status_idx").on(table.status),
    createdAtStatusIdx: index("imageGenerations_createdAtStatus_idx").on(
      table.createdAt,
      table.status,
    ),

    flaggedReasonIdx: index("imageGenerations_flaggedReason_idx").on(
      table.flaggedReason,
    ),
    createdAtFlaggedReasonIdx: index(
      "imageGenerations_createdAtFlaggedReason_idx",
    ).on(table.createdAt, table.flaggedReason),

    photoUploadConfirmedAtIdx: index(
      "imageGenerations_photoUploadConfirmedAt_idx",
    ).on(table.photoUploadConfirmedAt),

    finalOutputUrlIdx: index("imageGenerations_finalOutputUrl_idx").on(
      table.finalOutputUrl,
    ),

    createdAtIdx: index("imageGenerations_createdAt_idx").on(table.createdAt),

    updatedAtIdx: index("imageGenerations_updatedAt_idx").on(table.updatedAt),
  }),
);

export type AIGenerationSelect = typeof aiGenerations.$inferSelect;
