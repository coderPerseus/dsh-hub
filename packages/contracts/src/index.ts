import { oc } from "@orpc/contract";
import { z } from "zod";

const healthContract = oc.output(
  z.object({
    service: z.literal("dshhub-api"),
    status: z.literal("ok"),
    timestamp: z.iso.datetime(),
  }),
);

const helloContract = oc
  .input(
    z.object({
      name: z.string().trim().min(1).max(80),
    }),
  )
  .output(
    z.object({
      message: z.string(),
    }),
  );

export const appContract = {
  greeting: {
    hello: helloContract,
  },
  system: {
    health: healthContract,
  },
};

export type AppContract = typeof appContract;
