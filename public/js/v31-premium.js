/* AiSignalFx PRO v3.1 Premium Static Upgrade
   Non-destructive UI enhancer. Added as /js/v31-premium.js */
(function () {
  'use strict';

  const STORE = 'asfx_v31_profile';
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const textOf = (el) => (el && el.textContent ? el.textContent.trim() : '');

  const defaultProfile = {
    displayName: 'Romadon Saputra',
    bio: 'Institutional SMC trader and AiSignalFx member.',
    country: 'Indonesia',
    timezone: 'Asia/Jakarta',
    tradingStyle: 'SMC Scalping',
    favoritePairs: 'XAUUSD, BTCUSDT, EURUSD',
  };

  const paymentMethods = [
    { id: 'dana', name: 'DANA', icon: 'D', account: 'Atur dari Admin Control', holder: 'ROMADON SAPUTRA' },
    { id: 'gopay', name: 'GoPay', icon: 'G', account: 'Atur dari Admin Control', holder: 'ROMADON SAPUTRA' },
    { id: 'ovo', name: 'OVO', icon: 'O', account: 'Atur dari Admin Control', holder: 'ROMADON SAPUTRA' },
    { id: 'bri', name: 'BRI', icon: 'B', account: 'Atur dari Admin Control', holder: 'ROMADON SAPUTRA' },
    { id: 'jago', name: 'Bank Jago', icon: 'J', account: 'Atur dari Admin Control', holder: 'ROMADON SAPUTRA' },
    { id: 'seabank', name: 'SeaBank', icon: 'S', account: 'Atur dari Admin Control', holder: 'ROMADON SAPUTRA' },
  ];

  function profile() {
    try { return { ...defaultProfile, ...JSON.parse(localStorage.getItem(STORE) || '{}') }; }
    catch (_) { return defaultProfile; }
  }

  function saveProfile(data) {
    localStorage.setItem(STORE, JSON.stringify({ ...profile(), ...data }));
  }

  function toast(message) {
    let t = qs('.asfx-v31-toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'asfx-v31-toast';
      document.body.appendChild(t);
    }
    t.textContent = message;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  function createModal(id, title, bodyHtml) {
    let wrap = qs(`#${id}`);
    if (wrap) return wrap;
    wrap = document.createElement('div');
    wrap.id = id;
    wrap.className = 'asfx-v31-modal-backdrop';
    wrap.innerHTML = `
      <div class="asfx-v31-modal" role="dialog" aria-modal="true" aria-label="${title}">
        <div class="asfx-v31-modal-head">
          <div class="asfx-v31-modal-title">${title}</div>
          <button class="asfx-v31-x" type="button" data-asfx-close>Close</button>
        </div>
        ${bodyHtml}
      </div>`;
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap || e.target.closest('[data-asfx-close]')) closeModal(wrap);
    });
    document.body.appendChild(wrap);
    return wrap;
  }

  function openModal(wrap) {
    wrap.classList.add('open');
    document.documentElement.style.overflow = 'hidden';
  }
  function closeModal(wrap) {
    wrap.classList.remove('open');
    if (!qs('.asfx-v31-modal-backdrop.open')) document.documentElement.style.overflow = '';
  }

  function replaceVisibleText() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const p = node.parentElement;
        if (!p || ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
        return /mapping feed/i.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((n) => {
      n.nodeValue = n.nodeValue
        .replace(/MAPPING FEED/g, 'SENTINEL COMMUNITY')
        .replace(/Mapping Feed/g, 'Sentinel Community')
        .replace(/mapping feed/g, 'Sentinel Community');
    });
  }

  function addCommandCenter() {
    if (qs('#asfx-v31-command-center')) return;
    const target = qs('main') || qs('#app') || document.body;
    const p = profile();
    const shell = document.createElement('section');
    shell.id = 'asfx-v31-command-center';
    shell.className = 'asfx-v31-shell';
    shell.innerHTML = `
      <div class="asfx-v31-grid">
        <div class="asfx-v31-card asfx-v31-pad">
          <div class="asfx-v31-kicker"><span class="asfx-v31-dot"></span> Live Command Intelligence</div>
          <h2 class="asfx-v31-title">AiSignalFx Command Center</h2>
          <p class="asfx-v31-sub">Market overview dibuat lebih hidup: preview bias, insight top mapper, dan akses cepat ke modul utama tanpa membuat dashboard terlalu penuh.</p>

          <div class="asfx-v31-top-insight">
            <div class="asfx-v31-avatar">#1</div>
            <div>
              <div class="asfx-v31-user-row">
                <span class="asfx-v31-name">${escapeHtml(p.displayName || 'Top Mapper')}</span>
                <span class="asfx-v31-badge">Sentinel Elite</span>
                <span class="asfx-v31-badge">XAUUSD SMC</span>
              </div>
              <div class="asfx-v31-chat">“XAUUSD masih menunggu validasi reaksi di premium area. Fokus pada liquidity sweep, CHoCH kecil, dan konfirmasi candle sebelum entry.”</div>
              <div class="asfx-v31-metrics">
                <span class="asfx-v31-pill"><strong>Bias:</strong> SELL WAIT</span>
                <span class="asfx-v31-pill"><strong>Confidence:</strong> 78%</span>
                <span class="asfx-v31-pill"><strong>Saved:</strong> 246 members</span>
                <span class="asfx-v31-pill"><strong>Mode:</strong> Educational Insight</span>
              </div>
              <div class="asfx-v31-actions">
                <button class="asfx-v31-btn" type="button" data-asfx-view-community>View Mapping</button>
                <button class="asfx-v31-btn secondary" type="button" data-asfx-follow>Follow Creator</button>
                <button class="asfx-v31-btn secondary" type="button" data-asfx-save>Save Insight</button>
              </div>
            </div>
          </div>
        </div>

        <div class="asfx-v31-card asfx-v31-pad">
          <div class="asfx-v31-kicker"><span class="asfx-v31-dot"></span> Sentinel Signal Preview</div>
          <div class="asfx-v31-side-list" style="margin-top:12px">
            <div class="asfx-v31-mini"><div><div class="asfx-v31-mini-label">BTCUSDT</div><div class="asfx-v31-mini-value">Bullish pullback</div></div><span class="asfx-v31-status wait">WAIT</span></div>
            <div class="asfx-v31-mini"><div><div class="asfx-v31-mini-label">XAUUSD</div><div class="asfx-v31-mini-value">Premium area reaction</div></div><span class="asfx-v31-status sell">SELL WAIT</span></div>
            <div class="asfx-v31-mini"><div><div class="asfx-v31-mini-label">Sentiment</div><div class="asfx-v31-mini-value">Risk medium</div></div><span class="asfx-v31-status">ACTIVE</span></div>
          </div>
          <div class="asfx-v31-actions">
            <button class="asfx-v31-btn" type="button" data-asfx-open-scanner>Open Scanner</button>
            <button class="asfx-v31-btn secondary" type="button" data-asfx-open-lab>Trading Lab</button>
          </div>
        </div>
      </div>`;

    if (target.firstElementChild) target.insertBefore(shell, target.firstElementChild);
    else target.appendChild(shell);

    shell.addEventListener('click', (e) => {
      if (e.target.closest('[data-asfx-follow]')) toggleAction(e.target.closest('[data-asfx-follow]'), 'following', 'Following creator', 'Follow Creator');
      if (e.target.closest('[data-asfx-save]')) toggleAction(e.target.closest('[data-asfx-save]'), 'saved', 'Insight saved', 'Save Insight');
      if (e.target.closest('[data-asfx-view-community]')) scrollToText(/sentinel community|community|mapping/i);
      if (e.target.closest('[data-asfx-open-scanner]')) scrollToText(/signal scanner|scanner/i);
      if (e.target.closest('[data-asfx-open-lab]')) scrollToText(/trading lab|journal/i);
    });
  }

  function toggleAction(btn, key, onText, offText) {
    const active = btn.classList.toggle(`asfx-v31-${key}`);
    btn.classList.toggle('asfx-v31-active', active);
    btn.textContent = active ? onText : offText;
    toast(active ? onText : 'Action removed');
  }

  function scrollToText(regex) {
    const candidates = qsa('section, article, main > div, [class*="card"], [id], h1, h2, h3');
    const found = candidates.find((el) => regex.test(textOf(el)) && el.id !== 'asfx-v31-command-center');
    if (found) found.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else toast('Module preview tersedia di dashboard.');
  }

  function bindProfileButtons() {
    const buttons = qsa('button, a, [role="button"]');
    buttons.forEach((btn) => {
      const t = textOf(btn);
      if (/edit profile/i.test(t) && !btn.dataset.asfxBound) {
        btn.dataset.asfxBound = 'profile';
        btn.addEventListener('click', (e) => { e.preventDefault(); openProfileModal(); });
      }
      if (/(open settings|settings)/i.test(t) && !btn.dataset.asfxSettingsBound) {
        btn.dataset.asfxSettingsBound = 'settings';
        btn.addEventListener('click', (e) => { e.preventDefault(); openSettingsModal(); });
      }
    });
  }

  function openProfileModal() {
    const p = profile();
    const modal = createModal('asfx-v31-profile-modal', 'Edit Profile', `
      <form class="asfx-v31-form" id="asfx-v31-profile-form">
        ${field('displayName', 'Display Name', p.displayName)}
        ${field('bio', 'Bio', p.bio, true)}
        ${field('country', 'Country', p.country)}
        ${field('timezone', 'Timezone', p.timezone)}
        ${field('tradingStyle', 'Trading Style', p.tradingStyle)}
        ${field('favoritePairs', 'Favorite Pairs', p.favoritePairs)}
        <div class="asfx-v31-form-actions">
          <button class="asfx-v31-btn" type="submit">Save Changes</button>
          <button class="asfx-v31-btn secondary" type="button" data-asfx-close>Cancel</button>
        </div>
      </form>`);

    const form = qs('#asfx-v31-profile-form', modal);
    form.onsubmit = (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      saveProfile(data);
      syncProfileText(data);
      toast('Profile saved on this device.');
      closeModal(modal);
    };
    openModal(modal);
  }

  function field(name, label, value, textarea) {
    const safe = escapeAttr(value || '');
    return `<div class="asfx-v31-field"><label for="asfx-${name}">${label}</label>${textarea ? `<textarea id="asfx-${name}" name="${name}">${escapeHtml(value || '')}</textarea>` : `<input id="asfx-${name}" name="${name}" value="${safe}" />`}</div>`;
  }

  function openSettingsModal() {
    const modal = createModal('asfx-v31-settings-modal', 'Account Settings', `
      <div class="asfx-v31-form">
        <div class="asfx-v31-mini"><div><div class="asfx-v31-mini-label">VIP Status</div><div class="asfx-v31-mini-value">Preview / Manual Verification</div></div><span class="asfx-v31-status wait">PENDING</span></div>
        <div class="asfx-v31-mini"><div><div class="asfx-v31-mini-label">Theme</div><div class="asfx-v31-mini-value">Institutional Dark</div></div><span class="asfx-v31-status">ACTIVE</span></div>
        <div class="asfx-v31-mini"><div><div class="asfx-v31-mini-label">Notifications</div><div class="asfx-v31-mini-value">Signal alert preview</div></div><span class="asfx-v31-status wait">SOON</span></div>
        <div class="asfx-v31-mini"><div><div class="asfx-v31-mini-label">Privacy</div><div class="asfx-v31-mini-value">Journal private by default</div></div><span class="asfx-v31-status">SAFE</span></div>
        <div class="asfx-v31-form-actions"><button class="asfx-v31-btn secondary" type="button" data-asfx-close>Close Settings</button></div>
      </div>`);
    openModal(modal);
  }

  function syncProfileText(data) {
    // Light-touch update for visible duplicated profile text.
    const bodyTextTargets = qsa('body *').filter(el => el.children.length === 0 && textOf(el).length < 120);
    const oldP = defaultProfile;
    bodyTextTargets.forEach(el => {
      const txt = textOf(el);
      Object.keys(data).forEach(k => {
        if (txt === oldP[k]) el.textContent = data[k];
      });
    });
  }

  function addPaymentWidget() {
    if (qs('#asfx-v31-payment-widget')) return;
    const candidates = qsa('section, article, div').filter(el => {
      const t = textOf(el).toLowerCase();
      return t.includes('dana') && t.includes('gopay') && (t.includes('ovo') || t.includes('bri')) && t.length < 4500;
    });
    const region = candidates[0];
    if (!region) return;

    const widget = document.createElement('div');
    widget.id = 'asfx-v31-payment-widget';
    widget.className = 'asfx-v31-payment-widget';
    widget.innerHTML = `
      <div class="asfx-v31-payment-title">Select VIP Payment Method</div>
      <div class="asfx-v31-payment-sub">Detail rekening hanya muncul setelah metode dipilih. Untuk production, data payment sebaiknya dikelola dari Admin Control/Firebase.</div>
      <div class="asfx-v31-pay-grid">
        ${paymentMethods.map(m => `
          <button type="button" class="asfx-v31-pay-method" data-pay="${m.id}">
            <span class="asfx-v31-pay-icon">${m.icon}</span>
            <span><span class="asfx-v31-pay-name">${m.name}</span><span class="asfx-v31-pay-hint">Tap to view details</span></span>
          </button>`).join('')}
      </div>`;
    region.parentNode.insertBefore(widget, region);
    region.classList.add('asfx-v31-hide-original-payment');

    widget.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-pay]');
      if (!btn) return;
      const m = paymentMethods.find(x => x.id === btn.dataset.pay);
      openPaymentModal(m);
    });
  }

  function openPaymentModal(m) {
    const modal = createModal('asfx-v31-payment-modal', `${m.name} Payment Detail`, `
      <div class="asfx-v31-form">
        <div class="asfx-v31-mini"><div><div class="asfx-v31-mini-label">Method</div><div class="asfx-v31-mini-value">${m.name}</div></div><span class="asfx-v31-status">SELECTED</span></div>
        <div class="asfx-v31-field"><label>Account Number</label><input readonly value="${escapeAttr(m.account)}" id="asfx-v31-pay-account" /></div>
        <div class="asfx-v31-field"><label>Recipient Name</label><input readonly value="${escapeAttr(m.holder)}" /></div>
        <div class="asfx-v31-payment-sub">Nomor asli nanti ditarik dari Admin Control/Firebase, bukan hardcode di frontend publik.</div>
        <div class="asfx-v31-form-actions">
          <button class="asfx-v31-btn" type="button" data-copy-pay>Copy Number</button>
          <button class="asfx-v31-btn secondary" type="button" data-asfx-close>Close</button>
        </div>
      </div>`);
    qs('[data-copy-pay]', modal).onclick = async () => {
      try { await navigator.clipboard.writeText(qs('#asfx-v31-pay-account', modal).value); toast('Payment number copied.'); }
      catch (_) { toast('Copy belum tersedia di browser ini.'); }
    };
    openModal(modal);
  }

  function bindSocialActions() {
    qsa('button, a, [role="button"]').forEach((btn, idx) => {
      if (btn.dataset.asfxSocialBound) return;
      const t = textOf(btn).toLowerCase();
      if (/\blike\b|suka/.test(t)) {
        btn.dataset.asfxSocialBound = 'like';
        btn.addEventListener('click', (e) => { e.preventDefault(); toggleLike(btn, idx); });
      } else if (/comment|komentar/.test(t)) {
        btn.dataset.asfxSocialBound = 'comment';
        btn.addEventListener('click', (e) => { e.preventDefault(); openCommentModal(); });
      } else if (/\bsave\b|simpan/.test(t)) {
        btn.dataset.asfxSocialBound = 'save';
        btn.addEventListener('click', (e) => { e.preventDefault(); toggleAction(btn, 'saved', 'Saved', 'Save'); });
      } else if (/follow|ikuti/.test(t)) {
        btn.dataset.asfxSocialBound = 'follow';
        btn.addEventListener('click', (e) => { e.preventDefault(); toggleAction(btn, 'following', 'Following', 'Follow'); });
      }
    });
  }

  function toggleLike(btn, idx) {
    const key = `asfx_v31_like_${location.pathname}_${idx}`;
    const active = localStorage.getItem(key) !== '1';
    if (active) localStorage.setItem(key, '1');
    else localStorage.removeItem(key);
    btn.classList.toggle('asfx-v31-active', active);
    btn.textContent = active ? 'Liked' : 'Like';
    toast(active ? 'Post liked' : 'Like removed');
  }

  function openCommentModal() {
    const modal = createModal('asfx-v31-comment-modal', 'Add Comment', `
      <form class="asfx-v31-form" id="asfx-v31-comment-form">
        <div class="asfx-v31-field"><label>Comment</label><textarea name="comment" placeholder="Tulis komentar edukatif..."></textarea></div>
        <div class="asfx-v31-payment-sub">Mode v3.1 static: komentar tersimpan di device ini dulu. Production akan memakai Firestore.</div>
        <div class="asfx-v31-form-actions"><button class="asfx-v31-btn" type="submit">Save Comment</button><button class="asfx-v31-btn secondary" type="button" data-asfx-close>Cancel</button></div>
      </form>`);
    qs('#asfx-v31-comment-form', modal).onsubmit = (e) => {
      e.preventDefault();
      const val = new FormData(e.target).get('comment');
      if (val) localStorage.setItem(`asfx_v31_comment_${Date.now()}`, val);
      toast('Comment saved on this device.');
      closeModal(modal);
    };
    openModal(modal);
  }

  function addChartMode() {
    if (qs('#asfx-v31-chart-btn')) return;
    const iframe = qsa('iframe').find(f => /tradingview|tv-widget/i.test(f.src || '') || /tradingview/i.test(f.outerHTML));
    const tvContainer = iframe ? (iframe.closest('section, article, .card, div') || iframe.parentElement) : qsa('div').find(d => /tradingview/i.test((d.className || '') + ' ' + (d.id || '')));
    if (!tvContainer) return;
    tvContainer.classList.add('asfx-v31-chart-target');

    const btn = document.createElement('button');
    btn.id = 'asfx-v31-chart-btn';
    btn.className = 'asfx-v31-chart-btn';
    btn.type = 'button';
    btn.textContent = 'Fullscreen Chart';
    const exit = document.createElement('button');
    exit.className = 'asfx-v31-chart-exit';
    exit.type = 'button';
    exit.textContent = 'Exit Chart';
    document.body.appendChild(btn);
    document.body.appendChild(exit);
    btn.addEventListener('click', () => {
      document.body.classList.add('asfx-v31-chart-fullscreen');
      document.documentElement.classList.add('asfx-v31-chart-fullscreen');
      toast('Drawing mode aktif. Gunakan landscape untuk chart detail.');
    });
    exit.addEventListener('click', () => {
      document.body.classList.remove('asfx-v31-chart-fullscreen');
      document.documentElement.classList.remove('asfx-v31-chart-fullscreen');
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  function escapeAttr(s) { return escapeHtml(s).replace(/'/g, '&#39;'); }

  function init() {
    document.body.classList.add('asfx-v31-ready');
    replaceVisibleText();
    addCommandCenter();
    bindProfileButtons();
    addPaymentWidget();
    bindSocialActions();
    addChartMode();
    setTimeout(() => { bindProfileButtons(); bindSocialActions(); replaceVisibleText(); }, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
