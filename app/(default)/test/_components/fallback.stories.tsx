import preview from '../../../../.storybook/preview'
import { expect } from 'storybook/test'

import Fallback from './fallback'

const meta = preview.meta({
  component: Fallback,
})

export const Default = meta.story()

Default.test('デフォルトで「読み込み中」が表示される', async ({ canvas }) => {
  await expect(canvas.getByText(/読み込み中/)).toBeInTheDocument()
})

export const WithCustomLabel = meta.story({
  args: {
    l: 'データを取得中...',
  },
})

WithCustomLabel.test('カスタムラベルが表示される', async ({ canvas }) => {
  await expect(canvas.getByText('データを取得中...')).toBeInTheDocument()
})
