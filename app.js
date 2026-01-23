// ============================================
// VIP Mining Mini App - Professional Version
// Connected with @VIPMainingPROBot
// Firebase Integrated (Firestore)
// ============================================

// Import Firebase
import { app } from './firebaseConfig.js';
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const db = getFirestore(app);

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
};

// Configuration
const CONFIG = {
    MINE_COOLDOWN: 5000, // 5 seconds
    BASE_REWARD: 1,
    REFERRAL_REWARD: 25,
    REFERRAL_BOT: '@VIPMainingPROBot',
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

async function initApp() {
    console.log('🚀 Initializing VIP Mining App...');

    if (!tg.initDataUnsafe) {
        alert('⚠️ Telegram WebApp not detected!');
        return;
    }

    tg.ready();
    tg.expand();
    initTelegramUser();

    // Load Firebase Data **بعد** التأكد من وجود userId
    await loadUserData();

    // Enable mine button after data is loaded
    elements.mineBtn.disabled = false;

    setupEventListeners();
    requestAnimationFrame(updateLoop);

    console.log('✅ App initialized successfully');
}

function initTelegramUser() {
    const tgUser = tg.initDataUnsafe.user;
    
    if (tgUser) {
        userData.userId = tgUser.id.toString();
        userData.username = tgUser.username ? `@${tgUser.username}` : `User${userData.userId.slice(-4)}`;
        userData.firstName = tgUser.first_name || 'User';
        elements.username.textContent = userData.username;
        elements.userId.textContent = `ID: ${userData.userId}`;
        elements.userAvatar.textContent = userData.firstName.charAt(0).toUpperCase();
        userData.referralLink = generateReferralLink();
        elements.referralInput.value = userData.referralLink;
        elements.userSection.classList.add('telegram-user');
    }
}

function generateReferralLink() {
    if (userData.userId) {
        const encodedId = encodeURIComponent(userData.userId);
        return `https://t.me/VIPMainingPROBot?start=${encodedId}`;
    }
    return `https://t.me/VIPMainingPROBot?start=demo_${Date.now()}`;
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    elements.mineBtn.addEventListener('click', handleMining);
    elements.copyBtn.addEventListener('click', handleCopyLink);
    elements.shareBtn.addEventListener('click', handleShareTelegram);
    elements.whatsappBtn.addEventListener('click', handleShareWhatsApp);
    window.addEventListener('beforeunload', saveUserData);
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            handleMining();
        }
    });
}

// ============================================
// MINING SYSTEM
// ============================================

async function handleMining() {
    const now = Date.now();
    const timeSinceLastMine = now - userData.lastMineTime;
    
    if (timeSinceLastMine < CONFIG.MINE_COOLDOWN) {
        const secondsLeft = Math.ceil((CONFIG.MINE_COOLDOWN - timeSinceLastMine) / 1000);
        showToast(`⏳ Please wait ${secondsLeft}s`, 'warning');
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

    animateMineButton(reward);
    showToast(`⛏️ +${reward} points mined!`, 'success');
    checkRankUp();
}

// باقي الكود كما هو، مع الحفاظ على وظائف الرصيد وFirebase

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
            updateUI();
            console.log('📂 Data loaded from Firebase');
        } else {
            console.log('ℹ️ No data in Firebase, starting fresh');
        }
    } catch (err) {
        console.error('❌ Firebase load error:', err);
    }
}

// ============================================
// START THE APPLICATION
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else { initApp(); }

window.VIPMiningApp = { userData, CONFIG, saveUserData, loadUserData };
console.log('🌟 VIP Mining Mini App with Firebase loaded!');
