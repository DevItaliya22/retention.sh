import { promises as fs } from "node:fs";
import path from "node:path";
import type { DemoScenarioKey } from "../types";
import { runApiBrutalTests } from "./cases";
import { loadRuntimeAccounts } from "./credentials";
import type { DemoTestOptions, TestResult } from "./types";

async function assertApiReachable(baseUrl: string): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/api/auth/cashier/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    // Any HTTP response means host is reachable; 4xx/5xx is fine for preflight.
    if (!response) {
      throw new Error("No response from API host");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Cannot reach API at ${baseUrl}. Start the web server and verify --baseUrl. Original error: ${message}`,
    );
  }
}

function requiredKeysForFocus(
  focus: DemoTestOptions["focus"],
): DemoScenarioKey[] {
  if (focus === "cashback") {
    return ["cashback", "tier", "amount_spent", "visit_made"];
  }
  if (focus === "partner") {
    return ["partner_left", "partner_right"];
  }
  return [
    "cashback",
    "tier",
    "amount_spent",
    "visit_made",
    "partner_left",
    "partner_right",
  ];
}

function summarize(results: TestResult[]) {
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  return { total: results.length, passed, failed };
}

async function writeReport(results: TestResult[]) {
  const logsDir = path.join(process.cwd(), "demo", "test", "logs");
  await fs.mkdir(logsDir, { recursive: true });

  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, "-");
  const payload = {
    generatedAt: now.toISOString(),
    summary: summarize(results),
    results,
  };

  const latestPath = path.join(logsDir, "latest.json");
  const runPath = path.join(logsDir, `run-${ts}.json`);

  await fs.writeFile(latestPath, JSON.stringify(payload, null, 2), "utf8");
  await fs.writeFile(runPath, JSON.stringify(payload, null, 2), "utf8");

  return { latestPath, runPath, summary: payload.summary };
}

export async function runDemoApiBrutalSuite(options: DemoTestOptions) {
  await assertApiReachable(options.baseUrl);
  const keys = requiredKeysForFocus(options.focus);
  const runtimeAccounts = await loadRuntimeAccounts(keys);
  const results = await runApiBrutalTests(options.baseUrl, runtimeAccounts);
  const report = await writeReport(results);

  return {
    ...report,
    results,
  };
}
