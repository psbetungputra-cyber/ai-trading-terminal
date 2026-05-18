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
    dashboard: "AiSignalFx PRO",
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
  const pageTitleEl = document.getElementById("page-title");
  if (pageTitleEl) pageTitleEl.innerText = window.innerWidth <= 768 ? "AiSignalFx PRO" : (titles[id] || "AiSignalFx PRO");
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


function communityLatestPosts(){
  return [...demoCommunityPosts].sort((a,b) => {
    const ai = String(a.id || "");
    const bi = String(b.id || "");
    const at = Number(ai.replace("local-","")) || 0;
    const bt = Number(bi.replace("local-","")) || 0;

    if (!!b.image !== !!a.image) return b.image ? 1 : -1;
    return bt - at;
  });
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
    feed.innerHTML = communityLatestPosts().map(post => mappingPostCard(post)).join("");
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
    feed.innerHTML = communityLatestPosts().map(post => mappingPostCard(post)).join("");
    return;
  }

  feed.innerHTML = communityLatestPosts().map(post => mappingPostCard(post)).join("");
}

async function submitMappingPost(){
  const pair = document.getElementById("mapping-pair").value.trim() || "XAUUSD";
  const bias = document.getElementById("mapping-bias").value.trim() || "WAIT";
  const title = document.getElementById("mapping-title").value.trim() || `${pair} Mapping Idea`;
  const caption = document.getElementById("mapping-caption").value.trim() || "Community mapping idea.";
  const file = document.getElementById("mapping-file")?.files?.[0];
  const status = document.getElementById("mapping-upload-status");
  let image = "";
    let localPreview = file ? URL.createObjectURL(file) : "";

  try{
    if(file && window.AiSignalCloudinary?.uploadToCloudinary){
      if(status) status.innerText = "Uploading mapping...";
      const uploaded = await window.AiSignalCloudinary.uploadToCloudinary(file, "aisignalfx/mapping_feed");
      image = (uploaded && (uploaded.secure_url || uploaded.url)) || localPreview || "";
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
    if(status) status.innerText = "Mapping berhasil diposting.";
  }catch(error){
    if(status) status.innerText = "Upload gagal.";
    if(status) status.innerText = "Gagal upload mapping. Coba cek gambar atau koneksi.";
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

/* AiSignalFx PRO - Sentinel Trading Lab Demo Upgrade */
(function(){
  function labToast(message){
    if (typeof window.toast === "function") {
      window.toast(message);
      return;
    }
    const old = document.querySelector(".lab-toast");
    if (old) old.remove();
    const el = document.createElement("div");
    el.className = "lab-toast";
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add("show"), 30);
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 300);
    }, 2600);
  }

  function getJournalRows(){
    try {
      return JSON.parse(localStorage.getItem("aisignalfx_journal_entries") || "[]");
    } catch(e) {
      return [];
    }
  }

  function setJournalRows(rows){
    localStorage.setItem("aisignalfx_journal_entries", JSON.stringify(rows));
  }

  function renderJournalEntriesV32(){
    const box = document.getElementById("journal-list");
    if (!box) return;
    const rows = getJournalRows();

    if (!rows.length) {
      box.innerHTML = "<p class='muted'>Belum ada journal tersimpan.</p>";
      return;
    }

    box.innerHTML = rows.slice().reverse().map(row => `
      <div class="journal-mini lab-journal-card">
        <div>
          <b>${row.pair}</b>
          <span>${row.bias}</span>
        </div>
        <small>${row.createdAt || "-"}</small>
        <p><b>Entry:</b> ${row.entry} · <b>SL:</b> ${row.sl} · <b>TP:</b> ${row.tp}</p>
        <p><b>Result:</b> ${row.result}</p>
        <p>${row.note || "No note"}</p>
      </div>
    `).join("");
  }

  function saveJournalEntryV32(){
    const row = {
      pair: document.getElementById("journal-pair")?.value || "XAUUSD",
      bias: document.getElementById("journal-bias")?.value || "WAIT",
      entry: document.getElementById("journal-entry")?.value || "-",
      sl: document.getElementById("journal-sl")?.value || "-",
      tp: document.getElementById("journal-tp")?.value || "-",
      result: document.getElementById("journal-result")?.value || "-",
      note: document.getElementById("journal-note")?.value || "",
      createdAt: new Date().toLocaleString("id-ID")
    };

    const rows = getJournalRows();
    rows.push(row);
    setJournalRows(rows);
    renderJournalEntriesV32();
    labToast("Journal tersimpan di perangkat ini. Firebase sync akan ditambahkan tahap berikutnya.");
  }

  function renderTradingLabDemo(){
    const risk = document.getElementById("lab-risk");
    if (risk) {
      risk.innerHTML = `
        <div class="grid-3">
          <div class="card lab-module-card">
            <span class="badge free">Risk Calculator</span>
            <h3>Risk & Reward</h3>
            <p>Hitung estimasi risiko sebelum entry. Mode ini masih demo untuk edukasi.</p>
            <div class="lab-calc">
              <input id="risk-balance" type="number" placeholder="Modal, contoh 1000">
              <input id="risk-percent" type="number" placeholder="Risk %, contoh 1">
              <input id="risk-entry" type="number" placeholder="Entry price">
              <input id="risk-sl" type="number" placeholder="Stop Loss price">
              <button class="small-btn" id="risk-calc-btn">Calculate Risk</button>
              <p id="risk-calc-result" class="muted"></p>
            </div>
          </div>
          <div class="card lab-module-card">
            <span class="badge free">Money Management</span>
            <h3>1–2% Risk Rule</h3>
            <p>Batasi risiko per posisi. Hindari menaikkan lot setelah loss beruntun.</p>
            <ul>
              <li>Risk normal: 1% per trade</li>
              <li>Risk agresif: maksimal 2%</li>
              <li>Stop trading saat daily limit tercapai</li>
            </ul>
          </div>
          <div class="card lab-module-card">
            <span class="badge vip">Discipline</span>
            <h3>Anti FOMO Rules</h3>
            <p>Jangan entry saat candle sudah jauh dari area valid. Tunggu pullback, retest, atau konfirmasi struktur.</p>
          </div>
        </div>
      `;
    }

    const academy = document.getElementById("lab-academy");
    if (academy) {
      academy.innerHTML = `
        <div class="grid-3">
          <div class="card lab-module-card"><span class="badge free">Module 01</span><h3>Market Structure</h3><p>Pelajari HH, HL, LH, LL untuk membaca trend dan perubahan struktur.</p><small>Checklist: trend H1/M30, validasi M15/M5.</small></div>
          <div class="card lab-module-card"><span class="badge free">Module 02</span><h3>BOS & CHoCH</h3><p>BOS menandakan continuation. CHoCH memberi sinyal awal perubahan karakter market.</p><small>Jangan entry hanya karena 1 candle break.</small></div>
          <div class="card lab-module-card"><span class="badge free">Module 03</span><h3>Order Block</h3><p>Area candle institusional sebelum impuls besar. Valid jika ada displacement dan retest.</p></div>
          <div class="card lab-module-card"><span class="badge free">Module 04</span><h3>FVG / Imbalance</h3><p>Gap efisiensi harga yang sering menjadi area mitigasi sebelum continuation.</p></div>
          <div class="card lab-module-card"><span class="badge free">Module 05</span><h3>Liquidity Sweep</h3><p>Harga sering menyapu high/low sebelum bergerak ke arah sebenarnya.</p></div>
          <div class="card lab-module-card"><span class="badge vip">Module 06</span><h3>Entry Confirmation</h3><p>Gunakan M15/M5/M1 untuk validasi candle, CHoCH kecil, dan risk yang jelas.</p></div>
        </div>
      `;
    }

    const library = document.getElementById("lab-library");
    if (library) {
      library.innerHTML = `
        <div class="grid-3">
          <div class="card lab-module-card"><h3>Support & Resistance</h3><p>Gunakan sebagai area reaksi, bukan tempat entry buta. Tunggu rejection atau breakout valid.</p></div>
          <div class="card lab-module-card"><h3>Trendline</h3><p>Hubungkan swing penting. Break trendline perlu validasi struktur, bukan hanya garis tersentuh.</p></div>
          <div class="card lab-module-card"><h3>Parallel Channel</h3><p>Cocok untuk membaca area premium/discount dalam trend yang teratur.</p></div>
          <div class="card lab-module-card"><h3>Fibonacci</h3><p>Gunakan 0.5–0.705 sebagai area pullback, lalu tunggu konfirmasi price action.</p></div>
          <div class="card lab-module-card"><h3>Candlestick Confirmation</h3><p>Engulfing, pin bar, dan displacement lebih kuat jika muncul di area liquidity/OB/FVG.</p></div>
          <div class="card lab-module-card"><h3>ATR & Volatility</h3><p>ATR membantu membaca jarak SL realistis dan kondisi market terlalu liar.</p></div>
        </div>
      `;
    }

    const news = document.getElementById("lab-newslearn");
    if (news) {
      news.innerHTML = `
        <div class="grid-3">
          <div class="card lab-module-card">
            <span class="badge free">News Basic</span>
            <h3>Actual vs Forecast</h3>
            <p><b>Previous</b> = data sebelumnya. <b>Forecast</b> = perkiraan market. <b>Actual</b> = data yang keluar sekarang.</p>
            <small>Actual jauh dari forecast biasanya memicu volatilitas besar.</small>
          </div>
          <div class="card lab-module-card">
            <span class="badge vip">XAUUSD</span>
            <h3>CPI / Inflation</h3>
            <p>CPI tinggi bisa menguatkan USD karena market menilai suku bunga bisa tetap tinggi. XAUUSD sering tertekan jika USD menguat.</p>
          </div>
          <div class="card lab-module-card">
            <span class="badge vip">USD News</span>
            <h3>NFP / Jobs Data</h3>
            <p>NFP memicu whipsaw. Hindari entry beberapa menit sebelum rilis, tunggu sweep dan struktur baru.</p>
          </div>
          <div class="card lab-module-card">
            <span class="badge vip">FOMC</span>
            <h3>Interest Rate</h3>
            <p>Keputusan suku bunga dan statement bank sentral bisa mengubah arah trend besar.</p>
          </div>
          <div class="card lab-module-card">
            <span class="badge free">Safe Rules</span>
            <h3>High Impact Checklist</h3>
            <p>15–30 menit sebelum news: kecilkan risk, hindari overtrade, tunggu candle news selesai.</p>
          </div>
          <div class="card lab-module-card">
            <span class="badge free">After News</span>
            <h3>Post-News Setup</h3>
            <p>Tunggu liquidity sweep, CHoCH/BOS, lalu cari retest OB/FVG untuk entry lebih aman.</p>
          </div>
        </div>
      `;
    }

    const calcBtn = document.getElementById("risk-calc-btn");
    if (calcBtn) {
      calcBtn.addEventListener("click", function(){
        const balance = Number(document.getElementById("risk-balance")?.value || 0);
        const riskPct = Number(document.getElementById("risk-percent")?.value || 0);
        const entry = Number(document.getElementById("risk-entry")?.value || 0);
        const sl = Number(document.getElementById("risk-sl")?.value || 0);
        const riskAmount = balance * (riskPct / 100);
        const distance = Math.abs(entry - sl);
        const out = document.getElementById("risk-calc-result");
        if (!out) return;
        if (!balance || !riskPct || !entry || !sl) {
          out.textContent = "Isi modal, risk %, entry, dan SL dulu.";
          return;
        }
        out.innerHTML = `Risk amount: <b>${riskAmount.toFixed(2)}</b> · Distance to SL: <b>${distance.toFixed(2)}</b>. Lot size detail akan disesuaikan per pair pada versi berikutnya.`;
      });
    }
  }

  window.saveJournalEntry = saveJournalEntryV32;
  window.renderJournalEntries = renderJournalEntriesV32;

  document.addEventListener("DOMContentLoaded", function(){
    renderTradingLabDemo();
    renderJournalEntriesV32();
  });

  setTimeout(function(){
    renderTradingLabDemo();
    renderJournalEntriesV32();
  }, 500);
})();

