import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MarkdownRenderer } from '../markdownParser'

describe('MarkdownRenderer component', () => {
  it('renders empty placeholder for empty content', () => {
    const html = renderToStaticMarkup(<MarkdownRenderer content="" />)
    expect(html).toContain('Nothing to preview')
  })

  it('renders headings of different levels', () => {
    const markdown = '# Main Heading\n## Sub Heading\n### Section Heading'
    const html = renderToStaticMarkup(<MarkdownRenderer content={markdown} />)

    expect(html).toContain('<h1')
    expect(html).toContain('Main Heading</h1>')
    expect(html).toContain('<h2')
    expect(html).toContain('Sub Heading</h2>')
    expect(html).toContain('<h3')
    expect(html).toContain('Section Heading</h3>')
  })

  it('renders inline formatting: bold, italic, strikethrough, code, and links', () => {
    const markdown =
      'This is **bold** and *italic* and ~~strikethrough~~ and `inline code` with [a link](https://example.com).'
    const html = renderToStaticMarkup(<MarkdownRenderer content={markdown} />)

    expect(html).toContain('<strong')
    expect(html).toContain('bold</strong>')
    expect(html).toContain('<em')
    expect(html).toContain('italic</em>')
    expect(html).toContain('<del')
    expect(html).toContain('strikethrough</del>')
    expect(html).toContain('<code')
    expect(html).toContain('inline code</code>')
    expect(html).toContain('<a href="https://example.com"')
    expect(html).toContain('a link</a>')
  })

  it('renders lists and checkboxes', () => {
    const markdown = '- [x] Completed task\n- [ ] Pending task\n- Simple list item'
    const html = renderToStaticMarkup(<MarkdownRenderer content={markdown} />)

    expect(html).toContain('type="checkbox"')
    expect(html).toContain('checked=""')
    expect(html).toContain('Completed task')
    expect(html).toContain('Pending task')
  })

  it('renders blockquotes and tables', () => {
    const markdown = `> This is a quote

| Name | Role |
| --- | --- |
| Alice | Admin |
| Bob | Member |`

    const html = renderToStaticMarkup(<MarkdownRenderer content={markdown} />)

    expect(html).toContain('<blockquote')
    expect(html).toContain('This is a quote')
    expect(html).toContain('<table')
    expect(html).toContain('<th')
    expect(html).toContain('Name</th>')
    expect(html).toContain('Role</th>')
    expect(html).toContain('Alice</td>')
    expect(html).toContain('Admin</td>')
  })

  it('renders fenced code blocks', () => {
    const markdown = '```typescript\nconst greeting = "hello"\n```'
    const html = renderToStaticMarkup(<MarkdownRenderer content={markdown} />)

    expect(html).toContain('typescript')
    expect(html).toContain('const greeting = &quot;hello&quot;')
  })
})
