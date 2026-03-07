import { runDemoApiBrutalSuite } from "./run";
import type { DemoTestFocus } from "./types";

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";

function parseArg(name: string): string | undefined {
  return process.argv
    .find((arg) => arg.startsWith(`--${name}=`))
    ?.split("=")[1];
}

function parseFocus(value: string | undefined): DemoTestFocus {
  if (!value) return "all";
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "all" ||
    normalized === "cashback" ||
    normalized === "partner"
  ) {
    return normalized;
  }
  throw new Error(`Invalid --focus value: ${value}`);
}

async function main() {
  const baseUrl = parseArg("baseUrl") ?? "http://localhost:3000";
  const focus = parseFocus(parseArg("focus"));

  const out = await runDemoApiBrutalSuite({ baseUrl, focus });

  const total = out.summary.total;
  const passed = out.summary.passed;
  const failed = out.summary.failed;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : "0.0";

  console.log(`${CYAN}Brutal API suite finished${RESET}`);
  console.log(
    `${GREEN}Passed: ${passed}${RESET}  ${RED}Failed: ${failed}${RESET}  ${YELLOW}Total: ${total}${RESET}  ${CYAN}Pass rate: ${passRate}%${RESET}`,
  );
  console.log(`Report: ${out.latestPath}`);

  if (failed > 0) {
    const failed = out.results.filter((r) => !r.passed);
    for (const item of failed.slice(0, 20)) {
      console.log(
        `${RED}FAIL${RESET} [${item.accountKey}] ${item.name} (status=${item.status ?? "n/a"}) ${item.details ?? ""}`,
      );
    }
    process.exit(1);
  }

  console.log(`${GREEN}All test cases passed.${RESET}`);
}

main().catch((error) => {
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`Demo API brutal suite failed: ${msg}`);
  process.exit(1);
});
