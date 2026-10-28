/* =====================================================================
   Hueline shared UI: smooth scroll, morphing cursor, magnetic buttons,
   bag badge, toast, image zoom, buy box, and the quick-view modal that
   expands out of any element with data-product="HL-X-00".
   Needs: gsap, ScrollTrigger, Flip, Lenis, catalog.js
   ===================================================================== */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasG = !!window.gsap;
  if (hasG) gsap.registerPlugin(ScrollTrigger, Flip);

  /* ---------------- Smooth scroll ---------------- */
  let lenis = null;
  if (hasG && window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-scroll]'); if (!a) return;
    const h = a.getAttribute('href') || '';
    if (!h.startsWith('#') || h === '#') return;
    const el = $(h); if (!el) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(el, { duration: 1.6 }) : el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ---------------- Cursor ---------------- */
  if (hasG && fine && !reduce && $('.cursor')) {
    document.body.classList.add('has-cursor');
    const cur = $('.cursor'), pos = $('.c-pos'), shape = $('.c-shape'), dot = $('.c-dot'), label = $('.c-label');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, current = null;
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; cur.classList.remove('is-hidden'); }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    addEventListener('pointerdown', () => cur.classList.add('is-down'));
    addEventListener('pointerup', () => cur.classList.remove('is-down'));
    const setFrom = t => {
      current = t;
      const st = t ? t.dataset.cursor : '';
      cur.dataset.state = st;
      label.textContent = t ? (t.classList.contains('is-zoomed') ? 'Close' : t.dataset.cursorLabel || '') : '';
      if (st === 'color') cur.style.setProperty('--cc', t.dataset.cursorColor);
    };
    document.addEventListener('pointerover', e => { const t = e.target.closest('[data-cursor]'); if (t !== current) setFrom(t); });
    window.HLcursorRefresh = () => setFrom(current);
    gsap.ticker.add(() => {
      rx += (mx - rx) * 0.17; ry += (my - ry) * 0.17;
      const dx = mx - rx, dy = my - ry, dist = Math.hypot(dx, dy);
      const st = cur.dataset.state || '';
      const k = st === '' ? 1 : st === 'link' || st === 'text' ? .45 : .2;
      const s = Math.min(dist / 140, .55) * k;
      dot.style.transform = `translate(${mx}px,${my}px)`;
      pos.style.transform = `translate(${rx}px,${ry}px)`;
      shape.style.rotate = s > .01 ? Math.atan2(dy, dx) * 180 / Math.PI + 'deg' : '0deg';
      shape.style.scale = `${1 + s} ${1 - s * .55}`;
    });
  }

  /* ---------------- Magnetic ---------------- */
  function magnetize(root = document) {
    if (!hasG || !fine || reduce) return;
    $$('[data-magnetic]', root).forEach(el => {
      if (el._mag) return; el._mag = true;
      const xTo = gsap.quickTo(el, 'x', { duration: .6, ease: 'power3' }), yTo = gsap.quickTo(el, 'y', { duration: .6, ease: 'power3' });
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * .3); yTo((e.clientY - r.top - r.height / 2) * .4); });
      el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1,.35)' }));
    });
  }
  magnetize();

  /* ---------------- Bag badge + toast ---------------- */
  function bagRefresh(bump) {
    $$('[data-bag-count]').forEach(el => {
      el.textContent = HL.bag.count();
      if (bump && !reduce) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    });
    $$('[data-saved-count]').forEach(el => (el.textContent = HL.saved.count()));
    $$('[data-save]').forEach(b => { const on = HL.saved.has(b.dataset.save); b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', on ? 'Remove from saved' : 'Save for later'); });
  }
  const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 0 1 19.4 13Z"/></svg>';
  const heartBtn = (code, cls = 'heart') => `<button type="button" class="${cls}" data-save="${code}" aria-pressed="false" aria-label="Save for later" data-cursor="link">${HEART}</button>`;
  const badgeFor = p => p.isNew ? '<span class="badge mono">New in</span>' : p.left <= 3 ? `<span class="badge badge--low mono">Only ${p.left} left</span>` : '';
  bagRefresh();
  let toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  /* ---------------- Click-to-zoom with pan ---------------- */
  function bindZoom(el) {
    if (el._zoom) return; el._zoom = true;
    const target = () => el.querySelector('img.is-active') || el.querySelector('img');
    const pan = e => {
      const r = el.getBoundingClientRect(), img = target(); if (!img) return;
      img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    };
    el.addEventListener('click', e => {
      if (e.target.closest('button')) return;
      pan(e); el.classList.toggle('is-zoomed');
      window.HLcursorRefresh && window.HLcursorRefresh();
    });
    el.addEventListener('pointermove', e => { if (el.classList.contains('is-zoomed')) pan(e); });
    el.addEventListener('pointerleave', () => el.classList.remove('is-zoomed'));
  }

  /* ---------------- Buy box (modal + product page) ---------------- */
  function buyBoxHTML(p, ctx) {
    const id = `${ctx}-${p.code}`;
    return `
    <div class="buy" data-code="${p.code}" style="--accent:${p.tint}">
      <div class="buy-top mono"><span>${p.catLabel}</span><span>${p.colour}</span>${p.generated ? '<span class="pill">New in</span>' : ''}</div>
      <h2 class="buy-name" id="${id}-name">${p.name}</h2>
      <div class="buy-price">${HL.inr(p.price)} <span class="mono">incl. GST</span></div>
      <p class="buy-desc">${p.desc}</p>
      <fieldset class="opt">
        <legend class="mono">Colour <b class="buy-colour">${p.colour}</b></legend>
        <div class="swatches" role="radiogroup" aria-label="Colour">
          ${p.colours.map((c, i) => `<button type="button" class="sw" role="radio" aria-checked="${i === 0}" aria-label="${c.name}" data-colour="${c.name}" style="--c:${c.hex}" data-cursor="color" data-cursor-color="${c.hex}" data-cursor-label="${c.name}"></button>`).join('')}
        </div>
      </fieldset>
      <fieldset class="opt">
        <legend class="mono"><span>Size</span><button type="button" class="link guide-toggle" aria-expanded="false" data-cursor="link">Size guide</button></legend>
        <div class="sizes" role="radiogroup" aria-label="Size">
          ${HL.SIZES.map(s => `<button type="button" class="sz" role="radio" aria-checked="false" data-size="${s}" ${p.soldOut.includes(s) ? 'aria-disabled="true" title="Sold out in this dye lot"' : ''} data-cursor="link">${s}</button>`).join('')}
        </div>
        <div class="guide" hidden>
          <table class="chart"><thead><tr><th>Size</th><th>Bust</th><th>Waist</th><th>Hip</th></tr></thead>
          <tbody>${HL.CHART.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table>
          <p class="mono" style="margin-top:8px;opacity:.6">Body measurements in cm</p>
        </div>
      </fieldset>
      <div class="buy-actions">
        <button type="button" class="btn btn--ink buy-add" data-cursor="link" data-magnetic>Add to bag &middot; ${HL.inr(p.price)}</button>
        ${heartBtn(p.code, 'heart heart--box')}
        ${ctx === 'qv' ? `<a class="btn btn--line buy-more" href="product.html?p=${p.code}" data-cursor="link">Full details <span class="arr">&rarr;</span></a>` : ''}
      </div>
      <p class="buy-msg" aria-live="polite"></p>
      <div class="stock" style="--left:${p.left / 48}">
        <div class="stock-row mono"><span>${p.left <= 4 ? `Only ${p.left} left` : `${p.left} left`} in dye lot ${p.dye[0]}</span><span>of 48</span></div>
        <div class="stock-bar"><i></i></div>
      </div>
      ${ctx === 'pdp' ? `<div class="deliver">
        <label class="mono" for="pin">Check delivery</label>
        <div class="pin-row"><input id="pin" inputmode="numeric" autocomplete="postal-code" maxlength="6" placeholder="Pincode, e.g. 110001"><button type="button" class="pin-btn mono" data-cursor="link">Check</button></div>
        <p class="pin-out" aria-live="polite">Ships from Jaipur. Free shipping over ${HL.inr(HL.FREE_SHIP)}.</p>
      </div>` : ''}
      <ul class="buy-ship mono"><li>Free returns within 14 days</li><li>Cash on delivery available</li><li>Gift-wrapped in hand-printed cotton</li></ul>
      <div class="acc">
        <details ${ctx === 'pdp' ? 'open' : ''}><summary data-cursor="link">Fabric &amp; care</summary><div class="acc-body"><p><b>${p.fabric}.</b> ${p.care}</p></div></details>
        <details><summary data-cursor="link">Fit</summary><div class="acc-body"><p>${p.fit}</p></div></details>
        <details><summary data-cursor="link">The dye</summary><div class="acc-body"><p>${p.colour}, ref ${p.dye[0]}. ${p.dye[1]}. Mixed by hand in Bagru; expect slight variation between pieces.</p></div></details>
      </div>
    </div>`;
  }
  function bindBuyBox(root, p, onColour) {
    const box = $('.buy', root); if (!box) return;
    let size = null, colour = p.colour;
    const msg = $('.buy-msg', box);
    $$('.sw', box).forEach(b => b.addEventListener('click', () => {
      $$('.sw', box).forEach(x => x.setAttribute('aria-checked', x === b));
      colour = b.dataset.colour; $('.buy-colour', box).textContent = colour;
      box.style.setProperty('--accent', b.style.getPropertyValue('--c'));
      onColour && onColour(colour, b.style.getPropertyValue('--c'));
    }));
    $$('.sz', box).forEach(b => b.addEventListener('click', () => {
      if (b.getAttribute('aria-disabled') === 'true') { msg.textContent = `${b.dataset.size} is sold out in this dye lot.`; return; }
      $$('.sz', box).forEach(x => x.setAttribute('aria-checked', x === b));
      size = b.dataset.size; msg.textContent = '';
      root.dispatchEvent(new CustomEvent('hl:size', { detail: size }));
    }));
    const g = $('.guide-toggle', box), guide = $('.guide', box);
    g.addEventListener('click', () => {
      guide.hidden = !guide.hidden; g.setAttribute('aria-expanded', !guide.hidden);
      if (!guide.hidden && hasG && !reduce) gsap.from(guide, { height: 0, opacity: 0, duration: .5, ease: 'expo.out', clearProps: 'height' });
    });
    $('.buy-add', box).addEventListener('click', e => {
      const btn = e.currentTarget;
      if (!size) {
        msg.textContent = 'Pick a size first.';
        if (hasG && !reduce) gsap.fromTo($('.sizes', box), { x: -8 }, { x: 0, duration: .6, ease: 'elastic.out(1,.3)' });
        return;
      }
      HL.bag.add(p.code, size, colour); bagRefresh(true);
      msg.textContent = '';
      const old = btn.innerHTML; btn.innerHTML = 'Added &#10003;';
      setTimeout(() => (btn.innerHTML = old), 1400);
      if (isOpen) { close(); setTimeout(() => openDrawer('bag'), 650); } else openDrawer('bag');
    });
    box._getSize = () => size;
    // Delivery estimate (product page)
    const pin = $('#pin', box);
    if (pin) {
      const out = $('.pin-out', box);
      const check = () => {
        const v = pin.value.trim();
        if (!/^[1-8]\d{5}$/.test(v)) { out.textContent = 'Enter a 6-digit pincode, like 302001.'; return; }
        const pre = v.slice(0, 2), days = ['30', '31', '32', '33', '34'].includes(pre) ? 2 : ['11', '12', '40', '41', '56', '60', '50', '70'].includes(pre) ? 3 : 5;
        const d = new Date(); let n = days;
        while (n > 0) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) n--; }
        out.innerHTML = `<b>Arrives by ${d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</b> to ${v}. ${p.price >= HL.FREE_SHIP ? 'Free shipping.' : 'Shipping ₹250, free over ' + HL.inr(HL.FREE_SHIP) + '.'}`;
        try { localStorage.setItem('hueline-pin', v); } catch (e) {}
      };
      try { const saved = localStorage.getItem('hueline-pin'); if (saved) { pin.value = saved; check(); } } catch (e) {}
      $('.pin-btn', box).addEventListener('click', check);
      pin.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      pin.addEventListener('input', () => { pin.value = pin.value.replace(/\D/g, ''); });
    }
    magnetize(box);
  }

  /* ---------------- Product card (shared markup) ---------------- */
  function cardHTML(p, extraCls = '') {
    return `<article class="pcard ${extraCls}" data-product="${p.code}" data-cursor="view" data-cursor-label="Quick view" tabindex="0" aria-label="${p.name}, ${HL.inr(p.price)}. Open quick view">
      <div class="pcard-img">${HL.media(p, 700)}${badgeFor(p)}${heartBtn(p.code)}</div>
      <div class="pcard-meta"><h3>${p.name}</h3><span class="price">${HL.inr(p.price)}</span></div>
      <div class="pcard-sub"><span class="dot" style="--tint:${p.tint}"></span>${p.colour} &middot; ${p.fabric}</div>
    </article>`;
  }

  /* =================================================================
     QUICK-VIEW MODAL with shared-element expand
     ================================================================= */
  const qv = document.createElement('div');
  qv.className = 'qv'; qv.hidden = true;
  qv.setAttribute('role', 'dialog'); qv.setAttribute('aria-modal', 'true'); qv.setAttribute('data-lenis-prevent', '');
  qv.innerHTML = `<div class="qv-backdrop" data-close></div>
    <div class="qv-panel">
      <button type="button" class="qv-close mono" data-close data-cursor="link">Close &#10005;</button>
      <div class="qv-body"></div>
    </div>`;
  document.body.appendChild(qv);
  $('.qv-panel', qv).tabIndex = -1;
  const panel = $('.qv-panel', qv), body = $('.qv-body', qv), backdrop = $('.qv-backdrop', qv);
  let isOpen = false, current = null, srcEl = null, openedCode = null, lastFocus = null;

  function render(p) {
    current = p;
    qv.setAttribute('aria-labelledby', `qv-${p.code}-name`);
    const more = HL.related(p, 4);
    body.innerHTML = `
      <div class="qv-gallery">
        <div class="qv-main media zoomable" style="--tint:${p.tint}" data-cursor="zoom" data-cursor-label="Zoom">
          <span class="media-fb">${p.name}</span>
          ${p.views.map((v, i) => HL.imgTag(p, i, 1200, true, i === 0 ? 'is-active' : '')).join('')}
          <span class="qv-count mono"><b>01</b> / ${String(p.views.length).padStart(2, '0')} &middot; <span class="qv-vlabel">${p.views[0].label}</span></span>
        </div>
        <div class="qv-thumbs" role="tablist" aria-label="Views">
          ${p.views.map((v, i) => `<button type="button" class="qv-thumb" role="tab" aria-selected="${i === 0}" aria-label="${v.label}" data-v="${i}" data-cursor="link">${HL.media(p, 200, true, '', i)}</button>`).join('')}
        </div>
      </div>
      <div class="qv-info">
        ${buyBoxHTML(p, 'qv')}
        <div class="qv-more">
          <span class="mono">More in this style</span>
          <div class="qv-more-row">${more.map(m => `<button type="button" class="qv-mini" data-swap="${m.code}" data-cursor="view" data-cursor-label="Swap">${HL.media(m, 300)}<span>${m.name}</span><span class="mono">${HL.inr(m.price)}</span></button>`).join('')}</div>
        </div>
      </div>`;
    const main = $('.qv-main', body);
    bindZoom(main);
    $$('.qv-thumb', body).forEach(t => t.addEventListener('click', () => showView(+t.dataset.v)));
    bindBuyBox(body, p, (name, hex) => { main.style.setProperty('--tint', hex); });
    $$('.qv-mini', body).forEach(b => b.addEventListener('click', () => swap(b.dataset.swap)));
  }
  function showView(i) {
    const main = $('.qv-main', body), imgs = $$('img', main);
    main.classList.remove('is-zoomed');
    imgs.forEach((im, k) => im.classList.toggle('is-active', k === i));
    $$('.qv-thumb', body).forEach((t, k) => t.setAttribute('aria-selected', k === i));
    $('.qv-count b', body).textContent = String(i + 1).padStart(2, '0');
    $('.qv-vlabel', body).textContent = current.views[i].label;
  }
  let locks = 0;
  function lock() { if (locks++ === 0) { lenis && lenis.stop(); document.documentElement.classList.add('qv-open'); } }
  function unlock() { if (--locks <= 0) { locks = 0; lenis && lenis.start(); document.documentElement.classList.remove('qv-open'); } }
  const mediaOf = el => !el ? null : el.classList.contains('media') ? el : el.querySelector('.media');
  const inView = el => { if (!el || !el.isConnected) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
  function flyGhost(fromEl, toRect, fromRect, onDone) {
    const ghost = fromEl.cloneNode(true);
    ghost.classList.add('qv-ghost'); ghost.classList.remove('zoomable', 'is-zoomed');
    ghost.removeAttribute('data-cursor');
    Object.assign(ghost.style, { left: fromRect.left + 'px', top: fromRect.top + 'px', width: fromRect.width + 'px', height: fromRect.height + 'px' });
    document.body.appendChild(ghost);
    gsap.to(ghost, { left: toRect.left, top: toRect.top, width: toRect.width, height: toRect.height, duration: .95, ease: 'expo.inOut', onComplete: () => { onDone && onDone(); ghost.remove(); } });
  }

  function open(code, src) {
    const p = HL.byCode(code); if (!p) return;
    if (isOpen) { swap(code); return; }
    lastFocus = document.activeElement;
    srcEl = src || null; openedCode = code;
    render(p); qv.hidden = false; isOpen = true; lock();
    const main = $('.qv-main', body), sm = mediaOf(srcEl);
    if (!hasG || reduce) { panel.focus({ preventScroll: true }); return; }
    gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: .6, ease: 'power2.out' });
    if (sm && inView(sm)) {
      const from = sm.getBoundingClientRect(), to = main.getBoundingClientRect();
      gsap.set(main, { opacity: 0 }); gsap.set(panel, { opacity: 0 });
      sm.style.visibility = 'hidden';
      gsap.to(panel, { opacity: 1, duration: .5, delay: .35, ease: 'power2.out' });
      flyGhost(sm, to, from, () => { gsap.set(main, { opacity: 1 }); sm.style.visibility = ''; });
    } else {
      gsap.fromTo(panel, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .8, ease: 'expo.out' });
    }
    gsap.from($$('.buy > *, .qv-more', body), { y: 26, opacity: 0, duration: .9, ease: 'expo.out', stagger: .045, delay: .45 });
    gsap.from($$('.qv-thumb .media', body), { y: 16, opacity: 0, duration: .7, ease: 'expo.out', stagger: .06, delay: .7 });
    setTimeout(() => panel.focus({ preventScroll: true }), 50);
  }
  function swap(code) {
    const p = HL.byCode(code); if (!p) return;
    if (!hasG || reduce) { render(p); return; }
    gsap.to(body, { opacity: 0, y: 12, duration: .3, ease: 'power2.in', onComplete: () => {
      render(p); $('.qv-info', body).scrollTop = 0; panel.scrollTop = 0;
      gsap.fromTo(body, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: .6, ease: 'expo.out' });
    } });
  }
  function close() {
    if (!isOpen) return; isOpen = false;
    const done = () => { qv.hidden = true; body.innerHTML = ''; gsap.set([panel, backdrop, body], { clearProps: 'all' }); unlock(); lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true }); };
    if (!hasG || reduce) { done(); return; }
    const sm = mediaOf(srcEl), main = $('.qv-main', body);
    gsap.to(backdrop, { opacity: 0, duration: .6, ease: 'power2.inOut' });
    if (sm && inView(sm) && current && current.code === openedCode) {
      const from = main.getBoundingClientRect(), to = sm.getBoundingClientRect();
      sm.style.visibility = 'hidden';
      const clone = main.cloneNode(true);
      gsap.to(panel, { opacity: 0, duration: .35, ease: 'power2.in' });
      flyGhost(clone, to, from, () => { sm.style.visibility = ''; done(); });
    } else {
      gsap.to(panel, { opacity: 0, y: 30, duration: .45, ease: 'power3.in', onComplete: done });
    }
  }
  qv.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', e => {
    if (!isOpen || openPanel) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') { // keep focus inside the dialog
      const f = $$('button, a[href], [tabindex]:not([tabindex="-1"])', qv).filter(x => !x.disabled && x.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  // Any [data-product] element opens the quick view
  document.addEventListener('click', e => {
    if (e.target.closest('[data-add], [data-save], a[href], .qv, .drawer, .search')) return;
    const t = e.target.closest('[data-product]'); if (!t) return;
    e.preventDefault(); open(t.dataset.product, t);
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const t = e.target.closest && e.target.closest('[data-product]');
    if (t && e.target === t) { e.preventDefault(); open(t.dataset.product, t); }
  });

  /* =================================================================
     SAVE (hearts anywhere on the page)
     ================================================================= */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-save]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const p = HL.byCode(b.dataset.save), on = HL.saved.toggle(p.code);
    bagRefresh(); renderDrawer();
    toast(on ? `${p.name} saved` : `${p.name} removed from saved`);
    if (on && hasG && !reduce) gsap.fromTo(b.querySelector('svg'), { scale: .4 }, { scale: 1, duration: .7, ease: 'elastic.out(1,.4)' });
  }, true);

  /* =================================================================
     PANELS: bag drawer (bag + saved), search, mobile menu
     ================================================================= */
  let openPanel = null, panelFocus = null;
  const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.hidden = true; d.setAttribute('data-lenis-prevent', ''); d.innerHTML = html; document.body.appendChild(d); return d; };
  const mini = (p, extra = '') => `<div class="mini-img">${HL.media(p, 240, false)}</div>${extra}`;

  // ----- Drawer -----
  const drawer = mk('drawer', `<div class="drawer-bg" data-panel-close></div>
    <aside class="drawer-panel" role="dialog" aria-modal="true" aria-label="Your bag" tabindex="-1">
      <header class="drawer-head">
        <div class="drawer-tabs" role="tablist">
          <button type="button" role="tab" data-tab="bag" class="mono" data-cursor="link">Bag (<span data-bag-count>0</span>)</button>
          <button type="button" role="tab" data-tab="saved" class="mono" data-cursor="link">Saved (<span data-saved-count>0</span>)</button>
        </div>
        <button type="button" class="drawer-x mono" data-panel-close data-cursor="link">Close &#10005;</button>
      </header>
      <div class="drawer-body"></div>
      <footer class="drawer-foot"></footer>
    </aside>`);
  let tab = 'bag';
  function renderDrawer() {
    if (drawer.hidden) return;
    $$('[data-tab]', drawer).forEach(t => t.setAttribute('aria-selected', t.dataset.tab === tab));
    const bodyEl = $('.drawer-body', drawer), foot = $('.drawer-foot', drawer);
    if (tab === 'bag') {
      const items = HL.bag.items(), sub = HL.bag.subtotal(), away = Math.max(0, HL.FREE_SHIP - sub);
      if (!items.length) {
        const picks = HL.ALL.filter(p => p.isNew).slice(0, 4);
        bodyEl.innerHTML = `<div class="empty"><p class="empty-t">Your bag is empty.</p><p>Start with something new from dye lot 04.</p></div>
          <div class="picks">${picks.map(p => `<button type="button" class="pick" data-qv="${p.code}" data-cursor="view" data-cursor-label="View">${mini(p)}<span>${p.name}</span><span class="mono">${HL.inr(p.price)}</span></button>`).join('')}</div>`;
        foot.innerHTML = '';
      } else {
        const pair = HL.completeLook(HL.byCode(items[0].code), 2).filter(p => !items.some(i => i.code === p.code));
        bodyEl.innerHTML = `<div class="ship ${away ? '' : 'is-free'}" style="--p:${Math.min(1, sub / HL.FREE_SHIP)}">
            <p>${away ? `You're <b>${HL.inr(away)}</b> away from free shipping` : '<b>Free shipping unlocked.</b> Ships from Jaipur in 2&ndash;4 days.'}</p><div class="ship-bar"><i></i></div></div>
          <ul class="lines">${items.map((it, idx) => { const p = HL.byCode(it.code); return `<li class="line" style="--tint:${HL.PALETTE[it.colour] || p.tint}">
            <button type="button" class="line-img" data-qv="${p.code}" aria-label="View ${p.name}" data-cursor="view" data-cursor-label="View">${mini(p)}</button>
            <div class="line-info"><p class="line-name">${p.name}</p><p class="mono line-meta"><span class="dot" style="--tint:${HL.PALETTE[it.colour] || p.tint}"></span>${it.colour} &middot; ${it.size}</p>
              <div class="qty" role="group" aria-label="Quantity"><button type="button" data-qty="${idx}" data-d="-1" aria-label="One less" data-cursor="link">&minus;</button><span>${it.qty}</span><button type="button" data-qty="${idx}" data-d="1" aria-label="One more" data-cursor="link">+</button></div></div>
            <div class="line-end"><span class="mono">${HL.inr(p.price * it.qty)}</span><button type="button" class="link line-rm" data-rm="${idx}" data-cursor="link">Remove</button></div>
          </li>`; }).join('')}</ul>
          ${pair.length ? `<div class="pair"><p class="mono">Pairs well with</p><div class="picks picks--2">${pair.map(p => `<button type="button" class="pick" data-qv="${p.code}" data-cursor="view" data-cursor-label="View">${mini(p)}<span>${p.name}</span><span class="mono">${HL.inr(p.price)}</span></button>`).join('')}</div></div>` : ''}`;
        foot.innerHTML = `<div class="tot"><span>Subtotal</span><b>${HL.inr(sub)}</b></div>
          <p class="mono tot-note">Taxes included. ${away ? 'Shipping ₹250.' : 'Shipping free.'}</p>
          <button type="button" class="btn btn--ink checkout" data-cursor="link" data-magnetic>Checkout &middot; ${HL.inr(sub + (away ? 250 : 0))}</button>`;
        magnetize(foot);
      }
    } else {
      const list = HL.saved.list().map(HL.byCode);
      bodyEl.innerHTML = !list.length ? `<div class="empty"><p class="empty-t">Nothing saved yet.</p><p>Tap the heart on any piece and it waits for you here.</p></div>`
        : `<ul class="lines">${list.map(p => `<li class="line" style="--tint:${p.tint}">
            <button type="button" class="line-img" data-qv="${p.code}" aria-label="View ${p.name}" data-cursor="view" data-cursor-label="View">${mini(p)}</button>
            <div class="line-info"><p class="line-name">${p.name}</p><p class="mono line-meta"><span class="dot" style="--tint:${p.tint}"></span>${p.colour} &middot; ${HL.inr(p.price)}</p>
              <button type="button" class="link" data-qv="${p.code}" data-cursor="link">Choose size</button></div>
            <div class="line-end">${heartBtn(p.code, 'heart heart--inline')}</div></li>`).join('')}</ul>`;
      foot.innerHTML = '';
      bagRefresh();
    }
  }
  drawer.addEventListener('click', e => {
    const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; renderDrawer(); return; }
    const q = e.target.closest('[data-qty]'); if (q) { const it = HL.bag.items()[+q.dataset.qty]; HL.bag.setQty(+q.dataset.qty, it.qty + +q.dataset.d); bagRefresh(); renderDrawer(); return; }
    const r = e.target.closest('[data-rm]'); if (r) {
      const li = r.closest('.line'), done = () => { HL.bag.remove(+r.dataset.rm); bagRefresh(); renderDrawer(); };
      hasG && !reduce ? gsap.to(li, { height: 0, opacity: 0, paddingBlock: 0, duration: .45, ease: 'power3.inOut', onComplete: done }) : done(); return;
    }
    const v = e.target.closest('[data-qv]'); if (v) { closePanel(); setTimeout(() => open(v.dataset.qv), 450); return; }
    if (e.target.closest('.checkout')) toast('Demo store: connect Shopify, Razorpay or Stripe to take payment.');
  });
  function openDrawer(which = 'bag') { tab = which; showPanel(drawer, '.drawer-panel'); renderDrawer();
    if (hasG && !reduce) gsap.from($$('.drawer-body > *, .lines > li, .picks > *', drawer), { x: 30, opacity: 0, duration: .7, ease: 'expo.out', stagger: .05, delay: .2 }); }

  // ----- Search -----
  const search = mk('search', `<div class="search-bg" data-panel-close></div>
    <div class="search-panel" role="dialog" aria-modal="true" aria-label="Search" tabindex="-1">
      <div class="search-top wrap">
        <label for="q" class="mono">Search the drop</label>
        <button type="button" class="drawer-x mono" data-panel-close data-cursor="link">Close &#10005;</button>
      </div>
      <div class="wrap"><input id="q" class="search-input" type="search" autocomplete="off" placeholder="Try orchid, silk, denim&hellip;"></div>
      <div class="search-chips wrap">${['Orchid', 'Cobalt', 'Marigold', 'Lagoon', 'Silk', 'Evening', 'Tailoring', 'Denim', 'Knitwear'].map(c => `<button type="button" class="chip mono" data-chip="${c}" data-cursor="link">${c}</button>`).join('')}</div>
      <p class="search-count mono wrap" aria-live="polite"></p>
      <div class="search-res wrap"></div>
    </div>`);
  const qIn = $('#q', search);
  function runSearch() {
    const q = qIn.value.trim().toLowerCase();
    const res = !q ? HL.ALL.filter(p => p.isNew) : HL.ALL.filter(p => [p.name, p.colour, p.catLabel, p.fabric, p.code].join(' ').toLowerCase().includes(q));
    $('.search-count', search).textContent = !q ? 'New in dye lot 04' : res.length ? `${res.length} piece${res.length > 1 ? 's' : ''} for “${qIn.value.trim()}”` : `Nothing matches “${qIn.value.trim()}”. Try a colour like orchid or cobalt.`;
    $('.search-res', search).innerHTML = res.slice(0, 8).map(p => cardHTML(p).replace('data-product=', 'data-qv=')).join('');
    $$('.chip', search).forEach(c => c.setAttribute('aria-pressed', c.dataset.chip.toLowerCase() === q));
  }
  qIn.addEventListener('input', runSearch);
  search.addEventListener('click', e => {
    const c = e.target.closest('[data-chip]'); if (c) { qIn.value = c.dataset.chip; runSearch(); return; }
    if (e.target.closest('[data-save]')) return;
    const v = e.target.closest('[data-qv]'); if (v) { closePanel(); setTimeout(() => open(v.dataset.qv), 450); }
  });
  function openSearch() { showPanel(search, '.search-panel'); runSearch(); setTimeout(() => qIn.focus(), 60); }

  // ----- Mobile menu -----
  const onIndex = !!document.getElementById('shop') && !!document.getElementById('lookbook');
  const href = h => onIndex ? `#${h}` : `index.html#${h}`;
  const menu = mk('menu', `<div class="menu-panel" role="dialog" aria-modal="true" aria-label="Menu" tabindex="-1">
      <div class="menu-top wrap"><span class="logo cond">Hue<b>line</b></span><button type="button" class="drawer-x mono" data-panel-close>Close &#10005;</button></div>
      <nav class="menu-links wrap">${[['styles', 'Styles', '#f0a21a'], ['collections', 'Wardrobe', '#2b3fd6'], ['lookbook', 'Lookbook', '#c2378a'], ['colour', 'Colour', '#13807a'], ['shop', 'Shop all', '#e46d2f']]
        .map(([id, l, c]) => `<a href="${href(id)}" ${onIndex ? 'data-scroll' : ''} style="--c:${c}" class="cond">${l}</a>`).join('')}</nav>
      <div class="menu-foot wrap mono"><button type="button" data-open="search">Search</button><button type="button" data-open="saved">Saved (<span data-saved-count>0</span>)</button><button type="button" data-open="bag">Bag (<span data-bag-count>0</span>)</button></div>
    </div>`);
  menu.addEventListener('click', e => { if (e.target.closest('a')) closePanel(); });

  // ----- Shared open/close with focus return and Escape -----
  function showPanel(el, inner) {
    if (openPanel && openPanel !== el) hidePanel(openPanel, true);
    if (openPanel === el) return;
    panelFocus = document.activeElement; openPanel = el; el.hidden = false; lock();
    const pnl = $(inner, el), bg = el.firstElementChild;
    if (hasG && !reduce) {
      const from = el === drawer ? { xPercent: 100 } : el === search ? { yPercent: -100 } : { clipPath: 'circle(0% at 92% 4%)' };
      const to = el === drawer ? { xPercent: 0 } : el === search ? { yPercent: 0 } : { clipPath: 'circle(150% at 92% 4%)' };
      gsap.fromTo(pnl, from, { ...to, duration: .8, ease: 'expo.out' });
      if (bg !== pnl) gsap.fromTo(bg, { opacity: 0 }, { opacity: 1, duration: .5 });
      if (el === menu) gsap.from($$('.menu-links a', el), { yPercent: 100, opacity: 0, duration: .9, ease: 'expo.out', stagger: .06, delay: .15 });
    }
    setTimeout(() => (el === search ? qIn : pnl).focus({ preventScroll: true }), 40);
    bagRefresh();
  }
  function hidePanel(el, instant) {
    const pnl = el.querySelector('[role="dialog"]'), bg = el.firstElementChild;
    const done = () => { el.hidden = true; if (hasG) gsap.set([pnl, bg], { clearProps: 'all' }); unlock(); };
    if (openPanel === el) openPanel = null;
    if (instant || !hasG || reduce) { done(); return; }
    const to = el === drawer ? { xPercent: 100 } : el === search ? { yPercent: -100 } : { clipPath: 'circle(0% at 92% 4%)' };
    gsap.to(pnl, { ...to, duration: .5, ease: 'power3.in', onComplete: done });
    if (bg !== pnl) gsap.to(bg, { opacity: 0, duration: .4 });
  }
  function closePanel() { if (!openPanel) return; const f = panelFocus; hidePanel(openPanel); f && f.focus && f.focus({ preventScroll: true }); }
  document.addEventListener('click', e => {
    if (e.target.closest('[data-panel-close]')) { closePanel(); return; }
    const o = e.target.closest('[data-open]'); if (!o) return;
    e.preventDefault();
    const w = o.dataset.open;
    if (w === 'bag' || w === 'saved') openDrawer(w); else if (w === 'search') openSearch(); else if (w === 'menu') showPanel(menu, '.menu-panel');
  });
  document.addEventListener('keydown', e => {
    if (!openPanel) return;
    if (e.key === 'Escape') { closePanel(); return; }
    if (e.key === 'Tab') {
      const f = $$('button, a[href], input, [tabindex]:not([tabindex="-1"])', openPanel).filter(x => !x.disabled && x.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  document.addEventListener('keydown', e => { if (e.key === '/' && !openPanel && !isOpen && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); } });
  bagRefresh();

  /* =================================================================
     FOOTER (shared by both pages)
     ================================================================= */
  const footEl = $('[data-site-footer]');
  if (footEl) {
    const dyes = [['Cobalt', '#2b3fd6'], ['Marigold', '#f0a21a'], ['Orchid', '#c2378a'], ['Lagoon', '#13807a'], ['Poppy', '#e46d2f'], ['Indigo', '#3a4a7a'], ['Plum', '#3b1f3a']];
    const cats = Object.entries(HL.STYLES);
    footEl.innerHTML = `
      <div class="sf-strip" aria-hidden="true">${dyes.map(([n, c]) => `<i style="--c:${c}"><span class="mono">${n}</span></i>`).join('')}</div>
      <div class="sf-main wrap">
        <div class="sf-news">
          <span class="mono sf-kicker"><i></i>Dye lot 05 &middot; Monsoon</span>
          <h3 class="sf-title cond">Hear about the next dye drop first.</h3>
          <p class="sf-sub">One email when a new colour leaves the vat. Each lot is 48 pieces, so the list hears first.</p>
          <form class="sf-form" novalidate>
            <label for="sfEmail" class="sr-only">Email address</label>
            <input id="sfEmail" type="email" autocomplete="email" placeholder="Your email address" required>
            <button type="submit" class="btn btn--ink" data-cursor="link">Notify me <span class="arr">&rarr;</span></button>
          </form>
          <p class="sf-note mono" aria-live="polite"></p>
        </div>
        <nav class="sf-cols" aria-label="Footer">
          <div><span class="mono sf-h">Shop</span><ul>${cats.map(([k, s]) => `<li><a href="${onIndex ? '#shop' : 'index.html#shop'}" data-cat-link="${k}" data-cursor="link"><i style="--c:${s.tint}"></i>${s.label}</a></li>`).join('')}</ul></div>
          <div><span class="mono sf-h">Help</span><ul><li><a href="#" data-cursor="link">Shipping &amp; returns</a></li><li><a href="#" data-cursor="link">Size guide</a></li><li><a href="#" data-cursor="link">Care &amp; repair</a></li><li><a href="#" data-cursor="link">Track an order</a></li><li><a href="#" data-cursor="link">Contact</a></li></ul></div>
          <div><span class="mono sf-h">Visit the atelier</span><address>Hueline Atelier<br>Bagru, Rajasthan<br>Tuesday to Sunday, 11 to 7</address>
            <ul class="sf-social"><li><a href="#" data-cursor="link">Instagram</a></li><li><a href="#" data-cursor="link">Pinterest</a></li></ul></div>
        </nav>
      </div>
      <div class="sf-mark cond" aria-hidden="true">${[...'Hueline'].map((ch, i) => `<span style="--c:${dyes[i % dyes.length][1]}">${ch}</span>`).join('')}</div>
      <div class="sf-bottom wrap mono">
        <span>&copy; 2026 Hueline. Hand-dyed in Bagru, cut in Jaipur.</span>
        <span>UPI &middot; Cards &middot; Cash on delivery</span>
        <button type="button" class="sf-top" data-cursor="link">Back to top &uarr;</button>
      </div>`;
    $('.sf-form', footEl).addEventListener('submit', e => {
      e.preventDefault();
      const v = $('#sfEmail', footEl).value.trim(), note = $('.sf-note', footEl);
      note.textContent = /^\S+@\S+\.\S+$/.test(v) ? "You're on the list for dye lot 05." : 'Enter an email address, like name@domain.com.';
    });
    $('.sf-top', footEl).addEventListener('click', () => lenis ? lenis.scrollTo(0, { duration: 1.8 }) : scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
    footEl.addEventListener('click', e => {
      const a = e.target.closest('[data-cat-link]'); if (!a || !onIndex) return;
      e.preventDefault();
      const tab = document.querySelector(`#shopTabs .tab[data-k="${a.dataset.catLink}"]`);
      if (tab && tab.getAttribute('aria-selected') !== 'true') tab.click();
      lenis ? lenis.scrollTo('#shop', { duration: 1.6 }) : document.getElementById('shop').scrollIntoView();
    });
    if (hasG && !reduce && window.ScrollTrigger) {
      gsap.from($$('.sf-mark span', footEl), { yPercent: 100, ease: 'none', stagger: .08, scrollTrigger: { trigger: footEl, start: 'top 75%', end: 'bottom bottom', scrub: 1 } });
      gsap.from($$('.sf-strip i', footEl), { scaleY: 0, transformOrigin: '50% 0%', duration: 1, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: footEl, start: 'top 90%' } });
      gsap.from($$('.sf-news > *, .sf-cols > div', footEl), { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: footEl, start: 'top 80%' } });
    }
    magnetize(footEl);
  }

  window.HLUI = { lenis, reduce, fine, open, close, bagRefresh, toast, magnetize, bindZoom, buyBoxHTML, bindBuyBox, cardHTML, heartBtn, badgeFor, openDrawer, openSearch };
})();
