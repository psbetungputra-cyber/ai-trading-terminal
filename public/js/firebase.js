import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAnalytics, isSupported as analyticsSupported } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
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
