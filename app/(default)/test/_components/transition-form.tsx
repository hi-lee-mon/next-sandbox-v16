"use client"

import { memo, PropsWithChildren, useState } from "react";
import { TabButton } from "./tab-button";

export default function TransitionForm() {
  const [tab, setTab] = useState<"profile" | "slow" | "about">("profile");



  return (
    <div>
      <TabButton
        variant="outline"
        isActive={tab === 'profile'}
        action={() => setTab('profile')}
      >
        Profile表示
      </TabButton>
      <TabButton
        variant="outline"
        isActive={tab === 'slow'}
        action={() => setTab('slow')}
      >
        Slow表示
      </TabButton>
      <TabButton
        variant="outline"
        isActive={tab === 'about'}
        action={() => setTab('about')}
      >
        About表示
      </TabButton>
      {tab === 'profile' && <Fast>Profile画面</Fast>}
      {tab === 'slow' && <PostsTab />}
      {tab === 'about' && <Fast>About画面</Fast>}
    </div>

  )
}


const PostsTab = memo(function PostsTab() {
  let items = [];
  for (let i = 0; i < 500; i++) {
    items.push(<SlowPost key={i} index={i} />);
  }
  return (
    <ul>
      {items}
    </ul>
  );
});

function SlowPost({ index }: { index: number }) {
  let startTime = performance.now();
  while (performance.now() - startTime < 1) {
    // 1ms ブロックする重い処理のシミュレーション
  }

  return (
    <li className="item">
      Post #{index + 1}
    </li>
  );
}

function Fast({ children }: PropsWithChildren) {
  return <div>{children}</div>;
}