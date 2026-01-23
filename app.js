// ============================================
// VIP Mining Mini App - Production Version
// Connected with Firebase & @VIPMainingPROBot
// ============================================

// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCuZwYapa7LBRg4OOzcHLWFBpfSrjEVQ0U",
  authDomain: "vip-mining.firebaseapp.com",
  projectId: "vip-mining",
  storageBucket: "vip-mining.firebasestorage.app",
  messagingSenderId: "205041694428",
  appId: "1:205041694428:web:5b90ab2cc31b118d8be619"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// User Data Structure
let userData = {
    userId: null,
    username: 'User',
    firstName: 'User',
    balance: 0,
    referrals: 0,
    totalEarned: 0,
    rank: 'Beginner',
    referralEarnings: 0,
    minesToday: 0,
    totalMines: 0,
    lastMineTime: 0,
    createdAt: null,
    lastActive: null
};

// Configuration
const CONFIG = {
    MINE_COOLDOWN: 5000,
    REFERRAL_REWARD: 25,
    BASE_REWARD: 1,
    
    RANKS: [
        { name: 'Beginner', min: 0, max: 199, reward: 1, power: '10/h' },
        { name: 'Pro', min: 200, max: 499, reward: 2, power: '25/h' },
        { name: 'Expert', min: 500, max: 999, reward: 3, power: '50/h' },
        { name: 'VIP', min: 1000, max: 9999, reward: 5, power: '100/h' }
    ]
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
    console.log('🚀 Initializing VIP Mining App...');
    
    try {
        // Get Telegram user data
        const tgUser = tg.initDataUnsafe?.user;
        
        if (!tgUser) {
            showError('Please open this app from Telegram');
            return;
        }
        
        // Set user data from Telegram
        userData.userId = tgUser.id.toString();
        userData.username = tgUser.username ? `@${tgUser.username}` : `User${tgUser.id.toString().slice(-4)}`;
        userData.firstName = tgUser.first_name || 'User';
        
        // Update UI with user info
        elements.userInfo.textContent = `Welcome, ${userData.username}`;
        
        // Load or create user in Firebase
        await loadOrCreateUser();
        
        // Generate and display referral link
        const refLink = generateReferralLink();
        elements.referralLink.textContent = refLink;
        
        // Setup event listeners
        setupEventListeners();
        
        // Update UI
        updateUI();
        
        console.log('✅ App initialized successfully for user:', userData.username);
        
    } catch (error) {
        console.error('❌ Error initializing app:', error);
        showError('Failed to load app. Please try again.');
    }
}

// ============================================
// FIREBASE FUNCTIONS
// ============================================