/* AiSignalFx PRO - Compact Payment Interaction */
(function(){
  function enhancePaymentCards(){
    const cards = document.querySelectorAll(".payment-select-card");
    if (!cards.length) return;

    cards.forEach(card => {
      if (card.dataset.compactPaymentReady === "1") return;
      card.dataset.compactPaymentReady = "1";

      card.addEventListener("click", function(e){
        if (e.target.closest("button")) return;

        cards.forEach(other => {
          if (other !== card) other.classList.remove("payment-open");
        });

        card.classList.toggle("payment-open");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", enhancePaymentCards);
  document.addEventListener("click", function(){
    setTimeout(enhancePaymentCards, 100);
  });

  setInterval(enhancePaymentCards, 1000);
})();

/* AiSignalFx PRO - Sentinel Community Interaction Demo */
(function(){
  const KEY = "aisignalfx_community_demo_actions";

  function escapeHtml(value){
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getActions(){
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch(e) {
      return {};
    }
  }

  function setActions(data){
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function toast(message){
    const old = document.querySelector(".community-toast");
    if (old) old.remove();

    const el = document.createElement("div");
    el.className = "community-toast";
    el.textContent = message;
    document.body.appendChild(el);

    setTimeout(() => el.classList.add("show"), 30);
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 300);
    }, 2400);
  }

  function closeCommunityModal(){
    document.querySelectorAll(".community-modal-backdrop").forEach(x => x.remove());
  }

  function getPost(id){
    try {
      if (typeof demoCommunityPosts !== "undefined") {
        return demoCommunityPosts.find(x => x.id === id);
      }
    } catch(e) {}
    return null;
  }

  function updateAction(postId, type, value){
    const data = getActions();
    if (!data[postId]) data[postId] = { liked: false, saved: false, followed: false, comments: [] };

    if (type === "like") data[postId].liked = value;
    if (type === "save") data[postId].saved = value;
    if (type === "follow") data[postId].followed = value;
    if (type === "comment" && value) {
      data[postId].comments.push({
        text: value,
        at: new Date().toLocaleString("id-ID")
      });
    }

    setActions(data);
    return data[postId];
  }

  function openCommunityDetail(postId){
    const post = getPost(postId);
    if (!post) {
      toast("Mapping detail belum tersedia.");
      return;
    }

    const actions = getActions()[postId] || { liked: false, saved: false, followed: false, comments: [] };

    closeCommunityModal();

    const wrap = document.createElement("div");
    wrap.className = "community-modal-backdrop";
    wrap.innerHTML = `
      <div class="community-modal" role="dialog" aria-modal="true">
        <div class="community-modal-head">
          <div>
            <span class="community-kicker">SENTINEL COMMUNITY</span>
            <h3>${escapeHtml(post.pair || "Mapping Detail")}</h3>
            <p>${escapeHtml(post.user || "Community Mapper")}</p>
          </div>
          <button class="community-close" type="button">×</button>
        </div>

        <div class="community-preview-card">
          <span class="badge free">${escapeHtml(post.bias || "WAIT")}</span>
          <p>${escapeHtml(post.caption || "Mapping preview belum tersedia.")}</p>
          <small>Mode demo: aksi tersimpan sementara di perangkat ini.</small>
        </div>

        <div class="community-actions-demo">
          <button class="small-btn" id="community-like-btn" type="button">${actions.liked ? "Liked" : "Like"}</button>
          <button class="small-btn" id="community-save-btn" type="button">${actions.saved ? "Saved" : "Save"}</button>
          <button class="small-btn" id="community-follow-btn" type="button">${actions.followed ? "Following" : "Follow Mapper"}</button>
        </div>

        <div class="community-comment-box">
          <textarea id="community-comment-input" placeholder="Tulis komentar edukatif..."></textarea>
          <button class="small-btn" id="community-comment-send" type="button">Send Comment</button>
        </div>

        <div id="community-comment-list" class="community-comment-list"></div>
      </div>
    `;

    document.body.appendChild(wrap);

    function renderComments(){
      const latest = getActions()[postId] || { comments: [] };
      const box = wrap.querySelector("#community-comment-list");
      if (!box) return;

      if (!latest.comments || !latest.comments.length) {
        box.innerHTML = `<p class="muted">Belum ada komentar di perangkat ini.</p>`;
        return;
      }

      box.innerHTML = latest.comments.slice().reverse().map(c => `
        <div class="community-comment-item">
          <b>You</b>
          <small>${escapeHtml(c.at)}</small>
          <p>${escapeHtml(c.text)}</p>
        </div>
      `).join("");
    }

    wrap.querySelector(".community-close").onclick = closeCommunityModal;
    wrap.addEventListener("click", e => {
      if (e.target === wrap) closeCommunityModal();
    });

    wrap.querySelector("#community-like-btn").onclick = function(){
      const current = getActions()[postId]?.liked || false;
      const next = updateAction(postId, "like", !current);
      this.textContent = next.liked ? "Liked" : "Like";
      toast(next.liked ? "Mapping liked locally." : "Like removed.");
    };

    wrap.querySelector("#community-save-btn").onclick = function(){
      const current = getActions()[postId]?.saved || false;
      const next = updateAction(postId, "save", !current);
      this.textContent = next.saved ? "Saved" : "Save";
      toast(next.saved ? "Mapping saved locally." : "Save removed.");
    };

    wrap.querySelector("#community-follow-btn").onclick = function(){
      const current = getActions()[postId]?.followed || false;
      const next = updateAction(postId, "follow", !current);
      this.textContent = next.followed ? "Following" : "Follow Mapper";
      toast(next.followed ? "Mapper followed locally." : "Unfollowed locally.");
    };

    wrap.querySelector("#community-comment-send").onclick = function(){
      const input = wrap.querySelector("#community-comment-input");
      const text = input.value.trim();

      if (!text) {
        toast("Tulis komentar dulu.");
        return;
      }

      updateAction(postId, "comment", text);
      input.value = "";
      renderComments();
      toast("Comment saved locally.");
    };

    renderComments();
  }

  window.openMappingDetail = openCommunityDetail;

  window.followMapper = function(name){
    const id = "follow_" + String(name || "mapper").toLowerCase().replaceAll(" ", "_");
    const current = getActions()[id]?.followed || false;
    const next = updateAction(id, "follow", !current);
    toast(next.followed ? `Kamu mengikuti ${name}.` : `Kamu berhenti mengikuti ${name}.`);
  };
})();

/* AiSignalFx PRO - Crypto Scanner Real/Reference Mode */
(function(){
  let latestCryptoSignals = [];

  function scannerToast(message){
    const old = document.querySelector(".scanner-toast");
    if (old) old.remove();

    const el = document.createElement("div");
    el.className = "scanner-toast";
    el.textContent = message;
    document.body.appendChild(el);

    setTimeout(() => el.classList.add("show"), 30);
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 300);
    }, 2600);
  }

  function fallbackSignals(){
    return [
      { symbol: "BTCUSDT", market: "crypto", bias: "WAIT", confidence: 62, price: 0, change: 0, risk: "Medium", momentum: "Neutral", note: "Fallback reference mode. Binance belum tersedia di perangkat ini." },
      { symbol: "ETHUSDT", market: "crypto", bias: "WAIT", confidence: 60, price: 0, change: 0, risk: "Medium", momentum: "Neutral", note: "Tunggu data real tersambung." },
      { symbol: "SOLUSDT", market: "crypto", bias: "WAIT", confidence: 58, price: 0, change: 0, risk: "Medium", momentum: "Neutral", note: "Reference scanner aktif sementara." }
    ];
  }

  function badgeClass(bias){
    if (bias === "BUY") return "green";
    if (bias === "SELL") return "red";
    return "yellow";
  }

  function formatPrice(item){
    if (!item.price) return "Reference";
    return "$" + Number(item.price).toLocaleString("en-US", {
      maximumFractionDigits: item.price > 100 ? 2 : 4
    });
  }

  function renderScannerGridV32(signals){
    const grid = document.getElementById("scanner-grid");
    if (!grid) return;

    const rows = signals && signals.length ? signals : fallbackSignals();

    grid.innerHTML = rows.slice(0, 12).map(item => `
      <div class="card signal-card crypto-signal-card">
        <div class="signal-card-top">
          <span class="badge ${badgeClass(item.bias)}">${item.bias}</span>
          <span class="badge free">${item.market === "crypto" ? "BINANCE PUBLIC" : "REFERENCE"}</span>
        </div>
        <h3>${item.symbol}</h3>
        <p class="crypto-price">${formatPrice(item)}</p>
        ${typeof item.change === "number" ? `<p><b>24h:</b> <span class="${item.change >= 0 ? "green" : "red"}">${item.change.toFixed(2)}%</span></p>` : ""}
        <p><b>Confidence:</b> ${item.confidence}%</p>
        <p><b>Momentum:</b> ${item.momentum || "Neutral"} · <b>Risk:</b> ${item.risk || "Medium"}</p>
        <p>${item.note}</p>
        <small>${item.market === "crypto" ? "Real free mode · Binance Public API" : "Reference mode"}</small>
      </div>
    `).join("");
  }

  function renderCryptoPulse(signals, isFallback = false){
    const box = document.getElementById("crypto-market-preview");
    if (!box) return;

    const rows = signals && signals.length ? signals.slice(0, 4) : fallbackSignals();

    box.innerHTML = `
      <div class="crypto-pulse-list">
        ${rows.map(item => `
          <div class="crypto-pulse-item">
            <b>${item.symbol}</b>
            <span>${formatPrice(item)}</span>
            <small class="${(item.change || 0) >= 0 ? "green" : "red"}">${typeof item.change === "number" ? item.change.toFixed(2) + "%" : "0.00%"}</small>
          </div>
        `).join("")}
      </div>
      <p class="muted">${isFallback ? "Binance data belum tersedia. Scanner memakai fallback reference mode." : "Crypto market data aktif dari Binance Public API."}</p>
    `;
  }

  async function loadCryptoMarketV32(){
    try {
      if (!window.AiSignalBinance || !window.AiSignalBinance.getCryptoSignals) {
        throw new Error("Binance connector belum siap");
      }

      latestCryptoSignals = await window.AiSignalBinance.getCryptoSignals();
      renderCryptoPulse(latestCryptoSignals, false);
      renderScannerGridV32(latestCryptoSignals);
      scannerToast("Crypto scanner updated from Binance Public API.");
    } catch (err) {
      latestCryptoSignals = fallbackSignals();
      renderCryptoPulse(latestCryptoSignals, true);
      renderScannerGridV32(latestCryptoSignals);
      scannerToast("Binance data tidak tersedia. Scanner memakai fallback reference mode.");
    }
  }

  window.renderScannerGrid = renderScannerGridV32;
  window.loadCryptoMarket = loadCryptoMarketV32;

  try {
    renderScannerGrid = renderScannerGridV32;
    loadCryptoMarket = loadCryptoMarketV32;
  } catch(e) {}

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(loadCryptoMarketV32, 900);
  });
})();

