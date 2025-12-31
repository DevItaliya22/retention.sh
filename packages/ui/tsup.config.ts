import { defineConfig, Options } from "tsup";

export default defineConfig((options: Options) => ({
  entry: {
    index: "src/index.tsx",
  },
  format: ["esm", "cjs"],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client"',
    };
  },
  dts: true,
  minify: true,
  external: [
    "react",
    "react-dom",
    "@radix-ui/react-slot",
    "class-variance-authority",
    "clsx",
    "lucide-react",
    "next-themes",
    "tailwind-merge",
    "tw-animate-css",
    "zod",
  ],
  splitting: false,
  sourcemap: true,
  clean: true,
  ...options,
}));
