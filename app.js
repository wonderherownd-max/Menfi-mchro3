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
    // Telegram Data
    userId: null,
    username: 'Guest',
    firstName: 'User',
    
    // Mining Data
    balance: 0,
    referrals: 0,
    totalEarned: 0,
    rank: 'Beginner',
    
    // Referral Data
    referralEarnings: 0,
    referralLink: '',
    
    // Mining Stats
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

    if (tg.initDataUnsafe) {
        tg.ready();
        tg.expand();
        initTelegramUser();
    } else {
        alert('⚠️ Telegram WebApp not detected!');
    }

    await loadUserData(); // Load Firebase data
    
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

function animateMineButton(reward) {
    const btn = elements.mineBtn;
    btn.disabled = true;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<div class="mine-icon"><i class="fas fa-check"></i></div>
        <div class="mine-text">
            <div class="mine-title">Mined!</div>
            <div class="mine-reward">+${reward} Points</div>
        </div>
        <div class="mine-cooldown">5s</div>`;
    let cooldown = CONFIG.MINE_COOLDOWN / 1000;
    const timerInterval = setInterval(() => {
        cooldown--;
        if (cooldown > 0) btn.querySelector('.mine-cooldown').textContent = `${cooldown}s`;
        else { clearInterval(timerInterval); btn.disabled = false; btn.innerHTML = originalHTML; }
    }, 1000);
}

// ============================================
// REFERRAL SYSTEM
// ============================================

function handleCopyLink() {
    if (!userData.referralLink) return;
    navigator.clipboard.writeText(userData.referralLink)
        .then(() => showToast('✅ Link copied to clipboard!', 'success'))
        .catch(() => showToast('❌ Copy failed', 'error'));
}

function handleShareTelegram() {
    if (!userData.referralLink) return;
    const shareText = `Join me on VIP Mining and earn free points! 🪙\n\nUse my referral link: ${userData.referralLink}\n\n@VIPMainingPROBot`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(userData.referralLink)}&text=${encodeURIComponent(shareText)}`, '_blank');
    showToast('📱 Opening Telegram...', 'info');
}

function handleShareWhatsApp() {
    if (!userData.referralLink) return;
    const shareText = `Join me on VIP Mining! Earn free points using my link: ${userData.referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    showToast('💚 Opening WhatsApp...', 'info');
}

// ============================================
// RANK & PROGRESS SYSTEM
// ============================================

function getCurrentRank() {
    return CONFIG.RANKS.find(r => userData.totalEarned >= r.min && userData.totalEarned <= r.max) || CONFIG.RANKS[0];
}

function getNextRank() {
    const currentIndex = CONFIG.RANKS.findIndex(r => r.name === userData.rank);
    return currentIndex < CONFIG.RANKS.length - 1 ? CONFIG.RANKS[currentIndex + 1] : null;
}

function checkRankUp() {
    const currentRank = getCurrentRank();
    if (currentRank.name !== userData.rank) {
        const oldRank = userData.rank;
        userData.rank = currentRank.name;
        showToast(`🏆 Rank Up! ${oldRank} → ${currentRank.name}`, 'success');
        updateUI();
    }
}

function updateProgress() {
    const currentRank = getCurrentRank();
    const nextRank = getNextRank();
    if (nextRank) {
        const progress = ((userData.totalEarned - currentRank.min) / (nextRank.min - currentRank.min)) * 100;
        elements.progressFill.style.width = `${Math.min(progress, 100)}%`;
        elements.nextRank.textContent = `Next: ${nextRank.name} (${nextRank.min} points)`;
        elements.currentPoints.textContent = userData.totalEarned;
        elements.targetPoints.textContent = nextRank.min;
        elements.remainingPoints.textContent = Math.max(0, nextRank.min - userData.totalEarned);
    } else {
        elements.progressFill.style.width = '100%';
        elements.nextRank.textContent = 'Maximum Rank Achieved!';
        elements.currentPoints.textContent = userData.totalEarned;
        elements.targetPoints.textContent = '∞';
        elements.remainingPoints.textContent = '0';
    }
}

// ============================================
// UI UPDATES
// ============================================

function updateUI() {
    elements.balance.textContent = userData.balance.toLocaleString();
    elements.referrals.textContent = userData.referrals;
    elements.totalEarned.textContent = userData.totalEarned.toLocaleString();
    const currentRank = getCurrentRank();
    elements.rankBadge.textContent = currentRank.name;
    elements.rankBadge.style.background = `rgba(${hexToRgb(currentRank.color)},0.2)`;
    elements.rankBadge.style.color = currentRank.color;
    elements.rewardAmount.textContent = currentRank.reward;
    elements.miningPower.innerHTML = `<i class="fas fa-bolt"></i> Power: ${currentRank.power}`;
    elements.refCount.textContent = userData.referrals;
    elements.refEarned.textContent = userData.referralEarnings;
    elements.refRank.textContent = currentRank.name;
    updateProgress();
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
// UTILITIES
// ============================================

function showToast(message, type='info') {
    const toast = elements.toast;
    toast.querySelector('.toast-message').textContent = message;
    const colors = { success: 'rgba(34,197,94,0.9)', error: 'rgba(239,68,68,0.9)', warning: 'rgba(245,158,11,0.9)', info: 'rgba(59,130,246,0.9)' };
    toast.style.background = colors[type] || colors.info;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1],16)},${parseInt(result[2],16)},${parseInt(result[3],16)}` : '59,130,246';
}

function updateLoop() {
    if (userData.lastMineTime > 0) {
        const timeSinceLastMine = Date.now() - userData.lastMineTime;
        if (timeSinceLastMine < CONFIG.MINE_COOLDOWN) {
            const secondsLeft = Math.ceil((CONFIG.MINE_COOLDOWN - timeSinceLastMine) / 1000);
            if (elements.cooldownTimer) elements.cooldownTimer.textContent = `${secondsLeft}s`;
        }
    }
    requestAnimationFrame(updateLoop);
}

// ============================================
// START THE APPLICATION
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else { initApp(); }

window.VIPMiningApp = { userData, CONFIG, saveUserData, loadUserData };

console.log('🌟 VIP Mining Mini App with Firebase loaded!');