/* AiSignalFx PRO - Restore cached Firebase user after refresh */
(function () {
  const CACHE_KEY = "aisignalfx:firebase_user";

  function restoreCachedUser(attempt = 0) {
    try {
      if (localStorage.getItem("aisignalfx:manual_logout") === "1") return;
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return;

      const profile = JSON.parse(raw);
      if (!profile || !profile.uid) return;

      if (typeof window.loginFirebaseUser === "function") {
        window.loginFirebaseUser(profile);

        if (typeof window.showPageById === "function") {
          setTimeout(() => window.showPageById("dashboard"), 120);
        }

        return;
      }

      if (attempt < 15) {
        setTimeout(() => restoreCachedUser(attempt + 1), 180);
      }
    } catch (error) {
      console.warn("Cached user restore skipped:", error);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(() => restoreCachedUser(), 80);
    setTimeout(() => restoreCachedUser(), 600);
  });
})();


/* AiSignalFx PRO - Logout Guard */
(function () {
  const USER_CACHE = "aisignalfx:firebase_user";
  const LOGOUT_LOCK = "aisignalfx:manual_logout";

  function clearLoginCache() {
    localStorage.setItem(LOGOUT_LOCK, "1");
    localStorage.removeItem(USER_CACHE);
    localStorage.removeItem("aisignalfx_user");
    localStorage.removeItem("aisignalfx:profile");
    sessionStorage.clear();
  }

  window.clearAisignalLoginCache = clearLoginCache;

  document.addEventListener("click", function (event) {
    const el = event.target.closest("button,a");
    if (!el) return;

    const text = (el.textContent || "").toLowerCase();
    const action = (el.getAttribute("onclick") || "").toLowerCase();

    if (
      text.includes("logout") ||
      text.includes("log out") ||
      text.includes("keluar") ||
      action.includes("logout")
    ) {
      clearLoginCache();

      if (typeof window.logoutFirebaseAuth === "function") {
        window.logoutFirebaseAuth();
      }
    }
  }, true);

  function wrapLoginClearLock(attempt = 0) {
    if (typeof window.loginFirebaseUser === "function" && !window.loginFirebaseUser.__logoutGuarded) {
      const original = window.loginFirebaseUser;
      window.loginFirebaseUser = function () {
        localStorage.removeItem(LOGOUT_LOCK);
        return original.apply(this, arguments);
      };
      window.loginFirebaseUser.__logoutGuarded = true;
      return;
    }

    if (attempt < 15) {
      setTimeout(() => wrapLoginClearLock(attempt + 1), 200);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    wrapLoginClearLock();
  });
})();

