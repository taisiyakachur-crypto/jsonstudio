export const COMPARE_EXAMPLE_LEFT = JSON.stringify(
  {
    id: 'user-42',
    name: 'Олена Коваленко',
    email: 'olena@example.test',
    active: true,
    role: 'editor',
    address: { city: 'Київ', zip: '01001' },
    tags: ['vip', 'beta'],
    stats: { logins: 12 },
  },
  null,
  2,
)

export const COMPARE_EXAMPLE_RIGHT = JSON.stringify(
  {
    id: 'user-42',
    name: 'Олена Коваленко',
    email: 'olena.k@example.test',
    active: true,
    address: { city: 'Львів', zip: '01001' },
    tags: ['beta', 'vip', 'trial'],
    stats: { logins: 12 },
  },
  null,
  2,
)
