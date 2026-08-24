// After `next build`, publish a redirect stub at every route's old `.html` path.
//
// ponytail: the integration scripts in ../public/assets/js send people to hardcoded
// `pages/authentication/sign-in.html`, and they are shared with the still-live gulp
// build, so forking them is worse than answering at the old URL. Old bookmarks and
// emailed links keep working as a side effect.
//
// A stub, not a copy of the page: Next's client router normalises the URL it is served
// from, and a real page served at `/x.html` bounces between that and `/x/` forever.
import { readdirSync, writeFileSync, statSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../out')

const stub = route => `<!DOCTYPE html>
<meta charset="utf-8">
<title>Redirecting…</title>
<script>location.replace(${JSON.stringify(route)} + location.search + location.hash)</script>
<meta http-equiv="refresh" content="0;url=${route}">
`

let count = 0
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      walk(path)
      continue
    }
    if (entry !== 'index.html' || dir === OUT) continue
    const route = dir.slice(OUT.length) + '/'
    writeFileSync(dir + '.html', stub(route))
    count++
  }
}

walk(OUT)
console.log(`wrote ${count} legacy .html redirects`)
