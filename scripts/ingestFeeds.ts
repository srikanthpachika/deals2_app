import { ingestFeeds } from "../lib/ingest";
import { prisma } from "../lib/prisma";
import { loadEnv } from "./loadEnv";

loadEnv();

async function main() {
  const report = await ingestFeeds();
  console.log("Ingest report:", report);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
