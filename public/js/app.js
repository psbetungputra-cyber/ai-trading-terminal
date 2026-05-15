const USERS = {
  psbetung: { password: "admin123", name: "PSBETUNG", avatar: "P", role: "Founder", level: "admin", style: "SMC", pairs: "XAU", vipText: "Founder access active." },
  vip: { password: "vip123", name: "VIP USER", avatar: "V", role: "VIP Member", level: "vip", style: "Scalp", pairs: "XAU", vipText: "VIP access active." },
  free: { password: "free123", name: "FREE USER", avatar: "F", role: "Free Member", level: "free", style: "Learning", pairs: "XAU", vipText: "Free account. Upgrade VIP to unlock Signal Scanner." }
};

let currentUser = null;
let tvLoaded = false;
let freeSentinelUsed = 0;
const FREE_SENTINEL_LIMIT = 3;

function setAuthMode(mode){
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const loginTab = document.getElementById("login-tab");
  const registerTab = document.getElementById("register-tab");
  if(mode === "register"){
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    loginTab.classList.remove("active");
    registerTab.classList.add("active");
  }else{
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    registerTab.classList.remove("active");
    loginTab.classList.add("active");
  }
}

function startSession(userProfile){
  currentUser = userProfile;

  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  hydrateProfile();
  applyAccessRules();

  // Chart initializes when user opens Chart Terminal.
}

function loginFirebaseUser(userProfile){
  startSession(userProfile);
}

async function login(){
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const loginKey = username.toLowerCase();

  // Live Firebase login if user enters an email.
  if(username.includes("@")){
    if(!window.AiSignalFirebase || !window.AiSignalFirebase.login){
      alert("Firebase belum siap. Coba refresh halaman.");
      return;
    }

    try{
      await window.AiSignalFirebase.login(username, password);
    }catch(error){
      alert("Firebase login gagal: " + (error.message || error));
    }
    return;
  }

  // Demo login tetap aktif sebagai fallback.
  if(!USERS[loginKey] || USERS[loginKey].password !== password){
    alert("ACCESS DENIED");
    return;
  }

  startSession(USERS[loginKey]);
}

function hydrateProfile(){
  document.getElementById("display-name").innerText = currentUser.name;
  document.getElementById("role-badge").innerText = currentUser.role;
  document.getElementById("avatar").innerText = currentUser.avatar;
  document.getElementById("top-avatar").innerText = currentUser.avatar;

  const dropAvatar = document.getElementById("drop-avatar");
  const dropName = document.getElementById("drop-name");
  const dropRole = document.getElementById("drop-role");

  if(dropAvatar) dropAvatar.innerText = currentUser.avatar;
  if(dropName) dropName.innerText = currentUser.name;
  if(dropRole) dropRole.innerText = currentUser.role;
  document.getElementById("profile-avatar").innerText = currentUser.avatar;
  document.getElementById("profile-name").innerText = currentUser.name;
  document.getElementById("profile-role").innerText = currentUser.role;
  document.getElementById("profile-role-box").innerText = currentUser.level.toUpperCase();
  document.getElementById("profile-style").innerText = currentUser.style;
  document.getElementById("profile-pairs").innerText = currentUser.pairs;
  document.getElementById("profile-display").innerText = currentUser.name;
  const bioEl = document.getElementById("profile-bio");
  const countryEl = document.getElementById("profile-country");
  const pairsTextEl = document.getElementById("profile-pairs-text");
  if(bioEl) bioEl.innerText = currentUser.bio || "Institutional SMC trader and AiSignalFx member.";
  if(countryEl) countryEl.innerText = currentUser.countryTimezone || "Indonesia / Asia Jakarta";
  if(pairsTextEl) pairsTextEl.innerText = currentUser.pairs || "XAUUSD";
  document.getElementById("vip-status-text").innerText = currentUser.vipText;

  document.querySelectorAll(".owner-only").forEach(el => {
    el.style.display = currentUser.level === "admin" ? "" : "none";
  });
  document.querySelectorAll(".owner-floating").forEach(el => {
    el.style.display = currentUser.level === "admin" ? "grid" : "none";
  });
}

function isVipOrAdmin(){
  return currentUser && (currentUser.level === "vip" || currentUser.level === "admin");
}

function applyAccessRules(){
  const vipAccess = isVipOrAdmin();
  const scannerLock = document.getElementById("scanner-lock");
  const scannerContent = document.getElementById("scanner-content");
  if(scannerLock && scannerContent){
    scannerLock.classList.toggle("hidden", vipAccess);
    scannerContent.classList.toggle("hidden", !vipAccess);
  }

  const dashLock = document.getElementById("dashboard-scanner-lock");
  if(dashLock && vipAccess && dashLock.classList.contains("vip-lock")){
    dashLock.classList.remove("vip-lock");
    dashLock.innerHTML = `
      <div class="section-head">
        <h3>Signal Scanner VIP</h3>
        <span class="badge vip">Unlocked</span>
      </div>
      <p>AI AutoScan VIP aktif. Full scanner, entry model, confidence, dan pair radar terbuka.</p>
      <button class="small-btn" onclick="showPageById('scanner')">Open Scanner</button>
    `;
  }

  const usage = document.getElementById("usage-stat");
  const scannerStat = document.getElementById("scanner-stat");
  const sentAccess = document.getElementById("sentinel-access");
  const sentLimit = document.getElementById("sentinel-limit");
  const sentBadge = document.getElementById("sentinel-badge");

  if(usage) usage.innerText = vipAccess ? "∞" : "3/day";
  if(scannerStat) scannerStat.innerText = vipAccess ? "Open" : "Locked";
  if(sentAccess) sentAccess.innerText = vipAccess ? "VIP" : "Free";
  if(sentLimit) sentLimit.innerText = vipAccess ? "∞" : `${FREE_SENTINEL_LIMIT - freeSentinelUsed}`;
  if(sentBadge){
    sentBadge.className = vipAccess ? "badge vip" : "badge free";
    sentBadge.innerText = vipAccess ? "VIP Unlimited" : "Free Limited";
  }
}

