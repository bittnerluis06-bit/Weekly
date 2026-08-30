import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Markdown } from './markdown'
import { parseBlocks } from './markdownParser'

describe('parseBlocks', () => {
  it('erkennt Überschriften, Absätze und Listen', () => {
    const blocks = parseBlocks('# Titel\n\nEin Absatz.\n\n- eins\n- zwei\n\n1. a\n2. b')
    expect(blocks.map((b) => b.type)).toEqual(['heading', 'paragraph', 'ul', 'ol'])
  })

  it('fasst aufeinanderfolgende Zeilen zu einem Absatz zusammen', () => {
    const blocks = parseBlocks('Zeile eins\nZeile zwei')
    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toMatchObject({ type: 'paragraph', text: 'Zeile eins Zeile zwei' })
  })

  it('erkennt Zitate', () => {
    expect(parseBlocks('> Zitat')[0]).toMatchObject({ type: 'quote', text: 'Zitat' })
  })
})

describe('Markdown', () => {
  it('rendert fett, kursiv und Code', () => {
    render(<Markdown source={'**fett** *kursiv* `code`'} />)
    expect(screen.getByText('fett').tagName).toBe('STRONG')
    expect(screen.getByText('kursiv').tagName).toBe('EM')
    expect(screen.getByText('code').tagName).toBe('CODE')
  })

  it('rendert http-Links als Link', () => {
    render(<Markdown source={'[Covey](https://example.com/covey)'} />)
    expect(screen.getByRole('link', { name: 'Covey' })).toHaveAttribute(
      'href',
      'https://example.com/covey',
    )
  })

  it('führt kein HTML aus dem Text aus', () => {
    const { container } = render(<Markdown source={'<img src=x onerror=alert(1)>'} />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>')
  })

  it('lässt javascript:-Links nicht als Link durch', () => {
    render(<Markdown source={'[klick](javascript:alert(1))'} />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('klick')).toBeInTheDocument()
  })

  it('zeigt bei leerem Text einen Hinweis', () => {
    render(<Markdown source="" />)
    expect(screen.getByText('Noch kein Text.')).toBeInTheDocument()
  })
})
