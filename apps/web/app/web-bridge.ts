'use client'

const WEB_MEDIA_PREFIX = 'moyin:web:media:'

const toDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

async function normalizeImageInput(url: string): Promise<string> {
  if (url.startsWith('data:')) return url
  if (!url.startsWith('http://') && !url.startsWith('https://')) return url

  const response = await fetch('/api/media/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })

  if (!response.ok) {
    throw new Error(`Media fetch failed (${response.status})`)
  }

  const payload = (await response.json()) as { dataUrl?: string }
  if (!payload.dataUrl) {
    throw new Error('Media fetch returned empty payload')
  }

  return payload.dataUrl
}

function createWebFileStorage(): NonNullable<Window['fileStorage']> {
  return {
    async getItem(key) {
      return localStorage.getItem(key)
    },
    async setItem(key, value) {
      localStorage.setItem(key, value)
      return true
    },
    async removeItem(key) {
      localStorage.removeItem(key)
      return true
    },
    async exists(key) {
      return localStorage.getItem(key) !== null
    },
    async listKeys(prefix) {
      return Object.keys(localStorage).filter((key) => key.startsWith(prefix))
    },
    async listDirs(prefix) {
      const dirs = new Set<string>()
      const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`
      for (const key of Object.keys(localStorage)) {
        if (!key.startsWith(normalizedPrefix)) continue
        const rest = key.slice(normalizedPrefix.length)
        const seg = rest.split('/')[0]
        if (seg) dirs.add(seg)
      }
      return Array.from(dirs)
    },
    async removeDir(prefix) {
      const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`
      const keys = Object.keys(localStorage).filter((key) => key.startsWith(normalizedPrefix))
      keys.forEach((key) => localStorage.removeItem(key))
      return true
    },
  }
}

function createWebImageStorage(): NonNullable<Window['imageStorage']> {
  return {
    async saveImage(url, category, filename) {
      try {
        const normalized = await normalizeImageInput(url)
        if (!normalized.startsWith('data:')) {
          return { success: true, localPath: normalized }
        }
        const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${category}_${filename}`
        const localPath = `local-image://web/${id}`
        localStorage.setItem(`${WEB_MEDIA_PREFIX}${id}`, normalized)
        return { success: true, localPath }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'save image failed' }
      }
    },
    async getImagePath(localPath) {
      if (!localPath.startsWith('local-image://web/')) return localPath
      const id = localPath.replace('local-image://web/', '')
      return localStorage.getItem(`${WEB_MEDIA_PREFIX}${id}`)
    },
    async deleteImage(localPath) {
      if (!localPath.startsWith('local-image://web/')) return false
      const id = localPath.replace('local-image://web/', '')
      localStorage.removeItem(`${WEB_MEDIA_PREFIX}${id}`)
      return true
    },
    async readAsBase64(localPath) {
      if (localPath.startsWith('data:')) {
        return { success: true, base64: localPath, mimeType: localPath.slice(5, localPath.indexOf(';')) || 'image/png', size: localPath.length }
      }
      if (localPath.startsWith('local-image://web/')) {
        const id = localPath.replace('local-image://web/', '')
        const base64 = localStorage.getItem(`${WEB_MEDIA_PREFIX}${id}`)
        if (!base64) return { success: false, error: 'image not found' }
        return { success: true, base64, mimeType: base64.slice(5, base64.indexOf(';')) || 'image/png', size: base64.length }
      }
      if (localPath.startsWith('http://') || localPath.startsWith('https://')) {
        const res = await fetch(localPath)
        const blob = await res.blob()
        const base64 = await toDataUrl(blob)
        return { success: true, base64, mimeType: blob.type || 'image/png', size: blob.size }
      }
      return { success: false, error: 'unsupported path' }
    },
    async getAbsolutePath(localPath) {
      return localPath
    },
  }
}

export function setupWebBridge() {
  if (typeof window === 'undefined') return
  if (window.fileStorage && window.imageStorage) return

  window.fileStorage = createWebFileStorage()
  window.imageStorage = createWebImageStorage()
  window.storageManager = {
    async getPaths() {
      return { basePath: 'browser://localstorage', projectPath: 'browser://localstorage/projects', mediaPath: 'browser://localstorage/media', cachePath: 'browser://localstorage/cache' }
    },
    async selectDirectory() { return null },
    async validateDataDir() { return { valid: false, error: 'Web MVP 暂不支持目录操作' } },
    async moveData() { return { success: false, error: 'Web MVP 暂不支持目录迁移' } },
    async linkData() { return { success: false, error: 'Web MVP 暂不支持目录映射' } },
    async exportData() { return { success: false, error: 'Web MVP 暂不支持导出目录' } },
    async importData() { return { success: false, error: 'Web MVP 暂不支持导入目录' } },
    async getCacheSize() { return { total: 0, details: [] } },
    async clearCache() { return { success: true, clearedBytes: 0 } },
    async updateConfig() { return true },
  }

  window.appUpdater = {
    async getCurrentVersion() { return 'web-mvp' },
    async checkForUpdates() {
      return { success: true, hasUpdate: false, currentVersion: 'web-mvp', update: null }
    },
    async openExternalLink(url) {
      window.open(url, '_blank', 'noopener,noreferrer')
      return { success: true }
    },
  }
}
