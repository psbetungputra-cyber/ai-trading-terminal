import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAnalytics, isSupported as analyticsSupported } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, onAuthStateChanged, setPersistence, browserLocalPersistence, signOut } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  writeBatch,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB58Z7Gio-WqocNzWtF8mRYKRfzQXgBAjs",
  authDomain: "aisignalfx-pro.firebaseapp.com",
  databaseURL: "https://aisignalfx-pro-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "aisignalfx-pro",
  storageBucket: "aisignalfx-pro.firebasestorage.app",
  messagingSenderId: "894475340606",
  appId: "1:894475340606:web:086ba9cee096c63c257a6f",
  measurementId: "G-L28FTXVKWR"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const authPersistenceReady = setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn("Auth persistence fallback:", error);
});

function applyFirebaseSession(profile, attempt = 0) {
  if (typeof window.loginFirebaseUser === "function") {
    window.loginFirebaseUser(profile);
    return;
  }

  if (attempt < 12) {
    setTimeout(() => applyFirebaseSession(profile, attempt + 1), 250);
  }
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  try {
    await authPersistenceReady.catch(() => {});
    const data = await ensureUserDocument(user);
    const profile = normalizeUserProfile(user, data);
    localStorage.setItem("aisignalfx:firebase_user", JSON.stringify(profile));
    applyFirebaseSession(profile);
  } catch (error) {
    console.warn("Auth restore failed:", error);
    const profile = normalizeUserProfile(user, {});
    applyFirebaseSession(profile);
  }
});

let analytics = null;
analyticsSupported()
  .then((supported) => {
    if (supported) analytics = getAnalytics(app);
  })
  .catch(() => {});

function makeAvatar(name = "U"){
  return (name.trim()[0] || "U").toUpperCase();
}

function normalizeUserProfile(user, data = {}){
  const displayName = data.displayName || user.displayName || "AiSignalFx User";
  const level = data.level || "free";

  return {
    uid: user.uid,
    email: user.email,
    name: displayName,
    avatar: data.avatar || makeAvatar(displayName),
    role: data.role || "Free Member",
    level,
    style: data.tradingStyle || "Learning",
    pairs: data.favoritePairs || "XAU",
    vipText: level === "vip"
      ? "VIP access active."
      : level === "admin"
        ? "Founder access active."
        : "Free account. Upgrade VIP to unlock Signal Scanner."
  };
}

async function ensureUserDocument(user, extra = {}){
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if(!snap.exists()){
    const displayName = extra.displayName || user.displayName || "AiSignalFx User";

    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName,
      username: extra.username || "",
      avatar: makeAvatar(displayName),
      role: "Free Member",
      level: "free",
      vipStatus: "free",
      tradingStyle: extra.tradingStyle || "Learning",
      favoritePairs: extra.favoritePairs || "XAUUSD",
      countryTimezone: extra.countryTimezone || "Indonesia / Asia Jakarta",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    const created = await getDoc(userRef);
    return created.data();
  }

  return snap.data();
}

async function registerFromForm(){
  const displayName = document.getElementById("register-display-name")?.value.trim();
  const username = document.getElementById("register-username")?.value.trim();
  const email = document.getElementById("register-email")?.value.trim();
  const password = document.getElementById("register-password")?.value;
  const countryTimezone = document.getElementById("register-country")?.value.trim();
  const tradingStyle = document.getElementById("register-style")?.value.trim();
  const favoritePairs = document.getElementById("register-pairs")?.value.trim();

  if(!displayName || !email || !password){
    alert("Isi Display Name, Email, dan Password dulu.");
    return;
  }

  try{
    await authPersistenceReady.catch(() => {});
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });

    const data = await ensureUserDocument(credential.user, {
      displayName,
      username,
      countryTimezone,
      tradingStyle,
      favoritePairs
    });

    alert("Akun berhasil dibuat. Masuk ke AiSignalFx PRO.");
    window.loginFirebaseUser(normalizeUserProfile(credential.user, data));
  }catch(error){
    alert("Register gagal: " + (error.message || error));
  }
}

async function login(email, password){
  await authPersistenceReady.catch(() => {});
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const data = await ensureUserDocument(credential.user);
  window.loginFirebaseUser(normalizeUserProfile(credential.user, data));
}

