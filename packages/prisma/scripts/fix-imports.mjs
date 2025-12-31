import { readdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const generatedDir = join(__dirname, "../generated/prisma");

async function fixImportsInFile(filePath) {
  try {
    let content = await readFile(filePath, "utf-8");
    const originalContent = content;

    // Replace .js imports with .ts (or remove extension for TypeScript resolution)
    // Match imports like: import * from "./enums.js" or from './enums.js'
    content = content.replace(
      /from\s+['"]\.\/([^'"]+)\.js['"]/g,
      'from "./$1"',
    );
    content = content.replace(
      /from\s+['"]\.\.\/([^'"]+)\.js['"]/g,
      'from "../$1"',
    );

    if (content !== originalContent) {
      await writeFile(filePath, content, "utf-8");
      console.log(`Fixed imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function processDirectory(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await processDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".ts")) {
        await fixImportsInFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error);
  }
}

async function main() {
  console.log("Fixing .js imports in generated Prisma client...");
  await processDirectory(generatedDir);
  console.log("Done fixing imports!");
}

main().catch(console.error);
