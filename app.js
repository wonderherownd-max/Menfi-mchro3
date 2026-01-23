// ============================================
// VIP Mining Mini App - Professional Version
// Direct Bot Link: http://t.me/VIPMainingPROBot/PRO
// Firebase Integrated (Firestore)
// ============================================

// Import Firebase
import { app } from './firebaseConfig.js';
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const db = getFirestore(app);

// Initialize Telegram WebApp
const tg = window.Telegram?.WebApp || null;

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
};

// Configuration
const CONFIG = {
    MINE_COOLDOWN: 5000, // 5 seconds
    BASE_REWARD: 1,
    REFERRAL_REWARD: 25,
    REFERRAL_BOT_LINK: "http://t.me/VIPMainingPROBot/PRO",
    RANKS: [
        { name: 'Beginner', min: 0, max: 199, reward: 1, power: '10/h', color: '#10B981' },
        { name: 'Pro', min: 200, max: 499, reward: 2, power: '25/h', color: '#3B82F6' },
        { name: 'Expert', min: 500, max: 999, reward: 3, power: '50/h', color: '#8B5CF6' },
        { name: 'VIP', min: 1000, max: 9999, reward: 5, power: '100/h', color: '#F59E0B' },
        { name: 'Master', min: 10000, max: Infinity, reward: 10, power: '250/h', color: '#EF4444' }
    ],
    VERSION: '1.0.0'
};

// DOM Elements Cache
const elements = {
    username: document.getElementById('username'),
    userId: document.getElementById('userId'),
    userAvatar: document.getElementById('userAvatar'),
    balance: document.getElementById('balance'),
    mineBtn: document.getElementById('mineBtn'),
    referralInput: document.getElementById('referralInput'),
    copyBtn: document.getElementById('copyBtn'),
    shareBtn: document.getElementById('shareBtn'),
    whatsappBtn: document.getElementById('whatsappBtn'),
    toast: document.getElementById('toast'),
};

// ============================================
// INITIALIZATION
// ============================================

async function initApp() {
    console.log('🚀 Initializing VIP Mining App...');

    initTelegramUser();       // Initialize user from Telegram
    await loadUserData();     // Load user data from Firebase

    setupEventListeners();    // Attach button handlers
    requestAnimationFrame(updateLoop); // Start UI update loop
    updateUI();

    console.log('✅ App initialized successfully');
}

function initTelegramUser() {
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const tgUser = tg.initDataUnsafe.user;
        userData.userId = tgUser.id.toString();
        userData.username = tgUser.username ? `@${tgUser.username}` : `User${userData.userId.slice(-4)}`;
        userData.firstName = tgUser.first_name || 'User';
    } else {
        // Fallback if Telegram not available
        userData.userId = `guest_${Date.now()}`;
        userData.username = 'Guest';
        userData.firstName = 'Guest';
    }

    userData.referralLink = generateReferralLink();

    // Update DOM
    if (elements.username) elements.username.textContent = userData.username;
    if (elements.userId) elements.userId.textContent = `ID: ${userData.userId}`;
    if (elements.userAvatar) elements.userAvatar.textContent = userData.firstName.charAt(0).toUpperCase();
    if (elements.referralInput) elements.referralInput.value = userData.referralLink;
}

// Generate referral link
function generateReferralLink() {
    if (!userData.userId) return CONFIG.REFERRAL_BOT_LINK;
    const encodedId = encodeURIComponent(userData.userId);
    return `${CONFIG.REFERRAL_BOT_LINK}?start=${encodedId}`;
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    if (elements.mineBtn) elements.mineBtn.addEventListener('click', handleMining);
    if (elements.copyBtn) elements.copyBtn.addEventListener('click', handleCopyLink);
    if (elements.shareBtn) elements.shareBtn.addEventListener('click', handleShareTelegram);
    if (elements.whatsappBtn) elements.whatsappBtn.addEventListener('click', handleShareWhatsApp);
    window.addEventListener('beforeunload', saveUserData);
}

// ============================================
// MINING SYSTEM
// ============================================

async function handleMining() {
    const now = Date.now();
    const timeSinceLastMine = now - userData.lastMineTime;

    if (timeSinceLastMine < CONFIG.MINE_COOLDOWN) {
        showToast(`⏳ Please wait ${Math.ceil((CONFIG.MINE_COOLDOWN - timeSinceLastMine)/1000)}s`, 'warning');
        return;
    }

    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
    const reward = currentRank.reward;

    userData.balance += reward;
    userData.totalEarned += reward;
    userData.lastMineTime = now;
    userData.minesToday++;
    userData.totalMines++;

    updateUI();
    await saveUserData();

    showToast(`⛏️ +${reward} points mined!`, 'success');
}

// ============================================
// REFERRAL SYSTEM
// ============================================

function handleCopyLink() {
    if (!userData.referralLink) return;
    navigator.clipboard.writeText(userData.referralLink)
        .then(() => showToast('✅ Referral link copied!', 'success'))
        .catch(() => showToast('❌ Copy failed', 'error'));
}

function handleShareTelegram() {
    if (!userData.referralLink) return;
    const shareText = `Join VIP Mining and earn free points! 🪙\n${userData.referralLink}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(userData.referralLink)}&text=${encodeURIComponent(shareText)}`, '_blank');
    showToast('📱 Opening Telegram...', 'info');
}

function handleShareWhatsApp() {
    if (!userData.referralLink) return;
    const shareText = `Join VIP Mining! Earn points using my link: ${userData.referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    showToast('💚 Opening WhatsApp...', 'info');
}

// ============================================
// FIREBASE STORAGE
// ============================================

async function saveUserData() {
    if (!userData.userId) return;
    try {
        await setDoc(doc(db, "users", userData.userId), userData);
        console.log('💾 Data saved to Firebase');
    } catch (err) {
        console.error('❌ Firebase save error:', err);
    }
}

async function loadUserData() {
    if (!userData.userId) return;
    try {
        const docRef = doc(db, "users", userData.userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            Object.assign(userData, docSnap.data());
            console.log('📂 Data loaded from Firebase');
        }
    } catch (err) {
        console.error('❌ Firebase load error:', err);
    }
    updateUI();
}

// ============================================
// UI UPDATES
// ============================================

function updateUI() {
    if (elements.balance) elements.balance.textContent = userData.balance.toLocaleString();
}

// Toast utility
function showToast(message, type='info') {
    if (!elements.toast) return;
    elements.toast.textContent = message;
    const colors = { success: 'green', error: 'red', warning: 'orange', info: 'blue' };
    elements.toast.style.background = colors[type] || 'blue';
    elements.toast.classList.add('show');
    setTimeout(() => elements.toast.classList.remove('show'), 2500);
}

// Cooldown loop
function updateLoop() {
    requestAnimationFrame(updateLoop);
}

// ============================================
// START THE APPLICATION
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else { initApp(); }

window.VIPMiningApp = { userData, CONFIG, saveUserData, loadUserData };
console.log('🌟 VIP Mining App Loaded with Firebase & Direct Bot Link!');
