/**
 * Cutting-die templates (Хэв) — transcribed from the company spreadsheet.
 *
 * Columns in the source sheet:
 *   Хэвний нэр → code      (die / template name; normalised to T001…T036, original kept in `src`)
 *   Өндөр      → h         finished height, cm
 *   Урт        → l         finished length (front width), cm
 *   Өргөн      → w         finished width (side gusset / depth), cm
 *   Формат     → format    flat blank size [a, b], cm (single sheet, or one half for two-piece bags)
 *   (note col) → note      'hiih' | 'bantiktai tor' (ribbon tie) | 'tsonkhtoi' (with window)
 *
 * To add or change a die: edit one row here. Products reference templates by `code`.
 */
window.PK = window.PK || {};

PK.TEMPLATES = [
  { code: 'T001', src: 't001', h: 31.5, l: 32.5, w: 12,   format: [51, 46] },
  { code: 'T002', src: 't002', h: 16,   l: 22,   w: 11,   format: [67.5, 27.5] },
  { code: 'T003', src: 't003', h: 32,   l: 30,   w: 8,    format: [45.5, 39.5] },
  { code: 'T004', src: 't4',   h: 32,   l: 15,   w: 15,   format: [61.7, 47] },
  { code: 'T005', src: 't5',   h: 42,   l: 29.5, w: 13,   format: [44.5, 58] },
  { code: 'T006', src: 't6',   h: 22,   l: 14.5, w: 9.5,  format: null, note: 'hiih' },
  { code: 'T007', src: 't007', h: 41,   l: 32,   w: 16,   format: [51.5, 50] },
  { code: 'T008', src: 't8',   h: 23,   l: 23,   w: 10,   format: [35, 67.5] },
  { code: 'T009', src: 't009', h: 31,   l: 40.5, w: 13,   format: [43, 55.6] },
  { code: 'T010', src: 't010', h: 24,   l: 18,   w: 10,   format: [36, 38] },
  { code: 'T011', src: 't011', h: 20,   l: 25,   w: 12.5, format: [39.5, 32] },
  { code: 'T012', src: 't012', h: 25,   l: 24.5, w: 9,    format: [68.5, 36.7] },
  { code: 'T013', src: 't013', h: 18,   l: 16,   w: 8,    format: [49.5, 27] },
  { code: 'T014', src: 't14',  h: 15,   l: 10,   w: 5,    format: [22, 31] },
  { code: 'T015', src: 't015', h: 18,   l: 18,   w: 18,   format: [27, 37] },
  { code: 'T016', src: 't016', h: 19,   l: 21,   w: 7,    format: [26.5, 58] },
  { code: 'T017', src: 't017', h: 35.5, l: 44,   w: 16,   format: [62, 50] },
  { code: 'T018', src: 't018', h: 25,   l: 19,   w: 6,    format: [51.7, 35] },
  { code: 'T019', src: 't019', h: 23,   l: 32,   w: 9.6,  format: [43, 35] },
  { code: 'T020', src: 't020', h: 22,   l: 17,   w: 7,    format: [50, 33.5] },
  { code: 'T021', src: 't021', h: 22,   l: 27.5, w: 8,    format: [72.5, 30] },
  { code: 'T022', src: 't022', h: 21,   l: 15,   w: 9,    format: [49, 31], note: 'hiih' },
  { code: 'T023', src: 't023', h: 29,   l: 20.5, w: 7,    format: [40, 56.5] },
  { code: 'T024', src: 't024', h: 23,   l: 32,   w: 11,   format: [45, 35] },
  { code: 'T025', src: 't025', h: 20,   l: 29,   w: 7,    format: [72, 29.5], note: 'hiih' },
  { code: 'T026', src: 't026', h: 34,   l: 38,   w: null, format: [40, 56], note: 'bantiktai tor' },
  { code: 'T027', src: 't027', h: 12,   l: 15,   w: 7,    format: [45, 20] },
  { code: 'T028', src: 't028', h: 32,   l: 24,   w: 11,   format: [71.5, 44.5] },
  { code: 'T029', src: 't029', h: 15,   l: 12.5, w: 8,    format: [42.3, 23] },
  { code: 'T030', src: 't030', h: 34,   l: 26,   w: 17,   format: [48, 44.5] },
  { code: 'T031', src: 't031', h: 27,   l: 30,   w: 12,   format: [44, 38.5] },
  { code: 'T032', src: 't032', h: 11,   l: 11,   w: 6,    format: [35.5, 18], note: 'tsonkhtoi' },
  { code: 'T033', src: 't033', h: 33,   l: 48.5, w: 14.5, format: [64.5, 50] },
  { code: 'T034', src: 't34',  h: 33,   l: 20,   w: 10,   format: [62, 44] },
  { code: 'T035', src: 't35',  h: 22,   l: 18,   w: 10,   format: [58.5, 37] },
  { code: 'T036', src: 't36',  h: 40,   l: 33,   w: 15,   format: [54.5, 49] },
];

/** Quick lookup: PK.TEMPLATE_BY_CODE.T001 */
PK.TEMPLATE_BY_CODE = PK.TEMPLATES.reduce(function (acc, t) { acc[t.code] = t; return acc; }, {});
