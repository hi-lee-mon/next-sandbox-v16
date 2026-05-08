'use client' // エラーバウンダリーはクライアントコンポーネントである必要があります

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // エラーをエラーレポーティングサービスにログします
    console.error(error)
  }, [error])

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button
        onClick={
          // セグメントの再レンダリングを試みて回復を試みます
          () => reset()
        }
      >
        Try again
      </button>
    </div>
  )
}