/**
 * Product catalog.
 *
 * ─ Categories ─────────────────────────────────────────────────────────────
 *   id, name {mn,en}, blurb {mn,en}, art (how the category tile is drawn)
 *
 * ─ Products ───────────────────────────────────────────────────────────────
 *   id          unique slug, used in URLs (product.html?id=…)
 *   category    category id
 *   shape       drawing type: 'bag' | 'box' | 'sheet' | 'roll'
 *   handle      bags only: 'twisted' | 'flat' | 'none' | 'ribbon' | 'window'
 *   lid         boxes only: 'window' | 'mailer'
 *   name, summary, description, material   {mn, en}
 *   uses        {mn: [...], en: [...]}
 *   colors      list of PK.COLORS keys; first is the default
 *   gsm         available paper weights in g/m² (first entry after sort = lightest); null if not applicable
 *   gsmDefault  weight the listed prices are based on
 *   thickness   optional {mn, en} when GSM does not apply (e.g. corrugated board)
 *   unit        'pcs' | 'sheet' | 'roll'
 *   moq, step   minimum order quantity and quantity increment
 *   pricing     for die-template sizes: unit price = base + flat blank area (m²) × perM2
 *   sizes       die codes from templates.js ('T001') OR explicit objects
 *               { code, l, w, h, price }        bags / boxes, cm
 *               { code, l, w, price }           sheets, cm
 *               { code, l, length, d, price }   rolls: width cm, length m, roll Ø cm (for drawing)
 *   popular     rank for "Popular" sorting / home page (lower = more popular)
 *   images      optional real photos, e.g. ['assets/img/products/twisted-white-1.jpg'].
 *               When present they are shown before the generated drawing.
 *   sample      true = illustrative sample product; replace with real data.
 */
window.PK = window.PK || {};

PK.COLORS = {
  white: { mn: 'Цагаан',    en: 'White',       swatch: '#F7F7F4' },
  kraft: { mn: 'Бор крафт', en: 'Brown kraft', swatch: '#BE8D5E' },
  black: { mn: 'Хар',       en: 'Black',       swatch: '#2B2D31' },
};

PK.UNITS = {
  pcs:   { mn: 'ш',      en: 'pcs' },
  sheet: { mn: 'хуудас', en: 'sheets' },
  roll:  { mn: 'ороодос', en: 'rolls' },
};

PK.CATEGORIES = [
  {
    id: 'bags',
    name:  { mn: 'Цаасан уут', en: 'Paper bags' },
    blurb: { mn: 'Бариултай, бариулгүй, бэлгийн уут', en: 'With handles, without handles, gift bags' },
    art: { shape: 'bag', handle: 'twisted', dims: { l: 32.5, w: 12, h: 31.5 }, color: 'white' },
  },
  {
    id: 'boxes',
    name:  { mn: 'Хайрцаг', en: 'Boxes' },
    blurb: { mn: 'Цонхтой болон шуудангийн хайрцаг', en: 'Window boxes and mailer boxes' },
    art: { shape: 'box', lid: 'window', dims: { l: 20, w: 20, h: 10 }, color: 'white' },
  },
  {
    id: 'wrapping',
    name:  { mn: 'Боодлын цаас', en: 'Wrapping paper' },
    blurb: { mn: 'Хуудас, ороодос, хүнсний болон нимгэн цаас', en: 'Sheets, rolls, food and tissue paper' },
    art: { shape: 'roll', dims: { l: 70, length: 50, d: 14 }, color: 'kraft' },
  },
];

/* Standard bag dies (everything except the ribbon-tie T026 and window T032). */
var STANDARD_BAG_DIES = PK.TEMPLATES
  .filter(function (t) { return !t.note || t.note === 'hiih'; })
  .map(function (t) { return t.code; });

