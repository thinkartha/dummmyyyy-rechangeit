'use client'

import { useEffect } from 'react'

export type ScriptItem = { src?: string; code?: string; module?: boolean }

/**
 * Runs the theme's vendor + page scripts after the markup is in the DOM, in the
 * order the pug build emitted them (bootstrap needs popper first, phoenix.js needs
 * both).
 *
 * ponytail: `async = false` on a dynamically inserted <script> is the platform's own
 * ordering guarantee — no loader library. Inline snippets become blob URLs so they
 * queue behind the external scripts instead of executing the moment they are inserted.
 */
export default function Scripts({ items }: { items: ScriptItem[] }) {
  useEffect(() => {
    if (!items?.length) return
    const urls: string[] = []
    const nodes = items.map(item => {
      const el = document.createElement('script')
      if (item.src) {
        el.src = item.src
      } else if (item.module) {
        // A module has to stay a real inline script: from a blob: URL the browser
        // cannot resolve "/assets/..." ("base scheme isn't hierarchical"), and the
        // whole API bootstrap dies with it. Inline modules are deferred anyway, which
        // is the position the pug build gave them.
        el.type = 'module'
        el.textContent = item.code ?? ''
        document.body.appendChild(el)
        return el
      } else {
        const url = URL.createObjectURL(
          new Blob([item.code ?? ''], { type: 'text/javascript' })
        )
        urls.push(url)
        el.src = url
      }
      el.async = false
      document.body.appendChild(el)
      return el
    })
    return () => {
      nodes.forEach(n => n.remove())
      urls.forEach(URL.revokeObjectURL)
    }
  }, [items])

  return null
}
