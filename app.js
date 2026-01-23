/*************************************************
 * VIP Mining Mini App - ONE FILE VERSION
 *************************************************/

/* ========= Firebase (CDN) ========= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ========= Firebase Config ========= */
const firebaseConfig = {
  apiKey: "AIzaSyCuZwYapa7LBRg4OOzcHLWFBpfSrjEVQ0U",
  authDomain: "vip-mining.firebaseapp.com",
  projectId: "vip-mining",
  storageBucket: "vip-mining.appspot.com",
  messagingSenderId: "205041694428",
  appId: "1:205041694428:web:5b90ab2cc31b118d8be619"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ========= Telegram ========= */
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

/* ========= DOM ========= */
const $ = id => document.getElementById(id);

/* ========= Globals ========= */
let user = null;

/* ========= Rank System ========= */
function getRank(total) {
  if (total >= 1000) return "VIP";
  if (total >= 500) return "Expert";
  if (total >= 200) return "Pro";
  return "Beginner";
}

function rewardByRank(rank) {
  return { Beginner: 1, Pro: 2, Expert: 3, VIP: 5 }[rank] || 1;
}

/* ========= Referral Logic ========= */
async function processReferral(referrerId, newUserId) {
  if (!referrerId) return;
  if (referrerId === newUserId) return;

  const refDoc = doc(db, "users", referrerId);
  const refSnap = await getDoc(refDoc);

  if (!refSnap.exists()) return;

  await updateDoc(refDoc, {
    balance: increment(25),
    referrals: increment(1),
    totalEarned: increment(25)
  });
}

/* ========= Init User ========= */
async function init() {
  const tgUser = tg.initDataUnsafe?.user;
  if (!tgUser) {
    $("username").textContent = "Telegram login required";
    return;
  }

  const userId = String(tgUser.id);
  const username = tgUser.username
    ? "@" + tgUser.username
    : "User" + userId.slice(-4);

  const params = new URLSearchParams(window.location.search);
  const referrerId = params.get("startapp");

  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    // 👤 NEW USER
    await processReferral(referrerId, userId);

    user = {
      userId,
      username,
      balance: 100,
      referrals: 0,
      totalEarned: 100,
      rank: "Beginner",
      referredBy: referrerId || null,
      createdAt: serverTimestamp()
    };

    await setDoc(userRef, user);
  } else {
    user = snap.data();
  }

  render();
}

/* ========= UI ========= */
function render() {
  user.rank = getRank(user.totalEarned);

  $("username").textContent = user.username;
  $("balance").textContent = user.balance;
  $("referrals").textContent = user.referrals;
  $("total").textContent = user.totalEarned;
  $("rank").textContent = user.rank;

  const link = `https://t.me/VIPMainingPROBot/PRO?startapp=${user.userId}`;
  $("refLink").value = link;

  $("copy").onclick = () => {
    navigator.clipboard.writeText(link);
    $("copy").innerText = "✅ Copied";
    setTimeout(() => ($("copy").innerText = "📋 Copy"), 1500);
  };

  $("mine").onclick = mine;
}

/* ========= Mining ========= */
async function mine() {
  const reward = rewardByRank(user.rank);

  user.balance += reward;
  user.totalEarned += reward;
  user.rank = getRank(user.totalEarned);

  await updateDoc(doc(db, "users", user.userId), {
    balance: increment(reward),
    totalEarned: increment(reward)
  });

  render();
}

/* ========= Start ========= */
init();
