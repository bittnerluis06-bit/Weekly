import type { ReactNode } from 'react'
import { parseBlocks } from './markdownParser'

/**
 * Minimaler Markdown-Renderer für den Mission-Text.
 * Bewusst ohne Abhängigkeit und ohne `dangerouslySetInnerHTML` — es entstehen
 * ausschließlich React-Elemente, damit kein HTML aus dem Text ausgeführt wird.
 *
 * Inline: **fett**, *kursiv*, `Code`, [Links](url).
 * Blöcke: siehe `markdownParser.ts`.
 */

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(INLINE).filter(Boolean).map((part, i) => {
    const key = `${keyPrefix}-${i}`

    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={key}>{part.slice(1, -1)}</em>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={key} className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">
          {part.slice(1, -1)}
        </code>
      )
    }

    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part)
    if (link) {
      const [, label, href] = link
      // Nur http(s) zulassen — kein javascript: o. Ä.
      const safe = href && /^https?:\/\//i.test(href) ? href : undefined
      return safe ? (
        <a
          key={key}
          href={safe}
          target="_blank"
          rel="noreferrer noopener"
          className="text-accent-600 underline dark:text-accent-500"
        >
          {label}
        </a>
      ) : (
        <span key={key}>{label}</span>
      )
    }

    return <span key={key}>{part}</span>
  })
}

export function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source)

  if (blocks.length === 0) {
    return <p className="text-neutral-500 dark:text-neutral-400">Noch kein Text.</p>
  }

  return (
    <div className="space-y-3 leading-relaxed">
      {blocks.map((block, i) => {
        const key = `b${i}`
        switch (block.type) {
          case 'heading': {
            const size =
              block.level === 1
                ? 'text-xl font-semibold'
                : block.level === 2
                  ? 'text-lg font-semibold'
                  : 'font-semibold'
            const Tag = (['h2', 'h3', 'h4'] as const)[block.level - 1] ?? 'h4'
            return (
              <Tag key={key} className={size}>
                {renderInline(block.text, key)}
              </Tag>
            )
          }
          case 'quote':
            return (
              <blockquote
                key={key}
                className="border-l-2 border-accent-600 pl-3 text-neutral-600 italic dark:text-neutral-400"
              >
                {renderInline(block.text, key)}
              </blockquote>
            )
          case 'ul':
            return (
              <ul key={key} className="list-disc space-y-1 pl-5">
                {block.items.map((item, j) => (
                  <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={key} className="list-decimal space-y-1 pl-5">
                {block.items.map((item, j) => (
                  <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>
                ))}
              </ol>
            )
          default:
            return <p key={key}>{renderInline(block.text, key)}</p>
        }
      })}
    </div>
  )
}
