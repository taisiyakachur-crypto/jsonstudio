import * as Comlink from 'comlink'
import { useCallback, useRef, useState } from 'react'
import { getTableWorkerApi } from '@/lib/table-worker-client'
import type { PathEntry } from '@/lib/json-paths'
import type { TableQuery, TableQueryResult } from '@/lib/table-query'
import type { JsonPathSegment } from '@/types/json-doc'
import { TABLE_CANCELLED_ERROR_NAME } from '@/types/table-worker'
import type { TableLoadProgress, TableMeta } from '@/types/table-worker'

export type TableDocStatus = 'idle' | 'loading' | 'ready' | 'error' | 'cancelled'

function isCancelledError(err: unknown): boolean {
  return err instanceof Error && err.name === TABLE_CANCELLED_ERROR_NAME
}

export interface UseTableDocument {
  status: TableDocStatus
  meta: TableMeta | null
  progress: TableLoadProgress | null
  error: string | null
  paths: PathEntry[]
  loadFile: (file: File, rootPath: JsonPathSegment[], flattenDepth: number) => Promise<void>
  loadText: (text: string, rootPath: JsonPathSegment[], flattenDepth: number) => Promise<void>
  setRootAndDepth: (rootPath: JsonPathSegment[], flattenDepth: number) => Promise<void>
  queryRows: (query: TableQuery) => Promise<TableQueryResult>
  cancel: () => void
  reset: () => void
}

export function useTableDocument(): UseTableDocument {
  const [status, setStatus] = useState<TableDocStatus>('idle')
  const [meta, setMeta] = useState<TableMeta | null>(null)
  const [progress, setProgress] = useState<TableLoadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paths, setPaths] = useState<PathEntry[]>([])
  const docIdRef = useRef<string | null>(null)

  const closeCurrent = useCallback(() => {
    if (docIdRef.current) {
      void getTableWorkerApi().close(docIdRef.current)
      docIdRef.current = null
    }
  }, [])

  const afterLoaded = useCallback(async (id: string, docMeta: TableMeta) => {
    if (docIdRef.current !== id) return
    setMeta(docMeta)
    setStatus('ready')
    const fetchedPaths = await getTableWorkerApi().getPaths(id)
    if (docIdRef.current === id) setPaths(fetchedPaths)
  }, [])

  const loadFile = useCallback(
    async (file: File, rootPath: JsonPathSegment[], flattenDepth: number) => {
      closeCurrent()
      const id = crypto.randomUUID()
      docIdRef.current = id
      setStatus('loading')
      setError(null)
      setProgress(null)
      setMeta(null)
      setPaths([])
      try {
        const onProgress = Comlink.proxy((p: TableLoadProgress) => setProgress(p))
        const docMeta = await getTableWorkerApi().loadFile(id, file, rootPath, flattenDepth, onProgress)
        await afterLoaded(id, docMeta)
      } catch (err) {
        if (docIdRef.current !== id) return
        if (isCancelledError(err)) setStatus('cancelled')
        else {
          setStatus('error')
          setError(err instanceof Error ? err.message : String(err))
        }
      }
    },
    [closeCurrent, afterLoaded],
  )

  const loadText = useCallback(
    async (text: string, rootPath: JsonPathSegment[], flattenDepth: number) => {
      closeCurrent()
      const id = crypto.randomUUID()
      docIdRef.current = id
      setStatus('loading')
      setError(null)
      setProgress(null)
      setMeta(null)
      setPaths([])
      try {
        const docMeta = await getTableWorkerApi().loadText(id, text, rootPath, flattenDepth)
        await afterLoaded(id, docMeta)
      } catch (err) {
        if (docIdRef.current !== id) return
        setStatus('error')
        setError(err instanceof Error ? err.message : String(err))
      }
    },
    [closeCurrent, afterLoaded],
  )

  const setRootAndDepth = useCallback(
    async (rootPath: JsonPathSegment[], flattenDepth: number) => {
      const id = docIdRef.current
      if (!id) return
      const docMeta = await getTableWorkerApi().setRootAndDepth(id, rootPath, flattenDepth)
      if (docIdRef.current === id) setMeta(docMeta)
    },
    [],
  )

  const queryRows = useCallback((query: TableQuery): Promise<TableQueryResult> => {
    const id = docIdRef.current
    if (!id) return Promise.resolve({ rows: [], totalFiltered: 0 })
    return getTableWorkerApi().queryRows(id, query)
  }, [])

  const cancel = useCallback(() => {
    if (docIdRef.current) getTableWorkerApi().cancel(docIdRef.current)
  }, [])

  const reset = useCallback(() => {
    closeCurrent()
    setStatus('idle')
    setMeta(null)
    setProgress(null)
    setError(null)
    setPaths([])
  }, [closeCurrent])

  return { status, meta, progress, error, paths, loadFile, loadText, setRootAndDepth, queryRows, cancel, reset }
}
