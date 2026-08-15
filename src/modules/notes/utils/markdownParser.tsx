import React, { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MarkdownRendererProps {
  content: string
  className?: string
  onToggleCheckbox?: (lineIndex: number) => void
}

export interface MarkdownHeading {
  level: number
  text: string
  id: string
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function extractHeadings(content: string): MarkdownHeading[] {
  if (!content) return []
  const lines = content.split(/\r?\n/)
  const headings: MarkdownHeading[] = []

  for (const line of lines) {
    const match = line.match(/^(#{1,6})(?:\s+(.+))?$/)
    if (match && match[2] && match[2].trim()) {
      const text = match[2].trim()
      headings.push({
        level: match[1].length,
        text,
        id: `heading-${slugify(text)}`
      })
    }
  }

  return headings
}

function parseInline(text: string): React.ReactNode[] {
  if (!text) return []
  const elements: React.ReactNode[] = []
  let remaining = text
  let keyIndex = 0

  while (remaining.length > 0) {
    const prevLength = remaining.length

    // Check for inline code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/)
    if (codeMatch) {
      elements.push(
        <code
          key={`code-${keyIndex++}`}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground"
        >
          {codeMatch[1]}
        </code>
      )
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }

    // Check for link: [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/)
    if (linkMatch) {
      elements.push(
        <a
          key={`link-${keyIndex++}`}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
        >
          {parseInline(linkMatch[1])}
        </a>
      )
      remaining = remaining.slice(linkMatch[0].length)
      continue
    }

    // Check for bold: **text**
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/)
    if (boldMatch) {
      elements.push(
        <strong key={`bold-${keyIndex++}`} className="font-semibold text-foreground">
          {parseInline(boldMatch[1])}
        </strong>
      )
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    // Check for strikethrough: ~~text~~
    const strikeMatch = remaining.match(/^~~([^~]+)~~/)
    if (strikeMatch) {
      elements.push(
        <del key={`strike-${keyIndex++}`} className="line-through text-muted-foreground">
          {parseInline(strikeMatch[1])}
        </del>
      )
      remaining = remaining.slice(strikeMatch[0].length)
      continue
    }

    // Check for italic: *text* or _text_
    const italicMatch = remaining.match(/^\*([^*]+)\*/) || remaining.match(/^_([^_]+)_/)
    if (italicMatch) {
      elements.push(
        <em key={`italic-${keyIndex++}`} className="italic">
          {parseInline(italicMatch[1])}
        </em>
      )
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    // Plain text until the next special character
    const nextSpecialIndex = remaining.search(/[`*~_\[]/)
    if (nextSpecialIndex === -1) {
      elements.push(remaining)
      break
    } else if (nextSpecialIndex === 0) {
      // Single character that did not match regex pattern
      elements.push(remaining[0])
      remaining = remaining.slice(1)
    } else {
      elements.push(remaining.slice(0, nextSpecialIndex))
      remaining = remaining.slice(nextSpecialIndex)
    }

    // Failsafe: guarantee progress
    if (remaining.length >= prevLength) {
      elements.push(remaining[0])
      remaining = remaining.slice(1)
    }
  }

  return elements
}

interface CodeBlockProps {
  language: string
  code: string
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative my-3 rounded-lg border bg-muted/70 font-mono text-xs">
      <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
        <span>{language || 'text'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded p-1 hover:bg-background/80"
          title="Copy code"
        >
          {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-foreground">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export function MarkdownRenderer({
  content,
  className = '',
  onToggleCheckbox
}: MarkdownRendererProps) {
  if (!content || !content.trim()) {
    return <p className="text-sm italic text-muted-foreground">Nothing to preview</p>
  }

  const lines = content.split(/\r?\n/)
  const renderedElements: React.ReactNode[] = []
  let i = 0
  let elementKey = 0

  while (i < lines.length) {
    const line = lines[i]

    // 1. Fenced Code Block: ```lang
    if (line.trim().startsWith('```')) {
      const language = line.trim().slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      if (i < lines.length) i++ // skip closing ```
      renderedElements.push(
        <CodeBlock
          key={`code-block-${elementKey++}`}
          language={language}
          code={codeLines.join('\n')}
        />
      )
      continue
    }

    // 2. Horizontal divider
    if (/^(---|___|\*\*\*)$/.test(line.trim())) {
      renderedElements.push(<hr key={`hr-${elementKey++}`} className="my-4 border-border" />)
      i++
      continue
    }

    // 3. Headings (# to ######)
    const headingMatch = line.match(/^(#{1,6})(?:\s+(.*))?$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const headingText = (headingMatch[2] || '').trim()
      const headingId = headingText ? `heading-${slugify(headingText)}` : `heading-${elementKey}`
      const parsedHeading = headingText ? parseInline(headingText) : <span>&nbsp;</span>

      switch (level) {
        case 1:
          renderedElements.push(
            <h1
              id={headingId}
              key={`h1-${elementKey++}`}
              className="mt-6 mb-3 text-2xl font-bold tracking-tight text-foreground first:mt-0 scroll-mt-6"
            >
              {parsedHeading}
            </h1>
          )
          break
        case 2:
          renderedElements.push(
            <h2
              id={headingId}
              key={`h2-${elementKey++}`}
              className="mt-5 mb-2 text-xl font-semibold tracking-tight text-foreground first:mt-0 scroll-mt-6"
            >
              {parsedHeading}
            </h2>
          )
          break
        case 3:
          renderedElements.push(
            <h3
              id={headingId}
              key={`h3-${elementKey++}`}
              className="mt-4 mb-2 text-lg font-semibold text-foreground first:mt-0 scroll-mt-6"
            >
              {parsedHeading}
            </h3>
          )
          break
        case 4:
          renderedElements.push(
            <h4
              id={headingId}
              key={`h4-${elementKey++}`}
              className="mt-3 mb-1 text-base font-semibold text-foreground first:mt-0 scroll-mt-6"
            >
              {parsedHeading}
            </h4>
          )
          break
        default:
          renderedElements.push(
            <h5
              id={headingId}
              key={`h5-${elementKey++}`}
              className="mt-2 mb-1 text-sm font-semibold text-foreground first:mt-0 scroll-mt-6"
            >
              {parsedHeading}
            </h5>
          )
          break
      }
      i++
      continue
    }

    // 4. Blockquotes: > text
    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''))
        i++
      }
      renderedElements.push(
        <blockquote
          key={`quote-${elementKey++}`}
          className="my-3 border-l-4 border-primary/50 bg-muted/30 px-4 py-2 italic text-muted-foreground"
        >
          {quoteLines.map((qLine, qIdx) => (
            <p key={`quote-p-${qIdx}`}>{parseInline(qLine)}</p>
          ))}
        </blockquote>
      )
      continue
    }

    // 5. Tables: lines containing '|'
    if (
      line.trim().startsWith('|') &&
      i + 1 < lines.length &&
      /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(lines[i + 1].trim())
    ) {
      const headerLine = line.trim()
      const headerCells = headerLine
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim())

      i += 2 // skip header and delimiter line
      const tableRows: string[][] = []

      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const rowCells = lines[i]
          .trim()
          .split('|')
          .slice(1, -1)
          .map((cell) => cell.trim())
        tableRows.push(rowCells)
        i++
      }

      renderedElements.push(
        <div key={`table-${elementKey++}`} className="my-3 overflow-x-auto">
          <table className="w-full border-collapse border border-border text-left text-sm">
            <thead className="bg-muted/60 font-semibold">
              <tr>
                {headerCells.map((hCell, hIdx) => (
                  <th key={`th-${hIdx}`} className="border border-border px-3 py-2">
                    {parseInline(hCell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, rIdx) => (
                <tr key={`tr-${rIdx}`} className="hover:bg-muted/30">
                  {row.map((cell, cIdx) => (
                    <td key={`td-${cIdx}`} className="border border-border px-3 py-1.5">
                      {parseInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    }

    // 6. Checkbox lists: - [ ] or - [x]
    if (/^\s*[-*]\s+\[([ xX])\]\s*(.*)$/.test(line)) {
      const checkItems: { lineIndex: number; checked: boolean; text: string }[] = []
      while (i < lines.length) {
        const checkMatch = lines[i].match(/^\s*[-*]\s+\[([ xX])\]\s*(.*)$/)
        if (!checkMatch) break
        checkItems.push({
          lineIndex: i,
          checked: checkMatch[1].toLowerCase() === 'x',
          text: checkMatch[2]
        })
        i++
      }
      renderedElements.push(
        <ul key={`checklist-${elementKey++}`} className="my-2 space-y-1 text-sm">
          {checkItems.map((item) => (
            <li key={`checkitem-${item.lineIndex}`} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.checked}
                disabled={!onToggleCheckbox}
                onChange={() => onToggleCheckbox?.(item.lineIndex)}
                className="h-4 w-4 rounded border-border text-primary accent-primary cursor-pointer disabled:cursor-default"
              />
              <span
                onClick={onToggleCheckbox ? () => onToggleCheckbox(item.lineIndex) : undefined}
                className={cn(
                  onToggleCheckbox && 'cursor-pointer select-text',
                  item.checked ? 'line-through text-muted-foreground' : 'text-foreground'
                )}
              >
                {parseInline(item.text)}
              </span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // 7. Unordered lists: - item or * item
    if (/^\s*[-*+]\s*(.*)$/.test(line)) {
      const listItems: string[] = []
      while (i < lines.length) {
        const itemMatch = lines[i].match(/^\s*[-*+]\s*(.*)$/)
        // make sure it is not a checkbox item or horizontal divider
        if (!itemMatch || /^\s*[-*]\s+\[([ xX])\]/.test(lines[i])) break
        listItems.push(itemMatch[1])
        i++
      }
      renderedElements.push(
        <ul key={`ul-${elementKey++}`} className="my-2 list-disc space-y-1 pl-6 text-sm">
          {listItems.map((item, idx) => (
            <li key={`ul-item-${idx}`}>{parseInline(item)}</li>
          ))}
        </ul>
      )
      continue
    }

    // 8. Ordered lists: 1. item
    if (/^\s*\d+\.\s+(.*)$/.test(line)) {
      const listItems: string[] = []
      while (i < lines.length) {
        const itemMatch = lines[i].match(/^\s*\d+\.\s+(.*)$/)
        if (!itemMatch) break
        listItems.push(itemMatch[1])
        i++
      }
      renderedElements.push(
        <ol key={`ol-${elementKey++}`} className="my-2 list-decimal space-y-1 pl-6 text-sm">
          {listItems.map((item, idx) => (
            <li key={`ol-item-${idx}`}>{parseInline(item)}</li>
          ))}
        </ol>
      )
      continue
    }

    // 9. Blank line
    if (!line.trim()) {
      i++
      continue
    }

    // 10. Normal Paragraph
    const paragraphLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].match(/^(#{1,6})(?:\s+.*)?$/) &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('>') &&
      !/^(---|___|\*\*\*)$/.test(lines[i].trim()) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith('|')
    ) {
      paragraphLines.push(lines[i])
      i++
    }

    if (paragraphLines.length === 0) {
      paragraphLines.push(lines[i])
      i++
    }

    renderedElements.push(
      <p key={`p-${elementKey++}`} className="my-2 text-sm leading-relaxed text-foreground">
        {paragraphLines.map((pLine, pIdx) => (
          <React.Fragment key={`pline-${pIdx}`}>
            {pIdx > 0 && <br />}
            {parseInline(pLine)}
          </React.Fragment>
        ))}
      </p>
    )
  }

  return <div className={`prose-sm space-y-1 text-foreground ${className}`}>{renderedElements}</div>
}
