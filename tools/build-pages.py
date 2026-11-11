#!/usr/bin/env python3
"""
Generates the static HTML pages from one shared shell.

    python3 tools/build-pages.py

Each page = shared <head> + header/footer placeholders + page body + scripts.
Elements with data-i18n="key" get their Mongolian text filled in here (read
from assets/js/core/i18n.js) so pages have readable content before JS runs;
the browser then swaps in the visitor's language.
"""
import html
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent / 'public'
I18N = (ROOT / 'assets/js/core/i18n.js').read_text(encoding='utf-8')
MN_BLOCK = I18N.split('mn: {', 1)[1].split('\n    en: {', 1)[0]
MN = {k: v.replace("\\'", "'") for k, v in re.findall(r"'([\w.]+)':\s*'((?:[^'\\]|\\.)*)'", MN_BLOCK)}

CORE_SCRIPTS = [
    'assets/js/config.js',
    'assets/js/data/templates.js',
    'assets/js/data/catalog.js',
    'assets/js/core/catalog-store.js',
    'assets/js/core/i18n.js',
    'assets/js/core/util.js',
    'assets/js/core/shop.js',
    'assets/js/core/store.js',
    'assets/js/core/art.js',
    'assets/js/core/layout.js',
]

SHELL = '''<!doctype html>
<html lang="mn">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title} | Package.mgl</title>
  <meta name="description" content="{description}">
  <meta name="theme-color" content="#ffffff">
  <link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;display=swap">
  <link rel="stylesheet" href="assets/css/styles.css">
</head>
<body data-page="{page}" data-title="{title_key}">
  <div id="site-header" class="sticky top-0 z-40 min-h-[65px]"></div>

{body}

  <div id="site-footer"></div>

{scripts}
</body>
</html>
'''


def fill_i18n(body: str) -> str:
    """Insert Mongolian fallback text into empty data-i18n elements."""
    def repl(m):
        key = m.group(2)
        text = html.escape(MN.get(key, ''), quote=False)
        return f'{m.group(1)}{text}{m.group(3)}'
    return re.sub(r'(<[^>]*data-i18n="([\w.]+)"[^>]*>)(</)', repl, body)


def build(name, page, title_key, description, body, page_script):
    scripts = '\n'.join(f'  <script src="{s}" defer></script>' for s in CORE_SCRIPTS + [f'assets/js/pages/{page_script}'])
    out = SHELL.format(title=html.escape(MN[title_key]), description=html.escape(description), page=page,
                       title_key=title_key, body=fill_i18n(body.strip('\n')), scripts=scripts)
    (ROOT / name).write_text(out, encoding='utf-8')
    print('wrote', name)


BREADCRUMB = '<nav aria-label="Breadcrumb" class="text-sm text-muted"><ol class="flex flex-wrap items-center gap-1.5" id="breadcrumb"></ol></nav>'

