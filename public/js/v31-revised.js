(() => {
  const NS = 'v31Revised';
  const $all = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const norm = (s = '') => String(s).replace(/\s+/g, ' ').trim();
  const low = (s = '') => norm(s).toLowerCase();

  function toast(message) {
    document.querySelectorAll('.v31-toast').forEach(t => t.remove());
    const el = document.createElement('div');
    el.className = 'v31-toast';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  function createEl(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function replaceWording() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (node.nodeValue && /MAPPING FEED/i.test(node.nodeValue)) {
        node.nodeValue = node.nodeValue.replace(/MAPPING FEED/gi, 'SENTINEL COMMUNITY');
      }
    });
    document.title = document.title.replace(/Mapping Feed/gi, 'Sentinel Community');
  }

  function findDashboardAnchor() {
    const candidates = $all('main, section, article, .page, .content, .container, .dashboard, .panel, .card, div');
    return candidates.find(el => {
      const t = low(el.innerText || '');
      return t.includes('aisignalfx pro dashboard') || t.includes('institutional dashboard') || t.includes('command center');
    });
  }

  function installDashboardCompact() {
    if (document.querySelector('.v31-revised-dashboard')) return;
    const bodyText = low(document.body.innerText || '');
    if (!bodyText.includes('aisignalfx') || (!bodyText.includes('dashboard') && !bodyText.includes('command center'))) return;
    const anchor = findDashboardAnchor();
    if (!anchor || anchor.closest('.v31-revised-dashboard')) return;

    const widget = createEl(`
      <section class="v31-revised-dashboard" aria-label="AiSignalFx compact intelligence">
        <div class="v31-card-compact">
          <p class="v31-label"><span class="v31-dot"></span> Live command intelligence</p>
          <h2 class="v31-title">Top Mapper Insight</h2>
          <p class="v31-subtitle">Preview singkat dari creator unggulan. Detail entry tetap berada di Sentinel Official Signal / VIP Scanner.</p>
          <div class="v31-insight-row">
            <div class="v31-rank">#1</div>
            <div>
              <div class="v31-name-row">
                <span class="v31-name">Romadon Saputra</span>
                <span class="v31-pill">Sentinel Elite</span>
                <span class="v31-pill">XAUUSD SMC</span>
              </div>
              <p class="v31-quote">“XAUUSD masih menunggu validasi reaksi di premium area. Fokus pada liquidity sweep, CHoCH kecil, dan konfirmasi candle sebelum entry.”</p>
              <div class="v31-metrics">
                <span class="v31-pill">Bias: SELL WAIT</span>
                <span class="v31-pill">Confidence: 78%</span>
                <span class="v31-pill">Educational Insight</span>
              </div>
              <div class="v31-actions">
                <button class="v31-btn" data-v31-action="view-community">View Mapping</button>
                <button class="v31-btn secondary" data-v31-action="follow">Follow Creator</button>
                <button class="v31-btn secondary" data-v31-action="save">Save Insight</button>
              </div>
            </div>
          </div>
        </div>
        <aside class="v31-card-compact">
          <p class="v31-label"><span class="v31-dot"></span> Signal preview</p>
          <div class="v31-mini-list">
            <div class="v31-mini-item"><div><strong>BTCUSDT</strong><span>Bullish pullback</span></div><b class="v31-status">WAIT</b></div>
            <div class="v31-mini-item"><div><strong>XAUUSD</strong><span>Premium area reaction</span></div><b class="v31-status sell">SELL WAIT</b></div>
            <div class="v31-mini-item"><div><strong>Sentiment</strong><span>Risk medium</span></div><b class="v31-status active">ACTIVE</b></div>
          </div>
          <div class="v31-actions">
            <button class="v31-btn" data-v31-action="open-scanner">Open Scanner</button>
            <button class="v31-btn secondary" data-v31-action="open-lab">Trading Lab</button>
          </div>
        </aside>
      </section>
    `);

    // Put it after the first meaningful dashboard card, not above the whole site.
    anchor.insertAdjacentElement('afterend', widget);
  }

  function openModal(title, bodyHtml, footerHtml = '') {
    document.querySelectorAll('.v31-modal-backdrop').forEach(x => x.remove());
    const modal = createEl(`
      <div class="v31-modal-backdrop" role="dialog" aria-modal="true">
        <div class="v31-modal">
          <div class="v31-modal-head">
            <div><p class="v31-label"><span class="v31-dot"></span> AiSignalFx PRO</p><h3>${title}</h3></div>
            <button class="v31-close" type="button" aria-label="Close">×</button>
          </div>
          <div class="v31-modal-body">${bodyHtml}</div>
          ${footerHtml ? `<div class="v31-actions">${footerHtml}</div>` : ''}
        </div>
      </div>
    `);
    modal.addEventListener('click', e => {
      if (e.target === modal || e.target.closest('.v31-close')) modal.remove();
    });
    document.body.appendChild(modal);
    return modal;
  }

  function openProfileModal() {
    const profile = JSON.parse(localStorage.getItem(`${NS}:profile`) || '{}');
    const modal = openModal('Edit Profile', `
      <form class="v31-form" id="v31-profile-form">
        <label>Display Name<input name="displayName" value="${profile.displayName || 'Romadon Saputra'}"></label>
        <label>Bio<textarea name="bio">${profile.bio || 'Institutional SMC trader and AiSignalFx member.'}</textarea></label>
        <label>Country / Timezone<input name="timezone" value="${profile.timezone || 'Indonesia / Asia Jakarta'}"></label>
        <label>Trading Style<select name="style"><option>Scalping</option><option>Intraday</option><option>Swing</option><option>SMC Mapper</option></select></label>
        <label>Favorite Pairs<input name="pairs" value="${profile.pairs || 'XAUUSD, BTCUSDT'}"></label>
      </form>
    `, `<button class="v31-btn" type="button" data-v31-save-profile>Save Changes</button>`);
    modal.querySelector('[data-v31-save-profile]').addEventListener('click', () => {
      const fd = new FormData(modal.querySelector('#v31-profile-form'));
      localStorage.setItem(`${NS}:profile`, JSON.stringify(Object.fromEntries(fd.entries())));
      toast('Profile saved locally. Firestore sync will be added later.');
      modal.remove();
    });
  }

  function openSettingsModal() {
    openModal('Account Settings', `
      <div class="v31-mini-list">
        <div class="v31-mini-item"><div><strong>Account</strong><span>Profile, avatar, timezone, and trading style.</span></div><b class="v31-status active">READY</b></div>
        <div class="v31-mini-item"><div><strong>Notifications</strong><span>Signal, journal, community, and VIP alerts.</span></div><b class="v31-status">SOON</b></div>
        <div class="v31-mini-item"><div><strong>Privacy</strong><span>Journal remains private unless shared manually.</span></div><b class="v31-status active">PRIVATE</b></div>
        <div class="v31-mini-item"><div><strong>VIP Status</strong><span>Upgrade flow and payment confirmation.</span></div><b class="v31-status">FREE</b></div>
      </div>
    `);
  }

  function installPaymentCompact() {
    if (document.querySelector('.v31-payment-panel')) return;
    const headings = $all('h1,h2,h3,h4,div,p').filter(el => /metode pembayaran/i.test(norm(el.textContent || '')));
    const heading = headings[0];
    if (!heading) return;
    const section = heading.closest('section, article, main, .card, .panel, div') || heading.parentElement;
    if (!section) return;

    const cards = $all('div', section).filter(el => {
      const t = low(el.innerText || '');
      return t.includes('salin nomor') && t.includes('pilih') && t.length < 420;
    });

    const methods = cards.map(card => {
      const lines = norm(card.innerText || '').split(/ (?=(?:Bank BRI|DANA|GoPay|Bank Jago|OVO|SeaBank)\b)/i);
      const t = norm(card.innerText || '');
      const nameMatch = t.match(/(Bank BRI|DANA|GoPay|Bank Jago|OVO|SeaBank)/i);
      return { name: nameMatch ? nameMatch[1] : 'Payment', text: t, card };
    }).filter((m, i, arr) => m.name && arr.findIndex(x => x.name.toLowerCase() === m.name.toLowerCase()) === i);

    if (!methods.length) return;
    const panel = createEl(`
      <div class="v31-payment-panel">
        <p class="v31-label"><span class="v31-dot"></span> Compact payment selector</p>
        <h3 style="margin:0;font-size:20px;">Pilih metode pembayaran</h3>
        <p class="v31-payment-note">Detail nomor tampil setelah metode dipilih, sehingga halaman VIP tetap bersih dan profesional.</p>
        <div class="v31-payment-chips"></div>
        <div class="v31-actions"><button class="v31-btn secondary" type="button" data-v31-show-original>Show original cards</button></div>
      </div>
    `);
    const chips = panel.querySelector('.v31-payment-chips');
    methods.forEach(m => {
      const b = createEl(`<button class="v31-pay-chip" type="button"><span class="v31-pay-icon">${m.name[0]}</span>${m.name}</button>`);
      b.addEventListener('click', () => openModal(m.name, `<p style="white-space:pre-wrap;line-height:1.65;color:var(--v31-muted);">${m.text.replace(/Salin Nomor|Pilih/gi, '').trim()}</p>`, `<button class="v31-btn" data-v31-copy-pay>Salin Detail</button>`));
      chips.appendChild(b);
    });
    section.insertBefore(panel, heading.nextSibling);
    cards.forEach(c => { c.dataset.v31PaymentOriginal = 'true'; c.style.display = 'none'; });
    panel.querySelector('[data-v31-show-original]').addEventListener('click', e => {
      cards.forEach(c => c.style.display = c.style.display === 'none' ? '' : 'none');
      e.currentTarget.textContent = cards[0]?.style.display === 'none' ? 'Show original cards' : 'Hide original cards';
    });
  }

  function enterChartMode() {
    document.body.classList.add('v31-chart-mode');
    if (!document.querySelector('.v31-chart-exit')) {
      const btn = createEl('<button class="v31-chart-exit" type="button">Exit Chart Mode</button>');
      btn.addEventListener('click', () => {
        document.body.classList.remove('v31-chart-mode');
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      });
      document.body.appendChild(btn);
    }
    const chart = document.querySelector('iframe, .tradingview-widget-container, [class*="tradingview"]');
    if (chart && chart.requestFullscreen) chart.requestFullscreen().catch(() => {});
    toast('Drawing Mode aktif. Gunakan landscape untuk garis/channel lebih nyaman.');
  }

  function wireClicks() {
    if (document.body.dataset.v31Clicks === '1') return;
    document.body.dataset.v31Clicks = '1';
    document.addEventListener('click', e => {
      const target = e.target.closest('button, a, [role="button"]');
      if (!target) return;
      const t = low(target.innerText || target.textContent || '');
      const act = target.dataset.v31Action;
      if (act === 'follow') { e.preventDefault(); toast('Creator followed locally. Firestore follow system comes later.'); return; }
      if (act === 'save') { e.preventDefault(); toast('Insight saved locally.'); return; }
      if (act === 'view-community') { e.preventDefault(); toast('Open Sentinel Community from the menu.'); return; }
      if (act === 'open-scanner') { e.preventDefault(); toast('Open Signal Scanner from the menu.'); return; }
      if (act === 'open-lab') { e.preventDefault(); toast('Open Sentinel Trading Lab from the menu.'); return; }
      if (t.includes('edit profile')) { e.preventDefault(); e.stopPropagation(); openProfileModal(); return; }
      if (t.includes('open settings')) { e.preventDefault(); e.stopPropagation(); openSettingsModal(); return; }
      if (t.includes('fullscreen chart') || t.includes('drawing mode')) { e.preventDefault(); enterChartMode(); return; }
      if (t.includes('like') || t.includes('save') || t.includes('follow')) {
        if (t.length < 50) toast('Action saved locally. Real community sync will use Firestore.');
      }
    }, true);
  }

  function apply() {
    try { replaceWording(); } catch (_) {}
    try { installDashboardCompact(); } catch (e) { console.warn('v31 dashboard skipped', e); }
    try { installPaymentCompact(); } catch (e) { console.warn('v31 payment skipped', e); }
    try { wireClicks(); } catch (_) {}
  }

  let timer = null;
  function schedule() { clearTimeout(timer); timer = setTimeout(apply, 250); }
  document.addEventListener('DOMContentLoaded', apply);
  window.addEventListener('load', apply);
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
})();