async function loadOrCreateUser() {
    const userRef = doc(db, 'users', userData.userId);
    
    try {
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            // User exists - load data
            const data = userDoc.data();
            
            userData.balance = data.balance || 100;
            userData.referrals = data.referrals || 0;
            userData.totalEarned = data.totalEarned || 100;
            userData.rank = data.rank || 'Beginner';
            userData.referralEarnings = data.referralEarnings || 0;
            userData.minesToday = data.minesToday || 0;
            userData.totalMines = data.totalMines || 0;
            userData.lastMineTime = data.lastMineTime || 0;
            userData.createdAt = data.createdAt || new Date().toISOString();
            
            console.log('📂 Loaded existing user data');
            
        } else {
            // New user - create in Firebase
            const newUserData = {
                userId: userData.userId,
                username: userData.username,
                firstName: userData.firstName,
                balance: 100,
                referrals: 0,
                totalEarned: 100,
                rank: 'Beginner',
                referralEarnings: 0,
                minesToday: 0,
                totalMines: 0,
                lastMineTime: 0,
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString()
            };
            
            await setDoc(userRef, newUserData);
            
            // Check for referral
            await checkReferral();
            
            Object.assign(userData, newUserData);
            console.log('🆕 Created new user in Firebase');
        }
        
        // Update last active time
        await updateDoc(userRef, {
            lastActive: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Firebase error:', error);
        // Fallback to local data
        userData.balance = 100;
        userData.totalEarned = 100;
    }
}

async function checkReferral() {
    // Check if user came from referral
    const urlParams = new URLSearchParams(window.location.search);
    const referrerId = urlParams.get('ref');
    
    if (referrerId && referrerId !== userData.userId) {
        try {
            const referrerRef = doc(db, 'users', referrerId);
            const referrerDoc = await getDoc(referrerRef);
            
            if (referrerDoc.exists()) {
                // Reward referrer
                await updateDoc(referrerRef, {
                    referrals: increment(1),
                    balance: increment(CONFIG.REFERRAL_REWARD),
                    totalEarned: increment(CONFIG.REFERRAL_REWARD),
                    referralEarnings: increment(CONFIG.REFERRAL_REWARD)
                });
                
                // Reward new user
                const userRef = doc(db, 'users', userData.userId);
                await updateDoc(userRef, {
                    balance: increment(CONFIG.REFERRAL_REWARD),
                    totalEarned: increment(CONFIG.REFERRAL_REWARD)
                });
                
                // Update local data
                userData.balance += CONFIG.REFERRAL_REWARD;
                userData.totalEarned += CONFIG.REFERRAL_REWARD;
                
                console.log('🎉 Referral bonus applied!');
            }
        } catch (error) {
            console.error('❌ Referral error:', error);
        }
    }
}

async function saveUserData() {
    try {
        const userRef = doc(db, 'users', userData.userId);
        
        await updateDoc(userRef, {
            balance: userData.balance,
            referrals: userData.referrals,
            totalEarned: userData.totalEarned,
            rank: userData.rank,
            referralEarnings: userData.referralEarnings,
            minesToday: userData.minesToday,
            totalMines: userData.totalMines,
            lastMineTime: userData.lastMineTime,
            lastActive: new Date().toISOString()
        });
        
        console.log('💾 Saved to Firebase');
    } catch (error) {
        console.error('❌ Save error:', error);
    }
}

// ============================================
// MINING SYSTEM
// ============================================

async function minePoints() {
    const now = Date.now();
    const timeSinceLastMine = now - userData.lastMineTime;
    
    // Check cooldown
    if (timeSinceLastMine < CONFIG.MINE_COOLDOWN) {
        const secondsLeft = Math.ceil((CONFIG.MINE_COOLDOWN - timeSinceLastMine) / 1000);
        showToast(`⏳ Please wait ${secondsLeft}s`, 'warning');
        return;
    }
    
    // Get current rank reward
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
    const reward = currentRank.reward;
    
    try {
        // Update in Firebase
        const userRef = doc(db, 'users', userData.userId);
        await updateDoc(userRef, {
            balance: increment(reward),
            totalEarned: increment(reward),
            minesToday: increment(1),
            totalMines: increment(1),
            lastMineTime: now
        });
        
        // Update local data
        userData.balance += reward;
        userData.totalEarned += reward;
        userData.minesToday++;
        userData.totalMines++;
        userData.lastMineTime = now;
        
        // Update UI
        updateUI();
        animateMineButton(reward);
        
        // Check rank up
        checkRankUp();
        
        showToast(`⛏️ +${reward} points mined!`, 'success');
        
    } catch (error) {
        console.error('❌ Mining error:', error);
        showToast('❌ Error mining points', 'error');
    }
}

// ============================================
// REFERRAL SYSTEM
// ============================================

function generateReferralLink() {
    // Create Telegram bot referral link
    const botLink = `https://t.me/VIPMainingPROBot?start=${userData.userId}`;
    
    // Also create Mini App link with referral parameter
    const miniAppLink = `${window.location.origin}${window.location.pathname}?ref=${userData.userId}`;
    
    return botLink;
}

function setupEventListeners() {
    // Mining Button
    elements.mineBtn.addEventListener('click', minePoints);
    
    // Copy Referral Link
    elements.copyBtn.addEventListener('click', () => {
        const refLink = generateReferralLink();
        navigator.clipboard.writeText(refLink)
            .then(() => {
                elements.copyBtn.textContent = '✅ Copied!';
                setTimeout(() => {
                    elements.copyBtn.textContent = '📋 Copy Link';
                }, 2000);
                showToast('✅ Link copied to clipboard!', 'success');
            })
            .catch(err => {
                console.error('Copy failed:', err);
                showToast('❌ Copy failed', 'error');
            });
    });
}

// ============================================
// UI FUNCTIONS
// ============================================

function updateUI() {
    // Update numbers
    elements.balance.textContent = userData.balance.toLocaleString();
    elements.referrals.textContent = userData.referrals;
    elements.totalEarned.textContent = userData.totalEarned.toLocaleString();
    elements.rank.textContent = `Rank: ${userData.rank}`;
    
    // Update mining info
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
    elements.rewardAmount.textContent = currentRank.reward;
    elements.miningPower.textContent = currentRank.power;
    
    // Check rank up
    const nextRank = CONFIG.RANKS.find(r => r.min > userData.totalEarned);
    if (nextRank) {
        const progress = ((userData.totalEarned - currentRank.min) / (nextRank.min - currentRank.min)) * 100;
        console.log(`Progress to ${nextRank.name}: ${progress.toFixed(1)}%`);
    }
}

function checkRankUp() {
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank);
    const newRank = CONFIG.RANKS.find(r => 
        userData.totalEarned >= r.min && userData.totalEarned <= r.max
    );
    
    if (newRank && newRank.name !== userData.rank) {
        userData.rank = newRank.name;
        updateUI();
        saveUserData();
        showToast(`🏆 Rank Up! ${currentRank.name} → ${newRank.name}`, 'success');
    }
}

function animateMineButton(reward) {
    const btn = elements.mineBtn;
    const originalHTML = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = `
        <div class="mine-icon">
            <i class="fas fa-check"></i>
        </div>
        <div class="mine-text">
            <div class="mine-title">Mined!</div>
            <div class="mine-reward">+${reward} Points</div>
        </div>
        <div class="mine-cooldown">5s</div>
    `;
    
    let cooldown = 5;
    const timerInterval = setInterval(() => {
        cooldown--;
        btn.querySelector('.mine-cooldown').textContent = `${cooldown}s`;
        
        if (cooldown <= 0) {
            clearInterval(timerInterval);
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    }, 1000);
}

function showToast(message, type = 'info') {
    // Create toast if doesn't exist
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-check-circle"></i>
                <span class="toast-message">${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .toast {
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                background: rgba(34, 197, 94, 0.9);
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 1000;
                opacity: 0;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
            }
            .toast.show {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        `;
        document.head.appendChild(style);
    }
    
    // Set message
    toast.querySelector('.toast-message').textContent = message;
    
    // Set color based on type
    const colors = {
        success: 'rgba(34, 197, 94, 0.9)',
        error: 'rgba(239, 68, 68, 0.9)',
        warning: 'rgba(245, 158, 11, 0.9)',
        info: 'rgba(59, 130, 246, 0.9)'
    };
    
    toast.style.background = colors[type] || colors.info;
    
    // Show toast
    toast.classList.add('show');
    
    // Auto hide
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showError(message) {
    elements.userInfo.textContent = message;
    elements.userInfo.style.color = '#ef4444';
}

// ============================================
// START APPLICATION
// ============================================

// Auto-save every 30 seconds
setInterval(() => {
    if (userData.userId) {
        saveUserData();
    }
}, 30000);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContent', initApp);
} else {
    initApp();
        }
