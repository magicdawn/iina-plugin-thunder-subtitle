import { basename, dirname, extname, join } from 'path'
import { fileURLToPath } from 'url'
import { getPlayingIndex } from './helper'

export const NSP = 'iina-plugin-thunder-subtitle'

export const eventHandles: Record<string, (...args: any[]) => any> = {
  pause() {
    iina.core.pause()
  },

  toggle() {
    const cur = iina.core.status.paused
    if (cur) {
      iina.core.resume()
    } else {
      iina.core.pause()
    }
  },

  playNext() {
    iina.playlist.playNext()
  },
  playPrevious() {
    iina.playlist.playPrevious()
  },

  seek({ sec }: { sec: number }) {
    iina.core.seek(sec, true)
  },

  playlistStatus() {
    return {
      count: iina.playlist.count(),
      playingIndex: getPlayingIndex(),
      playlistDir: dirname(iina.mpv.getString('path')),
    }
  },

  playingFile() {
    const status = iina.core.status
    const {
      paused,
      idle,
      position,
      duration,
      speed,
      videoWidth,
      videoHeight,
      isNetworkResource,
      url,
    } = status

    // fileUrlToPath 不能, 这个 url 不标准, # 没有 escape
    const filePath = url.slice('file://'.length)
    const fileBase = basename(filePath, extname(filePath))

    return {
      paused,
      idle,
      position,
      duration,
      speed,
      videoWidth,
      videoHeight,
      isNetworkResource,
      url,
      fileBase,
    }
  },

  async search({ text }: { text: string }) {
    const response = await iina.http.get(
      `https://api-shoulei-ssl.xunlei.com/oracle/subtitle?duration=0&gcid=&name=${text}`,
      // @ts-ignore
      {
        headers: {
          'user-agent': 'xunlei',
        },
      }
    )
    return response.data
  },

  async useSubtitle({ url, title }: { url: string; title: string }) {
    // 无法创建文件夹啊~
    // const filename = basename(url)
    // await iina.http.download(url, `/tmp/${NSP}/${filename}`)
    // iina.core.subtitle.loadTrack(`/tmp/${NSP}/${filename}`)

    // iina.mpv.command('sub-add', [url, title])
    iina.mpv.command('sub-add', [url, 'select', title])
  },

  async saveSubtitle({ url, cid }: { url: string; cid: string }) {
    const file = iina.mpv.getString('path')
    if (!file) return
    if (!file.startsWith('/')) return // not a path

    const dir = dirname(file)
    const base = basename(file, extname(file))
    const ext = extname(url)
    const subtitlePath = join(dir, base + '-' + cid + ext)
    console.log('subtitlePath = %s', subtitlePath)
    await iina.http.download(url, subtitlePath)
  },
}

// broadcast message
iina.event.on('iina.file-loaded', (fileUrl: string) => {
  const filePath = fileURLToPath(fileUrl)
  const file = basename(filePath, extname(filePath))
  iina.standaloneWindow.postMessage('iina.file-loaded', { file })
  console.log('iina.file-loaded: fileUrl=%s file=%s', fileUrl, file)
})

export function bindListeners() {
  for (const [event, handle] of Object.entries(eventHandles)) {
    const reqevent = `${NSP}.${event}`
    const resevent = `${NSP}.${event}.response`

    iina.standaloneWindow.onMessage(reqevent, async (data) => {
      console.log('onMessage(%s): params = %j, typeof params = %s', reqevent, data, typeof data)
      let ret: any = undefined
      try {
        ret = await handle(data)
      } catch (e) {
        console.error('ERROR: ', e?.stack || e?.message || e)
      } finally {
        console.log('onMessage(%s): reponse %j, typeof response %s', reqevent, ret, typeof ret)
        iina.standaloneWindow.postMessage(resevent, { value: ret })
      }
    })
  }
}
