// Ports the gulp/pug-compiled HTML in ../public into Next.js App Router pages.
// Run: node scripts/port-html.mjs
//
// The compiled HTML is the source of truth, not the .pug — it is what the browser
// actually renders today, so a 1:1 transcription of it is what keeps the formatting
// identical. The .pug mixins never have to be interpreted.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'parse5'
import { toJsx, find, findAll, attr, hasClass } from './html-to-jsx.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolve(ROOT, '../public')

// The 50 pages this app actually links to. The other ~550 compiled files are
// untouched Phoenix template demos and are deliberately left behind.
const PAGES = [
  'index.html',
  'dashboard/observability.html',
  'pages/authentication/sign-in.html',
  'pages/authentication/sign-up.html',
  'pages/authentication/forgot-password.html',
  'pages/authentication/reset-password.html',
  'pages/authentication/confirm.html',
  ...[
    'ai-cost-usage', 'ai-gateway', 'ai-models', 'ai-monitoring', 'alert-management',
    'alerts', 'api-gateway', 'api-monitoring', 'automation', 'cloud-cost',
    'cloud-monitoring', 'data-observability', 'database-monitoring', 'drift',
    'escalation', 'etl-monitoring', 'incident-correlation', 'logs',
    'orchestration-monitoring', 'service-topology', 'slo', 'traces',
  ].map(p => `apps/observability/${p}.html`),
  ...['admin', 'command-center', 'databricks', 'health-connectivity', 'integrations']
    .map(p => `apps/platform/${p}.html`),
  // Each integration that needs credentials or an install has its own page under
  // Integrations; the monitoring pages link here rather than carrying the form.
  ...['api-gateway', 'cloud', 'etl', 'databases', 'ai-tools']
    .map(p => `apps/platform/integrations/${p}.html`),
  ...['authentication', 'members', 'multi-tenant', 'onboarding', 'organizations']
    .map(p => `apps/organization/${p}.html`),
  'apps/chat.html',
  // Email and Events are commented out of the nav (src/pug/mixins/Variables.pug), so
  // they are not ported either — a route nothing links to is dead weight in the export.
  // 'apps/email/compose.html',
  // 'apps/email/email-detail.html',
  // 'apps/email/inbox.html',
  // 'apps/events/create-an-event.html',
  // 'apps/events/event-detail.html',
  'apps/social/settings.html',
  // Hidden with their nav entries (src/pug/mixins/Variables.pug): theme pages with no
  // backend behind them. Uncomment here and there together.
  // 'pages/faq/faq-accordion.html',
  // 'pages/faq/faq-tab.html',
  // 'pages/notifications.html',
  // 'pages/timeline.html',
]

// Loaded in the root layout for every page; a page must not re-emit them.
const HEAD_SCRIPTS = new Set(['vendors/simplebar/simplebar.min.js', 'assets/js/config.js'])

/* -------------------------------------------------------------------------- */
/*                              path rewriting                                */
/* -------------------------------------------------------------------------- */

const isExternal = v => /^(https?:|data:|mailto:|tel:|#|\/\/)/.test(v)

/** `../../assets/img/x.png` -> `/assets/img/x.png`, `foo/bar.html` -> `/foo/bar/`. */
function rewritePath(value) {
  if (!value || isExternal(value)) return value
  let v = value.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '')
  if (v.startsWith('/')) v = v.slice(1)

  const [path, hash] = v.split('#')
  if (!path.endsWith('.html')) return '/' + v

  const route = path === 'index.html' ? '/' : '/' + path.slice(0, -'.html'.length) + '/'
  return hash ? `${route}#${hash}` : route
}

const PATH_ATTRS = new Set(['src', 'href', 'action', 'poster', 'data-options'])

function rewriteAttr(name, value, node) {
  if (name === 'href' && node.tagName === 'a' && (value === '#!' || value.startsWith('#'))) {
    return value
  }
  if (name === 'srcset') {
    return value.split(',').map(p => {
      const [url, ...rest] = p.trim().split(/\s+/)
      return [rewritePath(url), ...rest].join(' ')
    }).join(', ')
  }
  if (!PATH_ATTRS.has(name)) return undefined
  if (name === 'data-options') return undefined
  return rewritePath(value)
}

