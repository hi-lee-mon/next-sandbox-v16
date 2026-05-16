import preview from '../../../.storybook/preview';

import SectionTitle from "./section-title";

const meta = preview.meta({
  component: SectionTitle,
});

export const Primary = meta.story({
  args: {
    children: "セクションタイトル"
  }
});