async function seedFoundationData(){
  const batch = writeBatch(db);

  const paymentMethods = [
    { id: "dana", type: "ewallet", name: "DANA", number: "082258464062", accountName: "ROMADON SAPUTRA", active: true },
    { id: "gopay", type: "ewallet", name: "GoPay", number: "082258464062", accountName: "ROMADON SAPUTRA", active: true },
    { id: "ovo", type: "ewallet", name: "OVO", number: "082258464062", accountName: "ROMADON SAPUTRA", active: true },
    { id: "bri", type: "bank", name: "Bank BRI", number: "7705 0101 2157 535", accountName: "ROMADON SAPUTRA", active: true },
    { id: "jago", type: "bank", name: "Bank Jago", number: "102893930380", accountName: "ROMADON SAPUTRA", active: true },
    { id: "seabank", type: "bank", name: "SeaBank", number: "901537786673", accountName: "ROMADON SAPUTRA", active: true }
  ];

  const vipPackages = [
    { id: "vip-starter", name: "VIP Starter", normalPrice: 35000, discount: 10000, finalPrice: 25000, durationDays: 30, label: "Early Promo", active: true },
    { id: "vip-pro", name: "VIP Pro", normalPrice: 75000, discount: 25000, finalPrice: 50000, durationDays: 30, label: "Best Value", active: true },
    { id: "founder-promo", name: "Founder Promo", normalPrice: 150000, discount: 50000, finalPrice: 100000, durationDays: 90, label: "Founder Access", active: true }
  ];

  paymentMethods.forEach((item) => {
    batch.set(doc(db, "paymentMethods", item.id), {
      ...item,
      updatedAt: serverTimestamp()
    }, { merge: true });
  });

  vipPackages.forEach((item) => {
    batch.set(doc(db, "vipPackages", item.id), {
      ...item,
      updatedAt: serverTimestamp()
    }, { merge: true });
  });

  batch.set(doc(db, "settings", "featureModes"), {
    signalScanner: "demo_vip_locked",
    sentinelAI: "demo_free_limited",
    news: "manual_preview",
    cryptoProvider: "binance_public_ready",
    forexProvider: "demo",
    updatedAt: serverTimestamp()
  }, { merge: true });

  await batch.commit();
  alert("Firebase foundation data berhasil disiapkan.");
}