function showPage(id, button){
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
  const target = document.getElementById(id);
  if(!target){
    alert("Page belum tersedia: " + id);
    return;
  }
  target.classList.add("active");

  document.querySelectorAll(".nav").forEach(nav => nav.classList.remove("active"));
  if(button) button.classList.add("active");

  const titles = {
    dashboard: "Institutional Dashboard",
    chart: "Chart Terminal",
    scanner: "Signal Scanner VIP",
    sentinel: "Sentinel AI Visual Analysis",
    sentiment: "Market Sentiment",
    fundamental: "Fundamental Calendar",
    mapping: "Mapping Feed",
    lab: "Sentinel Trading Lab",
    profile: "Profile Center",
    vip: "VIP Access",
    admin: "Admin Control",
    ads: "Ads Manager"
  };
  document.getElementById("page-title").innerText = titles[id] || "AiSignalFx PRO";
  closeSidebar();
  if(id === "chart") setTimeout(initTradingView, 250);
  if(id === "vip") setTimeout(loadVipPage, 120);
  if(id === "admin") setTimeout(loadAdminOverview, 120);
  if(id === "sentiment") setTimeout(loadManualSentiment, 120);
  if(id === "lab") setTimeout(renderJournalEntries, 120);
  if(id === "scanner") setTimeout(loadCryptoMarket, 120);
  if(id === "mapping") setTimeout(renderCommunity, 120);
  if(id === "dashboard") { setTimeout(loadCryptoMarket, 120); setTimeout(renderDashboardFyp, 120); }
  applyAccessRules();
}

function showPageById(id){
  const navButtons = Array.from(document.querySelectorAll(".nav"));
  const btn = navButtons.find(b => b.getAttribute("onclick")?.includes("'" + id + "'"));
  showPage(id, btn);
}

function toggleSidebar(){
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("backdrop");
  if(window.innerWidth <= 1080){
    sidebar.classList.toggle("mobile-open");
    backdrop.classList.toggle("show");
  }else{
    sidebar.classList.toggle("collapsed");
    setTimeout(() => { if(tvLoaded) initTradingView(); }, 320);
  }
}

function closeSidebar(){
  document.getElementById("sidebar").classList.remove("mobile-open");
  document.getElementById("backdrop").classList.remove("show");
}

function toggleFloatingActions(){
  document.getElementById("floating-actions").classList.toggle("collapsed");
}

function initTradingView(){
  const container = document.getElementById("tvchart");
  if(!container || typeof TradingView === "undefined") return;

  container.innerHTML = "";

  const isMobile = window.innerWidth <= 720;

  new TradingView.widget({
    autosize: true,
    symbol: "OANDA:XAUUSD",
    interval: "15",
    timezone: "Asia/Jakarta",
    theme: "dark",
    style: "1",
    locale: "en",
    container_id: "tvchart",
    backgroundColor: "#0b0e11",
    gridColor: "rgba(255,255,255,0.05)",
    allow_symbol_change: true,

    hide_side_toolbar: false,
    hide_top_toolbar: false,
    details: !isMobile,
    calendar: !isMobile,
    studies: []
  });

  tvLoaded = true;
}

function updateClock(){
  const now = new Date();
  const clock = document.getElementById("clock");
  if(clock) clock.innerText = now.toLocaleTimeString("en-GB",{hour12:false});
}
setInterval(updateClock,1000);
updateClock();

document.addEventListener("change", function(event){
  if(event.target.id === "sentinel-upload"){
    const file = event.target.files[0];
    if(!file) return;

    if(!isVipOrAdmin() && freeSentinelUsed >= FREE_SENTINEL_LIMIT){
      alert("Free Sentinel AI limit sudah habis. Upgrade VIP untuk unlimited analysis.");
      event.target.value = "";
      return;
    }

    if(!isVipOrAdmin()) freeSentinelUsed++;
    const url = URL.createObjectURL(file);
    document.getElementById("sentinel-preview").innerHTML = `<img src="${url}" alt="Uploaded chart" />`;

    const response = isVipOrAdmin()
      ? "Chart berhasil dimuat. Sentinel AI VIP melakukan full scan: market structure, liquidity sweep, BOS/CHoCH, FVG, entry zone, SL/TP, dan confidence model."
      : "Chart berhasil dimuat. Sentinel AI Free memberi preview visual terbatas: struktur utama dan potensi bias. Upgrade VIP untuk full reasoning, entry, SL/TP, dan confidence lengkap.";

    document.getElementById("sentinel-response").innerText = response;
    applyAccessRules();
  }

  if(event.target.id === "mapping-upload"){
    const file = event.target.files[0];
    if(!file) return;
    const url = URL.createObjectURL(file);
    const box = document.getElementById("new-mapping");
    box.innerHTML = `
      <div class="card feed-post">
        <div class="post-header">
          <div class="post-user">
            <div class="avatar">${currentUser?.avatar || "U"}</div>
            <div>
              <h3>${currentUser?.name || "USER"}</h3>
              <p>New Community Mapping</p>
            </div>
          </div>
          <span class="badge free">New Post</span>
        </div>
        <p>Mapping baru berhasil diupload ke community feed.</p>
        <div class="post-img"><img src="${url}" alt="Mapping upload" /></div>
        <div class="ai-message">
          <strong>Sentinel AI</strong>
          <p>Preview AI reply: mapping akan bisa dikomentari AI saat fitur backend aktif.</p>
        </div>
        <div class="post-actions">
          <span>❤️ 0</span>
          <span>💬 0</span>
          <span>🔖 Save</span>
        </div>
      </div>
    `;
  }
});


function toggleProfileMenu(){
  const dropdown = document.getElementById("profile-dropdown");
  if(dropdown){
    dropdown.classList.toggle("hidden");
  }
}

function closeProfileMenu(){
  const dropdown = document.getElementById("profile-dropdown");
  if(dropdown){
    dropdown.classList.add("hidden");
  }
}

