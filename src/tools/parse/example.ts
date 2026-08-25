import type { SourceFormat } from '@/lib/parsers'

export const PARSE_EXAMPLES: Partial<Record<SourceFormat, string>> = {
  auto: '{"id": 42, "name": "Олена", "tags": ["vip", "beta"]}',
  'escaped-json': '"{\\"id\\":1,\\"name\\":\\"Іван\\"}"',
  'log-json': '2026-08-25 12:03:11 INFO  Response body: {"status":"ok","code":200} (14ms)',
  json5: "{\n  // приклад JSON5\n  id: 1,\n  name: 'Олена',\n  tags: ['vip', 'beta'],\n}",
  'query-string': 'user[name]=John&user[age]=30&tags[]=vip&tags[]=beta',
  'key-value': 'name: Олена\nrole: admin\nactive: true\nlogins: 12',
  csv: 'name,age,active\nOlena,30,true\nIvan,25,false',
  xml: '<user id="42"><name>Олена</name><active>true</active></user>',
  yaml: 'user:\n  name: Олена\n  active: true\n  tags:\n    - vip\n    - beta',
  ndjson: '{"id":1,"name":"Олена"}\n{"id":2,"name":"Іван"}',
  // btoa() only accepts Latin1, so these two stay ASCII-only (real JWT payloads usually are too).
  base64: btoa(JSON.stringify({ id: 1, name: 'Olena' })),
  jwt: [
    btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=+$/, ''),
    btoa(JSON.stringify({ sub: '1234567890', name: 'Olena', admin: true })).replace(/=+$/, ''),
    'signature-not-verified',
  ].join('.'),
}
