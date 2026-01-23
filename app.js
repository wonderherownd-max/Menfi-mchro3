// ============================================
// VIP Mining Mini App - Professional Version
// Connected with @VIPMainingPROBot
// Firebase Integrated (Firestore)
// ============================================

// Import Firebase
import { app } from './firebaseConfig.js';
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// Initialize Firestore
const db = getFirestore(app);

// Telegram Mini App Initialization
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// User data
let userData = {
    balance: 100,
    referrals: 0,
    totalEarned: 100,
    rank: 'Beginner',
    userId: null,
    username: 'User'
};

// DOM Elements
const elements = {
    balance: document.getElementById('balance'),
    referrals: document.getElementById('referrals'),
    totalEarned: document.getElementById('totalEarned'),
    rank: document.getElementById('rank'),
    userInfo: document.getElementById('userInfo'),
    mineBtn: document.getElementById('mineBtn'),
    rewardAmount: document.getElementById('rewardAmount'),
    referralLink: document.getElementById('referralLink'),
    copyBtn: document.getElementById('copyBtn'),
    miningPower: document.getElementById('miningPower')
};

// ============================================
// INITIALIZATION
// ============================================
async function initApp() {
    try {
        // Get user data from Telegram
        const tgUser = tg.initDataUnsafe?.user;
        
        if (!tgUser) {
            elements.userInfo.textContent = '⚠️ Please open this link inside Telegram';
            elements.mineBtn.disabled = true;
            return;
        }

        userData.userId = tgUser.id.toString();
        userData.username = tgUser.username ? `@${tgUser.username}` : `User${userData.userId.slice(-4)}`;
        elements.userInfo.textContent = `Welcome, ${userData.username}`;

        // Generate referral link
        userData.referralLink = `https://t.me/VIPMainingPROBot/PRO?start=${userData.userId}`;
        elements.referralLink.textContent = userData.referralLink;

        // Copy button functionality
        elements.copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(userData.referralLink);
            elements.copyBtn.textContent = '✅ Copied!';
            setTimeout(() => {
                elements.copyBtn.textContent = '📋 Copy Link';
            }, 2000);
        });

        // Load user data from Firebase
        await loadUserData();

        // Update UI
        updateUI();

        // Mining button
        elements.mineBtn.addEventListener('click', minePoints);

        console.log('Mini App initialized successfully');

    } catch (error) {
        console.error('Error initializing app:', error);
        elements.userInfo.textContent = 'Error loading app';
    }
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
        } else {
            console.log('ℹ️ No data in Firebase, starting fresh');
        }
    } catch (err) {
        console.error('❌ Firebase load error:', err);
    }
}

// ============================================
// UPDATE UI
// ============================================
function updateUI() {
    elements.balance.textContent = userData.balance;
    elements.referrals.textContent = userData.referrals;
    elements.totalEarned.textContent = userData.totalEarned;
    elements.rank.textContent = `Rank: ${userData.rank}`;

    const miningPower = {
        'Beginner': '10/h',
        'Pro': '25/h',
        'Expert': '50/h',
        'VIP': '100/h'
    };
    elements.miningPower.textContent = miningPower[userData.rank] || '10/h';

    const rewardAmounts = {
        'Beginner': 1,
        'Pro': 2,
        'Expert': 3,
        'VIP': 5
    };
    const reward = rewardAmounts[userData.rank] || 1;
    elements.rewardAmount.textContent = reward;

    if (userData.totalEarned >= 1000) userData.rank = 'VIP';
    else if (userData.totalEarned >= 500) userData.rank = 'Expert';
    else if (userData.totalEarned >= 200) userData.rank = 'Pro';
}

// ============================================
// MINE POINTS
// ============================================
function minePoints() {
    const reward = parseInt(elements.rewardAmount.textContent);

    userData.balance += reward;
    userData.totalEarned += reward;

    updateUI();
    saveUserData();

    elements.mineBtn.textContent = `🎉 +${reward} Mined!`;
    elements.mineBtn.disabled = true;

    setTimeout(() => {
        elements.mineBtn.textContent = `⛏️ Mine Now (+${elements.rewardAmount.textContent})`;
        elements.mineBtn.disabled = false;
    }, 1000);

    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// ============================================
// START THE APP
// ============================================
initApp();

// Auto-save every 30 seconds
setInterval(saveUserData, 30000);
