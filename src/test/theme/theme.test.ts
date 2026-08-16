import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Brand Identity & Color System Verification', () => {
  const indexCss = fs.readFileSync(
    path.resolve(__dirname, '../../index.css'),
    'utf-8'
  )
  const indexHtml = fs.readFileSync(
    path.resolve(__dirname, '../../../index.html'),
    'utf-8'
  )
  const manifestJson = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, '../../../public/manifest.json'),
      'utf-8'
    )
  )

  it('configures light mode core brand and neutral tokens in index.css', () => {
    // Primary #0A7A64 (168.2 84.8% 25.9%)
    expect(indexCss).toContain('--primary: 168.2 84.8% 25.9%')
    // Primary hover #086653 (167.9 85.5% 21.6%)
    expect(indexCss).toContain('--primary-hover: 167.9 85.5% 21.6%')
    // Primary active #065243 (168.2 86.4% 17.3%)
    expect(indexCss).toContain('--primary-active: 168.2 86.4% 17.3%')
    // Primary subtle #DDF7F0 (164 62% 91.8%)
    expect(indexCss).toContain('--primary-subtle: 164 62% 91.8%')
    // Light background #F8FAFC (210 40% 98%)
    expect(indexCss).toContain('--background: 210 40% 98%')
    // Light surface #FFFFFF (0 0% 100%)
    expect(indexCss).toContain('--card: 0 0% 100%')
    // Light border #E2E8F0 (214.3 31.8% 91.4%)
    expect(indexCss).toContain('--border: 214.3 31.8% 91.4%')
    // Light primary text #0F172A (222.2 47.4% 11.2%)
    expect(indexCss).toContain('--foreground: 222.2 47.4% 11.2%')
    // Light secondary text #475569 (215.3 19.3% 34.5%)
    expect(indexCss).toContain('--secondary-foreground: 215.3 19.3% 34.5%')
    // Light muted text #94A3B8 (215 20.2% 65.1%)
    expect(indexCss).toContain('--muted-foreground: 215 20.2% 65.1%')
  })

  it('configures dark mode tokens in index.css', () => {
    // Dark background #0B1211 (171.4 24.1% 5.7%)
    expect(indexCss).toContain('171.4 24.1% 5.7%')
    // Dark surface #111C1A (169.1 24.4% 8.8%)
    expect(indexCss).toContain('169.1 24.4% 8.8%')
    // Elevated surface #172522 (167.1 23.3% 11.8%)
    expect(indexCss).toContain('167.1 23.3% 11.8%')
    // Dark border #263936 (170.5 20% 18.6%)
    expect(indexCss).toContain('170.5 20% 18.6%')
    // Dark primary text #F1F5F4 (165 14.3% 95.3%)
    expect(indexCss).toContain('165 14.3% 95.3%')
    // Dark secondary text #A7B8B4 (165.9 10.8% 68.8%)
    expect(indexCss).toContain('165.9 10.8% 68.8%')
    // Dark muted text #718581 (168 8.1% 48.2%)
    expect(indexCss).toContain('168 8.1% 48.2%')
    // Dark mode primary #14B8A6 (173.4 80.4% 40%)
    expect(indexCss).toContain('173.4 80.4% 40%')
    // Dark mode primary hover #2DD4BF (172.5 66% 50.4%)
    expect(indexCss).toContain('172.5 66% 50.4%')
  })

  it('defines the brand gradient correctly', () => {
    expect(indexCss).toContain(
      'linear-gradient(135deg, #0A7A64 0%, #14B8A6 50%, #34D399 100%)'
    )
  })

  it('configures semantic colors', () => {
    // Success #10B981 (160 84% 39%)
    expect(indexCss).toContain('--success: 160 84% 39%')
    // Warning #F59E0B (38 92% 50%)
    expect(indexCss).toContain('--warning: 38 92% 50%')
    // Destructive #EF4444 (0 84% 60%)
    expect(indexCss).toContain('--destructive: 0 84% 60%')
    // Info #3B82F6 (217 91% 60%)
    expect(indexCss).toContain('--info: 217 91% 60%')
  })

  it('uses /icon.png for favicon and app icons in index.html', () => {
    expect(indexHtml).toContain('href="/icon.png"')
    expect(indexHtml).toContain('content="#0A7A64"')
    expect(indexHtml).toContain('content="#0B1211"')
    expect(indexHtml).not.toContain('favicon.svg')
  })

  it('uses /icon.png and teal brand theme in manifest.json', () => {
    expect(manifestJson.icons[0].src).toBe('/icon.png')
    expect(manifestJson.icons[0].type).toBe('image/png')
    expect(manifestJson.theme_color).toBe('#0A7A64')
    expect(manifestJson.background_color).toBe('#0B1211')
  })
})
