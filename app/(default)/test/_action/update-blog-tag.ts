"use server";

import { refresh, updateTag } from "next/cache";
import { BLOGS_CACHE_TAG } from "../../blogs/_data/cache-tags";

export const updateBlogTag = async () => {
  updateTag(BLOGS_CACHE_TAG);
  refresh()
}