/* AiSignalFx PRO - Compact Chart Symbol Navigation */
(function () {
  const symbols = ["XAUUSD", "BTCUSDT", "ETHUSDT", "EURUSD", "GBPUSD", "USDJPY", "NAS100", "US30"];
  let index = 0;

  window.changeChartSymbol = function (direction) {
    index = (index + direction + symbols.length) % symbols.length;
    const symbol = symbols[index];

    const title = document.getElementById("chart-terminal-title");
    if (title) title.textContent = symbol + " Chart";

    window.currentChartSymbol = symbol;

    if (typeof window.initTradingView === "function") {
      try {
        window.initTradingView(symbol);
      } catch (error) {
        console.warn("Chart symbol switch skipped:", error);
      }
    }
  };
})();



/* AiSignalFx PRO - Single chart close button */
(function () {
  function injectChartCloseButton() {
    const card = document.querySelector(".chart-terminal-card");
    if (!card) return;
    if (card.querySelector(".chart-close-only")) return;

    const btn = document.createElement("button");
    btn.className = "chart-close-only";
    btn.type = "button";
    btn.textContent = "×";
    btn.onclick = function () {
      if (typeof window.expandChartTerminal === "function") {
        window.expandChartTerminal();
      } else {
        document.body.classList.remove("v31-chart-mode");
      }
    };

    card.appendChild(btn);
  }

  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(injectChartCloseButton, 300);
    setTimeout(injectChartCloseButton, 1200);
  });
})();

