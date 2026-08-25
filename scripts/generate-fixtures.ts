/**
 * Generates synthetic JSON fixtures for manually exercising the big-file path
 * (stage 2) and, later, the performance budget in stage 9: a top-level array of
 * flat-ish records, written straight to disk so generating a 50 MB file never
 * holds the whole thing in memory at once.
 *
 * Usage: `npm run gen:fixtures` — writes into scripts/fixtures/ (gitignored).
 */
import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, 'fixtures')

const TARGETS: { name: string; bytes: number }[] = [
  { name: '5mb.json', bytes: 5 * 1024 * 1024 },
  { name: '20mb.json', bytes: 20 * 1024 * 1024 },
  { name: '50mb.json', bytes: 50 * 1024 * 1024 },
]

const FIRST_NAMES = ['Олена', 'Іван', 'Марія', 'Петро', 'Ганна', 'Andrew', 'Sophia', 'Liam', 'Emma', 'Noah']
const LAST_NAMES = ['Коваленко', 'Шевченко', 'Бондаренко', 'Ткаченко', 'Smith', 'Johnson', 'Garcia', 'Müller']
const CITIES = ['Київ', 'Львів', 'Одеса', 'Харків', 'Berlin', 'Paris', 'Warsaw', 'Lisbon']
const COUNTRIES = ['UA', 'DE', 'FR', 'PL', 'PT']
const TAG_POOL = ['vip', 'trial', 'churned', 'active', 'beta', 'partner', 'internal', 'flagged']

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]!
}

function makeRecord(id: number) {
  const first = pick(FIRST_NAMES, id * 7)
  const last = pick(LAST_NAMES, id * 13)
  const tagCount = id % 4
  const tags: string[] = []
  for (let i = 0; i < tagCount; i++) tags.push(pick(TAG_POOL, id * 17 + i))

  return {
    id,
    uuid: `${id.toString(16).padStart(8, '0')}-fixture-0000-0000-000000000000`,
    name: `${first} ${last}`,
    email: `user${id}@example.test`,
    active: id % 3 !== 0,
    createdAt: new Date(1700000000000 + id * 60_000).toISOString(),
    amount: Math.round(((id * 37) % 100000) / 100),
    tags,
    address: {
      city: pick(CITIES, id * 3),
      country: pick(COUNTRIES, id * 5),
      zip: String(10000 + (id % 89999)),
    },
  }
}

async function generateFixture(name: string, targetBytes: number): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true })
  const filePath = path.join(OUT_DIR, name)
  const stream = createWriteStream(filePath, { encoding: 'utf-8' })
  const streamError = new Promise<never>((_, reject) => stream.once('error', reject))
  streamError.catch(() => {}) // avoid an unhandled-rejection warning when it's never raced against

  let written = 0
  let id = 0

  function write(chunk: string): Promise<void> {
    written += Buffer.byteLength(chunk, 'utf-8')
    if (stream.write(chunk)) return Promise.resolve()
    return Promise.race([new Promise<void>((resolve) => stream.once('drain', resolve)), streamError])
  }

  await write('[\n')
  while (written < targetBytes) {
    const prefix = id === 0 ? '' : ',\n'
    await write(prefix + JSON.stringify(makeRecord(id)))
    id++
  }
  await write('\n]\n')

  await new Promise<void>((resolve, reject) => {
    stream.end(() => resolve())
    stream.once('error', reject)
  })

  console.log(`  ${name}: ${(written / (1024 * 1024)).toFixed(2)} MB, ${id} records -> ${filePath}`)
}

async function main() {
  console.log('Generating JSON fixtures...')
  for (const target of TARGETS) {
    await generateFixture(target.name, target.bytes)
  }
  console.log('Done.')
}

main().catch((err: unknown) => {
  console.error(err)
  process.exitCode = 1
})