document.addEventListener("click", function(event){
  const wrap = document.querySelector(".profile-menu-wrap");
  if(wrap && !wrap.contains(event.target)){
    closeProfileMenu();
  }
});

window.setAuthMode = setAuthMode;
window.login = login;
window.showPage = showPage;
window.showPageById = showPageById;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.toggleFloatingActions = toggleFloatingActions;

window.toggleProfileMenu = toggleProfileMenu;
window.closeProfileMenu = closeProfileMenu;

window.loginFirebaseUser = loginFirebaseUser;

function firebaseRegisterFromForm(){
  if(!window.AiSignalFirebase || !window.AiSignalFirebase.registerFromForm){
    alert("Firebase belum siap. Coba refresh halaman.");
    return;
  }
  window.AiSignalFirebase.registerFromForm();
}
window.firebaseRegisterFromForm = firebaseRegisterFromForm;


let selectedVipPackage = null;
let selectedPaymentMethod = null;

function moneyIDR(value){
  const n = Number(value || 0);
  return "Rp" + n.toLocaleString("id-ID");
}

const fallbackPackages = [
  { id: "vip-starter", name: "VIP Starter", normalPrice: 35000, discount: 10000, finalPrice: 25000, durationDays: 30, label: "Early Promo", active: true },
  { id: "vip-pro", name: "VIP Pro", normalPrice: 75000, discount: 25000, finalPrice: 50000, durationDays: 30, label: "Best Value", active: true },
  { id: "founder-promo", name: "Founder Promo", normalPrice: 150000, discount: 50000, finalPrice: 100000, durationDays: 90, label: "Founder Access", active: true }
];

const fallbackPayments = [
  { id: "dana", type: "ewallet", name: "DANA", number: "082258464062", accountName: "ROMADON SAPUTRA", active: true },
  { id: "gopay", type: "ewallet", name: "GoPay", number: "082258464062", accountName: "ROMADON SAPUTRA", active: true },
  { id: "ovo", type: "ewallet", name: "OVO", number: "082258464062", accountName: "ROMADON SAPUTRA", active: true },
  { id: "bri", type: "bank", name: "Bank BRI", number: "7705 0101 2157 535", accountName: "ROMADON SAPUTRA", active: true },
  { id: "jago", type: "bank", name: "Bank Jago", number: "102893930380", accountName: "ROMADON SAPUTRA", active: true },
  { id: "seabank", type: "bank", name: "SeaBank", number: "901537786673", accountName: "ROMADON SAPUTRA", active: true }
];

async function getSafeCollection(name, fallback){
  try{
    if(window.AiSignalFirebase?.getCollectionDocs){
      const rows = await window.AiSignalFirebase.getCollectionDocs(name);
      return rows.length ? rows.filter(x => x.active !== false) : fallback;
    }
  }catch(error){
    console.warn("Firestore fallback:", name, error);
  }
  return fallback;
}

async function loadVipPage(){
  const packages = await getSafeCollection("vipPackages", fallbackPackages);
  const payments = await getSafeCollection("paymentMethods", fallbackPayments);
  renderVipPackages(packages);
  renderPaymentMethods(payments);
}

function renderVipPackages(packages){
  const box = document.getElementById("vip-package-list");
  if(!box) return;

  box.innerHTML = packages.map(pkg => `
    <div class="card vip-select-card" onclick='selectVipPackage(${JSON.stringify(pkg).replace(/'/g, "&apos;")})'>
      <span class="badge vip">${pkg.label || "VIP"}</span>
      <h3 style="margin-top:12px;">${pkg.name}</h3>
      <p><s>${moneyIDR(pkg.normalPrice)}</s></p>
      <h2 class="yellow">${moneyIDR(pkg.finalPrice)}</h2>
      <p>${pkg.durationDays || 30} hari akses VIP</p>
    </div>
  `).join("");
}

function renderPaymentMethods(methods){
  const box = document.getElementById("payment-method-list");
  if(!box) return;

  box.innerHTML = methods.map(method => `
    <div class="card payment-select-card">
      <div onclick='selectPaymentMethod(${JSON.stringify(method).replace(/'/g, "&apos;")})'>
        <span class="badge free">${method.type || "payment"}</span>
        <h3 style="margin-top:12px;">${method.name}</h3>
        <p class="payment-number"><b>${method.number}</b></p>
        <p>a.n. ${method.accountName || "ROMADON SAPUTRA"}</p>
      </div>
      <div class="payment-actions">
        <button onclick="copyPaymentNumber('${method.number}', '${method.name}')">Salin Nomor</button>
        <button onclick='selectPaymentMethod(${JSON.stringify(method).replace(/'/g, "&apos;")})'>Pilih</button>
      </div>
    </div>
  `).join("");
}

function selectVipPackage(pkg){
  selectedVipPackage = pkg;
  document.getElementById("selected-package-label").innerText = `${pkg.name} • ${moneyIDR(pkg.finalPrice)}`;
}

function selectPaymentMethod(method){
  selectedPaymentMethod = method;
  document.getElementById("selected-method-label").innerText = `${method.name} • ${method.number}`;
}

async function submitVipRequest(){
  if(!currentUser){
    alert("Login dulu.");
    return;
  }

  if(!selectedVipPackage || !selectedPaymentMethod){
    alert("Pilih paket VIP dan metode pembayaran dulu.");
    return;
  }

  const senderName = document.getElementById("vip-payment-name")?.value.trim();
  const note = document.getElementById("vip-payment-note")?.value.trim();
  const proofFile = document.getElementById("vip-proof-file")?.files?.[0];
  let proofUrl = "";

  try{
    if(proofFile && window.AiSignalCloudinary?.uploadToCloudinary){
      document.getElementById("vip-upload-status").innerText = "Uploading proof to Cloudinary...";
      const uploaded = await window.AiSignalCloudinary.uploadToCloudinary(proofFile, "aisignalfx/payment_proofs");
      proofUrl = uploaded.secure_url;
      document.getElementById("vip-upload-status").innerText = "Proof uploaded.";
    }
  }catch(error){
    alert("Upload bukti gagal, request tetap bisa dibuat. Kirim bukti via WA/TG. Error: " + error.message);
  }

  const payload = {
    userId: currentUser.uid || "demo-" + currentUser.name,
    userName: currentUser.name,
    email: currentUser.email || "",
    packageId: selectedVipPackage.id,
    packageName: selectedVipPackage.name,
    amount: selectedVipPackage.finalPrice,
    durationDays: selectedVipPackage.durationDays || 30,
    paymentMethod: selectedPaymentMethod.name,
    paymentNumber: selectedPaymentMethod.number,
    accountName: selectedPaymentMethod.accountName || "ROMADON SAPUTRA",
    senderName: senderName || currentUser.name,
    note: note || "",
    proofUrl
  };

  if(window.AiSignalFirebase?.createVipRequest){
    await window.AiSignalFirebase.createVipRequest(payload);
    alert("VIP request terkirim ke Admin Control.");
  }else{
    alert("Firebase belum siap. Data request belum tersimpan.");
  }
}

