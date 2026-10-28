/* =====================================================================
   Hueline catalogue: one source of truth for index.html and product.html.
   Womenswear only. Every image is original and lives in /assets.
   To add a shot: save it as assets/<name>.jpg, add <name> to ASSETS,
   then put <name> in the product's image list below.
   ===================================================================== */
(function () {
  const pad = n => String(n).padStart(2, '0');

  const PALETTE = {
    Orchid: '#c2378a', Cobalt: '#2b3fd6', Marigold: '#f0a21a', Lagoon: '#13807a',
    Plum: '#3b1f3a', Poppy: '#e46d2f', Indigo: '#3a4a7a', Chalk: '#d9d6cf', Ink: '#16141a'
  };

  // [name, fabric, price (INR), colour, [images: main first]]
  const STYLES = {
    tailoring: { code: 'T', label: 'Tailoring', tint: '#2b3fd6', items: [
      ['Cobalt wrap overcoat', 'Double-faced cashmere', 62000, 'Cobalt', ['look-01']],
      ['Cobalt trouser suit', 'Super 120s wool', 54000, 'Cobalt', ['p-t-02']],
      ['Marigold soft blazer', 'Linen-silk, 210 g/m²', 33500, 'Marigold', ['p-t-03']],
      ['Chalk belted trench', 'Cotton gabardine', 41000, 'Chalk', ['p-t-04']] ] },
    street: { code: 'S', label: 'Streetwear', tint: '#13807a', items: [
      ['Dyed loop-back hoodie', 'Organic cotton, 420 g/m²', 9800, 'Lagoon', ['mood-street']],
      ['Lagoon fleece set', 'Brushed fleece', 10500, 'Lagoon', ['look-04']],
      ['Orchid boxy tee', 'Combed cotton, 240 g/m²', 4200, 'Orchid', ['p-s-03']],
      ['Poppy cargo trouser', 'Ripstop cotton', 12800, 'Poppy', ['p-s-04']] ] },
    evening: { code: 'E', label: 'Evening', tint: '#c2378a', items: [
      ['Bias-cut slip dress', 'Mulberry silk, 19 momme', 29000, 'Orchid', ['look-02']],
      ['Cobalt column gown', 'Silk crepe de chine', 48000, 'Cobalt', ['p-e-02']],
      ['Orchid halter dress', 'Silk satin', 36500, 'Orchid', ['mood-evening']],
      ['Plum draped midi', 'Silk georgette', 31500, 'Plum', ['p-e-04']] ] },
    knit: { code: 'K', label: 'Knitwear', tint: '#f0a21a', items: [
      ['Marigold cardigan set', 'Lambswool', 16800, 'Marigold', ['look-03']],
      ['Orchid ribbed crewneck', 'Merino, 12 gauge', 14500, 'Orchid', ['p-k-02']],
      ['Lagoon fine-knit polo', 'Cotton-silk', 11200, 'Lagoon', ['p-k-03']],
      ['Chalk cable vest', 'Undyed alpaca', 13900, 'Chalk', ['p-k-04']] ] },
    resort: { code: 'R', label: 'Resort', tint: '#e46d2f', items: [
      ['Block-print shirt dress', 'Hand-block cotton voile', 18500, 'Poppy', ['look-05', 'mood-resort']],
      ['Marigold tiered sundress', 'Cotton mulmul', 15500, 'Marigold', ['p-r-02']],
      ['Lagoon tiered maxi', 'Cotton voile', 17200, 'Lagoon', ['p-r-03']],
      ['Chalk wide-leg set', 'Linen, 180 g/m²', 21000, 'Chalk', ['p-r-04']] ] },
    denim: { code: 'D', label: 'Denim', tint: '#3a4a7a', items: [
      ['Indigo trucker jacket', 'Indigo + cobalt overdye', 17900, 'Indigo', ['look-06']],
      ['Straight selvedge jean', '14 oz selvedge', 14900, 'Indigo', ['mood-denim']],
      ['Rinse wide-leg jean', '12 oz organic denim', 13500, 'Indigo', ['p-d-03']],
      ['Overdyed shirt dress', 'Indigo chambray', 16200, 'Cobalt', ['p-d-04']] ] },
  };

  // Every image file that exists in /assets. Nothing outside this list is ever requested.
  const ASSETS = ['look-01', 'look-02', 'look-03', 'look-04', 'look-05', 'look-06',
    'mood-street', 'mood-evening', 'mood-resort', 'mood-denim',
    'dye-cobalt', 'dye-marigold', 'dye-orchid', 'dye-lagoon', 'atelier',
    'p-t-02', 'p-t-03', 'p-t-04', 'p-s-03', 'p-s-04', 'p-e-02', 'p-e-04', 'p-k-02', 'p-k-03', 'p-k-04',
    'p-r-02', 'p-r-03', 'p-r-04', 'p-d-03', 'p-d-04'];
  const has = n => ASSETS.includes(n);
  // Video files in /assets (each as .webm and .mp4)
  const VIDEOS = ['hero-close-1', 'hero-close-2'];
  const LOCAL = { has, hasVideo: n => VIDEOS.includes(n) };
  const src = n => `assets/${n}.jpg`;
  // Views: every full frame first, then an upper and a lower detail cropped from the main frame
  const viewsFor = imgs => {
    const ok = imgs.filter(has);
    if (!ok.length) return [{ label: 'Front' }];
    return [...ok.map((n, i) => ({ src: src(n), label: i ? 'Second look' : 'Full look' })),
      { src: src(ok[0]), label: 'Upper detail', z: 1.8, pos: '50% 34%' },
      { src: src(ok[0]), label: 'Lower detail', z: 1.7, pos: '50% 82%' }];
  };

  const COPY = {
    tailoring: { desc: 'Cut from one dye lot so jacket and trouser match exactly. Half-canvassed, so the chest shapes to you over the first few wears.', fit: 'Regular fit, slightly extended shoulder. Take your usual size.', care: 'Dry clean only. Brush after wearing and rest on a shaped hanger.', },
    street: { desc: 'Garment-dyed after sewing, so seams take the colour a shade deeper. Heavy enough to hold its shape, soft from the first wash.', fit: 'Boxy and dropped at the shoulder. Size down for a closer fit.', care: 'Machine wash cold, inside out, with darks. Do not tumble dry.', },
    evening: { desc: 'Cut on the bias so the fabric falls close to the body and moves when you do. Dyed in small lots, so the colour deepens slightly toward the hem.', fit: 'True to size with a fluid drape. Model is 177 cm and wears S.', care: 'Cold hand wash or dry clean. Dry flat, away from direct sun.', },
    knit: { desc: 'Knitted on a 12-gauge machine, then linked by hand at the collar. Plant-dyed yarn, so each batch varies a little.', fit: 'Relaxed through the body. True to size.', care: 'Hand wash cold with wool wash. Reshape and dry flat.', },
    resort: { desc: 'Hand-block printed in Bagru with carved teak blocks. Every repeat is stamped by hand, so no two pieces line up the same way.', fit: 'Easy fit with room through the waist. True to size.', care: 'Gentle machine wash cold. Wash separately for the first three washes.', },
    denim: { desc: 'Rope-dyed indigo on a narrow shuttle loom, then overdyed in our Bagru vats. Fades along your own wear lines.', fit: 'Mid rise, straight through the leg. Take your usual waist size.', care: 'Wash rarely, inside out, cold. Hang to dry.', },
  };
  const DYE = {
    Orchid: ['HL-04/03', 'Lac resin with madder root, alum mordant overnight'],
    Cobalt: ['HL-04/01', 'Natural indigo with a cobalt mordant, three dips'],
    Marigold: ['HL-04/02', 'Dried marigold petals, simmered 60 min at 80°C'],
    Lagoon: ['HL-04/04', 'Pomegranate rind, then one indigo dip'],
    Plum: ['HL-04/05', 'Lac over iron, two baths'],
    Poppy: ['HL-04/06', 'Madder root with turmeric, alum mordant'],
    Indigo: ['HL-04/07', 'Fermented indigo vat, eight dips'],
    Chalk: ['HL-04/00', 'Undyed, sun-bleached for five days'],
    Ink: ['HL-04/08', 'Iron and myrobalan, overdyed twice'],
  };
  const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
  const CHART = [ ['XS', 80, 62, 88], ['S', 84, 66, 92], ['M', 88, 70, 96], ['L', 94, 76, 102], ['XL', 100, 82, 108] ];

  const ALL = [];
  Object.entries(STYLES).forEach(([cat, s]) => s.items.forEach((it, i) => {
    const [name, fabric, price, colour, imgs] = it;
    const code = `HL-${s.code}-${pad(i + 1)}`;
    const tint = PALETTE[colour] || s.tint;
    const views = viewsFor(imgs);
    const others = Object.keys(PALETTE).filter(c => c !== colour && c !== 'Ink').slice(i % 4, i % 4 + 2);
    ALL.push({
      code, cat, catLabel: s.label, name, fabric, price, colour, tint, views,
      colours: [colour, ...others].map(c => ({ name: c, hex: PALETTE[c] })),
      soldOut: price % 3 === 0 ? ['XL'] : price % 2 === 0 ? [] : ['XS'],
      generated: !!views[0].src, isNew: !!views[0].src,
      left: 2 + (Math.round(price / 100) % 9),
      ...COPY[cat], dye: DYE[colour] || DYE.Chalk,
    });
  }));
  const byCode = c => ALL.find(p => p.code === c);
  // Copy of a product whose first view is a different local file (used by section images)
  const withSrc = (p, name) => !has(name) ? p : ({ ...p, views: [{ ...p.views[0], src: src(name), z: 1, pos: '50% 50%', label: 'Full look' }, ...p.views.slice(1)] });
  const inr = n => '₹' + n.toLocaleString('en-IN');

  function imgTag(p, v = 0, w = 900, eager = false, cls = '') {
    const view = p.views[v] || p.views[0];
    if (!view.src) return '';
    const alt = `${p.name} in ${p.colour.toLowerCase()}, ${view.label.toLowerCase()}`;
    const style = `--z:${view.z || 1};object-position:${view.pos || '50% 50%'}`;
    return `<img src="${view.src}" alt="${alt}" ${eager ? '' : 'loading="lazy"'} decoding="async" class="${cls}" style="${style}" onerror="this.remove()">`;
  }
  function media(p, w = 900, eager = false, extra = '', v = 0) {
    return `<div class="media" style="--tint:${p.tint}" ${extra}><span class="media-fb">${p.name}</span>${imgTag(p, v, w, eager)}</div>`;
  }
  function related(p, n = 6) {
    const newFirst = l => [...l.filter(x => x.isNew), ...l.filter(x => !x.isNew)];
    const same = newFirst(ALL.filter(x => x.cat === p.cat && x.code !== p.code));
    const near = { evening: ['resort'], resort: ['evening'], tailoring: ['denim'], denim: ['tailoring'], street: ['knit'], knit: ['street'] }[p.cat] || [];
    const extra = ALL.filter(x => near.includes(x.cat));
    return [...same, ...extra].slice(0, n);
  }
  function completeLook(p, n = 4) {
    const order = { evening: ['tailoring', 'knit', 'denim', 'resort'], resort: ['knit', 'denim', 'tailoring', 'street'], tailoring: ['knit', 'evening', 'denim', 'street'],
      street: ['denim', 'knit', 'tailoring', 'resort'], knit: ['denim', 'tailoring', 'resort', 'street'], denim: ['knit', 'street', 'tailoring', 'resort'] }[p.cat];
    const idx = ALL.indexOf(p);
    return order.slice(0, n).map((c, k) => { const all = ALL.filter(x => x.cat === c), fresh = all.filter(x => x.isNew); return fresh.length ? fresh[(idx + k) % fresh.length] : all[(idx + k) % all.length]; });
  }

  // Bag and saved items, kept in this browser (falls back to memory when storage is blocked)
  const store = (key) => ({
    _mem: [],
    read() { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { return this._mem; } },
    write(v) { this._mem = v; try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} },
  });
  const bagStore = store('hueline-bag-v2'), savedStore = store('hueline-saved');
  const bag = {
    items() { return bagStore.read().filter(i => byCode(i.code)); },
    add(code, size, colour, qty = 1) {
      const b = this.items(), hit = b.find(i => i.code === code && i.size === size && i.colour === colour);
      hit ? (hit.qty = Math.min(9, hit.qty + qty)) : b.push({ code, size, colour, qty });
      bagStore.write(b); return this.count();
    },
    setQty(idx, qty) { const b = this.items(); if (!b[idx]) return; qty < 1 ? b.splice(idx, 1) : (b[idx].qty = Math.min(9, qty)); bagStore.write(b); },
    remove(idx) { const b = this.items(); b.splice(idx, 1); bagStore.write(b); },
    count() { return this.items().reduce((n, i) => n + i.qty, 0); },
    subtotal() { return this.items().reduce((n, i) => n + byCode(i.code).price * i.qty, 0); },
  };
  const saved = {
    list() { return savedStore.read().filter(byCode); },
    has(code) { return this.list().includes(code); },
    toggle(code) { const s = this.list(), i = s.indexOf(code); i > -1 ? s.splice(i, 1) : s.unshift(code); savedStore.write(s); return i === -1; },
    count() { return this.list().length; },
  };
  const FREE_SHIP = 25000;

  window.HL = { LOCAL, ASSETS, withSrc, saved, FREE_SHIP, PALETTE, STYLES, ALL, SIZES, CHART, byCode, inr, imgTag, media, related, completeLook, bag };
})();
