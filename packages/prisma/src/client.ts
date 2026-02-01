import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import pg from "pg";
import { PrismaClient } from "../generated/prisma/client";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

const adapter = new PrismaPg(pool);

const globalForDb = global as unknown as { db: PrismaClient };

export const db =
  globalForDb.db ||
  new PrismaClient({
    adapter,
    log: [
      {
        emit: "event",
        level: "query",
      },
    ],
  });

const dim = "\x1b[2m";
const green = "\x1b[32m";
const yellow = "\x1b[33m";
const reset = "\x1b[0m";
const cyan = "\x1b[36m";

// @ts-ignore
db.$on("query", (e: any) => {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.SHOW_QUERIES === "true") {
    console.log(`${cyan}Query:${reset} ${dim}${e.query}${reset}`);
  }
  if (process.env.SHOW_DELAYS === "true") {
    console.log(
      `${green}Duration:${reset} ${yellow}${e.duration.toFixed(2)}ms${reset}`,
    );
  }
});

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
