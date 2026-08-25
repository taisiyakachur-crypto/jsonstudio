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
npm run build      # продакшн-збірка у dist/
npm run preview    # локальний перегляд зібраного dist/
npm run test        # юніт-тести (Vitest)
npm run lint        # ESLint
npm run format      # Prettier
```

## Стан проєкту

- [x] Етап 1 — каркас: Vite/React/TS/Tailwind/shadcn, система вкладок з IndexedDB
      (`idb-keyval`) + localStorage (метадані), теми світла/темна, i18n uk/en,
      заглушки для всіх п'яти інструментів (Compare, Parse, Table, Chart, Format & Validate).
- [ ] Етап 2 — інфраструктура великих файлів (Comlink-воркери, потокове читання,
      режим великого файлу, віртуалізоване дерево).
- [ ] Етапи 3–10 — див. технічне завдання.

## Приватність

Жодних мережевих запитів із вмістом документів. Продакшн-збірка містить
`Content-Security-Policy` (`connect-src 'self'`), що блокує будь-які вихідні з'єднання
окрім самого застосунку.
