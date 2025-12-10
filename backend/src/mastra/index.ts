import { Mastra } from "@mastra/core";
import { agenteTesis } from "./agents";

export const mastra = new Mastra({
  agents: {
    agenteTesis
  }
});
