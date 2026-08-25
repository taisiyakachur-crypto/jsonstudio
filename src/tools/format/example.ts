export const FORMAT_EXAMPLE_JSON = JSON.stringify(
  {
    order: {
      id: 'ORD-10493',
      createdAt: '2026-08-20T09:15:00Z',
      customer: { name: 'Олена Коваленко', email: 'olena@example.test', vip: true },
      items: [
        { sku: 'A-100', title: 'Механічна клавіатура', qty: 1, price: 2499.0 },
        { sku: 'B-204', title: 'Килимок для миші', qty: 2, price: 349.5 },
      ],
      total: 3198.0,
      tags: ['online', 'express-delivery'],
      notes: null,
    },
  },
  null,
  2,
)