function showAdminPanel(name){
  document.querySelectorAll(".admin-panel").forEach(panel => panel.classList.remove("active"));
  document.querySelectorAll(".admin-tabs button").forEach(btn => btn.classList.remove("active"));

  const target = document.getElementById("admin-panel-" + name);
  if(target) target.classList.add("active");

  const button = Array.from(document.querySelectorAll(".admin-tabs button")).find(btn => btn.textContent.toLowerCase().includes(name));
  if(button) button.classList.add("active");

  if(name === "users") loadAdminUsers();
  if(name === "vip") loadVipRequests();
  if(name === "pricing") loadAdminPricing();
  if(name === "payments") loadAdminPayments();
}

function loadAdminOverview(){
  if(currentUser?.level === "admin"){
    loadVipPage();
  }
}

async function loadAdminUsers(){
  const box = document.getElementById("admin-users-list");
  if(!box) return;

  const users = await getSafeCollection("users", []);
  if(!users.length){
    box.innerHTML = `<div class="card"><p>Belum ada user Firebase. User demo tidak masuk database. Coba daftar lewat Register Preview.</p></div>`;
    return;
  }

  box.innerHTML = users.map(user => `
    <div class="card admin-row">
      <div>
        <h3>${user.displayName || user.email || user.id}</h3>
        <p>${user.email || ""}</p>
        <p>Role: <b>${user.level || "free"}</b></p>
      </div>
      <div class="row-actions">
        <button onclick="setUserRole('${user.id}','free')">Free</button>
        <button onclick="setUserRole('${user.id}','vip')">VIP</button>
        <button onclick="setUserRole('${user.id}','admin')">Admin</button>
      </div>
    </div>
  `).join("");
}

async function setUserRole(uid, level){
  if(!confirm("Ubah role user jadi " + level + "?")) return;
  await window.AiSignalFirebase.updateUserRole(uid, level);
  loadAdminUsers();
}

async function loadVipRequests(){
  const box = document.getElementById("admin-vip-requests");
  if(!box) return;

  const rows = await getSafeCollection("vipRequests", []);
  if(!rows.length){
    box.innerHTML = `<div class="card"><p>Belum ada VIP request.</p></div>`;
    return;
  }

  box.innerHTML = rows.map(row => `
    <div class="card admin-row">
      <div>
        <h3>${row.userName || "User"} • ${row.packageName || ""}</h3>
        <p>${moneyIDR(row.amount)} via ${row.paymentMethod || "-"}</p>
        <p>Status: <b>${row.status || "pending"}</b></p>
        ${row.proofUrl ? `<p><a href="${row.proofUrl}" target="_blank">Open Proof</a></p>` : `<p>Proof: WA/TG manual or not uploaded</p>`}
      </div>
      <div class="row-actions">
        <button onclick="setVipRequestStatus('${row.id}','approved')">Approve</button>
        <button onclick="setVipRequestStatus('${row.id}','rejected')">Reject</button>
      </div>
    </div>
  `).join("");
}

async function setVipRequestStatus(id, status){
  await window.AiSignalFirebase.updateVipRequestStatus(id, status);
  loadVipRequests();
}

async function loadAdminPricing(){
  const rows = await getSafeCollection("vipPackages", fallbackPackages);
  const box = document.getElementById("admin-pricing-list");
  if(box) renderVipPackagesToBox(rows, box);
}

function renderVipPackagesToBox(rows, box){
  box.innerHTML = rows.map(pkg => `
    <div class="card">
      <span class="badge vip">${pkg.label || "VIP"}</span>
      <h3 style="margin-top:10px;">${pkg.name}</h3>
      <p>Normal: ${moneyIDR(pkg.normalPrice)}</p>
      <p>Diskon: ${moneyIDR(pkg.discount)}</p>
      <h3 class="yellow">${moneyIDR(pkg.finalPrice)}</h3>
      <p>${pkg.durationDays || 30} hari</p>
    </div>
  `).join("");
}

async function saveVipPackageFromAdmin(){
  const data = {
    id: document.getElementById("pricing-id").value.trim(),
    name: document.getElementById("pricing-name").value.trim(),
    normalPrice: Number(document.getElementById("pricing-normal").value || 0),
    discount: Number(document.getElementById("pricing-discount").value || 0),
    finalPrice: Number(document.getElementById("pricing-final").value || 0),
    durationDays: Number(document.getElementById("pricing-days").value || 30),
    label: document.getElementById("pricing-label").value.trim(),
    active: true
  };

  if(!data.id || !data.name){
    alert("Isi package id dan nama paket.");
    return;
  }

  await window.AiSignalFirebase.upsertDoc("vipPackages", data.id, data);
  alert("Paket VIP tersimpan.");
  loadAdminPricing();
}

async function loadAdminPayments(){
  const rows = await getSafeCollection("paymentMethods", fallbackPayments);
  const box = document.getElementById("admin-payment-list");
  if(!box) return;
  box.innerHTML = rows.map(item => `
    <div class="card">
      <span class="badge free">${item.type}</span>
      <h3 style="margin-top:10px;">${item.name}</h3>
      <p><b>${item.number}</b></p>
      <p>a.n. ${item.accountName}</p>
    </div>
  `).join("");
}

