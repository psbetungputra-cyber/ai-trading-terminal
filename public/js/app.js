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

function login(){
  const username = document.getElementById("username").value.trim().toLowerCase();
  const password = document.getElementById("password").value;
  if(!USERS[username] || USERS[username].password !== password){
    alert("ACCESS DENIED");
    return;
  }
  currentUser = USERS[username];
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  hydrateProfile();
  applyAccessRules();
  setTimeout(initTradingView, 450);
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
    scanner: "Signal Scanner VIP",
    sentinel: "Sentinel AI Visual Analysis",
    sentiment: "Market Sentiment",
    fundamental: "Fundamental News",
    mapping: "Mapping Feed",
    journal: "Trade Journal",
    academy: "Smart Money Academy",
    profile: "Profile Center",
    vip: "VIP Access",
    admin: "Admin Control",
    ads: "Ads Manager"
  };
  document.getElementById("page-title").innerText = titles[id] || "AiSignalFx PRO";
  closeSidebar();
  if(id === "dashboard") setTimeout(initTradingView, 250);
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

    hide_side_toolbar: isMobile,
    details: !isMobile,
    calendar: !isMobile,
    studies: isMobile ? [] : ["STD;Volume"]
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
