/* ASFX_SENTINEL_COMMUNITY_DISABLE_V1
   Safely hides Sentinel Community / Mapping UI without touching app.js, scanner, admin, or VIP logic.
*/
(function(){
  if (window.__ASFX_SENTINEL_COMMUNITY_DISABLE_V1__) return;
  window.__ASFX_SENTINEL_COMMUNITY_DISABLE_V1__ = true;

  const MARK = "ASFX Sentinel Community Disable V1";

  function cssEscapeText(value){
    return String(value || "").replace(/[&<>"']/g, function(ch){
      return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[ch];
    });
  }

  function injectStyle(){
    if (document.getElementById("asfx-community-disable-v1-style")) return;
    const style = document.createElement("style");
    style.id = "asfx-community-disable-v1-style";
    style.textContent = `
      html[data-asfx-community-disabled="1"] #mapping,
      html[data-asfx-community-disabled="1"] .dashboard-fyp,
      html[data-asfx-community-disabled="1"] .community-spotlight-card,
      html[data-asfx-community-disabled="1"] .top-mapper-feature,
      html[data-asfx-community-disabled="1"] .top-mapper-mini,
      html[data-asfx-community-disabled="1"] #dashboard-fyp-list,
      html[data-asfx-community-disabled="1"] #community-leaderboard,
      html[data-asfx-community-disabled="1"] #community-upload,
      html[data-asfx-community-disabled="1"] #community-feed,
      html[data-asfx-community-disabled="1"] .community-tabs,
      html[data-asfx-community-disabled="1"] .community-upload-main-btn,
      html[data-asfx-community-disabled="1"] .community-modal-backdrop,
      html[data-asfx-community-disabled="1"] button[onclick*="showPage('mapping"],
      html[data-asfx-community-disabled="1"] button[onclick*="showPageById('mapping"],
      html[data-asfx-community-disabled="1"] a[onclick*="showPage('mapping"],
      html[data-asfx-community-disabled="1"] a[onclick*="showPageById('mapping"] {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
      html[data-asfx-community-disabled="1"] #mapping.active {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function toast(message){
    try {
      if (typeof window.showToast === "function") return window.showToast(message);
      const old = document.querySelector(".asfx-community-disabled-toast-v1");
      if (old) old.remove();
      const el = document.createElement("div");
      el.className = "asfx-community-disabled-toast-v1";
      el.textContent = message;
      el.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:999999;background:#111827;color:#e5e7eb;border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:10px 14px;font:600 12px system-ui;box-shadow:0 14px 40px rgba(0,0,0,.35);";
      document.body.appendChild(el);
      setTimeout(function(){ el.remove(); }, 2200);
    } catch(e) {}
  }

  function isMappingTrigger(el){
    if (!el || !el.getAttribute) return false;
    const onclick = String(el.getAttribute("onclick") || "").toLowerCase();
    const action = String(el.getAttribute("data-action") || "").toLowerCase();
    const route = String(el.getAttribute("data-route") || "").toLowerCase();
    const nav = String(el.getAttribute("data-nav") || "").toLowerCase();
    const href = String(el.getAttribute("href") || "").toLowerCase();
    const txt = String(el.textContent || "").trim().toLowerCase();

    if (onclick.includes("showpage('mapping") || onclick.includes('showpage("mapping')) return true;
    if (onclick.includes("showpagebyid('mapping") || onclick.includes('showpagebyid("mapping')) return true;
    if ([action, route, nav].includes("mapping")) return true;
    if (href === "#mapping" || href.endsWith("#mapping")) return true;
    if (txt === "sentinel community" || txt === "open sentinel community" || txt === "view community") return true;
    return false;
  }

  function hideElement(el){
    if (!el || !el.style) return;
    el.setAttribute("data-asfx-community-disabled", "1");
    el.setAttribute("aria-hidden", "true");
    el.style.setProperty("display", "none", "important");
    el.style.setProperty("visibility", "hidden", "important");
    el.style.setProperty("pointer-events", "none", "important");
  }

  function disableDom(){
    try {
      document.documentElement.setAttribute("data-asfx-community-disabled", "1");
      document.body && document.body.setAttribute("data-asfx-community-disabled", "1");

      [
        "#mapping",
        ".dashboard-fyp",
        ".community-spotlight-card",
        ".top-mapper-feature",
        ".top-mapper-mini",
        "#dashboard-fyp-list",
        "#community-leaderboard",
        "#community-upload",
        "#community-feed",
        ".community-tabs",
        ".community-upload-main-btn",
        ".community-modal-backdrop"
      ].forEach(function(sel){
        document.querySelectorAll(sel).forEach(hideElement);
      });

      document.querySelectorAll("button,a,[role='button']").forEach(function(el){
        if (isMappingTrigger(el)) hideElement(el);
      });

      const mapping = document.getElementById("mapping");
      if (mapping && mapping.classList.contains("active")) {
        mapping.classList.remove("active");
        const dashboard = document.getElementById("dashboard");
        if (dashboard) dashboard.classList.add("active");
      }
    } catch(e) {}
  }

  function dashboardButton(){
    return Array.from(document.querySelectorAll("button,a,[role='button']")).find(function(el){
      const onclick = String(el.getAttribute("onclick") || "").toLowerCase();
      return onclick.includes("showpage('dashboard") || onclick.includes('showpage("dashboard');
    }) || null;
  }

  function redirectDashboard(){
    const btn = dashboardButton();
    try {
      if (typeof window.showPageById === "function") return window.showPageById("dashboard");
      if (typeof window.showPage === "function") return window.showPage("dashboard", btn);
      if (btn && typeof btn.click === "function") return btn.click();
    } catch(e) {}
  }

  function guardRoutes(){
    try {
      const oldShowPage = window.showPage;
      if (typeof oldShowPage === "function" && !oldShowPage.__asfxCommunityDisabledV1) {
        const wrappedShowPage = function(id){
          if (String(id || "").toLowerCase() === "mapping") {
            toast("Sentinel Community sementara dinonaktifkan.");
            disableDom();
            return redirectDashboard();
          }
          return oldShowPage.apply(this, arguments);
        };
        wrappedShowPage.__asfxCommunityDisabledV1 = true;
        wrappedShowPage.__asfxOriginal = oldShowPage;
        window.showPage = wrappedShowPage;
        try { showPage = wrappedShowPage; } catch(e) {}
      }

      const oldShowPageById = window.showPageById;
      if (typeof oldShowPageById === "function" && !oldShowPageById.__asfxCommunityDisabledV1) {
        const wrappedShowPageById = function(id){
          if (String(id || "").toLowerCase() === "mapping") {
            toast("Sentinel Community sementara dinonaktifkan.");
            disableDom();
            return redirectDashboard();
          }
          return oldShowPageById.apply(this, arguments);
        };
        wrappedShowPageById.__asfxCommunityDisabledV1 = true;
        wrappedShowPageById.__asfxOriginal = oldShowPageById;
        window.showPageById = wrappedShowPageById;
        try { showPageById = wrappedShowPageById; } catch(e) {}
      }

      const block = function(){ toast("Sentinel Community sementara dinonaktifkan."); return false; };
      window.setCommunityTab = block;
      window.submitMappingPost = block;
      window.openMappingDetail = block;
      try { setCommunityTab = block; } catch(e) {}
      try { submitMappingPost = block; } catch(e) {}
      try { openMappingDetail = block; } catch(e) {}
    } catch(e) {}
  }

  function boot(){
    injectStyle();
    guardRoutes();
    disableDom();
    setTimeout(function(){ guardRoutes(); disableDom(); }, 250);
    setTimeout(function(){ guardRoutes(); disableDom(); }, 1000);
    setTimeout(function(){ guardRoutes(); disableDom(); }, 2200);

    try {
      const observer = new MutationObserver(function(){
        disableDom();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    } catch(e) {}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  console.info(MARK + " ready.");
})();
