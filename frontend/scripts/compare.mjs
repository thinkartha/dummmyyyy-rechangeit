// Diffs the exported Next HTML against the pug-compiled HTML, tag by tag.
// Whitespace and attribute order differ by construction; nothing else should.
import { readFileSync, existsSync } from 'node:fs'
import { parse } from 'parse5'
import { find, findAll, attr, hasClass } from './html-to-jsx.mjs'

const norm = v => (v || '').split(/\s+/).filter(Boolean).sort().join(' ')

function signature(root) {
  const out = []
  const walk = n => {
    if (n.nodeName === '#text') {
      const t = n.value.replace(/\s+/g, ' ').trim()
      if (t) out.push('#text:' + t)
      return
    }
    if (!n.tagName || n.tagName === 'script') return
    const cls = norm(attr(n, 'class'))
    const id = attr(n, 'id') || ''
    const href = (attr(n, 'href') || attr(n, 'src') || '').replace(/^(\.\.\/)+/, '').replace(/^\//, '').replace(/^index\.html$/, '').replace(/\.html$/, '/').replace(/^/, '/')
    out.push(`<${n.tagName}${cls ? ' .' + cls : ''}${id ? ' #' + id : ''}${href ? ' @' + href : ''}>`)
    ;(n.childNodes || []).forEach(walk)
  }
  walk(root)
  return out
}

const pages = process.argv.slice(2)
let bad = 0
for (const page of pages) {
  const orig = `../public/${page}`
  const route = page === 'index.html' ? 'index.html' : `${page.slice(0, -5)}/index.html`
  const ported = `out/${route}`
  if (!existsSync(orig) || !existsSync(ported)) { console.log('SKIP', page); continue }

  const a = signature(find(parse(readFileSync(orig, 'utf8')), n => n.tagName === 'main' && hasClass(n, 'main')))
  const b = signature(find(parse(readFileSync(ported, 'utf8')), n => n.tagName === 'main' && hasClass(n, 'main')))

  if (a.join('\n') === b.join('\n')) { console.log('  ok', page, `(${a.length} nodes)`); continue }
  bad++
  console.log('DIFF', page, `orig ${a.length} nodes, ported ${b.length}`)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      console.log(`   @${i}\n     pug:   ${a[i]}\n     react: ${b[i]}`)
      break
    }
  }
}
process.exit(bad ? 1 : 0)
