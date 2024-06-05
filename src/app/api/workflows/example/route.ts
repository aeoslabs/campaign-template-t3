import { Workflow } from "@/server/workflows";

const workflow = new Workflow();

export const { POST } = workflow.createWorkflow((step) => {
  step
    .create((_, req) => {
      console.log(`Request made by ${req.headers.get("user-agent")}`);

      return {
        stepNumber: 0,
        finishedAt: new Date().getTime(),
      };
    })

    .create((data, req) => {
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
    });
});