/* AiSignalFx PRO - Temporarily disable Chart Terminal */
(function () {
  function hideChartEntry() {
    document.querySelectorAll("button, a").forEach((el) => {
      const text = (el.textContent || "").toLowerCase();
      const action = (el.getAttribute("onclick") || "").toLowerCase();

      if (
        text.includes("chart terminal") ||
        text.includes("live chart") ||
        text.includes("fullscreen chart") ||
        action.includes("showpage('chart") ||
        action.includes('showpage("chart') ||
        action.includes("showpagebyid('chart") ||
        action.includes('showpagebyid("chart')
      ) {
        el.style.display = "none";
      }
    });

    const chartPage = document.getElementById("chart");
    if (chartPage) chartPage.style.display = "none";
  }

  function blockChartNavigation(attempt = 0) {
    if (typeof window.showPageById === "function" && !window.showPageById.__chartDisabled) {
      const original = window.showPageById;
      window.showPageById = function (id) {
        if (String(id).toLowerCase() === "chart") {
          return original.call(this, "scanner");
        }
        return original.apply(this, arguments);
      };
      window.showPageById.__chartDisabled = true;
    }

    if (typeof window.showPage === "function" && !window.showPage.__chartDisabled) {
      const original = window.showPage;
      window.showPage = function (id, btn) {
        if (String(id).toLowerCase() === "chart") {
          return original.call(this, "scanner", btn);
        }
        return original.apply(this, arguments);
      };
      window.showPage.__chartDisabled = true;
    }

    if (attempt < 12) setTimeout(() => blockChartNavigation(attempt + 1), 250);
  }

  document.addEventListener("DOMContentLoaded", function () {
    hideChartEntry();
    blockChartNavigation();
    setTimeout(hideChartEntry, 800);
    setTimeout(hideChartEntry, 1800);
  });
})();

