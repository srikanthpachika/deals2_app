import { ingestFeeds } from "../lib/ingest";
import { prisma } from "../lib/prisma";
import { loadEnv } from "./loadEnv";

loadEnv();

const intervalMinutes = Number(process.env.INGEST_INTERVAL_MINUTES || "10");
const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runOnce() {
  const report = await ingestFeeds();
  console.log("Ingest report:", report);
}

async function runLoop() {
  await runOnce();
  while (true) {
    await sleep(intervalMs);
    await runOnce();
  }
}

const shutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

runLoop().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
