import { env } from "@/env";
import { Client } from "@upstash/qstash";

import { type NextRequest } from "next/server";

const domain =
  env.NEXT_PUBLIC_VERCEL_ENV === "production"
    ? env.NEXT_PUBLIC_APP_URL
    : env.NEXT_PUBLIC_LOCAL_TUNNEL_URL ??
      env.NEXT_PUBLIC_VERCEL_URL ??
      env.NEXT_PUBLIC_APP_URL;

const baseUrl = new URL(domain).toString();

type SuccessResponse<I> = {
  data: Awaited<I>;
  error: null | undefined;
};

type ErrorResponse = {
  error: unknown;
  data: null | undefined;
};

type CommonResponse<I> = (SuccessResponse<I> | ErrorResponse) & {
  continue?: boolean;
  req: NextRequest;
};
type StepOutput<O> = O & {
  OPTIONS?: {
    shouldContinue?: boolean;
  };
};

interface Step<I> {
  create: <O>(
    action: (
      prevResult: CommonResponse<I>,
    ) => StepOutput<O> | Promise<StepOutput<O>>,
  ) => Step<O>;
  finally: (
    action: (
      prevResult: CommonResponse<I>,
    ) => StepOutput<unknown> | Promise<StepOutput<unknown>>,
  ) => unknown;
}

type StepResponse = {
  data?: Record<string, unknown>;
  error?: string;
  continue?: boolean;
};

export class Workflow {
  client = new Client({ token: env.QSTASH_TOKEN });

  steps: (<I>(
    prevResult: CommonResponse<I>,
  ) => StepOutput<unknown> | Promise<StepOutput<unknown>>)[] = [];

  createWorkflow = (setupStep: (step: Step<unknown>) => void) => {
    const step: Step<unknown> = {
      create: <O>(
        action: <I>(
          prevResult: CommonResponse<I>,
        ) => StepOutput<O> | Promise<StepOutput<O>>,
      ) => {
        this.steps.push(action);
        return step as Step<O>;
      },

      finally: (
        action: <I>(
          prevResult: CommonResponse<I>,
        ) => StepOutput<unknown> | Promise<StepOutput<unknown>>,
      ) => {
        this.steps.push(action);
      },
    };

    setupStep(step);

    const POST = async (req: NextRequest) => {
      const { pathname } = new URL(req.url);

      const { searchParams } = new URL(req.url);
      const step = searchParams.get("step");

      if (req.headers.get("content-type") !== "application/json") {
        return new Response("Missing JSON body or correct headers.", {
          status: 405,
        });
      }

      let body: Record<string, unknown>;

      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch (err) {
        body = {};
      }

      if (Number(step) > this.steps.length - 1) {
        return new Response("All tasks completed successfully");
      }

      const action = this.steps[Number(step)]!;

      try {
        const jsonData = action({
          data: body,
          req,
          error: null,
          continue: false,
        });

        // call next step with function output
        if (Number(step) < this.steps.length - 1) {
          await this.client.publishJSON({
            url: `${baseUrl}${pathname}?step=${Number(step) + 1}`,
            method: "POST",
            body: jsonData,
          });
        }

        return new Response("OK");
      } catch (err) {
        console.error(err);

        return new Response("Workflow error", { status: 500 });
      }
    };

    return { POST };
  };
}
