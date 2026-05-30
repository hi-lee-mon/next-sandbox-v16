import { fn } from "storybook/test";

import type { BlogListItem } from "../../schema";

export const getPublicBlogs = fn<() => Promise<BlogListItem[]>>().mockName("getPublicBlogs");