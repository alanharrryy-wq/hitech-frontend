
import { useEffect } from 'react'

type Handler = (e: KeyboardEvent) => void

export function useHotkeys(map: Record<string, Handler>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const parts:string[] = []
      if (e.ctrlKey || e.metaKey) parts.push('mod')
      if (e.shiftKey) parts.push('shift')
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      parts.push(key)
      const combo = parts.join('+')
      const h = map[combo]
      if (h) { e.preventDefault(); h(e) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [map])
}
