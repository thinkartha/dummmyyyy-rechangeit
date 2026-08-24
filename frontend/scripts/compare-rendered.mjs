// Renders the pug build and the ported build in headless Chrome and diffs the DOM
// *after* all scripts have run.
//
// Caveat: pages that redirect (the auth guard) reach their final state one navigation
// later than the pug build, so a still-pending API call can show up as a text diff on
// the landing page of the redirect. Check those by hand before believing them. Usage: node scripts/compare-rendered.mjs <page.html>...
// Expects the two static servers: pug on :8898 (../public), Next export on :8899 (out).
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { parse } from 'parse5'
import { find, attr, hasClass } from './html-to-jsx.mjs'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const norm = v => (v || '').split(/\s+/).filter(Boolean).sort().join(' ')

function render(url, file) {
  const dom = execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--no-sandbox',
    '--virtual-time-budget=45000', '--dump-dom', url,
  ], { stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }).toString()
  writeFileSync(file, dom)
  return dom
}

function sig(root) {
  const out = []
  const walk = n => {
    if (n.nodeName === '#text') {
      const t = n.value.replace(/\s+/g, ' ').trim()
      if (t) out.push('#text:' + t)
      return
    }
    // <canvas> is echarts' own output; its attributes carry pixel sizes, not markup.
    if (!n.tagName || n.tagName === 'script' || n.tagName === 'canvas') return
    const cls = norm(attr(n, 'class'))
    const id = attr(n, 'id') || ''
    out.push(`<${n.tagName}${cls ? ' .' + cls : ''}${id ? ' #' + id : ''}>`)
    ;(n.childNodes || []).forEach(walk)
  }
  walk(root)
  return out
}

const body = html => {
  const doc = parse(html)
  return find(doc, n => n.tagName === 'main' && hasClass(n, 'main')) ||
    find(doc, n => n.tagName === 'body')
}

let bad = 0
for (const page of process.argv.slice(2)) {
  const route = page === 'index.html' ? '' : page.slice(0, -5) + '/'
  const a = sig(body(render(`http://localhost:8898/${page}`, '/tmp/rendered-pug.html')))
  const b = sig(body(render(`http://localhost:8899/${route}`, '/tmp/rendered-react.html')))
  if (a.join('\n') === b.join('\n')) {
    console.log('  ok', page, `(${a.length} nodes)`)
    continue
  }
  bad++
  console.log('DIFF', page, `pug ${a.length}, react ${b.length}`)
  for (let i = 0, shown = 0; i < Math.max(a.length, b.length) && shown < 5; i++) {
    if (a[i] !== b[i]) { console.log(`   @${i}\n     pug:   ${a[i]}\n     react: ${b[i]}`); shown++ }
  }
}
process.exit(bad ? 1 : 0)