/** Same rewrite, applied to paths that appear inside inline script/JS source. */
function rewriteInline(code) {
  return code
    .replace(/(["'`])((?:\.\.\/)+)(assets|vendors)\//g, (_, q, __, dir) => `${q}/${dir}/`)
    .replace(/(["'`])(assets|vendors)\//g, (_, q, dir) => `${q}/${dir}/`)
    .replace(/(["'`])((?:\.\.\/)*)([\w./-]+)\.html\1/g, (m, q, _up, path) =>
      `${q}${rewritePath(path + '.html')}${q}`)
}

/* -------------------------------------------------------------------------- */
/*                                  scripts                                    */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                                  layout                                     */
/* -------------------------------------------------------------------------- */

const navGroups = {}

/**
 * The sidebar is byte-identical across every dashboard page except for the
 * `active` / `show` / `aria-expanded` markers, which the pug build hardcoded per
 * page. In React they come from the current pathname instead.
 */
function layoutReplace(node) {
  if (node.tagName !== 'a' && node.tagName !== 'ul') return undefined
  const cls = attr(node, 'class') || ''

  if (node.tagName === 'ul' && cls.includes('collapse') && cls.includes('parent')) {
    const id = attr(node, 'id')
    if (!id) return undefined
    navGroups[id] = findAll(node, n => n.tagName === 'a')
      .map(a => rewritePath(attr(a, 'href') || ''))
      .filter(h => h.startsWith('/'))
  }
  return undefined
}

function layoutRewriteAttr(name, value, node) {
  const base = rewriteAttr(name, value, node)
  const cls = attr(node, 'class') || ''

  // A few pages tweak the content wrapper (the email views drop its top padding).
  if (name === 'class' && node.tagName === 'div' && cls.split(/\s+/).includes('content')) {
    return { expr: 'contentClass' }
  }

  if (name === 'class' && node.tagName === 'a' && cls.includes('nav-link')) {
    const href = rewritePath(attr(node, 'href') || '')
    const group = attr(node, 'aria-controls')
    const stripped = cls.replace(/\bactive\b/g, '').replace(/\s+/g, ' ').trim()
    if (group) return { expr: `'${stripped}'` }
    if (href.startsWith('/')) {
      return { expr: `'${stripped}' + (path === '${href}' ? ' active' : '')` }
    }
    return { expr: `'${stripped}'` }
  }

  if (name === 'class' && node.tagName === 'ul' && cls.includes('collapse') && cls.includes('parent')) {
    const id = attr(node, 'id')
    const stripped = cls.replace(/\bshow\b/g, '').replace(/\s+/g, ' ').trim()
    if (id) return { expr: `'${stripped}' + (open('${id}') ? ' show' : '')` }
  }

  if (name === 'aria-expanded') {
    const group = attr(node, 'aria-controls')
    if (group && group.startsWith('nv-')) return { expr: `open('${group}')` }
  }

  return base
}

function buildLayout(html) {
  const doc = parse(html)
  const main = find(doc, n => n.tagName === 'main' && hasClass(n, 'main'))
  const body = find(doc, n => n.tagName === 'body')
  const content = find(main, n => n.tagName === 'div' && hasClass(n, 'content'))

  // Everything in <body> is layout chrome except the page's own content, which
  // becomes {children}. The footer lives inside .content and stays with the layout.
  const CHILDREN = '__LHB_CHILDREN__'
  const originalChildren = content.childNodes
  content.childNodes = [
    { nodeName: '#text', value: CHILDREN, parentNode: content },
    ...originalChildren.filter(c => c.tagName === 'footer'),
  ]

  findAll(body, layoutReplace)
  const jsx = toJsx(body, { rewriteAttr: layoutRewriteAttr, replace: layoutReplace }, 3)
    .replace(/^\s*<body>\n/, '')
    .replace(/\n\s*<\/body>\s*$/, '')
    .replace(new RegExp(`^\\s*${CHILDREN}$`, 'm'), '        {children}')

  content.childNodes = originalChildren

  return `'use client'

import { usePathname } from 'next/navigation'
import Scripts from './scripts'

// Which sidebar group each route belongs to. The pug build baked the open/active
// state into every page; here it is derived from the URL once.
const NAV_GROUPS: Record<string, string[]> = ${JSON.stringify(navGroups, null, 2)}

export default function AppLayout({
  children,
  scripts = [],
  contentClass = 'content',
}: {
  children: React.ReactNode
  scripts?: Array<{ src?: string; code?: string; module?: boolean }>
  contentClass?: string
}) {
  const path = usePathname()
  const open = (group: string) => (NAV_GROUPS[group] || []).includes(path)

  return (
    <>
${jsx}
      <Scripts items={scripts} />
    </>
  )
}
`
}

/* -------------------------------------------------------------------------- */
/*                                   pages                                     */
/* -------------------------------------------------------------------------- */

// An inline onclick= became a real handler, which a server component cannot hand to
// the client AppLayout. Only those pages pay for 'use client'.
const useClient = jsx => (jsx.includes('={() => {') ? "'use client'\n\n" : '')

function routeDir(page) {
  if (page === 'index.html') return 'app'
  return join('app', page.slice(0, -'.html'.length))
}

function buildPage(page, html) {
  const doc = parse(html)
  const main = find(doc, n => n.tagName === 'main' && hasClass(n, 'main'))
  const content = main && find(main, n => n.tagName === 'div' && hasClass(n, 'content'))

  const items = []
  for (const s of findAll(find(doc, n => n.tagName === 'body'), n => n.tagName === 'script')) {
    const src = attr(s, 'src')
    if (src) {
      const bare = src.replace(/^(\.\.\/)+/, '')
      if (!HEAD_SCRIPTS.has(bare)) items.push({ src: rewritePath(src) })
      continue
    }
    const code = (s.childNodes || []).map(c => c.value || '').join('')
    if (code.trim()) {
      const entry = { code: rewriteInline(code) }
      if (attr(s, 'type') === 'module') entry.module = true
      items.push(entry)
    }
  }

  const opts = { rewriteAttr }
  const scriptsJson = JSON.stringify(items, null, 2)
    .split('\n').map((l, i) => (i === 0 ? l : '      ' + l)).join('\n')

  if (content) {
    const contentClass = attr(content, 'class') || 'content'
    const contentProp = contentClass === 'content' ? '' : ` contentClass="${contentClass}"`
    const inner = content.childNodes.filter(c => c.tagName !== 'footer')
    const jsx = inner.map(c => toJsx(c, opts, 3)).filter(Boolean).join('\n')
    return `${useClient(jsx)}import AppLayout from '@/components/app-layout'

export default function Page() {
  return (
    <AppLayout scripts={${scriptsJson}}${contentProp}>
${jsx}
    </AppLayout>
  )
}
`
  }

  // Landing page and the auth pages carry no dashboard chrome — their whole
  // <body> is the page.
  const body = find(doc, n => n.tagName === 'body')
  const jsx = body.childNodes.map(c => toJsx(c, opts, 3)).filter(Boolean).join('\n')
  return `${useClient(jsx)}import Scripts from '@/components/scripts'

export default function Page() {
  return (
    <>
${jsx}
      <Scripts items={${scriptsJson}} />
    </>
  )
}
`
}

/* -------------------------------------------------------------------------- */
/*                          legacy .html redirects                             */
/* -------------------------------------------------------------------------- */

/**
 * A stub at every page's old `.html` path.
 *
 * ponytail: `assets/js/integration/auth.js` redirects to hardcoded targets like
 * `pages/authentication/sign-in.html` and `apps/platform/command-center.html`, and it
 * is shared with the still-live gulp build — so answering at the old URL is cheaper
 * than forking that file. Old bookmarks and emailed links keep working too.
 *
 * These live in `public/` rather than being generated after the build so that `next
 * dev` serves them as well; a successful sign-in redirects to one of them.
 *
 * A stub, not a copy of the page: Next's client router normalises the URL it is served
 * from, and a real page served at `/x.html` bounces between that and `/x/` forever.
 */
function writeRedirectStub(page) {
  const route = rewritePath(page)
  if (route === '/') return
  const out = join(ROOT, 'public', page)
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, `<!DOCTYPE html>
<meta charset="utf-8">
<title>Redirecting…</title>
<script>location.replace(${JSON.stringify(route)} + location.search + location.hash)</script>
<meta http-equiv="refresh" content="0;url=${route}">
`)
}

/* -------------------------------------------------------------------------- */

const layoutSource = readFileSync(join(SRC, 'dashboard/observability.html'), 'utf8')
mkdirSync(join(ROOT, 'components'), { recursive: true })
writeFileSync(join(ROOT, 'components/app-layout.tsx'), buildLayout(layoutSource))
console.log('components/app-layout.tsx')

for (const page of PAGES) {
  const file = join(SRC, page)
  if (!existsSync(file)) {
    console.warn('  skip (missing):', page)
    continue
  }
  const out = join(ROOT, routeDir(page), 'page.tsx')
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, buildPage(page, readFileSync(file, 'utf8')))
  writeRedirectStub(page)
  console.log(out.replace(ROOT + '/', ''))
}
