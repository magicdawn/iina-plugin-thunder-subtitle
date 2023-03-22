import { useMount, useRequest, useMemoizedFn } from 'ahooks'
import { Input, Table, TableColumnsType, Button, Tooltip } from 'antd'
import cx from 'clsx'
import { proxy, useSnapshot } from 'valtio'
import styles from './App.module.less'
import { SubtitleItem } from './define/result'
import { RPC } from './rpc'

import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
dayjs.extend(duration)

const state = proxy({
  playingFile: '',
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
    dataIndex: 'index',
    key: 'index',
    render(text, record, index) {
      return index + 1
    },
  },
  {
    title: '时长',
    dataIndex: 'duration',
    key: 'duration',
    render(text) {
      const num = Number(text)
      if (isNaN(num)) return text
      if (!num) return text
      return dayjs.duration(num, 'millisecond').format('HH:mm:ss')
    },
  },
  {
    title: '操作',
    key: 'action',
    render(text, record) {
      return (
        <>
          <Button
            type='primary'
            onClick={(e) => {
              useSubtitle(record)
              saveSubtitle(record)
            }}
          >
            保存
          </Button>
        </>
      )
    },
  },
  {
    title: '文件名',
    dataIndex: 'name',
    key: 'name',
    render(text, record, index) {
      return (
        <Tooltip overlayInnerStyle={{ width: 'max-content' }} title={<>cid: {record.cid}</>}>
          <a
            href='#'
            onClick={(e) => {
              e.preventDefault()
              useSubtitle(record)
            }}
          >
            {text}
          </a>
        </Tooltip>
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
  const { loading, runAsync } = useRequest(doSearch, {
    manual: true,
  })

  const loadSearchKeyword = useMemoizedFn(async () => {
    const file = await RPC.playingFile()
    state.playingFile = file || ''
    if (file) {
      state.searchKeyword = file.split(' ')[0]
      runAsync()
    }
  })

  useMount(() => {
    loadSearchKeyword()
  })

  const { searchKeyword, searchResults } = useSnapshot(state)

  return (
    <div className={cx('App', styles.page)}>
      <h1>
        搜索
        <Button onClick={loadSearchKeyword} type='primary'>
          重新加载搜索词
        </Button>
      </h1>
      <Input.Search
        value={searchKeyword}
        loading={loading}
        onChange={(e) => {
          state.searchKeyword = e.target.value
        }}
        onSearch={(value) => {
          state.searchKeyword = value
          runAsync()
        }}
        placeholder={'输入搜索词'}
      />

      {/* <div>
        {searchResults.map((item, index) => {
          return (
            <div key={item.cid} className={styles.row}>
              <span className='index'>{index}</span>
              <span className='duration'>{item.duration}</span>
              <span className='name'>{item.name}</span>
            </div>
          )
        })}
      </div> */}

      <Table columns={columns} dataSource={searchResults} pagination={false} />
    </div>
  )
}

export default App
