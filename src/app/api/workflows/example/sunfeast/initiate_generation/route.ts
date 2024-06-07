import { env } from "@/env";
import { FLAGGED_ERROR_CODES } from "@/lib/constants";
import { db } from "@/server/db";
import { aiGenerations } from "@/server/db/schema";
import { Workflow } from "@/server/workflows";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

// https://sdk.vercel.ai/providers/ai-sdk-providers/openai
const openai = createOpenAI({
  compatibility: "strict", // strict mode, enable when using the OpenAI API
  apiKey: env.OPENAI_API_KEY,
});

const workflow = new Workflow();

export const { POST } = workflow.createWorkflow((step) => {
  step
    .create(async ({ req }) => {
      console.log("Step 1: Validating user uploaded image...");
      const generationId = req.headers.get("generationId");
      if (!generationId) throw new Error("Generation ID is not provided!");

      const existingGeneration = await db.query.aiGenerations.findFirst({
        where: (g, { eq }) => eq(g.id, generationId),
      });

      if (!existingGeneration?.photoUrl)
        throw new Error("Generation does not have a photo yet!");

      const imageRes = await fetch(existingGeneration.photoUrl);
      const imageblob = await imageRes.blob();
      const fileExt = (imageblob.type.split("/")[1] ?? "jpeg")
        .trim()
        .toLowerCase();

      const imageContentType =
        imageRes.headers.get("content-type") ??
        (fileExt ? `image/${fileExt}` : "image/png");

      const base64ImageData = Buffer.from(
        await imageblob.arrayBuffer(),
      ).toString("base64");

      const imageAsBase64 = `data:${imageContentType};base64,${base64ImageData}`;

      // https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data
      const { object: validationData } = await generateObject({
        model: openai("gpt-4o"),
        schema: z.object({
          gender: z
            .enum(["male", "female", "unidentifiable"])
            .describe(
              'Gender of the person in the image. "unidentifiable" if it is not very clear.',
            ),

          number_of_people: z
            .number()
            .describe("Number of people in the image."),

          nsfw: z.boolean().describe("True if the image is NSFW."),
        }),

        messages: [
          { content: "Describe this image accurately.", role: "system" },
          {
            role: "user",
            content: [
              {
                image: base64ImageData,
                mimeType: imageContentType,
                type: "image",
              },
            ],
          },
        ],
      });

      if (validationData.nsfw) {
        await db
          .update(aiGenerations)
          .set({
            updatedAt: new Date(),
            status: "flagged",
            flaggedReason: FLAGGED_ERROR_CODES.NSFW_IMAGE,
          })
          .where(eq(aiGenerations.id, generationId));

        // return {
        //   success: false,
        // };
      }

      return {
        generationId,
        stepNumber: 0,
        finishedAt: new Date().getTime(),

        OPTIONS: {
          shouldContinue: false,
        },
      };
    })

    .create(({ data, error, req }) => {
      if (error) {
        return;
      }

      console.log(
        `step ${data.stepNumber + 1} finished at ${new Date(data.finishedAt).toISOString()}`,
      );

      console.log(`Request made by ${req.headers.get("user-agent")}`);

      return {
        stepNumber: data.stepNumber + 1,
        finishedAt: new Date().getTime(),
      };
    })

    .finally(() => {
      console.log("Workflow completed");

      return {
        OPTIONS: {
          shouldContinue: false,
        },
      };
    });
});
