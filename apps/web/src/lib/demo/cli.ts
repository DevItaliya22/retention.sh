import { createDemoAccounts } from "./generator";

const billsArg = Number(
  process.argv.find((arg) => arg.startsWith("--bills="))?.split("=")[1],
);
const customersArg = Number(
  process.argv.find((arg) => arg.startsWith("--customers="))?.split("=")[1],
);

await createDemoAccounts({
  billsPerAccount:
    Number.isFinite(billsArg) && billsArg > 0 ? billsArg : undefined,
  customersPerAccount:
    Number.isFinite(customersArg) && customersArg > 0
      ? customersArg
      : undefined,
});
