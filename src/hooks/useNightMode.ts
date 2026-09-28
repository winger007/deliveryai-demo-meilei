import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'night-mode'

/**
 * 夜间模式状态管理 hook。
 * 优先级：localStorage > 默认关闭。
 * localStorage 不可用时降级为内存态，不报错不阻塞。
 */
export function useNightMode() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    const initial = getInitialNightMode()
    applyNightMode(initial)
    return initial
  })

  useEffect(() => {
    applyNightMode(enabled)
  }, [enabled])

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, next ? 'true' : 'false')
      } catch {
        // localStorage 不可用时降级为内存态，不报错
      }
      return next
    })
  }, [])

  return { enabled, toggle }
}

function getInitialNightMode(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') return true
    if (stored === 'false') return false
  } catch {
    // localStorage 不可用时降级为默认关闭
  }
  return false
}

function applyNightMode(enabled: boolean) {
  const root = document.documentElement
  if (enabled) {
    root.classList.add('night')
  } else {
    root.classList.remove('night')
  }
}
