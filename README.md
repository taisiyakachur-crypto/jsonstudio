# JSON Studio

Локальна робоча станція для роботи з JSON. Порівняння, розбір довільного тексту в JSON,
таблиці, діаграми, форматування та валідація — все виконується у браузері, без бекенду.

> Проєкт будується поетапно (10 стадій). Цей README оновлюватиметься з кожним етапом;
> повна інструкція з деплою (GitHub Pages / Vercel) з'явиться на етапі 10.

## Стек

Vite + React 18 + TypeScript (strict) · Tailwind CSS + shadcn/ui · Zustand (+ persist) ·
CodeMirror 6 · TanStack Table · Recharts · Web Workers (Comlink) · idb-keyval · Vitest.

## Розробка

Потрібен Node.js ≥ 20.

```bash
npm install
npm run dev
```

Інші команди:

```bash
npm run build         # продакшн-збірка у dist/
npm run preview       # локальний перегляд зібраного dist/
npm run test           # юніт-тести (Vitest)
npm run lint           # ESLint
npm run format         # Prettier
npm run gen:fixtures   # згенерувати тестові JSON-файли 5/20/50 МБ у scripts/fixtures/
```

## Стан проєкту

- [x] Етап 1 — каркас: Vite/React/TS/Tailwind/shadcn, система вкладок з IndexedDB
      (`idb-keyval`) + localStorage (метадані), теми світла/темна, i18n uk/en,
      заглушки для всіх п'яти інструментів (Compare, Parse, Table, Chart, Format & Validate).
- [x] Етап 2 — інфраструктура великих файлів: Comlink-воркер (`src/workers/json-doc.worker.ts`)
      парсить JSON і віддає лише запитані гілки дерева, а не весь документ; файли > 20 МБ
      читаються порціями через `@streamparser/json` з прогрес-баром і робочим скасуванням;
      документи > 2 МБ показують банер «великий файл» + read-only перегляд перших ~2000
      рядків; віртуалізоване (`react-window`) дерево `JsonTree` довантажує дочірні вузли
      лише на розгортання/«завантажити ще». Скрипт `scripts/generate-fixtures.ts` генерує
      тестові файли на 5/20/50 МБ. Перевірено вручну: дерево 50 МБ відкривається (~1.5 с
      на цій машині) і плавно скролиться; повний бюджет продуктивності — етап 9.
- [ ] Етапи 3–10 — див. технічне завдання.

## Приватність

Жодних мережевих запитів із вмістом документів. Продакшн-збірка містить
`Content-Security-Policy` (`connect-src 'self'`), що блокує будь-які вихідні з'єднання
окрім самого застосунку.
