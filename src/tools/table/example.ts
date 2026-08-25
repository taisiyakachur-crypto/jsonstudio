export const TABLE_EXAMPLE_JSON = JSON.stringify(
  {
    users: [
      {
        id: 1,
        name: 'Олена Коваленко',
        active: true,
        createdAt: '2026-01-05',
        profile: { city: 'Київ', age: 30 },
        tags: ['vip', 'beta'],
      },
      {
        id: 2,
        name: 'Іван Петренко',
        active: false,
        createdAt: '2026-02-11',
        profile: { city: 'Львів', age: 25 },
        tags: ['beta'],
      },
      {
        id: 3,
        name: 'Марія Шевченко',
        active: true,
        createdAt: '2026-03-20',
        profile: { city: 'Одеса', age: 41 },
        tags: [],
      },
    ],
  },
  null,
  2,
)
