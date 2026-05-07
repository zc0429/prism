import { FlatCompat } from "@eslint/eslintrc"
import { defineConfig, globalIgnores } from "eslint/config"

const compat = new FlatCompat()

const eslintConfig = defineConfig([
  ...compat.extends("next/core-web-vitals"),
  ...compat.extends("next/typescript"),
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
])

export default eslintConfig
