import preview from "../../../../.storybook/preview";
import { expect, mocked } from "storybook/test";

import { getPublicBlogs } from "../../blogs/_data/get-public-blogs";
import BlogList from "./blog-list";

const meta = preview.meta({
  component: BlogList,
  parameters: {
    react: {
      rsc: true,
    },
  },
});


export const WithPublicBlogs = meta.story({
  async beforeEach() {
    // このテストは以下のように内部実装を見ており、getPublicBlogsから別の関数に置き換えるとすぐに壊れる
    // またブログ取得処理以外のauthやrevalidateなどのnext系のapiのモックが必要になってくる。表示を確認したいだけの場合は対応が重いと感じられる。
    mocked(getPublicBlogs).mockResolvedValue([
      {
        id: "public-blog-1",
        title: "公開記事",
        body: "本文",
        user_id: null,
        author_name: "Storybook User",
        is_private: false,
        created_at: new Date("2026-01-01T00:00:00.000Z"),
        updated_at: new Date("2026-01-01T00:00:00.000Z"),
        deleted_at: null,
      },
    ]);
  },
});

WithPublicBlogs.test("公開ブログのタイトルと著者が表示される", async ({ canvas }) => {
  await expect(canvas.getByText("タイトル：公開記事")).toBeInTheDocument();
  await expect(canvas.getByText("著者：Storybook User")).toBeInTheDocument();
});

export const Empty = meta.story({
  async beforeEach() {
    mocked(getPublicBlogs).mockResolvedValue([]);
  },
});

Empty.test("ブログがない場合は空状態を表示する", async ({ canvas }) => {
  await expect(canvas.getByText("投稿がありません")).toBeInTheDocument();
});
