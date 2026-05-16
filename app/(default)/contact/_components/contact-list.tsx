import { cacheLife, cacheTag } from "next/cache";
import { getContactList } from "../_data/get-contact-list";
import { CONTACTS_CACHE_TAG } from "../cache-tags";

export async function ContactList() {
  "use cache";
  cacheTag(CONTACTS_CACHE_TAG);
  cacheLife({ stale: 0, revalidate: 15, expire: 300 });

  const contactList = await getContactList()

  return (
    <div>
      {contactList.map((contact) => {
        return <div key={contact.id} >
          <p>
            名前：{contact.name}
          </p>
          <p>
            内容：{contact.message}
          </p>
        </div>
      })}
    </div>
  )
}