async function savePaymentMethodFromAdmin(){
  const data = {
    id: document.getElementById("payment-id").value.trim(),
    name: document.getElementById("payment-name").value.trim(),
    type: document.getElementById("payment-type").value.trim() || "ewallet",
    number: document.getElementById("payment-number").value.trim(),
    accountName: document.getElementById("payment-account").value.trim() || "ROMADON SAPUTRA",
    active: true
  };

  if(!data.id || !data.name || !data.number){
    alert("Isi id, nama metode, dan nomor.");
    return;
  }

  await window.AiSignalFirebase.upsertDoc("paymentMethods", data.id, data);
  alert("Metode pembayaran tersimpan.");
  loadAdminPayments();
}

async function saveFeatureModesFromAdmin(){
  const data = {
    signalScanner: document.getElementById("mode-scanner").value,
    sentinelAI: document.getElementById("mode-sentinel").value,
    news: document.getElementById("mode-news").value,
    cryptoProvider: document.getElementById("mode-crypto").value,
    forexProvider: document.getElementById("mode-forex").value
  };

  await window.AiSignalFirebase.saveFeatureModes(data);
  alert("Feature mode tersimpan.");
}

async function saveManualSentiment(){
  const data = {
    pair: document.getElementById("admin-sentiment-pair").value,
    session: document.getElementById("admin-sentiment-session").value,
    long: document.getElementById("admin-sentiment-long").value,
    short: document.getElementById("admin-sentiment-short").value,
    netVolume: document.getElementById("admin-sentiment-volume").value,
    positions: document.getElementById("admin-sentiment-positions").value,
    note: document.getElementById("admin-sentiment-note").value,
    updatedAtText: new Date().toLocaleString("id-ID")
  };

  if(window.AiSignalFirebase?.saveManualSentiment){
    await window.AiSignalFirebase.saveManualSentiment(data);
    alert("Sentiment tersimpan.");
  }
  applySentimentToUI(data);
}

async function loadManualSentiment(){
  if(window.AiSignalFirebase?.getManualSentiment){
    const data = await window.AiSignalFirebase.getManualSentiment();
    if(data) applySentimentToUI(data);
  }
}

function applySentimentToUI(data){
  const set = (id, value) => { const el = document.getElementById(id); if(el) el.innerText = value; };
  set("sentiment-pair", data.pair || "XAUUSD");
  set("sentiment-long", (data.long || "59") + "%");
  set("sentiment-short", (data.short || "41") + "%");
  set("sentiment-session", data.session || "Asia");
  set("sentiment-volume", data.netVolume || "+321.66 lots");
  set("sentiment-positions", data.positions || "14.2K");
  set("sentiment-note", data.note || "");
  set("sentiment-updated", data.updatedAtText || "Manual");
}

function openCalendarWidget(){
  document.getElementById("calendar-preview")?.classList.toggle("hidden");
}

async function saveManualNews(){
  const title = document.getElementById("admin-news-title").value.trim();
  const body = document.getElementById("admin-news-body").value.trim();
  if(!title || !body){
    alert("Isi judul dan berita.");
    return;
  }
  await window.AiSignalFirebase.saveManualNews({ title, body, impact: "manual" });
  alert("News manual tersimpan.");
}

async function saveSignalBroadcast(){
  const pair = document.getElementById("signal-pair").value.trim();
  const bias = document.getElementById("signal-bias").value.trim();
  const note = document.getElementById("signal-note").value.trim();
  if(!pair || !bias){
    alert("Isi pair dan bias.");
    return;
  }
  await window.AiSignalFirebase.saveSignal({ pair, bias, note, mode: "demo" });
  alert("Signal demo tersimpan.");
}

async function saveAdSlot(){
  const title = document.getElementById("ad-title").value.trim();
  const link = document.getElementById("ad-link").value.trim();
  const note = document.getElementById("ad-note").value.trim();
  if(!title){
    alert("Isi judul ads.");
    return;
  }
  await window.AiSignalFirebase.saveAd({ title, link, note, active: true });
  alert("Ad slot tersimpan.");
}

window.loadVipPage = loadVipPage;
window.selectVipPackage = selectVipPackage;
window.selectPaymentMethod = selectPaymentMethod;
window.submitVipRequest = submitVipRequest;
window.showAdminPanel = showAdminPanel;
window.loadAdminOverview = loadAdminOverview;
window.loadAdminUsers = loadAdminUsers;
window.setUserRole = setUserRole;
window.loadVipRequests = loadVipRequests;
window.setVipRequestStatus = setVipRequestStatus;
window.loadAdminPricing = loadAdminPricing;
window.saveVipPackageFromAdmin = saveVipPackageFromAdmin;
window.loadAdminPayments = loadAdminPayments;
window.savePaymentMethodFromAdmin = savePaymentMethodFromAdmin;
window.saveFeatureModesFromAdmin = saveFeatureModesFromAdmin;
window.saveManualSentiment = saveManualSentiment;
window.openCalendarWidget = openCalendarWidget;
window.saveManualNews = saveManualNews;
window.saveSignalBroadcast = saveSignalBroadcast;
window.saveAdSlot = saveAdSlot;


function copyPaymentNumber(number, name){
  const clean = String(number || "").replace(/\s+/g, "");
  if(navigator.clipboard){
    navigator.clipboard.writeText(clean).then(() => {
      alert(`Nomor ${name} berhasil disalin.`);
    }).catch(() => {
      prompt("Salin nomor ini:", clean);
    });
  }else{
    prompt("Salin nomor ini:", clean);
  }
}

function toggleProfileEdit(show){
  const panel = document.getElementById("profile-edit-panel");
  if(!panel) return;
  panel.classList.toggle("hidden", !show);

  if(show){
    document.getElementById("edit-display-name").value = currentUser?.name || "";
    document.getElementById("edit-username").value = currentUser?.username || "";
    document.getElementById("edit-country").value = currentUser?.countryTimezone || "Indonesia / Asia Jakarta";
    document.getElementById("edit-style").value = currentUser?.style || "";
    document.getElementById("edit-pairs").value = currentUser?.pairs || "";
    document.getElementById("edit-bio").value = currentUser?.bio || "";
  }
}

