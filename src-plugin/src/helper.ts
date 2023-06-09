export function addRootMenu(label: string, fn: () => void) {
  iina.menu.addItem(iina.menu.item(label, fn))
}

export function getPlayingIndex() {
  return iina.mpv.getNumber('playlist-playing-pos')
}

export async function zsh(cmd: string): ReturnType<typeof iina.utils.exec> {
  console.log('zsh exec cmd = %s', cmd)
  const res = await iina.utils.exec('/bin/zsh', ['-c', cmd])
  console.log(
    'zsh exec result, status = %s\nstdout =>\n%s\nstderr =>\n%s',
    res.status,
    res.stdout,
    res.stderr
  )
  return res
}

export function notify(msg: string) {
  //
}
