// ============================================
// VIP Mining Mini App - Professional Version
// Connected with @VIPMainingPROBot
// ============================================

// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;

// User Data Structure
let userData = {
    userId: null,
    username: 'Guest',
    firstName: 'User',
    balance: 0,
    referrals: 0,
    totalEarned: 0,
    rank: 'Beginner',
    referralEarnings: 0,
    referralLink: '',
    minesToday: 0,
    lastMineTime: 0,
    totalMines: 0,
    storageKey: 'vip_mining_data'
};

// ============================================
// FIREBASE INITIALIZATION
// ============================================

const firebaseConfig = {
    apiKey: "ضع_apiKey_هنا",
    authDomain: "vip-mining.firebaseapp.com",
    databaseURL: "https://vip-mining-default-rtdb.firebaseio.com",
    projectId: "vip-mining",
    storageBucket: "vip-mining.appspot.com",
    messagingSenderId: "XXXX",
    appId: "XXXX"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ============================================
// DOM Elements Cache
// ============================================

const elements = {
    username: document.getElementById('username'),
    userId: document.getElementById('userId'),
    userAvatar: document.getElementById('userAvatar'),
    userSection: document.getElementById('userSection'),
    balance: document.getElementById('balance'),
    referrals: document.getElementById('referrals'),
    totalEarned: document.getElementById('totalEarned'),
    rankBadge: document.getElementById('rankBadge'),
    mineBtn: document.getElementById('mineBtn'),
    rewardAmount: document.getElementById('rewardAmount'),
    cooldownTimer: document.getElementById('cooldownTimer'),
    miningPower: document.getElementById('miningPower'),
    refCount: document.getElementById('refCount'),
    refEarned: document.getElementById('refEarned'),
    refRank: document.getElementById('refRank'),
    referralInput: document.getElementById('referralInput'),
    copyBtn: document.getElementById('copyBtn'),
    shareBtn: document.getElementById('shareBtn'),
    whatsappBtn: document.getElementById('whatsappBtn'),
    nextRank: document.getElementById('nextRank'),
    progressFill: document.getElementById('progressFill'),
    currentPoints: document.getElementById('currentPoints'),
    targetPoints: document.getElementById('targetPoints'),
    remainingPoints: document.getElementById('remainingPoints'),
    toast: document.getElementById('toast')
};

// ============================================
// INITIALIZATION
// ============================================

function initApp() {
    tg.ready();
    tg.expand();

    const tgUser = tg.initDataUnsafe.user;
    if (tgUser) {
        userData.userId = tgUser.id;
        userData.username = tgUser.username ? `@${tgUser.username}` : `User${tgUser.id.toString().slice(-4)}`;
        userData.firstName = tgUser.first_name || 'User';
        elements.username.textContent = userData.username;
        elements.userId.textContent = `ID: ${userData.userId}`;
        elements.userAvatar.textContent = userData.firstName.charAt(0).toUpperCase();
        userData.referralLink = generateReferralLink();
        elements.referralInput.value = userData.referralLink;
        elements.userSection.classList.add('telegram-user');

        // 🔹 Load balance from Firebase
        loadFirebaseData();
    }

    // Setup event listeners
    setupEventListeners();
    requestAnimationFrame(updateLoop);
}

// ============================================
// FIREBASE DATA FUNCTIONS
// ============================================

function loadFirebaseData() {
    const userRef = db.ref("users/" + userData.userId);
    userRef.once("value").then(snapshot => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            userData.balance = data.balance || 0;
            userData.referrals = data.referrals || 0;
            userData.totalEarned = data.totalEarned || userData.balance;
        } else {
            // New user
            userRef.set({
                balance: 0,
                referrals: 0,
                totalEarned: 0,
                createdAt: Date.now()
            });
        }
        updateUI();
    });
}

function saveFirebaseData() {
    const userRef = db.ref("users/" + userData.userId);
    userRef.update({
        balance: userData.balance,
        referrals: userData.referrals,
        totalEarned: userData.totalEarned
    });
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    elements.mineBtn.addEventListener('click', handleMining);
    elements.copyBtn.addEventListener('click', handleCopyLink);
    elements.shareBtn.addEventListener('click', handleShareTelegram);
    elements.whatsappBtn.addEventListener('click', handleShareWhatsApp);
}

// ============================================
// MINING SYSTEM
// ============================================

let canMine = true;
const MINE_COOLDOWN = 5000;

function handleMining() {
    if (!canMine) return;

    const reward = 1; // Base reward
    userData.balance += reward;
    userData.totalEarned += reward;

    updateUI();
    saveFirebaseData();

    canMine = false;
    setTimeout(() => canMine = true, MINE_COOLDOWN);
}

// ============================================
// REFERRAL SYSTEM
// ============================================

function generateReferralLink() {
    return `https://t.me/VIPMainingPROBot?start=${userData.userId}`;
}

function handleCopyLink() {
    if (!userData.referralLink) return;
    elements.referralInput.select();
    document.execCommand('copy');
    showToast('✅ Link copied!', 'success');
}

function handleShareTelegram() {
    const shareText = `Join me on VIP Mining: ${userData.referralLink}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(userData.referralLink)}&text=${encodeURIComponent(shareText)}`, '_blank');
}

function handleShareWhatsApp() {
    const shareText = `Join me on VIP Mining: ${userData.referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
}

// ============================================
// UI & UTILITIES
// ============================================

function updateUI() {
    elements.balance.textContent = userData.balance.toLocaleString();
    elements.referrals.textContent = userData.referrals;
    elements.totalEarned.textContent = userData.totalEarned.toLocaleString();
}

function showToast(message, type = 'info') {
    const toast = elements.toast;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function updateLoop() {
    requestAnimationFrame(updateLoop);
}

// ============================================
// START
// ============================================

document.addEventListener('DOMContentLoaded', initApp);