/* AiSignalFx PRO - Hide dashboard stat cards on mobile */
(function () {
  function hideDashboardStats() {
    var isMobile = window.matchMedia("(max-width: 760px)").matches;
    var dashboard = document.getElementById("dashboard");
    if (!dashboard) return;

    dashboard.querySelectorAll(".card").forEach(function (card) {
      var text = (card.textContent || "").toLowerCase();

      if (
        text.includes("market bias") ||
        text.includes("sentinel usage") ||
        text.includes("vip scanner")
      ) {
        card.style.display = isMobile ? "none" : "";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    hideDashboardStats();
    setTimeout(hideDashboardStats, 500);
    setTimeout(hideDashboardStats, 1500);
  });

  window.addEventListener("resize", hideDashboardStats);
})();

/* AiSignalFx PRO - Community mobile menu simplify */
(function () {
  function simplifyCommunityMobileMenu() {
    const page = document.getElementById("mapping");
    if (!page) return;

    const tabs = page.querySelector(".community-tabs");
    if (!tabs) return;

    if (!page.querySelector(".community-upload-main-btn")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "community-upload-main-btn";
      btn.innerHTML = "📸 Upload Mapping";
      btn.onclick = function () {
        if (typeof window.setCommunityTab === "function") {
          window.setCommunityTab("upload");
        }
        setTimeout(function () {
          document.getElementById("community-upload")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }, 120);
      };
      tabs.insertAdjacentElement("beforebegin", btn);
    }

    tabs.querySelectorAll("button").forEach(function (btn) {
      const text = (btn.textContent || "").toLowerCase();

      if (
        text.includes("for you") ||
        text.includes("following") ||
        text.includes("upload")
      ) {
        btn.classList.add("community-mobile-hide-tab");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    simplifyCommunityMobileMenu();
    setTimeout(simplifyCommunityMobileMenu, 700);
    setTimeout(simplifyCommunityMobileMenu, 1600);
  });
})();


/* AiSignalFx PRO - Community mobile interaction cleanup */
(function () {
  function isMobileCommunity() {
    return window.matchMedia("(max-width: 760px)").matches &&
      document.getElementById("mapping")?.classList.contains("active");
  }

  const oldOpenMappingDetail = window.openMappingDetail;
  window.openMappingDetail = function (id) {
    if (isMobileCommunity()) {
      return;
    }
    if (typeof oldOpenMappingDetail === "function") {
      return oldOpenMappingDetail(id);
    }
  };

  function hideCommunityTopMapperMobile() {
    const page = document.getElementById("mapping");
    if (!page) return;

    page.querySelectorAll(".card").forEach(function (card) {
      const text = (card.textContent || "").toLowerCase();
      if (text.includes("top mapper insight") || text.includes("live command intelligence")) {
        card.classList.add("community-mobile-hide-heavy");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    hideCommunityTopMapperMobile();
    setTimeout(hideCommunityTopMapperMobile, 700);
    setTimeout(hideCommunityTopMapperMobile, 1600);
  });
})();


/* AiSignalFx PRO - Sentinel Community V2 Mobile Feed */
(function () {
  function safe(v) {
    return String(v ?? "").replace(/[&<>"']/g, function (m) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[m];
    });
  }

  function postList() {
    try {
      if (typeof communityLatestPosts === "function") return communityLatestPosts();
      if (typeof demoCommunityPosts !== "undefined") return demoCommunityPosts;
    } catch (e) {}
    return [];
  }

  try {
    openMappingDetail = function () {
      return false;
    };
    window.openMappingDetail = openMappingDetail;
  } catch (e) {}

  try {
    mappingPostCard = function (post, mini = false) {
      const pair = safe(post.pair || "XAUUSD");
      const bias = safe(post.bias || "WAIT");
      const title = safe(post.title || pair + " Mapping");
      const caption = safe(post.caption || "Mapping idea.");
      const user = safe(post.user || "Community Mapper");
      const img = post.image ? String(post.image) : "";
      const likes = Number(post.likes || 0).toLocaleString("id-ID");
      const comments = Number(post.comments || 0).toLocaleString("id-ID");

      const visual = img
        ? `<div class="v2-map-image"><img src="${safe(img)}" alt="${pair} mapping"></div>`
        : `<div class="v2-map-placeholder"><strong>${pair}</strong><span>${bias}</span></div>`;

      return `
        <article class="v2-map-post" data-pair="${pair}" data-bias="${bias}">
          ${visual}
          <div class="v2-map-body">
            <div class="v2-map-title-row">
              <div>
                <h3>${title}</h3>
                <p>${user} • ${pair} • ${bias}</p>
              </div>
              <button class="v2-follow" onclick="event.stopPropagation(); this.classList.toggle('active'); this.textContent=this.classList.contains('active')?'Following':'Follow';">Follow</button>
            </div>

            <p class="v2-caption">${caption}</p>

            <div class="v2-actions">
              <button onclick="event.stopPropagation(); this.classList.toggle('active'); const s=this.querySelector('span'); s.textContent=(Number(String(s.textContent).replace(/\\D/g,''))||0)+1;">♡ <span>${likes}</span></button>
              <button onclick="event.stopPropagation(); this.closest('.v2-map-post').querySelector('.v2-comment-box').classList.toggle('show');">💬 <span>${comments}</span></button>
              <button onclick="event.stopPropagation(); this.classList.toggle('active');">🔖 Save</button>
            </div>

            <div class="v2-comment-box">
              <input placeholder="Tulis komentar singkat...">
              <button onclick="event.stopPropagation(); const box=this.closest('.v2-comment-box'); const input=box.querySelector('input'); if(input.value.trim()){ box.insertAdjacentHTML('beforeend','<p><b>You:</b> '+safe(input.value.trim())+'</p>'); input.value=''; }">Send</button>
            </div>
          </div>
        </article>
      `;
    };
    window.mappingPostCard = mappingPostCard;
  } catch (e) {}

  function renderCommunityV2() {
    const feed = document.getElementById("community-feed");
    if (feed) {
      feed.innerHTML = postList().map(function (post) {
        return mappingPostCard(post);
      }).join("");
    }

    document.querySelectorAll(".dashboard-fyp, .community-spotlight-card, .top-mapper-feature").forEach(function (el) {
      el.classList.add("community-v2-hide-heavy");
    });
  }

  const oldSetCommunityTab = window.setCommunityTab;
  window.setCommunityTab = function (tab) {
    if (typeof oldSetCommunityTab === "function") oldSetCommunityTab(tab);
    setTimeout(renderCommunityV2, 80);
  };

  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(renderCommunityV2, 500);
    setTimeout(renderCommunityV2, 1500);
  });
})();


/* ASFX_FIREBASE_ACCESS_GUARD_V1 */
(() => {
  if (window.__ASFX_FIREBASE_ACCESS_GUARD_V1__) return;
  window.__ASFX_FIREBASE_ACCESS_GUARD_V1__ = true;

  const OWNER_EMAILS = new Set([
    "psbetungputra@gmail.com"
  ]);

  const OWNER_KEYS = new Set([
    "psbetung",
    "psbetungputra",
    "romadon saputra",
    "romadon"
  ]);

  const CACHE_KEY_SAFE = "aisignalfx:firebase_user";

  const clean = (v) => String(v || "").trim().toLowerCase();

  const queryAccess = () => {
    const q = new URLSearchParams(window.location.search);
    return (
      q.get("owner") === "1" ||
      q.get("admin") === "1" ||
      clean(q.get("access")) === "owner"
    );
  };

  const readCachedUser = () => {
    try {
      return JSON.parse(localStorage.getItem(CACHE_KEY_SAFE) || "null");
    } catch (err) {
      return null;
    }
  };

  const getActiveUser = () => {
    try {
      if (typeof currentUser !== "undefined" && currentUser) return currentUser;
    } catch (err) {}

    if (window.currentUser) return window.currentUser;

    return readCachedUser();
  };

  const emailOf = (profile) => clean(
    profile?.email ||
    profile?.user?.email ||
    profile?.firebaseUser?.email ||
    ""
  );

  const nameKeyOf = (profile) => clean(
    profile?.username ||
    profile?.handle ||
    profile?.name ||
    profile?.displayName ||
    ""
  );

  const ownerMatch = (profile) => {
    if (queryAccess()) return true;

    const email = emailOf(profile);
    const key = nameKeyOf(profile);
    const role = clean(profile?.role);
    const level = clean(profile?.level);

    return (
      OWNER_EMAILS.has(email) ||
      OWNER_KEYS.has(key) ||
      role === "owner" ||
      role === "founder" ||
      level === "owner"
    );
  };

  const normalizeProfile = (profile) => {
    if (!profile) return profile;

    const isOwner = ownerMatch(profile);
    const role = clean(profile.role);
    const level = clean(profile.level);

    if (isOwner) {
      profile.role = "owner";
      profile.level = "admin";
      profile.vipText = "Owner Access";
      profile.vipAccess = true;
      profile.isOwner = true;
      profile.isAdmin = true;
      profile.isVip = true;
      profile.status = "owner";
    } else if (role === "admin" || level === "admin") {
      profile.role = profile.role || "admin";
      profile.level = "admin";
      profile.vipAccess = true;
      profile.isAdmin = true;
      profile.isVip = true;
    } else if (role === "vip" || level === "vip") {
      profile.role = profile.role || "vip";
      profile.level = "vip";
      profile.vipAccess = true;
      profile.isVip = true;
    }

    try {
      if (typeof currentUser !== "undefined") currentUser = profile;
    } catch (err) {}

    window.currentUser = profile;

    try {
      localStorage.setItem(CACHE_KEY_SAFE, JSON.stringify(profile));
    } catch (err) {}

    return profile;
  };

  const getAccess = () => {
    const profile = normalizeProfile(getActiveUser() || {});
    const role = clean(profile.role);
    const level = clean(profile.level);
    const owner = ownerMatch(profile);
    const admin = owner || role === "admin" || level === "admin";
    const vip = admin || role === "vip" || level === "vip" || profile.vipAccess === true;

    return {
      profile,
      role: owner ? "owner" : admin ? "admin" : vip ? "vip" : "free",
      owner,
      admin,
      vip,
      canOpenAdmin: owner || admin,
      canOpenSignalRoom: owner || admin || vip,
      canUseVip: owner || admin || vip
    };
  };

  const applyAccessDom = () => {
    const access = getAccess();
    document.documentElement.dataset.asfxRole = access.role;
    document.body?.setAttribute("data-asfx-role", access.role);

    if (access.canUseVip) {
      document.querySelectorAll(".vip-lock, [data-vip-lock], .scanner-lock").forEach((el) => {
        el.classList.add("hidden");
        el.setAttribute("data-asfx-unlocked", "true");
      });

      document.querySelectorAll("[data-vip-content], .vip-content").forEach((el) => {
        el.classList.remove("hidden");
      });
    }
  };

  const syncOwnerRole = async () => {
    try {
      const access = getAccess();
      const profile = access.profile;

      if (!access.owner || !profile?.uid || !window.AiSignalFirebase?.upsertDoc) return;

      await window.AiSignalFirebase.upsertDoc("users", profile.uid, {
        email: emailOf(profile),
        name: profile.name || profile.displayName || "Owner",
        role: "owner",
        level: "admin",
        vipAccess: true,
        updatedAt: Date.now()
      });
    } catch (err) {
      console.warn("Owner role sync waiting:", err?.message || err);
    }
  };

  window.ASFXAccessGuard = {
    getActiveUser,
    normalizeProfile,
    getAccess,
    isOwner: () => getAccess().owner,
    isAdmin: () => getAccess().admin,
    isVip: () => getAccess().vip,
    canOpenSignalRoom: () => getAccess().canOpenSignalRoom,
    canOpenAdmin: () => getAccess().canOpenAdmin,
    applyAccessDom,
    syncOwnerRole
  };

  try {
    const originalIsVipOrAdmin = typeof isVipOrAdmin === "function" ? isVipOrAdmin : null;
    isVipOrAdmin = function () {
      return window.ASFXAccessGuard.canOpenSignalRoom() || !!originalIsVipOrAdmin?.();
    };
    window.isVipOrAdmin = isVipOrAdmin;
  } catch (err) {}

  try {
    const originalCanOpenSignalDetail = typeof canOpenSignalDetail === "function" ? canOpenSignalDetail : null;
    canOpenSignalDetail = function () {
      return window.ASFXAccessGuard.canOpenSignalRoom() || !!originalCanOpenSignalDetail?.();
    };
    window.canOpenSignalDetail = canOpenSignalDetail;
  } catch (err) {}

  try {
    const originalApplyUserAccess = typeof applyUserAccess === "function" ? applyUserAccess : window.applyUserAccess;
    const guardedApplyUserAccess = function () {
      normalizeProfile(getActiveUser());
      try {
        originalApplyUserAccess?.apply(this, arguments);
      } catch (err) {}
      applyAccessDom();
    };

    window.applyUserAccess = guardedApplyUserAccess;
    applyUserAccess = guardedApplyUserAccess;
  } catch (err) {}

  try {
    const originalLoginFirebaseUser = window.loginFirebaseUser;
    if (typeof originalLoginFirebaseUser === "function" && !originalLoginFirebaseUser.__asfxGuarded) {
      const guardedLogin = async function () {
        const result = await originalLoginFirebaseUser.apply(this, arguments);
        normalizeProfile(getActiveUser());
        window.applyUserAccess?.();
        syncOwnerRole();
        return result;
      };

      guardedLogin.__asfxGuarded = true;
      window.loginFirebaseUser = guardedLogin;

      try {
        loginFirebaseUser = guardedLogin;
      } catch (err) {}
    }
  } catch (err) {}

  const boot = () => {
    normalizeProfile(getActiveUser());
    window.applyUserAccess?.();
    applyAccessDom();
    syncOwnerRole();
  };

  setTimeout(boot, 500);
  setTimeout(boot, 1600);
  document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 500));
  window.addEventListener("storage", () => setTimeout(boot, 300));

  console.info("ASFX Firebase Access Guard V1 ready.");
})();
