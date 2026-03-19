import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  oxc: false,
  test: {
    globals: true,
    root: "./",
    environment: "node",
    include: ["src/**/*.spec.ts"],
    exclude: ["dist/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.spec.ts",
        "src/**/*.module.ts",
        "src/**/main.ts",
        "dist/**",
        "node_modules/**",
      ],
    },
  },
  plugins: [
    swc.vite({
      module: { type: "es6" },
    }),
  ],
});
