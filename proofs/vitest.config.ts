import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "proofs",
    include: ["test/**/*.test.ts"],
  },
});
