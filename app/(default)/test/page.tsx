import { Suspense } from "react";
import Dynamic from "./_components/dynamic";
import DynamicCache from "./_components/dynamic-cache";
import Static from "./_components/static";
import DynamicRuntime from "./_components/dynamic-runtime";
import Interaction from "./_components/interaction";
import F from "./_components/fallback";
import Timer from "./_components/timer";

export default async function Page() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Testページ</h1>
      <Timer />
      <Interaction />
      <Suspense fallback={<F l="3秒待機🚨" />}>
        <Static>
          <DynamicRuntime sec={3}>
            3秒で出る
            <Static>
              3秒後に出る
            </Static>
            <Suspense fallback={<F l="1秒待機😇" />}>
              <Dynamic sec={1}>
                1秒で出る
              </Dynamic>
            </Suspense>
            <Suspense fallback={<F l="10秒待機🛠️" />}>
              <Dynamic sec={10}>
                10秒で出る
              </Dynamic>
            </Suspense>
            <Suspense fallback={<F l="4秒待機😍" />}>
              <Dynamic sec={4}>
                4秒で出る
              </Dynamic>
            </Suspense>
          </DynamicRuntime>
        </Static>
        <Suspense fallback={<F l="3秒待機🥲" />}>
          <Suspense fallback={<F l="10秒待機😌" />}>
            <Dynamic sec={10}>
              10秒で出る
            </Dynamic>
          </Suspense>
          <Dynamic sec={5}>
            3秒で出る
          </Dynamic>
          <Suspense fallback={<F l="5秒待機😎" />}>
            <Dynamic sec={5}>
              5秒で出る
            </Dynamic>
          </Suspense>
        </Suspense>
      </Suspense>
      <Suspense fallback={<F l="1秒待機😭" />}>
        <Dynamic sec={1}>
          1秒で出る
        </Dynamic>
      </Suspense>
      <DynamicCache sec={3}>
        即出る
      </DynamicCache>
    </div >
  )
}