/**
 * Block-Parser für den Mission-Text.
 * Vom Renderer getrennt, damit er ohne React testbar bleibt.
 *
 * Unterstützt: Überschriften (#–###), Absätze, Aufzählungen (- / *),
 * nummerierte Listen, Zitate (>).
 */

export type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }

export function parseBlocks(source: string): Block[] {
  const blocks: Block[] = []
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  let paragraph: string[] = []

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: 'paragraph', text: paragraph.join(' ') })
      paragraph = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const trimmed = (lines[i] ?? '').trim()

    if (trimmed === '') {
      flushParagraph()
      continue
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(trimmed)
    if (heading) {
      flushParagraph()
      blocks.push({
        type: 'heading',
        level: (heading[1]?.length ?? 1) as 1 | 2 | 3,
        text: heading[2] ?? '',
      })
      continue
    }

    if (/^>\s?/.test(trimmed)) {
      flushParagraph()
      blocks.push({ type: 'quote', text: trimmed.replace(/^>\s?/, '') })
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph()
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test((lines[i] ?? '').trim())) {
        items.push((lines[i] ?? '').trim().replace(/^[-*]\s+/, ''))
        i++
      }
      i--
      blocks.push({ type: 'ul', items })
      continue
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph()
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test((lines[i] ?? '').trim())) {
        items.push((lines[i] ?? '').trim().replace(/^\d+\.\s+/, ''))
        i++
      }
      i--
      blocks.push({ type: 'ol', items })
      continue
    }

    paragraph.push(trimmed)
  }

  flushParagraph()
  return blocks
}
