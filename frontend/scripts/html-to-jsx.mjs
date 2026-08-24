// HTML -> JSX emitter. Walks a parse5 AST and prints TSX.
// ponytail: hand-rolled instead of a converter dep — the attribute rules below are the
// whole job, and every library that does this also drags in its own HTML parser.

const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
  'meta', 'param', 'source', 'track', 'wbr',
])

// Attributes React spells differently from HTML and that camelCasing alone won't fix.
const ATTR_MAP = {
  class: 'className',
  for: 'htmlFor',
  charset: 'charSet',
  autocomplete: 'autoComplete',
  autofocus: 'autoFocus',
  autoplay: 'autoPlay',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  contenteditable: 'contentEditable',
  crossorigin: 'crossOrigin',
  datetime: 'dateTime',
  enctype: 'encType',
  formaction: 'formAction',
  frameborder: 'frameBorder',
  maxlength: 'maxLength',
  minlength: 'minLength',
  novalidate: 'noValidate',
  readonly: 'readOnly',
  spellcheck: 'spellCheck',
  srcset: 'srcSet',
  tabindex: 'tabIndex',
  usemap: 'useMap',
  allowfullscreen: 'allowFullScreen',
  cellpadding: 'cellPadding',
  cellspacing: 'cellSpacing',
  'accept-charset': 'acceptCharset',
  'http-equiv': 'httpEquiv',
  'xlink:href': 'xlinkHref',
  'xmlns:xlink': 'xmlnsXlink',
  playsinline: 'playsInline',
  srcdoc: 'srcDoc',
  nomodule: 'noModule',
  referrerpolicy: 'referrerPolicy',
  formnovalidate: 'formNoValidate',
  inputmode: 'inputMode',
  accesskey: 'accessKey',
  hreflang: 'hrefLang',
  marginwidth: 'marginWidth',
  marginheight: 'marginHeight',
}

// Attributes that are boolean in HTML: value="" means true, not false.
const BOOLEAN = new Set([
  'allowfullscreen', 'async', 'autofocus', 'autoplay', 'checked', 'controls',
  'default', 'defer', 'disabled', 'hidden', 'loop', 'multiple', 'muted',
  'novalidate', 'open', 'readonly', 'required', 'reversed', 'selected',
  'playsinline', 'itemscope', 'inert', 'nomodule', 'formnovalidate',
])

// ARIA attributes React types as numbers rather than strings.
const NUMERIC_ARIA = new Set([
  'aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-level', 'aria-posinset',
  'aria-setsize', 'aria-colcount', 'aria-colindex', 'aria-colspan', 'aria-rowcount',
  'aria-rowindex', 'aria-rowspan',
])

// Attributes React types as numbers rather than strings.
const NUMERIC_ATTRS = new Set([
  'tabindex', 'maxlength', 'minlength', 'rows', 'cols', 'size', 'span',
  'colspan', 'rowspan', 'start',
])

const camel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())

function jsxAttrName(name) {
  if (ATTR_MAP[name]) return ATTR_MAP[name]
  if (name.startsWith('data-') || name.startsWith('aria-')) return name
  // SVG presentation attributes (stroke-width, clip-rule, ...) and anything else
  // hyphenated that React expects camelCased.
  return name.includes('-') ? camel(name) : name
}

function styleToObject(value) {
  const props = []
  for (const decl of value.split(';')) {
    const i = decl.indexOf(':')
    if (i < 0) continue
    const rawKey = decl.slice(0, i).trim()
    const val = decl.slice(i + 1).trim()
    if (!rawKey || !val) continue
    // CSS custom properties must keep their literal name; React passes them through.
    const key = rawKey.startsWith('--') ? `'${rawKey}'` : camel(rawKey)
    props.push(`${key}: ${JSON.stringify(val)}`)
  }
  if (!props.length) return null
  const obj = `{ ${props.join(', ')} }`
  // CSS custom properties are valid at runtime but not in React's CSSProperties type.
  return value.includes('--') ? `${obj} as React.CSSProperties` : obj
}

function attrValue(value) {
  return value.includes('"') || value.includes('\n')
    ? `{${JSON.stringify(value)}}`
    : `"${value}"`
}

const TEXT_ENTITIES = { '{': '&#123;', '}': '&#125;', '<': '&lt;', '>': '&gt;' }

export function escapeText(text) {
  // `{}` open a JSX expression and `<>` open a tag — parse5 has already decoded the
  // entities that protected them in the HTML, so they have to be re-escaped here.
  // Entities rather than `{'>'}` so the character stays inside its own text node.
  return text.replace(/[{}<>]/g, m => TEXT_ENTITIES[m])
}