# ───────────────────────────── Home ─────────────────────────────
HOME = '''  <main id="main">
    <section class="bg-canvas" aria-labelledby="hero-h">
      <div class="container-page flex flex-col items-center pb-14 pt-10 text-center sm:pb-16 sm:pt-14">
        <div id="constellation" class="flex w-full items-end justify-center" aria-label=""></div>
        <h1 id="hero-h" class="mt-10 max-w-2xl text-[30px] font-semibold leading-[1.08] sm:text-[42px]" style="letter-spacing:-0.05em" data-i18n="hero.title"></h1>
        <form id="hero-search" role="search" class="relative mt-6 w-full max-w-xl" novalidate>
          <label for="hero-q" class="sr-only" data-i18n="search.label"></label>
          <input id="hero-q" name="q" type="search" autocomplete="off" class="field-input h-14 pl-6 pr-16 text-base shadow-pill" data-i18n-placeholder="hero.search">
          <button type="submit" class="btn-search absolute right-1.5 top-1.5 h-11 w-11" data-i18n-aria-label="search.label"><svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
        </form>
        <nav id="hero-pills" class="mt-5 flex flex-wrap justify-center gap-2" data-i18n-aria-label="home.categories"></nav>
      </div>
    </section>

    <section class="container-page pt-16" id="finder" aria-labelledby="finder-h">
      <form id="finder-form" class="panel flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-end md:gap-6" novalidate>
        <div class="md:w-52 md:shrink-0 md:self-center">
          <h2 id="finder-h" class="h-section" data-i18n="finder.title"></h2>
          <p class="mt-1 text-sm text-muted" data-i18n="finder.hint"></p>
        </div>
        <div class="grid flex-1 grid-cols-3 gap-3">
          <div><label for="fl" class="field-label text-[13px] font-normal text-muted" data-i18n="dim.l"></label><input id="fl" name="fl" type="number" inputmode="decimal" min="0" step="0.5" placeholder="20" class="field-input tnum"></div>
          <div><label for="fw" class="field-label text-[13px] font-normal text-muted" data-i18n="dim.w"></label><input id="fw" name="fw" type="number" inputmode="decimal" min="0" step="0.5" placeholder="10" class="field-input tnum"></div>
          <div><label for="fh" class="field-label text-[13px] font-normal text-muted" data-i18n="dim.h"></label><input id="fh" name="fh" type="number" inputmode="decimal" min="0" step="0.5" placeholder="25" class="field-input tnum"></div>
        </div>
        <button type="submit" class="btn btn-primary" data-i18n="finder.submit"></button>
      </form>
    </section>

    <section class="container-page pt-16" id="categories" aria-labelledby="cat-h">
      <a href="products.html" class="group inline-flex items-center gap-1"><h2 id="cat-h" class="h-section" data-i18n="home.categories"></h2><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></a>
      <div id="category-grid" class="mt-6 grid gap-4 sm:grid-cols-3"></div>
    </section>

    <section class="container-page pt-16" id="popular" aria-labelledby="pop-h">
      <a href="products.html" class="group inline-flex items-center gap-1"><h2 id="pop-h" class="h-section" data-i18n="home.popular"></h2><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></a>
      <div id="popular-grid" class="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"></div>
    </section>

    <section class="container-page pt-16" aria-labelledby="custom-h">
      <div class="panel flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h2 id="custom-h" class="h-section" data-i18n="custom.title"></h2>
          <p class="mt-1.5 text-muted" data-i18n="custom.body"></p>
        </div>
        <a href="contact.html?topic=custom" class="btn btn-primary shrink-0" data-i18n="custom.cta"></a>
      </div>
    </section>

    <section class="container-page grid gap-6 pt-16 lg:grid-cols-[1.25fr_1fr]" id="about" aria-labelledby="about-h">
      <div class="py-2">
        <h2 id="about-h" class="h-section" data-i18n="about.title"></h2>
        <p class="mt-3 max-w-prose text-[17px] leading-relaxed" data-i18n="about.p1"></p>
        <dl class="mt-6 grid grid-cols-3 gap-3">
          <div class="tile flex flex-col-reverse justify-end gap-1 p-4"><dt class="text-[13px] leading-snug text-muted" data-i18n="about.f1l"></dt><dd class="h-section tnum" data-i18n="about.f1v"></dd></div>
          <div class="tile flex flex-col-reverse justify-end gap-1 p-4"><dt class="text-[13px] leading-snug text-muted" data-i18n="about.f2l"></dt><dd class="h-section tnum" data-i18n="about.f2v"></dd></div>
          <div class="tile flex flex-col-reverse justify-end gap-1 p-4"><dt class="text-[13px] leading-snug text-muted" data-i18n="about.f3l"></dt><dd class="h-section tnum" data-i18n="about.f3v"></dd></div>
        </dl>
      </div>
      <div class="panel p-6 sm:p-8" id="home-contact"></div>
    </section>
  </main>'''

