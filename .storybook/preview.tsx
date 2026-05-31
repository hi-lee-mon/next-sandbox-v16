import addonThemes, { withThemeByClassName } from "@storybook/addon-themes";
import addonA11y from "@storybook/addon-a11y";
import addonDocs from "@storybook/addon-docs";
import { definePreview } from '@storybook/nextjs-vite'
import { sb } from "storybook/test";

// tailwindcss有効化(https://storybook.js.org/recipes/tailwindcss/)
import '../app/globals.css';

// Storybook は preview config 内の sb.mock を静的に抽出して、
// story の import 前に module を差し替える。別ファイルへ移して import するだけでは
// 抽出されず、server-only な実装が browser test に混入する。
sb.mock(import("next/cache"));

// このローカル TS ファイルの mock は文字列指定にする。
// Storybook 公式例の dynamic import 形式だと allowImportingTsExtensions が必要になり、
// root tsconfig の許可範囲を広げるか、Storybook 用の型チェックを分ける必要がある。
sb.mock("../app/(default)/blogs/_data/get-public-blogs.ts", { spy: true });

export default definePreview({
  tags: ['autodocs'],
  parameters: {
    a11y: { test: 'error' },
    nextjs: {
      appDirectory: true,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  addons: [addonDocs(), addonA11y(), addonThemes()],
  decorators: [
    withThemeByClassName({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
  ]
})
