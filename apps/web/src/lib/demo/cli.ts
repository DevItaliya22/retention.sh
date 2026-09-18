import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { createDemoAccounts } from "./generator";
import type { DemoRunOptions, DemoScenarioKey } from "./types";

const billsArg = Number(
  process.argv.find((arg) => arg.startsWith("--bills="))?.split("=")[1],
);
const customersArg = Number(
  process.argv.find((arg) => arg.startsWith("--customers="))?.split("=")[1],
);
const modeArg = process.argv
  .find((arg) => arg.startsWith("--mode="))
  ?.split("=")[1];

const menu: Array<{ id: string; label: string; keys: DemoScenarioKey[] }> = [
  {
    id: "1",
    label: "Client showcase (90-day analytics demo)",
    keys: ["showcase"],
  },
  { id: "2", label: "Cashback account", keys: ["cashback"] },
  { id: "3", label: "Tier account", keys: ["tier"] },
  { id: "4", label: "Amount spent account", keys: ["amount_spent"] },
  { id: "5", label: "Visit made account", keys: ["visit_made"] },
  { id: "6", label: "Large data account", keys: ["cashback_large"] },
  {
    id: "7",
    label: "Partner accounts (both sides)",
    keys: ["partner_left", "partner_right"],
  },
  {
    id: "8",
    label: "All accounts (incl. showcase)",
    keys: [
      "showcase",
      "cashback",
      "tier",
      "amount_spent",
      "visit_made",
      "cashback_large",
      "partner_left",
      "partner_right",
    ],
  },
];

const modeToKeys: Record<string, DemoScenarioKey[]> = {
  showcase: ["showcase"],
  cashback: ["cashback"],
  tier: ["tier"],
  "amount-spent": ["amount_spent"],
  "visit-made": ["visit_made"],
  large: ["cashback_large"],
  partner: ["partner_left", "partner_right"],
  all: [
    "showcase",
    "cashback",
    "tier",
    "amount_spent",
    "visit_made",
    "cashback_large",
    "partner_left",
    "partner_right",
  ],
};

async function pickScenarioKeys(): Promise<DemoScenarioKey[]> {
  if (modeArg && modeToKeys[modeArg]) {
    return modeToKeys[modeArg];
  }

  output.write("\nSelect what to run:\n");
  for (const item of menu) {
    output.write(`${item.id}. ${item.label}\n`);
  }
  output.write("\n");

  const rl = createInterface({ input, output });
  try {
    const answer = (await rl.question("Enter option (1-8): ")).trim();
    const picked = menu.find((m) => m.id === answer);
    if (!picked) {
      throw new Error("Invalid option. Use 1 to 8.");
    }
    return picked.keys;
  } finally {
    rl.close();
  }
}

const scenarioKeys = await pickScenarioKeys();

const runOptions: DemoRunOptions = {
  scenarioKeys,
  billsPerAccount:
    Number.isFinite(billsArg) && billsArg > 0 ? billsArg : undefined,
  customersPerAccount:
    Number.isFinite(customersArg) && customersArg > 0
      ? customersArg
      : undefined,
};

await createDemoAccounts(runOptions);
