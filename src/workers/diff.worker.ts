import * as Comlink from 'comlink'
import { diffValues } from '@/lib/diff'
import type { DiffNode, DiffOptions } from '@/lib/diff'
import type { JsonValue } from '@/types/json'
import { DIFF_CANCELLED_ERROR_NAME } from '@/types/diff-worker'
import type { DiffProgress, DiffWorkerApi } from '@/types/diff-worker'

class DiffCancelledError extends Error {
  constructor() {
    super('Diff was cancelled')
    this.name = DIFF_CANCELLED_ERROR_NAME
  }
}

const cancelFlags = new Map<string, boolean>()

// Yielding between phases (rather than deep inside the recursive diff, which has no natural
// batch boundary) keeps this honest: real progress feedback and a cancel button that actually
// works for the common "pasted the wrong huge file" case, without pretending to report
// fine-grained progress through a single synchronous recursive call. See stage 9 in the plan
// for revisiting this if diffing very large documents turns out to need real chunking.
async function yieldToEventLoop(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

function checkCancelled(id: string): void {
  if (cancelFlags.get(id)) throw new DiffCancelledError()
}

async function computeDiff(
  id: string,
  leftText: string,
  rightText: string,
  options: DiffOptions,
  onProgress: (progress: DiffProgress) => void,
): Promise<DiffNode> {
  cancelFlags.set(id, false)
  try {
    onProgress({ phase: 'parsing-left' })
    await yieldToEventLoop()
    checkCancelled(id)
    const left = JSON.parse(leftText) as JsonValue

    onProgress({ phase: 'parsing-right' })
    await yieldToEventLoop()
    checkCancelled(id)
    const right = JSON.parse(rightText) as JsonValue

    onProgress({ phase: 'diffing' })
    await yieldToEventLoop()
    checkCancelled(id)
    const result = diffValues(left, right, options)

    onProgress({ phase: 'done' })
    return result
  } finally {
    cancelFlags.delete(id)
  }
}

function cancel(id: string): void {
  if (cancelFlags.has(id)) cancelFlags.set(id, true)
}

const api: DiffWorkerApi = { computeDiff, cancel }

Comlink.expose(api)
