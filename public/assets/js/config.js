/**
 * Site configuration — edit this file to change company details, delivery
 * rules, pricing tiers and form/order endpoints. Values marked REPLACE are
 * placeholders that must be updated before going live.
 */
window.PK = window.PK || {};

PK.CONFIG = {
  brand: {
    name: 'Package.mgl',
    legalName: { mn: 'Package.mgl ХХК', en: 'Package.mgl LLC' }, // REPLACE with registered company name
  },

  contact: {
    phone: '+976 0000-0000',              // REPLACE
    phoneHref: 'tel:+97600000000',        // REPLACE
    email: 'order@yourdomain.mn',         // REPLACE
    address: {
      mn: 'Улаанбаатар хот, Монгол Улс',   // REPLACE with warehouse / showroom address
      en: 'Ulaanbaatar, Mongolia',
    },
    mapUrl: 'https://maps.google.com/?q=Ulaanbaatar', // REPLACE with exact location link
    hours: {
      mn: ['Даваа–Баасан 09:00–18:00', 'Бямба 10:00–15:00', 'Ням амарна'],
      en: ['Mon–Fri 09:00–18:00', 'Sat 10:00–15:00', 'Sun closed'],
    },
  },

  social: [
    { id: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/package.mgl' },
  ],

  currency: { code: 'MNT', symbol: '₮', locale: 'mn-MN' },

  /** Quantity price breaks applied to the unit price (percent off). */
  priceTiers: [
    { min: 0,    off: 0 },
    { min: 500,  off: 5 },
    { min: 1000, off: 10 },
    { min: 3000, off: 15 },
  ],

  delivery: {
    fee: 8000,              // Ulaanbaatar delivery fee, MNT
    freeOver: 300000,       // free delivery threshold, MNT (subtotal)
    leadDays: { inStock: '1–2', madeToOrder: '7–10' },
  },

  /**
   * Back-end endpoints. Leave empty to run in demo mode (data is kept in the
   * browser's localStorage). Set to a URL to POST JSON instead, e.g.
   * a form service or your own API.
   */
  endpoints: {
    order: '',
    contact: '',
  },

  /** Districts offered in the delivery address form. */
  districts: [
    'Баянгол', 'Баянзүрх', 'Сонгинохайрхан', 'Сүхбаатар', 'Хан-Уул',
    'Чингэлтэй', 'Налайх', 'Багануур', 'Багахангай',
  ],
};