async function saveProfileChanges(){
  if(!currentUser){
    alert("Login dulu.");
    return;
  }

  const status = document.getElementById("profile-save-status");
  if(status) status.innerText = "Saving profile...";

  const displayName = document.getElementById("edit-display-name").value.trim() || currentUser.name;
  const username = document.getElementById("edit-username").value.trim();
  const countryTimezone = document.getElementById("edit-country").value.trim();
  const tradingStyle = document.getElementById("edit-style").value.trim();
  const favoritePairs = document.getElementById("edit-pairs").value.trim();
  const bio = document.getElementById("edit-bio").value.trim();
  const avatarFile = document.getElementById("edit-avatar-file")?.files?.[0];

  let avatarUrl = currentUser.avatarUrl || "";
  try{
    if(avatarFile && window.AiSignalCloudinary?.uploadToCloudinary){
      const uploaded = await window.AiSignalCloudinary.uploadToCloudinary(avatarFile, "aisignalfx/avatars");
      avatarUrl = uploaded.secure_url;
    }
  }catch(error){
    alert("Upload avatar gagal, profil tetap disimpan tanpa avatar gambar. " + error.message);
  }

  const avatarLetter = (displayName[0] || "U").toUpperCase();

  const data = {
    displayName,
    username,
    countryTimezone,
    tradingStyle,
    favoritePairs,
    bio,
    avatar: avatarLetter,
    avatarUrl
  };

  currentUser = {
    ...currentUser,
    name: displayName,
    username,
    countryTimezone,
    style: tradingStyle,
    pairs: favoritePairs,
    bio,
    avatar: avatarLetter,
    avatarUrl
  };

  try{
    if(window.AiSignalFirebase?.upsertDoc && currentUser.uid){
      await window.AiSignalFirebase.upsertDoc("users", currentUser.uid, data);
    }
    hydrateProfile();
    toggleProfileEdit(false);
    if(status) status.innerText = "Profile saved.";
    alert("Profile berhasil disimpan.");
  }catch(error){
    if(status) status.innerText = "Save failed.";
    alert("Gagal menyimpan profile: " + error.message);
  }
}

function expandChartTerminal(){
  const chartCard = document.querySelector(".chart-terminal-card");
  if(!chartCard) return;
  chartCard.classList.toggle("chart-expanded");
  setTimeout(initTradingView, 250);
}

function showLabTab(name){
  document.querySelectorAll(".lab-panel").forEach(panel => panel.classList.remove("active"));
  document.querySelectorAll(".lab-tabs button").forEach(btn => btn.classList.remove("active"));

  const target = document.getElementById("lab-" + name);
  if(target) target.classList.add("active");

  const button = Array.from(document.querySelectorAll(".lab-tabs button")).find(btn => btn.getAttribute("onclick")?.includes("'" + name + "'"));
  if(button) button.classList.add("active");
}

function saveJournalEntry(){
  const row = {
    pair: document.getElementById("journal-pair")?.value || "XAUUSD",
    bias: document.getElementById("journal-bias")?.value || "WAIT",
    entry: document.getElementById("journal-entry")?.value || "-",
    sl: document.getElementById("journal-sl")?.value || "-",
    tp: document.getElementById("journal-tp")?.value || "-",
    result: document.getElementById("journal-result")?.value || "-",
    note: document.getElementById("journal-note")?.value || "",
    createdAtText: new Date().toLocaleString("id-ID")
  };

  const key = "aisignalfx_journal_entries";
  const rows = JSON.parse(localStorage.getItem(key) || "[]");
  rows.unshift(row);
  localStorage.setItem(key, JSON.stringify(rows.slice(0, 20)));
  renderJournalEntries();
  alert("Journal tersimpan di perangkat ini.");
}

function renderJournalEntries(){
  const box = document.getElementById("journal-list");
  if(!box) return;
  const rows = JSON.parse(localStorage.getItem("aisignalfx_journal_entries") || "[]");
  if(!rows.length){
    box.innerHTML = "<p class='muted'>Belum ada journal tersimpan.</p>";
    return;
  }
  box.innerHTML = rows.map(row => `
    <div class="journal-mini">
      <b>${row.pair}</b> • ${row.bias} • Result: ${row.result}
      <small>${row.createdAtText}</small>
      <p>${row.note || "No note"}</p>
    </div>
  `).join("");
}

window.copyPaymentNumber = copyPaymentNumber;
window.toggleProfileEdit = toggleProfileEdit;
window.saveProfileChanges = saveProfileChanges;
window.expandChartTerminal = expandChartTerminal;
window.showLabTab = showLabTab;
window.saveJournalEntry = saveJournalEntry;
window.renderJournalEntries = renderJournalEntries;


const forexDemoSignals = [
  { symbol: "XAUUSD", market: "gold", bias: "BUY", confidence: 82, note: "Liquidity sweep preview. Tunggu retest demand dan confirmation candle." },
  { symbol: "EURUSD", market: "forex", bias: "SELL", confidence: 76, note: "Bearish structure preview. Pantau premium zone retest." },
  { symbol: "GBPUSD", market: "forex", bias: "WAIT", confidence: 58, note: "Struktur belum bersih. Tunggu BOS/CHoCH valid." },
  { symbol: "USDJPY", market: "forex", bias: "BUY", confidence: 69, note: "Momentum bullish preview, validasi saat London/NY." },
  { symbol: "GBPJPY", market: "forex", bias: "WAIT", confidence: 54, note: "Volatilitas tinggi. Hindari entry tanpa konfirmasi." },
  { symbol: "NAS100", market: "indices", bias: "BUY", confidence: 71, note: "Momentum positif. Tunggu pullback sehat." }
];

