import { initTRPC } from '@trpc/server'
import { basename, dirname, extname, join } from 'path'
import { createIINATrpcServer } from 'trpc-iina/server'
import { fileURLToPath } from 'url'
import { z } from 'zod'

export const NSP = 'iina-plugin-thunder-subtitle'

const t = initTRPC.create({
  isServer: false,
  allowOutsideOfServer: true,
})

const appRouter = t.router({
  test: t.procedure.query(() => {
    iina.standaloneWindow.postMessage('test', { a: 'b\nc' })
  }),

  pause: t.procedure.mutation(() => {
    iina.core.pause()
  }),

  togglePause: t.procedure.mutation(() => {
    const cur = iina.core.status.paused
    if (cur) {
      iina.core.resume()
    } else {
      iina.core.pause()
    }
  }),
  seek: t.procedure.input(z.number()).mutation(({ input: sec }) => {
    iina.core.seek(sec, true)
  }),
  playNext: t.procedure.mutation(() => {
    iina.playlist.playNext()
  }),
  playPrevious: t.procedure.mutation(() => {
    iina.playlist.playPrevious()
  }),

  getPlayingFile: t.procedure.query(async () => {
    const {
      paused,
      idle,
      position,
      duration,
      speed,
      videoWidth,
      videoHeight,
      isNetworkResource,
      url = '',
    } = iina.core.status

    // 不能使用 fileUrlToPath, 这个 url 不标准, # 没有 escape
    const filePath = url.startsWith('file://') ? url.slice('file://'.length) : url
    const fileBase = basename(filePath, extname(filePath))

    // 直接 spread {...status} 没有输出, 可能 enumerable: false
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
  }),

  search: t.procedure.input(z.string()).query(async ({ input: searchText }) => {
    console.log('in search(%s)', searchText)

    let json: any = {}
    try {
      const response = await iina.http.get(`https://api-shoulei-ssl.xunlei.com/oracle/subtitle`, {
        // ?duration=0&gcid=&name=${searchText}
        params: {
          duration: '0',
          gcid: '',
          name: searchText,
        },
        headers: { 'user-agent': 'Thunder' },
        data: undefined,
      })
      json = response.data
    } catch (e: any) {
      console.error(e.stack || e)
    }

    // console.log(json)
    return json
  }),

  useSubtitle: t.procedure
    .input(z.object({ url: z.string(), title: z.string() }))
    .mutation(async ({ input }) => {
      const { url, title } = input

      // 无法创建文件夹啊~
      // const filename = basename(url)
      // await iina.http.download(url, `/tmp/${NSP}/${filename}`)
      // iina.core.subtitle.loadTrack(`/tmp/${NSP}/${filename}`)

      // iina.mpv.command('sub-add', [url, title])
      iina.mpv.command('sub-add', [url, 'select', title])
    }),

  saveSubtitle: t.procedure
    .input(z.object({ url: z.string(), cid: z.string() }))
    .mutation(async ({ input }) => {
      const { url, cid } = input
      const file = iina.mpv.getString('path')
      if (!file) return
      if (!file.startsWith('/')) return // not a path

      const dir = dirname(file)
      const base = basename(file, extname(file))
      const ext = extname(url)
      const subtitlePath = join(dir, base + '-' + cid + ext)
      console.log('subtitlePath = %s', subtitlePath)
      await iina.http.download(url, subtitlePath)
    }),
})

export type AppRouter = typeof appRouter

export function bindTrpcEvents() {
  createIINATrpcServer(appRouter, {
    nsp: NSP,
    debug: true,
  })
}

// broadcast message
iina.event.on('iina.file-loaded', (fileUrl: string) => {
  const filePath = fileURLToPath(fileUrl)
  const file = basename(filePath, extname(filePath))
  iina.standaloneWindow.postMessage('iina.file-loaded', { file })
  console.log('iina.file-loaded: fileUrl=%s file=%s', fileUrl, file)
})
