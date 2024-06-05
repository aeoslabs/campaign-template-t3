## TLDR;

This repo is a collection of Next.js specific workflows to help you quickly build out a production ready app that scales to thousands of users.
Here's a list of what's included:

- Authorization (for admin) - No hard dependencies, you can use any auth provider (Clerk, Supabase, Next Auth, etc.)
- S3 compatible storage
- Postgres Database (any provider)
- Abuse prevention strategies - Rate-limits (IP based), and OTP.
- Responsive interactive elements that are wired up with the server.
- Retry mechanisms and queueing for long running tasks using [QStash](https://upstash.com/docs/qstash/)

## What is this

Wanna launch a campaign? This is the place to start.

- Will save you a lot of time and hair pulling
- All best practices already implemented
- Just pick the workflows you need and you're good to go
- Also includes a production checklist

## For whom is this

You. The developer. The one who's tired of setting up the same workflows over and over again.

## How to use this

## 1. Initialize the project

Since this template doesn't impose any rigid requirements on your project structure, you can scaffolding your project the way you'd like, either using [Create T3 App](https://create.t3.gg/) [**recommended**], [Kirimase](https://github.com/nicoalbanese/kirimase) or even use vanilla [Create Next App](https://nextjs.org/docs/app/api-reference/create-next-app)

## 2. Add the workflows you need

This repository includes a bunch of workflows that you can pick and choose from, in the `workflows` directory.

Here's a list of the most common workflows that you'd probably need:

1. **Replicate Generation** - Creates a new Replicate Prediction for a given model and input data.

## 3. Wire up the frontend (if needed)

This repo contains ready-to-go UI blocks that are already stitched together with CRUD APIs. that were used in some of the projects in the past. They've been refined and polished over time, and follow these best practices:

1. **Full Stack Typesafety**: All APIs that the client interacts with are built using [tRPC](https://trpc.io/), in tandem with [TanStack Query](https://tanstack.com/query/).
2. **Validation**: All forms are validated using [Zod](https://zod.dev/).
3. **State Management**: Uses [Zustand](https://zustand.surge.sh/) for state management.

- **UI Components**: It's recommended to use [Tailwind CSS](https://tailwindcss.com/) and [Shadcn UI](https://ui.shadcn.com/).

## Concepts

### [1. Workflows](./src/app/api/workflows/README.md)

A workflow is a collection of APIs that run in a sequence to accomplish a given task. A workflow consists of a series of steps, where each step is an abstraction over a single API call.

Consider the following workflow for Sunfeast Image Generation Campaign 2024:

1.  Extract details from a user submitted image using GPT Vision
2.  Use the extracted details to construct input for a Replicate model
3.  Run a Replicate prediction

It is also possible to extend a workflow with more steps, and make a new workflow out of it.

### 2. Modules

A module is a collection of utilities that can run inside a workflow, or even standalone. For example - a module that uses GPT Vision to extract details from an image in a validated JSON format.

This can also include other utilities for S3, Replicate, OpenAI, etc.

### 3. Use cases

### Optional goodies

---

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.