const demoCommunityPosts = [
  { id: "p1", user: "Romadon Saputra", tier: "Sentinel Elite", pair: "XAUUSD", bias: "BUY", likes: 8400, comments: 128, caption: "Liquidity sweep + demand retest. Tunggu confirmation candle.", image: "" },
  { id: "p2", user: "BTC Mapper", tier: "Pro Mapper", pair: "BTCUSDT", bias: "WAIT", likes: 5100, comments: 92, caption: "BTC sedang konsolidasi, tunggu breakout valid.", image: "" },
  { id: "p3", user: "GBPJPY Analyst", tier: "Rising Analyst", pair: "GBPJPY", bias: "SELL", likes: 3800, comments: 71, caption: "Bearish retest zone. Valid saat London session.", image: "" },
  { id: "p4", user: "Gold Hunter", tier: "Top Mapper", pair: "XAUUSD", bias: "WAIT", likes: 2600, comments: 44, caption: "No trade sebelum high impact news.", image: "" },
  { id: "p5", user: "Crypto SMC", tier: "Top Mapper", pair: "ETHUSDT", bias: "BUY", likes: 2400, comments: 38, caption: "ETH momentum positif, tunggu retest area breakout.", image: "" }
];

const demoLeaderboard = [
  { rank: 1, name: "Romadon Saputra", tier: "Sentinel Elite", followers: "1.2K", likes: "8.4K", posts: 34 },
  { rank: 2, name: "BTC Mapper", tier: "Pro Mapper", followers: "870", likes: "5.1K", posts: 22 },
  { rank: 3, name: "GBPJPY Analyst", tier: "Rising Analyst", followers: "640", likes: "3.8K", posts: 19 },
  { rank: 4, name: "Gold Hunter", tier: "Top Mapper", followers: "520", likes: "2.6K", posts: 16 },
  { rank: 5, name: "Crypto SMC", tier: "Top Mapper", followers: "490", likes: "2.4K", posts: 14 },
  { rank: 6, name: "London Session", tier: "Top Mapper", followers: "410", likes: "2.1K", posts: 12 },
  { rank: 7, name: "NY Scalper", tier: "Top Mapper", followers: "390", likes: "1.9K", posts: 11 },
  { rank: 8, name: "Liquidity Pro", tier: "Top Mapper", followers: "350", likes: "1.7K", posts: 10 },
  { rank: 9, name: "FVG Hunter", tier: "Top Mapper", followers: "320", likes: "1.5K", posts: 9 },
  { rank: 10, name: "Asia Range", tier: "Top Mapper", followers: "280", likes: "1.2K", posts: 8 }
];

let scannerMode = "all";

async function loadCryptoMarket(){
  const box = document.getElementById("crypto-market-preview");
  if(box) box.innerHTML = `<p class="muted">Loading crypto market data...</p>`;

  try{
    const rows = await window.AiSignalBinance.fetchBinanceTicker24h();
    const signals = rows.map(window.AiSignalBinance.buildCryptoSignal);

    if(box){
      box.innerHTML = signals.slice(0, 5).map(item => `
        <div class="crypto-row">
          <b>${item.symbol}</b>
          <span>$${item.price.toLocaleString("en-US", { maximumFractionDigits: item.price > 100 ? 2 : 4 })}</span>
          <small class="${item.change >= 0 ? "green" : "red"}">${item.change.toFixed(2)}%</small>
        </div>
      `).join("");
    }

    if(document.getElementById("scanner-grid")){
      renderScannerGrid(signals);
    }
  }catch(error){
    if(box) box.innerHTML = `<p class="muted">Crypto data sedang tidak tersedia. Sistem tetap memakai fallback demo.</p>`;
    if(document.getElementById("scanner-grid")){
      renderScannerGrid([]);
    }
  }
}

function setScannerMode(mode){
  scannerMode = mode;
  document.querySelectorAll(".scanner-tools .chip").forEach(btn => btn.classList.remove("active"));
  const active = Array.from(document.querySelectorAll(".scanner-tools .chip")).find(btn => btn.getAttribute("onclick")?.includes("'" + mode + "'"));
  if(active) active.classList.add("active");
  loadCryptoMarket();
}

function signalBadge(bias){
  if(bias === "BUY") return "buy";
  if(bias === "SELL") return "sell";
  return "wait";
}

function renderScannerGrid(cryptoSignals = []){
  const grid = document.getElementById("scanner-grid");
  if(!grid) return;

  const cryptoCards = cryptoSignals.map(item => ({
    symbol: item.symbol,
    market: "crypto",
    bias: item.bias,
    confidence: item.confidence,
    note: item.note,
    price: item.price,
    change: item.change
  }));

  let rows = [];
  if(scannerMode === "crypto") rows = cryptoCards;
  else if(scannerMode === "forex") rows = forexDemoSignals.filter(x => x.market === "forex");
  else if(scannerMode === "gold") rows = forexDemoSignals.filter(x => x.market === "gold");
  else if(scannerMode === "favorites") rows = [...forexDemoSignals.slice(0,2), ...cryptoCards.slice(0,3)];
  else rows = [...forexDemoSignals, ...cryptoCards];

  if(!rows.length) rows = forexDemoSignals;

  grid.innerHTML = rows.slice(0, 12).map(item => `
    <div class="card signal-card">
      <span class="badge ${signalBadge(item.bias)}">${item.bias}</span>
      <h3 style="margin-top:12px;">${item.symbol}</h3>
      ${item.price ? `<p><b>Price:</b> $${item.price.toLocaleString("en-US", { maximumFractionDigits: item.price > 100 ? 2 : 4 })}</p>` : ""}
      ${typeof item.change === "number" ? `<p><b>24h:</b> <span class="${item.change >= 0 ? "green" : "red"}">${item.change.toFixed(2)}%</span></p>` : ""}
      <p>${item.note}</p>
      <p><b class="green">Confidence:</b> ${item.confidence}%</p>
      <small>${item.market === "crypto" ? "Real Free Mode • Binance Public" : "Demo Mode • Forex/Gold"}</small>
    </div>
  `).join("");
}

