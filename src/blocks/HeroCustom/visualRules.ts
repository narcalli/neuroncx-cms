/**
 * What a Hero (custom CSS) visual may contain. The website draws the visual
 * in a sealed box of its own (a shadow root), so its CSS cannot reach the
 * rest of the page and nothing in it can sit above the header. These checks
 * refuse the few things that would still be unsafe or break the page: code
 * that runs, markup that could break out of the box, and loading things from
 * other sites. Each returns the problems found, or an empty list.
 */

const HTML_RULES: [RegExp, string][] = [
  [/<script\b/i, 'Scripts (<script>) are not allowed. Use CSS animations instead.'],
  [/<(iframe|object|embed|frame|frameset|applet)\b/i, 'Embedded frames and plug-ins (iframe, object, embed) are not allowed.'],
  [/<(link|meta|base)\b/i, '<link>, <meta> and <base> tags are not allowed. Put styles in the CSS box.'],
  [/<\/?(template|style)\b/i, 'Put all styles in the CSS box: <style> and <template> tags are not allowed in the HTML.'],
  [/<form\b/i, 'Forms are not allowed in a visual.'],
  [/\son[a-z]+\s*=/i, 'Event attributes such as onclick or onload are not allowed: they run code.'],
  [/javascript\s*:/i, 'javascript: links are not allowed.'],
  [/\ssrcdoc\s*=/i, 'srcdoc attributes are not allowed.'],
]

const CSS_RULES: [RegExp, string][] = [
  [/@import\b/i, '@import is not allowed: everything must be in this box.'],
  [/<\/?\s*(style|template|script)/i, 'The CSS box takes CSS only, with no HTML tags.'],
  [/expression\s*\(|javascript\s*:|-moz-binding|behavior\s*:/i, 'Scripting in CSS (expression, javascript:, -moz-binding, behavior) is not allowed.'],
]

/** Hosts a visual may load files from: the CMS itself, and the media bucket. */
const ownHost = (u: string): boolean => {
  let host: string
  try {
    host = new URL(u.startsWith('//') ? `https:${u}` : u).host
  } catch {
    return false
  }
  const cms = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_SERVER_URL || '').host
    } catch {
      return ''
    }
  })()
  return host === cms || host.endsWith('.amazonaws.com')
}

/** url(...) pointing at another site. Data URLs and the site's own paths are fine. */
const externalUrls = (css: string): string[] =>
  [...css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi)]
    .map((m) => m[2].trim())
    .filter((u) => /^(https?:)?\/\//i.test(u) && !ownHost(u))

export const htmlProblems = (html: unknown): string[] =>
  typeof html === 'string' ? HTML_RULES.filter(([re]) => re.test(html)).map(([, message]) => message) : []

export const cssProblems = (css: unknown): string[] => {
  if (typeof css !== 'string') return []
  const problems = CSS_RULES.filter(([re]) => re.test(css)).map(([, message]) => message)
  if (externalUrls(css).length) {
    problems.push('Images and fonts must come from the CMS media library, not another site: upload the file and use its address.')
  }
  return problems
}
