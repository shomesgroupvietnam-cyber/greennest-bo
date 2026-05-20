import { runDueKnowledgeDiscoveryTopics } from "@/modules/knowledge/services/knowledge-discovery-scheduler";

const runnerId = process.env.DISCOVERY_RUNNER_ID ?? `manual-runner-${new Date().toISOString()}`;

const result = await runDueKnowledgeDiscoveryTopics({
  runnerId
});

console.log(
  JSON.stringify(
    {
      runnerId,
      ...result
    },
    null,
    2
  )
);
