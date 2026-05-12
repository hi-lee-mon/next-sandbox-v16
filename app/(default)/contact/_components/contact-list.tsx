import { getContactList } from "../_data/get-contact-list";

export async function ContactList() {
  const contactList = await getContactList()
  return (
    <div>
      {contactList.map((contact) => {
        return <div>
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
