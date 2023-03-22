import { zsh } from './helper'
import { bindListeners } from './rpc-server'

const DEV_SERVER_PORT = '5173'
const win = iina.standaloneWindow

export function addMenu() {
  iina.menu.addItem(
    iina.menu.item('从迅雷影音查找字幕', () => {
      showWin()
    })
  )
}

// showWin()

async function isDevServerRunning(): Promise<boolean> {
  const res = await zsh(`lsof -i :${DEV_SERVER_PORT}`)
  return res.stdout.includes('TCP') && res.stdout.includes('LISTEN')
}

async function showWin() {
  // dev
  const loadUrl = () => {
    console.log('loading dev server')
    win.loadUrl(`http://localhost:${DEV_SERVER_PORT}`)
  }

  // html 相对于插件 info.json
  const loadFile = () => {
    console.log('loading html file')
    win.loadFile('dist/ui/index.html')
  }

  // @ts-ignore
  if (process.env.NODE_ENV === 'development' && (await isDevServerRunning())) {
    loadUrl()
  } else {
    loadFile()
  }

  // win.setFrame(920, 900)
  const videoFrame = iina.core?.window?.frame
  console.log(videoFrame)
  const width = 800
  const height = 600
  win.setFrame(
    width,
    height,
    videoFrame ? videoFrame.x - width : undefined, // targetX + width = videoFrame.x
    videoFrame ? videoFrame.y + videoFrame.height / 2 - height / 2 : undefined // targetY + height/2 = videoFrame.y + videoFrame.height / 2
  )

  win.open()
  win.setProperty({ title: '从迅雷影音查找字幕' })

  // 实测每次都需要绑定
  bindListeners()
}
