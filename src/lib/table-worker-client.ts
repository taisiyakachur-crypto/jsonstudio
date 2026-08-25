import * as Comlink from 'comlink'
import type { TableWorkerApi } from '@/types/table-worker'

let worker: Worker | undefined
let api: Comlink.Remote<TableWorkerApi> | undefined

/** Lazily creates a single shared table worker instance for the lifetime of the page. */
export function getTableWorkerApi(): Comlink.Remote<TableWorkerApi> {
  if (!api) {
    worker = new Worker(new URL('../workers/table.worker.ts', import.meta.url), { type: 'module' })
    api = Comlink.wrap<TableWorkerApi>(worker)
  }
  return api
}
