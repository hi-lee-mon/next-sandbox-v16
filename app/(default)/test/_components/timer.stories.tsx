import preview from '../../../../.storybook/preview'
import { expect } from 'storybook/test'

import Timer from './timer'

const meta = preview.meta({
  component: Timer,
})

export const Default = meta.story()

Default.test('初期表示が0秒', async ({ canvas }) => {
  await expect(canvas.getByText(/0秒/)).toBeInTheDocument()
});
