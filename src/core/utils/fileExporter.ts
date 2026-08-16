import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

/**
 * Converts a Uint8Array or Blob to Base64 string for Capacitor Filesystem
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Saves and shares/downloads a text file (JSON, Markdown, CSV, etc.)
 */
export async function saveAndExportTextFile(
  content: string,
  filename: string,
  mimeType = 'application/json'
): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  // 1. Native Mobile (Capacitor on Android / iOS)
  if (Capacitor.isNativePlatform()) {
    try {
      const saved = await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Cache
      })

      await Share.share({
        title: filename,
        text: `Exported from Productivity Suite`,
        url: saved.uri,
        dialogTitle: `Save or Share ${filename}`
      })
      return
    } catch {
      // If native sharing fails or is cancelled, try web fallbacks
    }
  }

  const blob = new Blob([content], { type: mimeType })

  // 2. Web Share API (Mobile web browser)
  if (typeof navigator !== 'undefined' && navigator.canShare && typeof File !== 'undefined') {
    try {
      const file = new File([blob], filename, { type: mimeType })
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: filename
        })
        return
      }
    } catch {
      // Fall through to link download
    }
  }

  // 3. Standard Desktop Browser Blob Download
  triggerBlobDownload(blob, filename)
}

/**
 * Saves and shares/downloads a binary file (ZIP, PDF, etc.)
 */
export async function saveAndExportBinaryFile(
  data: Uint8Array,
  filename: string,
  mimeType = 'application/zip'
): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  // 1. Native Mobile (Capacitor on Android / iOS)
  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = uint8ArrayToBase64(data)
      const saved = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache
      })

      await Share.share({
        title: filename,
        text: `Exported from Productivity Suite`,
        url: saved.uri,
        dialogTitle: `Save or Share ${filename}`
      })
      return
    } catch {
      // Fallback
    }
  }

  const blob = new Blob([data.buffer as ArrayBuffer], { type: mimeType })

  // 2. Web Share API
  if (typeof navigator !== 'undefined' && navigator.canShare && typeof File !== 'undefined') {
    try {
      const file = new File([blob], filename, { type: mimeType })
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: filename
        })
        return
      }
    } catch {
      // Fall through
    }
  }

  // 3. Standard Desktop Browser Blob Download
  triggerBlobDownload(blob, filename)
}

function triggerBlobDownload(blob: Blob, filename: string) {
  if (typeof document === 'undefined') return
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