PK.PRODUCTS = [
  /* ─────────────────────────── Paper bags ─────────────────────────── */
  {
    id: 'twisted-handle-bag',
    category: 'bags',
    shape: 'bag',
    handle: 'twisted',
    name:    { mn: 'Мушгимал бариултай цаасан уут', en: 'Paper bag with twisted handles' },
    summary: { mn: 'Дэлгүүр, кафе, бэлгийн савлагаанд тохирох бат бөх уут.', en: 'A sturdy everyday bag for shops, cafés and gift packaging.' },
    description: {
      mn: 'Крафт цаасаар хийсэн, хавтгай ёроолтой, хажуу нугалаастай уут. Мушгимал цаасан бариулыг дээд ирмэгийн дотор талд нэмэлт туузаар бэхэлсэн тул хүнд бараа даана. Хэвлэлгүй цэвэр хэлбэрээр нийлүүлнэ — өөрийн тамга, наалт, лого хэрэглэхэд бэлэн.',
      en: 'Made from kraft paper with a flat base and side gussets. The twisted paper handles are reinforced with a patch inside the top hem, so the bag carries heavier goods. Supplied blank — ready for your own stamp, sticker or logo.',
    },
    uses: { mn: ['Хувцас, гутал', 'Кафе, хоолны захиалга', 'Бэлэг, гоо сайхан'], en: ['Clothing and shoes', 'Cafés and takeaway', 'Gifts and cosmetics'] },
    material: { mn: 'Крафт цаас', en: 'Kraft paper' },
    colors: ['white', 'kraft'],
    gsm: [100, 120, 150],
    gsmDefault: 120,
    unit: 'pcs', moq: 100, step: 50,
    pricing: { base: 380, perM2: 4200 },
    sizes: STANDARD_BAG_DIES,
    popular: 1,
    images: [],
  },
  {
    id: 'flat-handle-bag',
    category: 'bags',
    shape: 'bag',
    handle: 'flat',
    name:    { mn: 'Хавтгай бариултай цаасан уут', en: 'Paper bag with flat handles' },
    summary: { mn: 'Хүнсний дэлгүүр, ресторанд — өргөн ёроолтой, хавтгай туузан бариултай.', en: 'A wide-based bag with flat tape handles for groceries and restaurant takeaway.' },
    description: {
      mn: 'Хавтгай цаасан бариул нь гарт эвтэйхэн тул хоолны сав, хайрцагласан бараа зөөхөд тохиромжтой. Хажуу нугалаастай тул дүүргэхэд ёроол нь тэгш байрлана.',
      en: 'Flat paper handles are comfortable to carry and suit food containers and boxed goods. The gusseted sides open into a level base when packed.',
    },
    uses: { mn: ['Хүнсний дэлгүүр', 'Ресторан, хүргэлт', 'Эмийн сан'], en: ['Grocery stores', 'Restaurants and delivery', 'Pharmacies'] },
    material: { mn: 'Крафт цаас', en: 'Kraft paper' },
    colors: ['kraft', 'white'],
    gsm: [100, 120],
    gsmDefault: 100,
    unit: 'pcs', moq: 100, step: 50,
    pricing: { base: 300, perM2: 3800 },
    sizes: ['T001', 'T003', 'T005', 'T007', 'T009', 'T012', 'T017', 'T019', 'T024', 'T028', 'T030', 'T031', 'T033', 'T036'],
    popular: 3,
    sample: true, // size assignment is illustrative
    images: [],
  },
  {
    id: 'no-handle-bag',
    category: 'bags',
    shape: 'bag',
    handle: 'none',
    name:    { mn: 'Бариулгүй цаасан уут', en: 'Paper bag without handles' },
    summary: { mn: 'Талх, нарийн боов, хоолны савлагаанд — хөнгөн бөгөөд хямд.', en: 'Light, economical bags for bread, pastries and takeaway food.' },
    description: {
      mn: 'Хавтгай ёроолтой тул өөрөө босож зогсоно. Дээд ирмэгийг нугалж эсвэл наалтаар битүүмжилнэ. Хүнсэнд шууд хүрэх зориулалттай цаас ашигладаг.',
      en: 'The flat base lets the bag stand on its own. Fold the top over or close it with a sticker. Made from paper approved for direct food contact.',
    },
    uses: { mn: ['Талх, нарийн боов', 'Кофе шоп', 'Жижиг бараа'], en: ['Bread and pastries', 'Coffee shops', 'Small retail items'] },
    material: { mn: 'Хүнсний крафт цаас', en: 'Food-grade kraft paper' },
    colors: ['kraft', 'white'],
    gsm: [80, 100],
    gsmDefault: 80,
    unit: 'pcs', moq: 200, step: 100,
    pricing: { base: 120, perM2: 3000 },
    sizes: ['T002', 'T010', 'T011', 'T013', 'T014', 'T015', 'T016', 'T018', 'T020', 'T022', 'T027', 'T029', 'T035'],
    popular: 5,
    sample: true, // size assignment is illustrative
    images: [],
  },
  {
    id: 'ribbon-gift-bag',
    category: 'bags',
    shape: 'bag',
    handle: 'ribbon',
    name:    { mn: 'Бантиктай бэлгийн уут', en: 'Ribbon-tie gift bag' },
    summary: { mn: 'Дээд хэсгийг туузаар бантиклан уядаг хавтгай бэлгийн уут.', en: 'A flat gift bag closed with a ribbon tied in a bow.' },
    description: {
      mn: 'Хажуу нугалаасгүй хавтгай хийцтэй тул хувцас, ном, хавтгай бэлэгт тохиромжтой. Туузны өнгийг захиалгын тайлбарт бичнэ үү.',
      en: 'No side gusset — the flat format suits clothing, books and other flat gifts. Add your ribbon colour in the order comment.',
    },
    uses: { mn: ['Хувцас, ороолт', 'Ном, гэрчилгээ', 'Баярын бэлэг'], en: ['Clothing and scarves', 'Books and certificates', 'Holiday gifts'] },
    material: { mn: 'Крафт цаас, тууз', en: 'Kraft paper with ribbon' },
    colors: ['white', 'kraft'],
    gsm: [120, 150],
    gsmDefault: 120,
    unit: 'pcs', moq: 100, step: 50,
    pricing: { base: 650, perM2: 4200 },
    sizes: ['T026'],
    popular: 6,
    images: [],
  },
  {
    id: 'window-bag',
    category: 'bags',
    shape: 'bag',
    handle: 'window',
    name:    { mn: 'Цонхтой жижиг уут', en: 'Small bag with window' },
    summary: { mn: 'Агуулга нь харагдах тунгалаг цонхтой — жигнэмэг, чихэр, жижиг бэлэгт.', en: 'A clear window shows what is inside — for cookies, sweets and small gifts.' },
    description: {
      mn: 'Урд талдаа хүнсний тунгалаг хальсан цонхтой. Бүтээгдэхүүнээ харуулж зарах шаардлагатай кондитер, гар урлалын дэлгүүрт тохиромжтой.',
      en: 'The front has a food-safe clear film window, so the product sells itself. A good fit for confectioners and craft shops.',
    },
    uses: { mn: ['Жигнэмэг, чихэр', 'Цай, кофе', 'Гар урлал'], en: ['Cookies and sweets', 'Tea and coffee', 'Handmade goods'] },
    material: { mn: 'Крафт цаас, тунгалаг хальс', en: 'Kraft paper, clear film' },
    colors: ['kraft', 'white'],
    gsm: [100, 120],
    gsmDefault: 100,
    unit: 'pcs', moq: 200, step: 100,
    pricing: { base: 260, perM2: 3600 },
    sizes: ['T032'],
    popular: 7,
    images: [],
  },

  /* ─────────────────────────── Boxes (sample data) ─────────────────────────── */
  {
    id: 'window-pastry-box',
    category: 'boxes',
    shape: 'box',
    lid: 'window',
    name:    { mn: 'Цонхтой бялууны хайрцаг', en: 'Pastry box with window' },
    summary: { mn: 'Бялуу, нарийн боовыг гэмтээлгүй хүргэх цонхтой хайрцаг.', en: 'A window-top box that carries cakes and pastries without damage.' },
    description: {
      mn: 'Хавтгайгаар нийлүүлэх тул агуулахад бага зай эзэлнэ, цавуугүйгээр хэдхэн секундэд эвхэгдэнэ. Дээд талын тунгалаг цонхоор бүтээгдэхүүн харагдана.',
      en: 'Ships flat to save storage space and folds into shape in seconds without glue. The clear top window shows off the product.',
    },
    uses: { mn: ['Бялуу, бялуучин', 'Макарон, печень', 'Бэлгийн багц'], en: ['Cakes and cupcakes', 'Macarons and cookies', 'Gift sets'] },
    material: { mn: 'Хүнсний цагаан картон', en: 'Food-grade white board' },
    colors: ['white', 'kraft'],
    gsm: [300],
    gsmDefault: 300,
    unit: 'pcs', moq: 50, step: 50,
    sizes: [
      { code: 'BW-15', l: 15, w: 15, h: 8,  price: 1350 },
      { code: 'BW-20', l: 20, w: 20, h: 10, price: 1850 },
      { code: 'BW-25', l: 25, w: 25, h: 12, price: 2600 },
      { code: 'BW-30', l: 30, w: 30, h: 12, price: 3200 },
    ],
    popular: 2,
    sample: true,
    images: [],
  },
  {
    id: 'kraft-mailer-box',
    category: 'boxes',
    shape: 'box',
    lid: 'mailer',
    name:    { mn: 'Крафт шуудангийн хайрцаг', en: 'Kraft mailer box' },
    summary: { mn: 'Онлайн дэлгүүрийн хүргэлтэд — скочгүйгээр хаагддаг.', en: 'For online-shop deliveries — closes with tuck flaps, no tape needed.' },
    description: {
      mn: 'Атираат картон нь тээвэрлэлтийн үед бараагаа даралт, цохилтоос хамгаална. Хажуугийн хавчаар хаалт нь хайрцгийг скочгүйгээр бат бөх хаана.',
      en: 'Corrugated board protects goods from pressure and knocks in transit. Side tuck flaps lock the lid firmly without tape.',
    },
    uses: { mn: ['Онлайн худалдаа', 'Гоо сайхны багц', 'Хувцас'], en: ['Online stores', 'Cosmetics sets', 'Apparel'] },
    material: { mn: 'Атираат картон (E-долгион)', en: 'Corrugated board (E-flute)' },
    thickness: { mn: '1.5 мм', en: '1.5 mm' },
    colors: ['kraft', 'white'],
    gsm: null,
    unit: 'pcs', moq: 50, step: 50,
    sizes: [
      { code: 'MB-20', l: 20, w: 15, h: 8,  price: 1600 },
      { code: 'MB-25', l: 25, w: 20, h: 10, price: 2100 },
      { code: 'MB-30', l: 30, w: 22, h: 12, price: 2700 },
      { code: 'MB-35', l: 35, w: 25, h: 15, price: 3400 },
    ],
    popular: 4,
    sample: true,
    images: [],
  },

  /* ─────────────────────────── Wrapping paper (sample data) ─────────────────────────── */
  {
    id: 'white-wrapping-sheets',
    category: 'wrapping',
    shape: 'sheet',
    name:    { mn: 'Цагаан боодлын цаас, хуудсаар', en: 'White wrapping paper sheets' },
    summary: { mn: 'Бараа ороох, хайрцаг дүүргэх, тавиур доторлоход.', en: 'For wrapping goods, filling boxes and lining shelves.' },
    description: {
      mn: 'Гөлгөр цагаан крафт цаас. 100 хуудсаар боож нийлүүлнэ. Хэвлэлгүй тул тамга, наалтаар өөрийн брэндийг нэмэхэд тохиромжтой.',
      en: 'Smooth white kraft paper, packed in bundles of 100 sheets. Blank, so it takes a stamp or sticker for your brand.',
    },
    uses: { mn: ['Бараа ороох', 'Хайрцаг дүүргэх', 'Тавиур доторлох'], en: ['Wrapping goods', 'Box filling', 'Shelf lining'] },
    material: { mn: 'Цагаан крафт цаас', en: 'White kraft paper' },
    colors: ['white'],
    gsm: [60, 80, 120],
    gsmDefault: 80,
    unit: 'sheet', moq: 100, step: 100,
    sizes: [
      { code: 'WS-5070',  l: 70,  w: 50, price: 220 },
      { code: 'WS-70100', l: 100, w: 70, price: 450 },
    ],
    popular: 8,
    sample: true,
    images: [],
  },
  {
    id: 'kraft-paper-roll',
    category: 'wrapping',
    shape: 'roll',
    name:    { mn: 'Бор крафт цаас, ороодсоор', en: 'Brown kraft paper roll' },
    summary: { mn: 'Том бараа боох, илгээмж савлах, гадаргуу хамгаалахад.', en: 'For wrapping large items, parcels and surface protection.' },
    description: {
      mn: 'Бат бөх, урагдахад тэсвэртэй бор крафт цаас. Нэг ороодос нь 50 метр урттай, картон голтой.',
      en: 'Strong, tear-resistant brown kraft paper. Each roll is 50 metres long on a cardboard core.',
    },
    uses: { mn: ['Илгээмж', 'Тавилга, том бараа', 'Засварын хамгаалалт'], en: ['Parcels', 'Furniture and large goods', 'Protection during renovation'] },
    material: { mn: 'Бор крафт цаас', en: 'Brown kraft paper' },
    colors: ['kraft', 'white'],
    gsm: [70, 90],
    gsmDefault: 70,
    unit: 'roll', moq: 1, step: 1,
    sizes: [
      { code: 'KR-50',  l: 50,  length: 50, d: 12, price: 28000 },
      { code: 'KR-70',  l: 70,  length: 50, d: 12, price: 38000 },
      { code: 'KR-100', l: 100, length: 50, d: 12, price: 52000 },
    ],
    popular: 9,
    sample: true,
    images: [],
  },
  {
    id: 'greaseproof-paper',
    category: 'wrapping',
    shape: 'sheet',
    name:    { mn: 'Тосонд тэсвэртэй цаас', en: 'Greaseproof paper' },
    summary: { mn: 'Бургер, сэндвич, шарсан хоол ороох хүнсний цаас.', en: 'Food paper for wrapping burgers, sandwiches and fried food.' },
    description: {
      mn: 'Тос, чийг нэвтрүүлэхгүй хүнсний цаас. Хоолыг гаргахдаа шууд ороох эсвэл тавиур, сагсанд дэвсэж хэрэглэнэ.',
      en: 'Food-safe paper that holds back grease and moisture. Wrap food directly or use it to line trays and baskets.',
    },
    uses: { mn: ['Бургер, сэндвич', 'Шарсан төмс', 'Тавиур дэвсгэр'], en: ['Burgers and sandwiches', 'Fries', 'Tray liners'] },
    material: { mn: 'Хүнсний тосонд тэсвэртэй цаас', en: 'Food-grade greaseproof paper' },
    colors: ['white', 'kraft'],
    gsm: [40],
    gsmDefault: 40,
    unit: 'sheet', moq: 500, step: 500,
    sizes: [
      { code: 'GP-2535', l: 35, w: 25, price: 45 },
      { code: 'GP-3040', l: 40, w: 30, price: 60 },
      { code: 'GP-3545', l: 45, w: 35, price: 80 },
    ],
    popular: 10,
    sample: true,
    images: [],
  },
  {
    id: 'tissue-paper',
    category: 'wrapping',
    shape: 'sheet',
    name:    { mn: 'Нимгэн боодлын цаас (тишү)', en: 'Tissue wrapping paper' },
    summary: { mn: 'Хувцас, бэлгийг ороож, хайрцаг нээх мөчийг гоё болгоно.', en: 'Wraps clothing and gifts so the box looks finished when opened.' },
    description: {
      mn: 'Зөөлөн, нимгэн цаас. Хувцас, гутал, гоо сайхны бүтээгдэхүүнийг хайрцаг, уутанд хийхийн өмнө ороход хэрэглэнэ.',
      en: 'Soft, thin paper for wrapping clothing, shoes and cosmetics before they go into a box or bag.',
    },
    uses: { mn: ['Хувцас, гутал', 'Бэлгийн хайрцаг', 'Гоо сайхан'], en: ['Clothing and shoes', 'Gift boxes', 'Cosmetics'] },
    material: { mn: 'Нимгэн цаас', en: 'Tissue paper' },
    colors: ['white', 'black'],
    gsm: [17],
    gsmDefault: 17,
    unit: 'sheet', moq: 200, step: 100,
    sizes: [
      { code: 'TS-5070', l: 70, w: 50, price: 90 },
    ],
    popular: 11,
    sample: true,
    images: [],
  },
];