/**
 * @param {object} node parse5 element
 * @param {object} opts
 *   rewriteAttr(name, value, node) -> string | {expr} | null (null drops the attribute)
 *   replace(node, ctx) -> string | null   emit this instead of the subtree
 *   onScript(node) -> void                called for every <script>; they are never emitted
 */
export function toJsx(node, opts = {}, indent = 0) {
  const pad = '  '.repeat(indent)

  if (node.nodeName === '#text') {
    const text = node.value
    if (!text.trim()) return text.includes('\n') ? '' : null
    return pad + escapeText(text.trim())
  }

  if (node.nodeName === '#comment') {
    const body = node.data.replace(/\*\//g, '*​/').trim()
    if (!body) return ''
    return `${pad}{/* ${body} */}`
  }

  if (node.nodeName === 'script') {
    opts.onScript?.(node)
    return ''
  }

  const tag = node.tagName
  if (!tag) return ''

  const replaced = opts.replace?.(node, { indent, pad })
  if (replaced !== undefined && replaced !== null) return replaced

  const parts = []
  const isInput = tag === 'input' || tag === 'textarea' || tag === 'select'
  for (const attr of node.attrs || []) {
    const htmlName = attr.name
    let name = attr.name
    let value = attr.value

    // Uncontrolled inputs: React warns on `value`/`checked` without an onChange.
    if (isInput && name === 'value') name = 'defaultValue'
    if (isInput && name === 'checked') name = 'defaultChecked'
    if (tag === 'option' && name === 'selected') continue

    const rewritten = opts.rewriteAttr?.(name, value, node)
    if (rewritten === null) continue
    if (rewritten && typeof rewritten === 'object') {
      parts.push(`${jsxAttrName(name)}={${rewritten.expr}}`)
      continue
    }
    if (typeof rewritten === 'string') value = rewritten

    if (name === 'style') {
      const obj = styleToObject(value)
      if (obj) parts.push(`style={${obj}}`)
      continue
    }
    // Inline handlers: onclick="location.reload()" -> onClick={() => { ... }}
    if (/^on[a-z]+$/.test(name)) {
      const event = 'on' + name[2].toUpperCase() + name.slice(3)
      parts.push(`${event}={() => { ${value} }}`)
      continue
    }

    const jsxName = jsxAttrName(name)
    // HTML boolean attributes are written either bare (value "") or repeating their
    // own name (checked="checked"); both mean true, and "" is falsy in JSX.
    if (
      BOOLEAN.has(htmlName.toLowerCase()) &&
      (value === '' || value.toLowerCase() === htmlName.toLowerCase())
    ) {
      parts.push(`${jsxName}={true}`)
      continue
    }
    const numeric = NUMERIC_ARIA.has(htmlName) || NUMERIC_ATTRS.has(htmlName.toLowerCase())
    if (numeric && /^-?\d+(\.\d+)?$/.test(value)) {
      parts.push(`${jsxName}={${value}}`)
      continue
    }
    // aria-expanded / aria-hidden / ... are Booleanish in React's types.
    if (htmlName.startsWith('aria-') && (value === 'true' || value === 'false')) {
      parts.push(`${jsxName}={${value}}`)
      continue
    }
    parts.push(`${jsxName}=${attrValue(value)}`)
  }

  const attrStr = parts.length ? ' ' + parts.join(' ') : ''

  if (VOID.has(tag)) return `${pad}<${tag}${attrStr} />`

  // <textarea>text</textarea> is invalid in JSX; React wants defaultValue.
  if (tag === 'textarea') {
    const inner = (node.childNodes || []).map(c => c.value || '').join('')
    const extra = inner ? ` defaultValue=${attrValue(inner)}` : ''
    return `${pad}<textarea${attrStr}${extra} />`
  }

  const children = (node.childNodes || [])
    .map(c => toJsx(c, opts, indent + 1))
    .filter(c => c !== null && c !== '')

  if (!children.length) return `${pad}<${tag}${attrStr}></${tag}>`
  return `${pad}<${tag}${attrStr}>\n${children.join('\n')}\n${pad}</${tag}>`
}

export function findAll(node, predicate, out = []) {
  if (predicate(node)) out.push(node)
  for (const child of node.childNodes || []) findAll(child, predicate, out)
  return out
}

export function find(node, predicate) {
  return findAll(node, predicate)[0] || null
}

export function attr(node, name) {
  return (node.attrs || []).find(a => a.name === name)?.value
}

export function hasClass(node, cls) {
  return (attr(node, 'class') || '').split(/\s+/).includes(cls)
}
