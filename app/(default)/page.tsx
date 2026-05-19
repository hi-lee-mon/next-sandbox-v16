import SectionTitle from "./_components/section-title";
import { L } from "./_components/l";

export default async function Home() {
  return (
    <div>
      <SectionTitle>メインページ</SectionTitle>
      <L href="/about">aboutへ</L>
      <L href="/profile">profileへ</L>
      <L href="/blogs">blogsへ</L>
      <L href="/contact">contactへ</L>
      <L href="/test">testへ</L>
      <L href="/wait">wait</L>
      <L href="/transition">transition</L>
    </div>
  );
}
