export const NSP = 'iina-plugin-thunder-subtitle'

// 在网页端使用 iina.postMessage
// 在 script 里使用 iina.standaloneWindow.onMessage 接收
export const bridge = iina as any as IINA.API.StandaloneWindow

export async function call<Ret = any>(event: string, data: any = {}) {
  const reqevent = `${NSP}.${event}`
  const resevent = `${NSP}.${event}.response`

  bridge.postMessage(reqevent, data)
  return new Promise<Ret>((resolve) => {
    bridge.onMessage(resevent, (data) => {
      resolve(data.value)
    })
  })
}

export const RPC = {
  playingFile() {
    return call<{ fileBase: string } & IINA.API.StatusAPI>('playingFile')
  },

  search(text: string) {
    return call('search', { text })
  },

  useSubtitle(url: string, title: string) {
    return call('useSubtitle', { url, title })
  },

  saveSubtitle(url: string, cid: string) {
    return call('saveSubtitle', { url, cid })
  },
}
