/**
 * Parametric product drawings (SVG) built from real dimensions in cm.
 *
 *   PK.art.product(spec, opts)        3/4 view of one item. opts.dims = show dimension lines
 *   PK.art.scene(specs, opts)         several items side by side at one common scale
 *   PK.art.front(spec, opts)          flat front elevation
 *   PK.art.overlay(specs, i, opts)    nested front outlines (size guide) with an A4 reference
 *   PK.art.lineup(specs, opts)        front elevations side by side at one scale (compare)
 *
 * spec = { shape: 'bag'|'box'|'sheet'|'roll', handle, lid, l, w, h, length, d, color }
 * Model units are centimetres; the viewBox is fitted afterwards, so drawings scale to any container.
 */
window.PK = window.PK || {};

PK.art = (function () {
  var INK = '#000000';
  var CUT = '#000000';   // dimension lines: monochrome, the product carries the colour
  var RIBBON = '#2A2A2A';
  var FONT = "Inter, system-ui, sans-serif";

  var PAL = {
    white: { front: '#FFFFFF', side: '#E6E8EA', top: '#F4F5F6', inside: '#C9CCCF', insideSide: '#D9DBDE', insideBack: '#EEF0F1', edge: 'rgba(0,0,0,.22)', crease: 'rgba(0,0,0,.12)', handle: '#F2F2EE', handleBack: '#DADCD7', handleEdge: '#AEB2AB', hi: 'rgba(255,255,255,.9)' },
    kraft: { front: '#C9996A', side: '#AD7F54', top: '#D3A576', inside: '#7F5B3B', insideSide: '#93694A', insideBack: '#B88958', edge: 'rgba(58,34,12,.45)', crease: 'rgba(58,34,12,.22)', handle: '#A9784A', handleBack: '#8E6440', handleEdge: '#6E4A2B', hi: 'rgba(255,240,220,.45)' },
    black: { front: '#30333A', side: '#24262B', top: '#3A3D44', inside: '#121316', insideSide: '#1A1B1F', insideBack: '#2A2C31', edge: 'rgba(0,0,0,.7)', crease: 'rgba(255,255,255,.10)', handle: '#3C3F46', handleBack: '#2A2C31', handleEdge: '#111215', hi: 'rgba(255,255,255,.18)' },
  };

  var A1 = 9 * Math.PI / 180;   // front axis: right and slightly down
  var A2 = 38 * Math.PI / 180;  // depth axis: right and up
  var DK = 0.62;                // depth foreshortening
  var C1 = Math.cos(A1), S1 = Math.sin(A1), C2 = Math.cos(A2), S2 = Math.sin(A2);

  var seq = 0;

  /** Handle span and rise (cm). Flat tape handles sit lower than twisted rope handles. */
  function handleDims(L, handle) {
    var hh = clamp(L * 0.3 + 2, 4.5, 11);
    return { span: clamp(L * 0.42, 4.5, 13), hh: handle === 'flat' ? hh * 0.7 : hh };
  }

  /** Project model point (x = length, y = depth, z = height) to screen [x, y]. */
  function P(x, y, z) { return [x * C1 + y * DK * C2, x * S1 - y * DK * S2 - z]; }
  function r2(v) { return Math.round(v * 100) / 100; }
  function ptsAttr(pts) { return pts.map(function (p) { return r2(p[0]) + ',' + r2(p[1]); }).join(' '); }
  function poly(pts, attrs) { return '<polygon points="' + ptsAttr(pts) + '" ' + (attrs || '') + '/>'; }
  function seg(a, b, attrs) { return '<line x1="' + r2(a[0]) + '" y1="' + r2(a[1]) + '" x2="' + r2(b[0]) + '" y2="' + r2(b[1]) + '" ' + (attrs || '') + '/>'; }
  function M(p) { return r2(p[0]) + ' ' + r2(p[1]); }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function esc(s) { return PK.util ? PK.util.esc(s) : String(s); }
  function fmt(n) { return String(Math.round(n * 10) / 10); }
  function stroke(color, px, extra) { return 'stroke="' + color + '" stroke-width="' + px + '" vector-effect="non-scaling-stroke" ' + (extra || ''); }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
  function mul(a, k) { return [a[0] * k, a[1] * k]; }
  function unit(v) { var l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; }

  function bbox(pts) {
    var b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    pts.forEach(function (p) {
      if (p[0] < b.x0) b.x0 = p[0]; if (p[0] > b.x1) b.x1 = p[0];
      if (p[1] < b.y0) b.y0 = p[1]; if (p[1] > b.y1) b.y1 = p[1];
    });
    return b;
  }

  function shadow(id, footprint, size) {
    var c = footprint.reduce(function (acc, p) { return [acc[0] + p[0] / footprint.length, acc[1] + p[1] / footprint.length]; }, [0, 0]);
    var grown = footprint.map(function (p) { return add(add(c, mul(sub(p, c), 1.06)), [size * 0.025, size * 0.012]); });
    return {
      defs: '<filter id="' + id + '" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="' + r2(size * 0.022) + '"/></filter>',
      el: poly(grown, 'fill="' + INK + '" fill-opacity=".16" filter="url(#' + id + ')"'),
    };
  }

  /* ───────────────────────── Builders (3/4 view) ───────────────────────── */

  function buildBag(spec, pal, id) {
    var L = spec.l, H = spec.h, flat = !spec.w;
    var W = spec.w || Math.max(1.2, L * 0.04);
    var handle = spec.handle || 'twisted';
    var notch = flat ? 0 : W * 0.24;
    var hem = Math.min(4, H * 0.12);
    var size = Math.max(L, H);
    var els = [], defs = [], pts = [];

    var foot = [P(0, 0, 0), P(L, 0, 0), P(L, W, 0), P(0, W, 0)];
    var sh = shadow(id + 's', foot, size);
    defs.push(sh.defs); els.push(sh.el);

    var front = [P(0, 0, 0), P(L, 0, 0)];
    if (handle === 'none') {
      // serrated top edge, like a bakery bag
      var teeth = Math.max(6, Math.round(L / 0.9));
      for (var i = teeth; i >= 0; i--) front.push(P(L * i / teeth, 0, H - (i % 2 ? 0.35 : 0)));
    } else {
      front.push(P(L, 0, H), P(0, 0, H));
    }
    var sideMid = P(L, W / 2, H - notch);
    var side = flat ? [P(L, 0, 0), P(L, W, 0), P(L, W, H), P(L, 0, H)]
                    : [P(L, 0, 0), P(L, W, 0), P(L, W, H), sideMid, P(L, 0, H)];
    pts = pts.concat(foot, front, side, [P(0, W, H)]);

    // Opening and inner walls
    if (flat) {
      els.push(poly([P(0, 0, H), P(L, 0, H), P(L, W, H), P(0, W, H)], 'fill="' + pal.top + '" ' + stroke(pal.edge, 1)));
    } else {
      var opening = [P(0, 0, H), P(L, 0, H), sideMid, P(L, W, H), P(0, W, H), P(0, W / 2, H - notch)];
      defs.push('<clipPath id="' + id + 'o"><polygon points="' + ptsAttr(opening) + '"/></clipPath>');
      els.push(poly(opening, 'fill="' + pal.inside + '"'));
      var d = H * 0.55;
      els.push('<g clip-path="url(#' + id + 'o)">' +
        poly([P(0, W, H), P(L, W, H), P(L, W, H - d), P(0, W, H - d)], 'fill="' + pal.insideBack + '"') +
        poly([P(0, 0, H), P(0, W / 2, H - notch), P(0, W, H), P(0, W, H - d), P(0, 0, H - d)], 'fill="' + pal.insideSide + '"') +
        '</g>');
      els.push(poly(opening, 'fill="none" ' + stroke(pal.edge, 1, 'stroke-linejoin="round"')));
    }

    // Handles (back first, then front; the front panel is drawn after so handle roots tuck inside)
    var cx = L / 2, hd = handleDims(L, handle), span = hd.span, hh = hd.hh;
    function handlePath(y) {
      var x0 = cx - span / 2, x1 = cx + span / 2;
      if (handle === 'flat') {
        var rad = Math.min(1.6, span * 0.2);
        return 'M' + M(P(x0, y, H - 0.4)) + ' L' + M(P(x0, y, H + hh - rad)) +
          ' Q' + M(P(x0, y, H + hh)) + ' ' + M(P(x0 + rad, y, H + hh)) +
          ' L' + M(P(x1 - rad, y, H + hh)) + ' Q' + M(P(x1, y, H + hh)) + ' ' + M(P(x1, y, H + hh - rad)) +
          ' L' + M(P(x1, y, H - 0.4));
      }
      return 'M' + M(P(x0, y, H - 0.4)) + ' C' + M(P(x0, y, H + hh * 1.33)) + ' ' + M(P(x1, y, H + hh * 1.33)) + ' ' + M(P(x1, y, H - 0.4));
    }
    function drawHandle(y, fill) {
      var tw = handle === 'flat' ? clamp(L * 0.06, 1.1, 2.2) : clamp(L * 0.022, 0.45, 0.75);
      var d = handlePath(y);
      var s = '<path d="' + d + '" fill="none" stroke="' + pal.handleEdge + '" stroke-width="' + r2(tw + Math.max(0.18, tw * 0.25)) + '" stroke-linecap="' + (handle === 'flat' ? 'butt' : 'round') + '" stroke-linejoin="round"/>' +
              '<path d="' + d + '" fill="none" stroke="' + fill + '" stroke-width="' + r2(tw) + '" stroke-linecap="' + (handle === 'flat' ? 'butt' : 'round') + '" stroke-linejoin="round"/>';
      if (handle === 'twisted') {
        s += '<path d="' + d + '" fill="none" stroke="' + pal.hi + '" stroke-width="' + r2(tw * 0.38) + '" stroke-dasharray="' + r2(tw * 0.8) + ' ' + r2(tw * 0.9) + '" stroke-linecap="round"/>';
      }
      return s;
    }
    if (handle === 'twisted' || handle === 'flat') {
      els.push(drawHandle(W * 0.96, pal.handleBack));
      els.push(drawHandle(0.05, pal.handle));
      pts.push(P(cx - span / 2, W, H + hh + 1), P(cx + span / 2, 0, H + hh + 1));
    }

    // Panels
    els.push(poly(front, 'fill="' + pal.front + '" ' + stroke(pal.edge, 1, 'stroke-linejoin="round"')));
    els.push(poly(side, 'fill="' + pal.side + '" ' + stroke(pal.edge, 1, 'stroke-linejoin="round"')));

    // Folds
    if (!flat) {
      var apex = P(L, W / 2, Math.min(W / 2, H * 0.35));
      els.push('<polyline points="' + ptsAttr([sideMid, apex]) + '" fill="none" ' + stroke(pal.crease, 1) + '/>');
      els.push('<polyline points="' + ptsAttr([P(L, 0, 0), apex, P(L, W, 0)]) + '" fill="none" ' + stroke(pal.crease, 1) + '/>');
    }
    if (handle === 'twisted' || handle === 'flat') {
      els.push(seg(P(0, 0, H - hem), P(L, 0, H - hem), stroke(pal.crease, 1)));
    }

    // Window film
    if (handle === 'window') {
      var wx0 = L * 0.22, wx1 = L * 0.78, wz0 = H * 0.28, wz1 = H * 0.7;
      els.push(poly([P(wx0, 0, wz0), P(wx1, 0, wz0), P(wx1, 0, wz1), P(wx0, 0, wz1)], 'fill="#D6E6EE" fill-opacity=".85" ' + stroke(pal.edge, 1)));
      els.push(seg(P(wx0 + (wx1 - wx0) * 0.18, 0, wz1 - (wz1 - wz0) * 0.12), P(wx0 + (wx1 - wx0) * 0.42, 0, wz0 + (wz1 - wz0) * 0.2), stroke('rgba(255,255,255,.95)', 2, 'stroke-linecap="round"')));
    }

    // Ribbon tie
    if (handle === 'ribbon') {
      var bz = H - Math.min(4, H * 0.12), off = L * 0.07;
      var hole = function (x) { var c = P(x, 0, bz); return '<ellipse cx="' + r2(c[0]) + '" cy="' + r2(c[1]) + '" rx="' + r2(L * 0.012) + '" ry="' + r2(L * 0.012) + '" fill="' + pal.inside + '"/>'; };
      els.push(hole(cx - off) + hole(cx + off));
      var k = P(cx, 0, bz);
      var lw = L * 0.09, lh = L * 0.045;
      var loop = function (dir) {
        var c = add(k, [dir * lw * 0.85, -lh * 0.35]);
        return '<ellipse cx="' + r2(c[0]) + '" cy="' + r2(c[1]) + '" rx="' + r2(lw) + '" ry="' + r2(lh) + '" transform="rotate(' + (dir * -18) + ' ' + r2(c[0]) + ' ' + r2(c[1]) + ')" fill="none" stroke="' + RIBBON + '" stroke-width="' + r2(L * 0.022) + '"/>';
      };
      var tail = function (dir) {
        var a = add(k, [dir * L * 0.01, 0]), b = add(k, [dir * L * 0.07, L * 0.17]);
        return '<path d="M' + M(a) + ' Q' + M(add(k, [dir * L * 0.05, L * 0.08])) + ' ' + M(b) + '" fill="none" stroke="' + RIBBON + '" stroke-width="' + r2(L * 0.022) + '" stroke-linecap="square"/>';
      };
      els.push(tail(-1) + tail(1) + loop(-1) + loop(1) +
        '<rect x="' + r2(k[0] - L * 0.02) + '" y="' + r2(k[1] - L * 0.022) + '" width="' + r2(L * 0.04) + '" height="' + r2(L * 0.044) + '" rx="' + r2(L * 0.01) + '" fill="' + RIBBON + '"/>');
    }

    return {
      els: els, defs: defs, pts: pts, size: size,
      dims: [
        { a: P(0, 0, 0), b: P(0, 0, H), kind: 'v', value: H },
        { a: P(0, 0, 0), b: P(L, 0, 0), kind: 'front', value: L },
        flat ? null : { a: P(L, 0, 0), b: P(L, W, 0), kind: 'depth', value: spec.w },
      ].filter(Boolean),
    };
  }

  function buildBox(spec, pal, id) {
    var L = spec.l, W = spec.w, H = spec.h;
    var size = Math.max(L + W * 0.5, H);
    var els = [], defs = [];
    var foot = [P(0, 0, 0), P(L, 0, 0), P(L, W, 0), P(0, W, 0)];
    var sh = shadow(id + 's', foot, size);
    defs.push(sh.defs); els.push(sh.el);

    var front = [P(0, 0, 0), P(L, 0, 0), P(L, 0, H), P(0, 0, H)];
    var side = [P(L, 0, 0), P(L, W, 0), P(L, W, H), P(L, 0, H)];
    var top = [P(0, 0, H), P(L, 0, H), P(L, W, H), P(0, W, H)];
    els.push(poly(front, 'fill="' + pal.front + '" ' + stroke(pal.edge, 1, 'stroke-linejoin="round"')));
    els.push(poly(side, 'fill="' + pal.side + '" ' + stroke(pal.edge, 1, 'stroke-linejoin="round"')));
    els.push(poly(top, 'fill="' + pal.top + '" ' + stroke(pal.edge, 1, 'stroke-linejoin="round"')));

    if (spec.lid === 'window') {
      var i = 0.2;
      els.push(poly([P(L * i, W * i, H), P(L * (1 - i), W * i, H), P(L * (1 - i), W * (1 - i), H), P(L * i, W * (1 - i), H)], 'fill="#D6E6EE" fill-opacity=".85" ' + stroke(pal.edge, 1)));
      els.push(seg(P(L * 0.3, W * 0.28, H), P(L * 0.45, W * 0.62, H), stroke('rgba(255,255,255,.95)', 2, 'stroke-linecap="round"')));
      els.push(seg(P(0, W * 0.07, H), P(L, W * 0.07, H), stroke(pal.crease, 1)));
    } else {
      // mailer: lid flap over the front with a thumb notch
      var fl = Math.min(1.6, H * 0.18);
      els.push(seg(P(0, 0, H - fl), P(L, 0, H - fl), stroke(pal.crease, 1)));
      els.push(seg(P(L, 0, H - fl), P(L, W * 0.9, H - fl), stroke(pal.crease, 1)));
      var nr = Math.min(1.6, L * 0.06), c = L / 2;
      els.push('<path d="M' + M(P(c - nr, 0, H)) + ' Q' + M(P(c, 0, H - nr * 1.3)) + ' ' + M(P(c + nr, 0, H)) + '" fill="' + pal.side + '" ' + stroke(pal.edge, 1) + '/>');
    }

    return {
      els: els, defs: defs, pts: foot.concat(front, side, top), size: size,
      dims: [
        { a: P(0, 0, 0), b: P(0, 0, H), kind: 'v', value: H },
        { a: P(0, 0, 0), b: P(L, 0, 0), kind: 'front', value: L },
        { a: P(L, 0, 0), b: P(L, W, 0), kind: 'depth', value: W },
      ],
    };
  }

  function buildSheet(spec, pal, id) {
    var L = spec.l, W = spec.w, T = Math.max(0.8, L * 0.022);
    var size = L;
    var els = [], defs = [];
    var foot = [P(0, 0, 0), P(L, 0, 0), P(L, W, 0), P(0, W, 0)];
    var sh = shadow(id + 's', foot, size);
    defs.push(sh.defs); els.push(sh.el);
    var front = [P(0, 0, 0), P(L, 0, 0), P(L, 0, T), P(0, 0, T)];
    var side = [P(L, 0, 0), P(L, W, 0), P(L, W, T), P(L, 0, T)];
    var top = [P(0, 0, T), P(L, 0, T), P(L, W, T), P(0, W, T)];
    els.push(poly(front, 'fill="' + pal.side + '" ' + stroke(pal.edge, 1)));
    els.push(poly(side, 'fill="' + pal.side + '" ' + stroke(pal.edge, 1)));
    [0.33, 0.66].forEach(function (f) {
      els.push('<polyline points="' + ptsAttr([P(0, 0, T * f), P(L, 0, T * f), P(L, W, T * f)]) + '" fill="none" ' + stroke(pal.crease, 1) + '/>');
    });
    els.push(poly(top, 'fill="' + pal.front + '" ' + stroke(pal.edge, 1, 'stroke-linejoin="round"')));
    // lifted corner on the top sheet
    var c = Math.min(L, W) * 0.2;
    els.push(poly([P(L - c, 0, T), P(L, 0, T), P(L, c, T)], 'fill="' + pal.top + '" ' + stroke(pal.crease, 1)));
    els.push(poly([P(L - c, 0, T), P(L, c, T), P(L - c * 0.55, c * 0.55, T + c * 0.45)], 'fill="' + pal.front + '" ' + stroke(pal.edge, 1, 'stroke-linejoin="round"')));
    return {
      els: els, defs: defs, pts: foot.concat(top, [P(L - c * 0.55, c * 0.55, T + c * 0.45)]), size: size,
      dims: [
        { a: P(0, 0, 0), b: P(L, 0, 0), kind: 'front', value: L },
        { a: P(L, 0, 0), b: P(L, W, 0), kind: 'depth', value: W },
      ],
    };
  }

  function buildRoll(spec, pal, id) {
    var Lr = spec.l, r = (spec.d || 12) / 2;
    var size = Lr;
    var els = [], defs = [];
    var tail = r * 1.9;
    var foot = [P(0, -tail, 0), P(Lr, -tail, 0), P(Lr, r, 0), P(0, r, 0)];
    var sh = shadow(id + 's', foot, size);
    defs.push(sh.defs); els.push(sh.el);

    function cap(x, rr) {
      var out = [];
      for (var i = 0; i < 64; i++) {
        var t = (i / 64) * Math.PI * 2;
        out.push(P(x, rr * Math.cos(t), r + rr * Math.sin(t)));
      }
      return out;
    }
    // unrolled tongue of paper lying on the ground, in front of the roll
    els.push(poly([P(0, -tail, 0), P(Lr, -tail, 0), P(Lr, 0, 0), P(0, 0, 0)], 'fill="' + pal.front + '" ' + stroke(pal.edge, 1)));

    var left = cap(0, r), right = cap(Lr, r);
    var axis = unit(sub(P(1, 0, 0), P(0, 0, 0)));
    var n = [-axis[1], axis[0]];
    function ext(list, sign) {
      var best = list[0], bv = -Infinity;
      list.forEach(function (p) { var v = sign * (p[0] * n[0] + p[1] * n[1]); if (v > bv) { bv = v; best = p; } });
      return best;
    }
    var lTop = ext(left, -1), lBot = ext(left, 1), rTop = ext(right, -1), rBot = ext(right, 1);
    defs.push('<linearGradient id="' + id + 'g" gradientUnits="userSpaceOnUse" x1="' + r2(lTop[0]) + '" y1="' + r2(lTop[1]) + '" x2="' + r2(lBot[0]) + '" y2="' + r2(lBot[1]) + '">' +
      '<stop offset="0" stop-color="' + pal.top + '"/><stop offset=".45" stop-color="' + pal.front + '"/><stop offset="1" stop-color="' + pal.side + '"/></linearGradient>');
    els.push(poly(left, 'fill="' + pal.side + '" ' + stroke(pal.edge, 1)));
    els.push(poly([lTop, rTop, rBot, lBot], 'fill="url(#' + id + 'g)"'));
    els.push(seg(lTop, rTop, stroke(pal.edge, 1)) + seg(lBot, rBot, stroke(pal.edge, 1)));
    els.push(poly(right, 'fill="' + pal.top + '" ' + stroke(pal.edge, 1)));
    [0.78, 0.56].forEach(function (f) { els.push(poly(cap(Lr, r * f), 'fill="none" ' + stroke(pal.crease, 1))); });
    els.push(poly(cap(Lr, r * 0.32), 'fill="#9C7046" ' + stroke('rgba(58,34,12,.5)', 1)));
    els.push(poly(cap(Lr, r * 0.22), 'fill="#3B2A1C"'));

    return {
      els: els, defs: defs, pts: foot.concat(left, right), size: size,
      dims: [{ a: P(0, -tail, 0), b: P(Lr, -tail, 0), kind: 'front', value: Lr }],
    };
  }

  function build(spec, id) {
    var pal = PAL[spec.color] || PAL.white;
    if (spec.shape === 'box') return buildBox(spec, pal, id);
    if (spec.shape === 'sheet') return buildSheet(spec, pal, id);
    if (spec.shape === 'roll') return buildRoll(spec, pal, id);
    return buildBag(spec, pal, id);
  }

  /* ───────────────────────── Dimension lines ───────────────────────── */

  function dimsLayer(dims, fs, gap) {
    var els = [], pts = [];
    var unitLabel = PK.t ? PK.t('common.cm') : 'cm';
    dims.forEach(function (d) {
      var off, dir = unit(sub(d.b, d.a));
      if (d.kind === 'v') off = [-gap, 0];
      else if (d.kind === 'front') off = mul([-dir[1], dir[0]], gap);   // below the front edge
      else off = mul([-dir[1], dir[0]], -gap);                          // below-right of the depth edge
      if (d.kind === 'depth' && off[1] < 0) off = mul(off, -1);
      var a2 = add(d.a, off), b2 = add(d.b, off);
      var ou = unit(off);
      var ext = function (p) { return seg(add(p, mul(ou, gap * 0.2)), add(p, mul(ou, gap * 1.15)), stroke(CUT, 1, 'stroke-dasharray="3 3" opacity=".7"')); };
      var tickV = mul(unit(add(dir, ou)), fs * 0.32);
      var tick = function (p) { return seg(sub(p, tickV), add(p, tickV), stroke(CUT, 1.6)); };
      els.push('<g class="art-dim">' + ext(d.a) + ext(d.b) + seg(a2, b2, stroke(CUT, 1.4, 'class="art-dim-line"')) + tick(a2) + tick(b2));
      var mid = mul(add(a2, b2), 0.5);
      var label = fmt(d.value) + ' ' + unitLabel;
      var halo = 'paint-order="stroke" stroke="#fff" stroke-width="' + r2(fs * 0.28) + '" stroke-linejoin="round"';
      var tAttrs = 'font-family="' + FONT + '" font-size="' + r2(fs) + '" font-weight="600" letter-spacing="0" fill="' + CUT + '" ' + halo;
      if (d.kind === 'v') {
        var tp = add(mid, [-fs * 0.45, 0]);
        els.push('<text x="' + r2(tp[0]) + '" y="' + r2(tp[1]) + '" text-anchor="end" dominant-baseline="middle" ' + tAttrs + '>' + esc(label) + '</text></g>');
        pts.push(add(tp, [-fs * label.length * 0.58, fs]), add(tp, [0, -fs]));
      } else {
        var ang = Math.atan2(dir[1], dir[0]) * 180 / Math.PI;
        if (ang > 90 || ang < -90) ang += 180;
        var tp2 = add(mid, mul(ou, fs * 0.95));
        els.push('<text x="' + r2(tp2[0]) + '" y="' + r2(tp2[1]) + '" text-anchor="middle" dominant-baseline="middle" transform="rotate(' + r2(ang) + ' ' + r2(tp2[0]) + ' ' + r2(tp2[1]) + ')" ' + tAttrs + '>' + esc(label) + '</text></g>');
        var half = fs * label.length * 0.3;
        pts.push(add(tp2, [-half, -fs]), add(tp2, [half, fs]));
      }
      pts.push(a2, b2);
    });
    return { els: els, pts: pts };
  }

  /* ───────────────────────── SVG wrapper ───────────────────────── */

  function svg(content, defs, b, pad, opts) {
    var x = b.x0 - pad, y = b.y0 - pad, w = b.x1 - b.x0 + pad * 2, h = b.y1 - b.y0 + pad * 2;
    var label = opts.label ? ' role="img" aria-label="' + esc(opts.label) + '"' : ' aria-hidden="true"';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + r2(x) + ' ' + r2(y) + ' ' + r2(w) + ' ' + r2(h) + '" preserveAspectRatio="xMidYMid meet" class="' + (opts.className || 'w-full h-full') + '"' + label + '>' +
      (defs.length ? '<defs>' + defs.join('') + '</defs>' : '') + content + '</svg>';
  }

  /* ───────────────────────── Public API ───────────────────────── */

  function product(spec, opts) {
    opts = opts || {};
    var id = 'pk' + (++seq);
    var m = build(spec, id);
    var all = m.pts.slice();
    var content = m.els.join('');
    var b0 = bbox(all);
    var extent = Math.max(b0.x1 - b0.x0, b0.y1 - b0.y0);
    if (opts.dims) {
      var fs = extent * 0.052, gap = extent * 0.075;
      var dl = dimsLayer(m.dims, fs, gap);
      content += '<g class="art-dims">' + dl.els.join('') + '</g>';
      all = all.concat(dl.pts);
    }
    return svg(content, m.defs, bbox(all), extent * (opts.pad != null ? opts.pad : 0.1), opts);
  }

  /** Several items at a common scale, standing in a row. opts.dimsIndex shows dimensions on one item. */
  function scene(specs, opts) {
    opts = opts || {};
    var cursor = 0, content = '', defs = [], all = [];
    var models = specs.map(function (s) { return build(s, 'pk' + (++seq)); });
    var maxExtent = Math.max.apply(null, models.map(function (m) { var b = bbox(m.pts); return Math.max(b.x1 - b.x0, b.y1 - b.y0); }));
    var gapX = maxExtent * (opts.gap != null ? opts.gap : 0.12);
    models.forEach(function (m, i) {
      var b = bbox(m.pts);
      var dx = cursor - b.x0;
      var inner = m.els.join('');
      var pts = m.pts;
      if (opts.dimsIndex === i) {
        var dl = dimsLayer(m.dims, maxExtent * 0.05, maxExtent * 0.07);
        inner += '<g class="art-dims">' + dl.els.join('') + '</g>';
        pts = pts.concat(dl.pts);
      }
      content += '<g transform="translate(' + r2(dx) + ' 0)">' + inner + '</g>';
      defs = defs.concat(m.defs);
      all = all.concat(pts.map(function (p) { return [p[0] + dx, p[1]]; }));
      cursor += (b.x1 - b.x0) + gapX;
    });
    return svg(content, defs, bbox(all), maxExtent * 0.08, opts);
  }

  /** Front outline path (2D, y up is negative) used by overlay / lineup / front view. */
  function frontOutline(spec) {
    var L = spec.l, H = spec.shape === 'sheet' ? spec.w : spec.shape === 'roll' ? (spec.d || 12) : spec.h;
    var body = 'M0 0 H' + r2(L) + ' V' + r2(-H) + ' H0 Z';
    var handle = '';
    var top = -H;
    if (spec.shape === 'bag' && (spec.handle === 'twisted' || spec.handle === 'flat')) {
      var hd = handleDims(L, spec.handle), span = hd.span, hh = hd.hh, x0 = L / 2 - span / 2, x1 = L / 2 + span / 2;
      handle = spec.handle === 'flat'
        ? 'M' + r2(x0) + ' ' + r2(-H) + ' V' + r2(-H - hh) + ' H' + r2(x1) + ' V' + r2(-H)
        : 'M' + r2(x0) + ' ' + r2(-H) + ' C' + r2(x0) + ' ' + r2(-H - hh * 1.33) + ' ' + r2(x1) + ' ' + r2(-H - hh * 1.33) + ' ' + r2(x1) + ' ' + r2(-H);
      top = -H - hh;
    }
    return { body: body, handle: handle, L: L, H: H, top: top };
  }

  /** Flat front elevation of a single item, with optional dimensions. */
  function front(spec, opts) {
    opts = opts || {};
    var pal = PAL[spec.color] || PAL.white;
    var o = frontOutline(spec);
    var extent = Math.max(o.L, -o.top);
    var content = '<path d="' + o.body + '" fill="' + pal.front + '" ' + stroke(INK, 1.2) + '/>';
    if (o.handle) content += '<path d="' + o.handle + '" fill="none" stroke="' + pal.handleEdge + '" stroke-width="' + r2(spec.handle === 'flat' ? clamp(o.L * 0.06, 1.1, 2.2) : clamp(o.L * 0.022, 0.45, 0.75)) + '" stroke-linecap="round"/>';
    if (spec.shape === 'bag' && spec.w) content += seg([0, -Math.min(4, o.H * 0.12)], [o.L, -Math.min(4, o.H * 0.12)], stroke(pal.crease, 1));
    var pts = [[0, 0], [o.L, 0], [0, o.top], [o.L, o.top]];
    if (opts.dims) {
      var fs = extent * 0.055, gap = extent * 0.08;
      var dl = dimsLayer([
        { a: [0, 0], b: [0, -o.H], kind: 'v', value: o.H },
        { a: [0, 0], b: [o.L, 0], kind: 'front', value: o.L },
      ], fs, gap);
      content += '<g class="art-dims">' + dl.els.join('') + '</g>';
      pts = pts.concat(dl.pts);
    }
    return svg(content, [], bbox(pts), extent * 0.1, opts);
  }

  function a4(x) {
    var w = 21, h = 29.7;
    return {
      el: '<g><rect x="' + r2(x) + '" y="' + r2(-h) + '" width="' + w + '" height="' + h + '" fill="none" ' + stroke(INK, 1, 'stroke-dasharray="5 4" opacity=".45"') + '/>' +
        '<text x="' + r2(x + w / 2) + '" y="' + r2(-h / 2) + '" text-anchor="middle" dominant-baseline="middle" font-family="' + FONT + '" font-size="3.2" font-weight="600" fill="' + INK + '" opacity=".45">A4</text></g>',
      pts: [[x, 0], [x + w, -h]],
    };
  }

  /** Nested front outlines of all sizes; `selected` index drawn in magenta with dimensions. */
  function overlay(specs, selected, opts) {
    opts = opts || {};
    var outlines = specs.map(frontOutline);
    var maxL = Math.max.apply(null, outlines.map(function (o) { return o.L; }));
    var minTop = Math.min.apply(null, outlines.map(function (o) { return o.top; }));
    var extent = Math.max(maxL, -minTop, 30);
    var ref = a4(0);
    var content = ref.el;
    var pts = ref.pts.slice();
    outlines.forEach(function (o, i) {
      if (i === selected) return;
      content += '<path d="' + o.body + '" fill="none" ' + stroke(INK, 1, 'opacity=".22"') + '/>';
      pts.push([o.L, 0], [0, o.top]);
    });
    var s = outlines[selected];
    if (s) {
      content += '<path d="' + s.body + '" fill="' + CUT + '" fill-opacity=".07" ' + stroke(CUT, 2) + '/>';
      if (s.handle) content += '<path d="' + s.handle + '" fill="none" ' + stroke(CUT, 2) + '/>';
      var dl = dimsLayer([
        { a: [s.L, 0], b: [s.L, -s.H], kind: 'v', value: s.H },
        { a: [0, 0], b: [s.L, 0], kind: 'front', value: s.L },
      ].map(function (d) { return d; }), extent * 0.045, extent * 0.06);
      // put the height dimension on the right side of the selected outline
      content += '<g class="art-dims" transform="translate(' + r2(extent * 0.12) + ' 0)">' + dl.els[0] + '</g>' + '<g class="art-dims">' + dl.els[1] + '</g>';
      pts = pts.concat(dl.pts.map(function (p) { return [p[0] + extent * 0.12, p[1]]; }), dl.pts);
      pts.push([s.L, 0], [0, s.top]);
    }
    content = seg([-extent * 0.05, 0], [maxL + extent * 0.08, 0], stroke(INK, 1, 'opacity=".35"')) + content;
    return svg(content, [], bbox(pts), extent * 0.05, opts);
  }

  /** Front elevations side by side at a common scale, with an A4 sheet first for reference. */
  function lineup(specs, opts) {
    opts = opts || {};
    var outlines = specs.map(frontOutline);
    var maxDim = Math.max.apply(null, outlines.map(function (o) { return Math.max(o.L, -o.top); }).concat([29.7]));
    var gap = maxDim * 0.18;
    var fs = maxDim * 0.06;
    var ref = a4(0);
    var content = ref.el, pts = ref.pts.slice();
    var x = 21 + gap;
    outlines.forEach(function (o, i) {
      var spec = specs[i], pal = PAL[spec.color] || PAL.white;
      content += '<g transform="translate(' + r2(x) + ' 0)"><path d="' + o.body + '" fill="' + pal.front + '" ' + stroke(INK, 1.2) + '/>';
      if (o.handle) content += '<path d="' + o.handle + '" fill="none" ' + stroke(INK, 1.2) + '/>';
      content += '<text x="' + r2(o.L / 2) + '" y="' + r2(fs * 1.5) + '" text-anchor="middle" font-family="' + FONT + '" font-size="' + r2(fs) + '" font-weight="600" fill="' + INK + '">' + (i + 1) + '</text></g>';
      pts.push([x, 0], [x + o.L, o.top], [x + o.L / 2, fs * 2]);
      x += o.L + gap;
    });
    content = seg([-gap * 0.3, 0], [x - gap * 0.7, 0], stroke(INK, 1, 'opacity=".35"')) + content;
    return svg(content, [], bbox(pts), maxDim * 0.06, opts);
  }

  return { product: product, scene: scene, front: front, overlay: overlay, lineup: lineup, PAL: PAL };
})();
