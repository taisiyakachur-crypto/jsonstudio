import * as Comlink from 'comlink'
import type { DiffWorkerApi } from '@/types/diff-worker'

let worker: Worker | undefined
let api: Comlink.Remote<DiffWorkerApi> | undefined

/** Lazily creates a single shared diff worker instance for the lifetime of the page. */
export function getDiffWorkerApi(): Comlink.Remote<DiffWorkerApi> {
  if (!api) {
    worker = new Worker(new URL('../workers/diff.worker.ts', import.meta.url), { type: 'module' })
    api = Comlink.wrap<DiffWorkerApi>(worker)
  }
  return api
}