function renderDashboardFyp(){
  const box = document.getElementById("dashboard-fyp-list");
  if(!box) return;
  box.innerHTML = demoCommunityPosts.slice(0,3).map(post => mappingPostCard(post, true)).join("");
}

function mappingPostCard(post, mini = false){
  return `
    <div class="card mapping-post-card" onclick="openMappingDetail('${post.id}')">
      <div class="mapping-thumb ${post.image ? "has-image" : ""}">
        ${post.image ? `<img src="${post.image}" alt="mapping">` : `<div><b>${post.pair}</b><span>${post.bias}</span></div>`}
      </div>
      <h3>${post.pair} • ${post.bias}</h3>
      <p>${post.caption}</p>
      <div class="mapping-meta">
        <span>${post.user}</span>
        <span>♥ ${Number(post.likes).toLocaleString("id-ID")}</span>
        <span>💬 ${post.comments}</span>
      </div>
      ${mini ? "" : `<button class="small-btn" onclick="event.stopPropagation(); followMapper('${post.user}')">Follow</button>`}
    </div>
  `;
}

function renderCommunity(){
  const feed = document.getElementById("community-feed");
  const leaderboard = document.getElementById("leaderboard-list");
  if(leaderboard){
    leaderboard.innerHTML = demoLeaderboard.map(item => `
      <div class="leaderboard-row">
        <b>#${item.rank}</b>
        <div><strong>${item.name}</strong><small>${item.tier}</small></div>
        <span>${item.followers} followers</span>
        <span>${item.likes} likes</span>
      </div>
    `).join("");
  }

  if(feed){
    feed.innerHTML = demoCommunityPosts.map(post => mappingPostCard(post)).join("");
  }
}

function setCommunityTab(tab){
  document.querySelectorAll(".community-tabs button").forEach(btn => btn.classList.remove("active"));
  const active = Array.from(document.querySelectorAll(".community-tabs button")).find(btn => btn.getAttribute("onclick")?.includes("'" + tab + "'"));
  if(active) active.classList.add("active");

  document.getElementById("community-upload")?.classList.toggle("hidden", tab !== "upload");
  document.getElementById("community-leaderboard")?.classList.toggle("hidden", tab !== "leaderboard" && tab !== "fyp" && tab !== "trending");

  const feed = document.getElementById("community-feed");
  if(!feed) return;

  if(tab === "leaderboard"){
    feed.innerHTML = "";
    return;
  }

  if(tab === "following"){
    feed.innerHTML = demoCommunityPosts.slice(0,2).map(post => mappingPostCard(post)).join("");
    return;
  }

  if(tab === "latest"){
    feed.innerHTML = [...demoCommunityPosts].reverse().map(post => mappingPostCard(post)).join("");
    return;
  }

  feed.innerHTML = demoCommunityPosts.map(post => mappingPostCard(post)).join("");
}

async function submitMappingPost(){
  const pair = document.getElementById("mapping-pair").value.trim() || "XAUUSD";
  const bias = document.getElementById("mapping-bias").value.trim() || "WAIT";
  const title = document.getElementById("mapping-title").value.trim() || `${pair} Mapping Idea`;
  const caption = document.getElementById("mapping-caption").value.trim() || "Community mapping idea.";
  const file = document.getElementById("mapping-file")?.files?.[0];
  const status = document.getElementById("mapping-upload-status");
  let image = "";

  try{
    if(file && window.AiSignalCloudinary?.uploadToCloudinary){
      if(status) status.innerText = "Uploading mapping...";
      const uploaded = await window.AiSignalCloudinary.uploadToCloudinary(file, "aisignalfx/mapping_feed");
      image = uploaded.secure_url;
    }

    const post = {
      id: "local-" + Date.now(),
      user: currentUser?.name || "AiSignalFx User",
      tier: currentUser?.level === "admin" ? "Sentinel Elite" : currentUser?.level === "vip" ? "Pro Mapper" : "Community Mapper",
      pair,
      bias,
      title,
      caption,
      image,
      likes: 0,
      comments: 0
    };

    demoCommunityPosts.unshift(post);

    if(window.AiSignalFirebase?.addCollectionDoc){
      await window.AiSignalFirebase.addCollectionDoc("mappingPosts", post);
    }

    if(status) status.innerText = "Mapping published.";
    setCommunityTab("latest");
    renderDashboardFyp();
    alert("Mapping berhasil diposting.");
  }catch(error){
    if(status) status.innerText = "Upload gagal.";
    alert("Gagal upload mapping: " + error.message);
  }
}

function openMappingDetail(id){
  const post = demoCommunityPosts.find(x => x.id === id);
  if(!post) return;
  alert(`${post.pair} by ${post.user}\\n\\n${post.caption}\\n\\nLike, comment, save, dan detail profile akan dibuat lebih lengkap pada versi social berikutnya.`);
}

function followMapper(name){
  alert(`Kamu mengikuti ${name}.`);
}

async function saveLearningModule(){
  const title = document.getElementById("module-title")?.value.trim();
  const category = document.getElementById("module-category")?.value.trim();
  const status = document.getElementById("module-status")?.value || "draft";
  const body = document.getElementById("module-body")?.value.trim();

  if(!title || !body){
    alert("Isi judul dan isi modul.");
    return;
  }

  if(window.AiSignalFirebase?.addCollectionDoc){
    await window.AiSignalFirebase.addCollectionDoc("learningModules", { title, category, status, body });
  }
  alert(status === "published" ? "Modul dipublikasikan." : "Modul tersimpan sebagai draft.");
}

window.loadCryptoMarket = loadCryptoMarket;
window.setScannerMode = setScannerMode;
window.renderScannerGrid = renderScannerGrid;
window.renderDashboardFyp = renderDashboardFyp;
window.renderCommunity = renderCommunity;
window.setCommunityTab = setCommunityTab;
window.submitMappingPost = submitMappingPost;
window.openMappingDetail = openMappingDetail;
window.followMapper = followMapper;
window.saveLearningModule = saveLearningModule;