# ───────────────────────────── Catalog ─────────────────────────────
CATALOG = '''  <main id="main" class="container-page pt-6">
    ''' + BREADCRUMB + '''
    <div class="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
      <h1 id="catalog-title" class="h-page" data-i18n="catalog.title"></h1>
      <p id="result-count" class="text-muted tnum" aria-live="polite"></p>
    </div>
    <div class="mt-6 grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside id="filters" class="hidden lg:block" aria-labelledby="filters-h"></aside>
      <div>
        <div class="flex flex-wrap items-center gap-3 border-b border-line pb-4">
          <button type="button" id="filters-open" class="btn btn-secondary btn-sm lg:hidden" aria-controls="filters" aria-expanded="false"></button>
          <div class="inline-flex rounded-full border border-line bg-white p-1 shadow-pill" role="group" id="view-toggle"></div>
          <div class="ml-auto flex items-center gap-2">
            <label for="sort" class="hidden text-sm text-muted sm:block" data-i18n="catalog.sort"></label>
            <select id="sort" class="field-input h-10 w-auto py-0 pr-10 text-sm"></select>
          </div>
          <div id="active-filters" class="flex w-full flex-wrap gap-2 empty:hidden"></div>
        </div>
        <div id="results" class="mt-6"></div>
      </div>
    </div>
  </main>'''

PRODUCT = '''  <main id="main" class="container-page pt-6">
    ''' + BREADCRUMB + '''
    <div id="product-root" class="mt-5"></div>
  </main>'''

COMPARE = '''  <main id="main" class="container-page pt-6">
    ''' + BREADCRUMB + '''
    <h1 class="h-page mt-4" data-i18n="compare.title"></h1>
    <div id="compare-root" class="mt-6"></div>
  </main>'''

CART = '''  <main id="main" class="container-page pt-6">
    ''' + BREADCRUMB + '''
    <div class="mt-4 flex items-baseline gap-4">
      <h1 class="h-page" data-i18n="cart.title"></h1>
      <p id="cart-count" class="text-muted tnum"></p>
    </div>
    <div id="cart-root" class="mt-6"></div>
  </main>'''

CHECKOUT = '''  <main id="main" class="container-page pt-6">
    ''' + BREADCRUMB + '''
    <h1 id="checkout-title" class="h-page mt-4" data-i18n="checkout.title"></h1>
    <div id="checkout-root" class="mt-6"></div>
  </main>'''

ACCOUNT = '''  <main id="main" class="container-page pt-6">
    ''' + BREADCRUMB + '''
    <div id="account-root" class="mt-4"></div>
  </main>'''

CONTACT = '''  <main id="main" class="container-page pt-6">
    ''' + BREADCRUMB + '''
    <div class="mt-4 grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-14">
      <div>
        <h1 class="h-page" data-i18n="contact.title"></h1>
        <p class="mt-3 max-w-prose leading-relaxed text-muted" data-i18n="contact.sub"></p>
        <div id="contact-root" class="mt-8"></div>
      </div>
      <aside id="contact-direct" class="lg:pt-14"></aside>
    </div>
  </main>'''

PAGES = [
    ('index.html', 'home', 'meta.home', 'Цаасан уут, хайрцаг, боодлын цаасыг бэлэн хэмжээгээр нь онлайнаар захиална. Улаанбаатарт 1–2 хоногт хүргэнэ.', HOME, 'home.js'),
    ('products.html', 'products', 'meta.products', 'Цаасан уут, хайрцаг, боодлын цаасны бүх хэмжээ, үнэ. Хэмжээгээр нь шүүж, харьцуулж захиална.', CATALOG, 'catalog.js'),
    ('product.html', 'product', 'meta.products', 'Хэмжээ, цаасны зузаан, өнгө, тоо ширхгээ сонгоод захиална.', PRODUCT, 'product.js'),
    ('compare.html', 'compare', 'meta.compare', 'Сонгосон хэмжээнүүдийг бодит харьцаагаар нь харьцуулах.', COMPARE, 'compare.js'),
    ('cart.html', 'cart', 'meta.cart', 'Таны сагс.', CART, 'cart.js'),
    ('checkout.html', 'checkout', 'meta.checkout', 'Захиалга баталгаажуулах.', CHECKOUT, 'checkout.js'),
    ('account.html', 'account', 'meta.account', 'Нэвтрэх, бүртгүүлэх, өмнөх захиалгаа харах.', ACCOUNT, 'account.js'),
    ('contact.html', 'contact', 'meta.contact', 'Холбоо барих, үнийн санал авах.', CONTACT, 'contact.js'),
]

if __name__ == '__main__':
    for args in PAGES:
        build(*args)
