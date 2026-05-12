import ContactForm from "./_components/contact-form";
import { ContactList } from "./_components/contact-list";

export default async function FormPage() {
  "use cache"
  return (
    // TODO:UIをきれいにする
    <div className="mx-auto max-w-lg py-10 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">お問い合わせ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          以下のフォームにご記入の上、送信してください。
        </p>
      </div>
      <ContactForm />
      <hr />
      <ContactList />
    </div>
  );
}
