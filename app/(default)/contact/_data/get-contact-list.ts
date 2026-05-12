import "server-only";

import sql from "@/lib/auth/db";
import { Contact } from "../schema";
import { cacheTag, cacheLife } from "next/cache";
import { CONTACTS_CACHE_TAG } from "../cache-tags";

type ContactList = Contact[]

export async function getContactList(): Promise<ContactList> {
  "use cache";
  cacheTag(CONTACTS_CACHE_TAG);
  cacheLife({ stale: 0, revalidate: 60, expire: 3600 });

  const contactList = await sql<ContactList>`
    SELECT *
    FROM contacts
  `;
  return contactList.map((b) => ({ ...b, created_at: new Date(b.created_at) }));
}
