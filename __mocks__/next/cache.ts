import { fn } from "storybook/test";

export const cacheLife = fn().mockName("next/cache::cacheLife");
export const cacheTag = fn().mockName("next/cache::cacheTag");
export const refresh = fn().mockName("next/cache::refresh");
export const revalidatePath = fn().mockName("next/cache::revalidatePath");
export const revalidateTag = fn().mockName("next/cache::revalidateTag");
export const unstable_cache = fn((callback) => callback).mockName("next/cache::unstable_cache");
export const unstable_noStore = fn().mockName("next/cache::unstable_noStore");
export const updateTag = fn().mockName("next/cache::updateTag");