async function getCollectionDocs(name){
  const snap = await getDocs(collection(db, name));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

async function upsertDoc(collectionName, id, data){
  const ref = doc(db, collectionName, id);
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  return { id, ...data };
}

async function addCollectionDoc(collectionName, data){
  const ref = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return ref.id;
}

async function updateCollectionDoc(collectionName, id, data){
  await updateDoc(doc(db, collectionName, id), {
    ...data,
    updatedAt: serverTimestamp()
  });
}

async function createVipRequest(data){
  return await addCollectionDoc("vipRequests", {
    ...data,
    status: "pending"
  });
}

async function updateVipRequestStatus(id, status){
  await updateCollectionDoc("vipRequests", id, { status });
}

async function updateUserRole(uid, level){
  const role = level === "admin" ? "Founder" : level === "vip" ? "VIP Member" : "Free Member";
  await updateCollectionDoc("users", uid, {
    level,
    role,
    vipStatus: level === "vip" ? "active" : level === "admin" ? "founder" : "free"
  });
}

async function saveManualSentiment(data){
  await upsertDoc("settings", "marketSentiment", data);
}

async function getManualSentiment(){
  const snap = await getDoc(doc(db, "settings", "marketSentiment"));
  return snap.exists() ? snap.data() : null;
}

async function saveFeatureModes(data){
  await upsertDoc("settings", "featureModes", data);
}

async function saveManualNews(data){
  return await addCollectionDoc("news", data);
}

async function saveSignal(data){
  return await addCollectionDoc("signals", data);
}

async function saveAd(data){
  return await addCollectionDoc("ads", data);
}

window.AiSignalFirebase = {
  app,
  auth,
  db,
  analytics,
  login,
  registerFromForm,
  seedFoundationData,
  getCollectionDocs,
  upsertDoc,
  addCollectionDoc,
  updateCollectionDoc,
  createVipRequest,
  updateVipRequestStatus,
  updateUserRole,
  saveManualSentiment,
  getManualSentiment,
  saveFeatureModes,
  saveManualNews,
  saveSignal,
  saveAd
};

window.seedFirebaseFoundationData = seedFoundationData;


window.logoutFirebaseAuth = async function () {
  try {
    await signOut(auth);
  } catch (error) {
    console.warn("Firebase logout skipped:", error);
  }
};


/* ASFX_VIP_LIFECYCLE_FIREBASE_V1 */
(function(){
  if (window.__ASFX_VIP_LIFECYCLE_FIREBASE_V1__) return;
  window.__ASFX_VIP_LIFECYCLE_FIREBASE_V1__ = true;

  const DAY = 24 * 60 * 60 * 1000;
  const apiReady = () => window.AiSignalFirebase || null;
  const clean = (v) => String(v || '').trim().toLowerCase();
  const toMs = (v) => {
    if (!v) return 0;
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const ms = Date.parse(v);
      return Number.isFinite(ms) ? ms : 0;
    }
    if (typeof v?.toDate === 'function') return v.toDate().getTime();
    if (typeof v?.seconds === 'number') return v.seconds * 1000;
    if (v instanceof Date) return v.getTime();
    return 0;
  };
  const iso = (ms) => ms ? new Date(ms).toISOString() : '';
  const daysLeft = (ms) => Math.max(0, Math.ceil((Number(ms || 0) - Date.now()) / DAY));

  function getUserStatus(user){
    const level = clean(user?.level);
    const role = clean(user?.role);
    const vipStatus = clean(user?.vipStatus || user?.status);
    const owner = ['owner','founder','admin'].includes(level) || ['owner','founder','admin'].includes(role) || vipStatus === 'founder';
    if (owner) return { state:'founder', active:true, owner:true, daysLeft:null, expiresAtMs:0, label:'Owner/Admin lifetime access' };
    const expiresAtMs = Number(user?.vipExpiresAtMs || 0) || toMs(user?.vipExpiresAt || user?.activeUntil || user?.vipActiveUntil);
    const active = (vipStatus === 'active' || user?.vipAccess === true || level === 'vip') && (!expiresAtMs || expiresAtMs > Date.now());
    if (active) return { state:'active', active:true, owner:false, daysLeft: expiresAtMs ? daysLeft(expiresAtMs) : null, expiresAtMs, label: expiresAtMs ? 'VIP active • ' + daysLeft(expiresAtMs) + ' days left' : 'VIP active' };
    if (expiresAtMs && expiresAtMs <= Date.now()) return { state:'expired', active:false, owner:false, daysLeft:0, expiresAtMs, label:'VIP expired' };
    return { state: vipStatus === 'expired' ? 'expired' : 'free', active:false, owner:false, daysLeft:0, expiresAtMs, label: vipStatus === 'expired' ? 'VIP expired' : 'Free account' };
  }

  async function findUser(uid){
    const api = apiReady();
    if (!uid || !api?.getCollectionDocs) return null;
    const users = await api.getCollectionDocs('users');
    return (users || []).find((u) => String(u.id) === String(uid)) || null;
  }

  function buildSubscription(user, requestOrOptions = {}){
    const durationDays = Math.max(1, Number(requestOrOptions.durationDays || requestOrOptions.days || 30));
    const currentExpiry = toMs(user?.vipExpiresAt || user?.activeUntil || user?.vipActiveUntil) || Number(user?.vipExpiresAtMs || 0) || 0;
    const base = currentExpiry > Date.now() ? currentExpiry : Date.now();
    const startedAtMs = Date.now();
    const expiresAtMs = base + durationDays * DAY;
    return { durationDays, startedAtMs, expiresAtMs, startedAt: iso(startedAtMs), expiresAt: iso(expiresAtMs), extendedFromMs: currentExpiry || 0 };
  }

  async function approveVipRequestLifecycle(request){
    const api = apiReady();
    if (!api?.upsertDoc || !api?.updateCollectionDoc) throw new Error('Firebase helper belum siap.');
    if (!request?.id) throw new Error('VIP request ID tidak ditemukan.');
    const uid = request.userId;
    if (!uid || String(uid).startsWith('demo-')) {
      await api.updateCollectionDoc('vipRequests', request.id, {
        status:'approved_manual',
        lifecycleStatus:'manual_required',
        approvedAt: iso(Date.now()),
        adminNote:'Request demo/manual. UserId tidak valid untuk auto activation.'
      });
      return { manual:true, reason:'demo_user' };
    }

    const user = await findUser(uid);
    const sub = buildSubscription(user, request);
    const userPatch = {
      uid,
      email: request.email || user?.email || '',
      name: request.userName || user?.name || user?.displayName || 'VIP User',
      level:'vip',
      role:'VIP Member',
      vipAccess:true,
      vipStatus:'active',
      vipStartedAt: sub.startedAt,
      vipStartedAtMs: sub.startedAtMs,
      vipExpiresAt: sub.expiresAt,
      vipExpiresAtMs: sub.expiresAtMs,
      vipDurationDays: sub.durationDays,
      vipLastPackageId: request.packageId || '',
      vipLastPackageName: request.packageName || '',
      vipLastRequestId: request.id,
      vipLastAmount: Number(request.amount || 0),
      vipLastPaymentMethod: request.paymentMethod || '',
      vipLastApprovedAt: iso(Date.now())
    };
    await api.upsertDoc('users', uid, userPatch);
    await api.updateCollectionDoc('vipRequests', request.id, {
      status:'approved',
      lifecycleStatus:'vip_active',
      approvedAt: iso(Date.now()),
      subscriptionStartedAt: sub.startedAt,
      subscriptionStartedAtMs: sub.startedAtMs,
      subscriptionExpiresAt: sub.expiresAt,
      subscriptionExpiresAtMs: sub.expiresAtMs,
      subscriptionDurationDays: sub.durationDays
    });
    if (api.addCollectionDoc) {
      await api.addCollectionDoc('paymentHistory', {
        type:'vip_subscription',
        status:'approved',
        userId: uid,
        userName: request.userName || user?.name || '',
        email: request.email || user?.email || '',
        requestId: request.id,
        packageId: request.packageId || '',
        packageName: request.packageName || '',
        amount: Number(request.amount || 0),
        durationDays: sub.durationDays,
        paymentMethod: request.paymentMethod || '',
        paymentNumber: request.paymentNumber || '',
        senderName: request.senderName || '',
        proofUrl: request.proofUrl || '',
        startedAt: sub.startedAt,
        startedAtMs: sub.startedAtMs,
        expiresAt: sub.expiresAt,
        expiresAtMs: sub.expiresAtMs
      });
    }
    return { userPatch, subscription: sub };
  }

  async function rejectVipRequestLifecycle(request, reason = ''){
    const api = apiReady();
    if (!api?.updateCollectionDoc) throw new Error('Firebase helper belum siap.');
    if (!request?.id) throw new Error('VIP request ID tidak ditemukan.');
    await api.updateCollectionDoc('vipRequests', request.id, {
      status:'rejected',
      lifecycleStatus:'rejected',
      rejectedAt: iso(Date.now()),
      rejectReason: reason || request.rejectReason || ''
    });
    if (api.addCollectionDoc) {
      await api.addCollectionDoc('paymentHistory', {
        type:'vip_subscription',
        status:'rejected',
        userId: request.userId || '',
        userName: request.userName || '',
        email: request.email || '',
        requestId: request.id,
        packageId: request.packageId || '',
        packageName: request.packageName || '',
        amount: Number(request.amount || 0),
        paymentMethod: request.paymentMethod || '',
        senderName: request.senderName || '',
        proofUrl: request.proofUrl || '',
        reason: reason || ''
      });
    }
  }

  async function extendVipSubscription(uid, days = 30, meta = {}){
    const api = apiReady();
    if (!uid || !api?.upsertDoc) throw new Error('User/Firebase tidak siap.');
    const user = await findUser(uid);
    const sub = buildSubscription(user, { days });
    const patch = {
      uid,
      name: user?.name || user?.displayName || meta.userName || 'VIP User',
      email: user?.email || meta.email || '',
      level:'vip',
      role:'VIP Member',
      vipAccess:true,
      vipStatus:'active',
      vipStartedAt: user?.vipStartedAt || sub.startedAt,
      vipStartedAtMs: user?.vipStartedAtMs || sub.startedAtMs,
      vipExpiresAt: sub.expiresAt,
      vipExpiresAtMs: sub.expiresAtMs,
      vipDurationDays: Number(user?.vipDurationDays || 0) + Number(days || 0),
      vipLastManualExtendAt: iso(Date.now())
    };
    await api.upsertDoc('users', uid, patch);
    if (api.addCollectionDoc) {
      await api.addCollectionDoc('paymentHistory', {
        type:'vip_manual_extend',
        status:'approved',
        userId: uid,
        userName: patch.name,
        email: patch.email,
        durationDays: Number(days || 0),
        startedAt: sub.startedAt,
        expiresAt: sub.expiresAt,
        expiresAtMs: sub.expiresAtMs,
        note: meta.note || 'Manual extend from Admin Control'
      });
    }
    return patch;
  }

  async function syncVipExpiryForUser(user){
    const api = apiReady();
    const status = getUserStatus(user);
    if (!user?.id && !user?.uid) return status;
    if (status.state !== 'expired' || status.owner) return status;
    const uid = user.id || user.uid;
    if (!api?.upsertDoc) return status;
    await api.upsertDoc('users', uid, {
      level:'free',
      role:'Free Member',
      vipAccess:false,
      vipStatus:'expired',
      vipExpiredAt: iso(Date.now())
    });
    return status;
  }

  async function syncAllVipExpiries(users){
    const rows = Array.isArray(users) ? users : (apiReady()?.getCollectionDocs ? await apiReady().getCollectionDocs('users') : []);
    const expired = [];
    for (const user of rows || []) {
      const status = getUserStatus(user);
      if (status.state === 'expired') {
        expired.push(user.id || user.uid);
        try { await syncVipExpiryForUser(user); } catch(err) { console.warn('VIP expiry sync skipped:', err?.message || err); }
      }
    }
    return expired;
  }

  function installApi(){
    const api = apiReady();
    if (!api || api.__vipLifecycleV1Installed) return;
    const originalUpdateUserRole = api.updateUserRole;
    api.approveVipRequestLifecycle = approveVipRequestLifecycle;
    api.rejectVipRequestLifecycle = rejectVipRequestLifecycle;
    api.extendVipSubscription = extendVipSubscription;
    api.syncVipExpiryForUser = syncVipExpiryForUser;
    api.syncAllVipExpiries = syncAllVipExpiries;
    api.getVipLifecycleStatus = getUserStatus;
    api.updateUserRole = async function(uid, level, options = {}){
      const lv = clean(level);
      if (lv === 'vip') return await extendVipSubscription(uid, Number(options.days || 30), { note:'Role changed to VIP from Admin Control' });
      if (lv === 'free') {
        await api.upsertDoc('users', uid, { level:'free', role:'Free Member', vipAccess:false, vipStatus:'free', vipExpiresAt:null, vipExpiresAtMs:0 });
        return;
      }
      if (lv === 'admin' || lv === 'owner') {
        await api.upsertDoc('users', uid, { level:'admin', role:'Founder', vipAccess:true, vipStatus:'founder', vipExpiresAt:null, vipExpiresAtMs:0 });
        return;
      }
      return originalUpdateUserRole ? originalUpdateUserRole(uid, level) : null;
    };
    api.__vipLifecycleV1Installed = true;
  }

  window.ASFXVipLifecycleV1 = {
    getUserStatus,
    daysLeft,
    toMs,
    approveVipRequestLifecycle,
    rejectVipRequestLifecycle,
    extendVipSubscription,
    syncVipExpiryForUser,
    syncAllVipExpiries,
    installApi
  };

  installApi();
  setTimeout(installApi, 400);
  setTimeout(installApi, 1200);
  console.info('ASFX VIP Lifecycle Firebase V1 ready.');
})();
/* END ASFX_VIP_LIFECYCLE_FIREBASE_V1 */
