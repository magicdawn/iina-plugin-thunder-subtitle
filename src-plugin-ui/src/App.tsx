import { useMemoizedFn, useMount, useRequest } from 'ahooks'
import { Button, Input, Table, TableColumnsType, Tooltip } from 'antd'
import cx from 'clsx'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { useLayoutEffect, useRef } from 'react'
import { proxy, useSnapshot } from 'valtio'
import styles from './App.module.less'
import { SubtitleItem } from './define/result'
import { bridge, RPC } from './rpc'

dayjs.extend(duration)

const state = proxy({
  playingFile: '',
  playingFileDuration: '',
  searchKeyword: '',
  searchResults: [] as SubtitleItem[],
})

async function doSearch() {
  const result = await RPC.search(state.searchKeyword)
  console.log(result)

  const arr = (result?.data || []) as SubtitleItem[]
  state.searchResults = arr
}

const columns: TableColumnsType<SubtitleItem> = [
  {
    title: '序号',
    key: 'index',
    width: 65,
    align: 'center',
    render(col, row, index) {
      return index + 1
    },
  },
  {
    title: '时长',
    dataIndex: 'duration',
    align: 'center',
    width: 120,
    render(col) {
      const num = Number(col)
      if (isNaN(num)) return col
      if (!num) return col
      return dayjs.duration(num, 'millisecond').format('HH:mm:ss')
    },
  },
  {
    title: '语言',
    width: 90,
    dataIndex: 'languages',
    render(col, row) {
      return <span>{(row.languages || []).join(',')}</span>
    },
  },
  {
    title: '格式',
    dataIndex: 'ext',
    width: 70,
  },
  {
    title: '文件名',
    dataIndex: 'name',
    render(col, row) {
      return (
        <Tooltip overlayInnerStyle={{ width: 'max-content' }} title={<>cid: {row.cid}</>}>
          <a
            style={{ wordBreak: 'break-all' }}
            href='#'
            onClick={(e) => {
              e.preventDefault()
              useSubtitle(row)
            }}
          >
            {col}
          </a>
        </Tooltip>
      )
    },
  },
  {
    title: '操作',
    key: 'action',
    align: 'center',
    width: 90,
    render(col, row) {
      return (
        <>
          <Button
            type='dashed'
            onClick={(e) => {
              useSubtitle(row)
              saveSubtitle(row)
            }}
          >
            保存
          </Button>
        </>
      )
    },
  },
]

async function useSubtitle(item: SubtitleItem) {
  console.log({ ...item })
  const index = state.searchResults.findIndex((x) => x.cid === item.cid)
  const title = `${index + 1}-${item.name}`
  await RPC.useSubtitle(item.url, title)
}

async function saveSubtitle(item: SubtitleItem) {
  console.log({ ...item })
  await RPC.saveSubtitle(item.url, item.cid)
}

function App() {
  const { playingFile, playingFileDuration, searchKeyword, searchResults } = useSnapshot(state)

  const { loading, runAsync } = useRequest(doSearch, {
    manual: true,
  })

  const loadPlaying = useMemoizedFn(async () => {
    const status = (await RPC.playingFile()) || ''
    console.log('status: %O', status)
    state.playingFile = status.fileBase

    if (status.duration) {
      state.playingFileDuration = dayjs.duration(status.duration, 'seconds').format('HH:mm:ss')
    }

    if (state.playingFile) {
      state.searchKeyword = state.playingFile.split(' ')[0]
      runAsync()
    }
  })

  useMount(async () => {
    await loadPlaying()
    bridge.onMessage('iina.file-loaded', () => {
      loadPlaying()
    })
  })

  const inputActionRef = useRef<(() => void) | null>(null)
  useLayoutEffect(() => {
    inputActionRef.current?.()
    inputActionRef.current = null
  }, [searchKeyword])

  return (
    <div className={cx('App', styles.page)}>
      <p>当前视频时长: {playingFileDuration}</p>
      <p>当前播放: {playingFile}</p>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ flex: 1 }}></span>
        <Button onClick={loadPlaying} type='primary'>
          重新加载搜索词
        </Button>
      </div>

      <Input.Search
        style={{ marginTop: 10 }}
        value={searchKeyword}
        loading={loading}
        onChange={(e) => {
          const input = e.target
          inputActionRef.current = createInputRecoverAction(input)
          state.searchKeyword = e.target.value
        }}
        onSearch={(value) => {
          state.searchKeyword = value
          runAsync()
        }}
        placeholder={'输入搜索词'}
        enterButton='搜索'
      />

      <Table
        style={{ marginTop: 10 }}
        columns={columns}
        dataSource={searchResults}
        pagination={false}
        rowKey='cid'
        scroll={{ y: 'calc(100vh - 280px)' }}
      />
    </div>
  )
}

export default App

function createInputRecoverAction(input: HTMLInputElement) {
  const { selectionStart, selectionEnd } = input
  return () => {
    input.selectionStart = selectionStart
    input.selectionEnd = selectionEnd
  }
}
