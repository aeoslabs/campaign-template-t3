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

interface Step<I> {
  create: <O>(
    action: (prevResult: Awaited<I>, req: NextRequest) => O,
  ) => Step<O>;
  finally: (
    action: (prevResult: Awaited<I>, req: NextRequest) => void,
  ) => unknown;
}

export class Workflow {
  client = new Client({ token: env.QSTASH_TOKEN });

  steps: (<I>(prevResult: I, req: NextRequest) => unknown)[] = [];

  createWorkflow = (setupStep: (step: Step<unknown>) => void) => {
    const step: Step<unknown> = {
      create: <O>(action: <I>(prevResult: I, req: NextRequest) => O) => {
        this.steps.push(action);
        return step as Step<O>;
      },

      finally: (action: <I>(prevResult: I, req: NextRequest) => unknown) => {
        this.steps.push(action);
      },
    };

    setupStep(step);

    const POST = async (req: NextRequest) => {
      const { pathname } = new URL(req.url);

      const { searchParams } = new URL(req.url);
      const step = searchParams.get("step");

      const contentType = req.headers.get("content-type");

      if (contentType !== "application/json") {
        return new Response("Missing JSON request body or correct headers.", {
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
        const res = await action(body, req);

        // call next step with function output
        if (Number(step) < this.steps.length - 1) {
          await this.client.publish({
            url: `${baseUrl}${pathname}?step=${Number(step) + 1}`,
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify(res),
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
