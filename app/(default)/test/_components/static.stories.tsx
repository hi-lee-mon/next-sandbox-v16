import preview from '../../../../.storybook/preview'

import Static from './static'

const meta = preview.meta({
  component: Static,
})

export const Default = meta.story({
  args: {
    children: 'Static content',
  },
})