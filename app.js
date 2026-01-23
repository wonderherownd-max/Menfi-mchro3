// ============================================
// VIP Mining Mini App - Main Application Logic
// ============================================

// Global Variables
let tg = null;
let firebaseApp, db;
let userData = {
    balance: 100,
    referrals: 0,
    totalEarned: 100,
    rank: 'Beginner',
    userId: null,
    username: 'User',
    referralEarnings: 0,
    lastMineTime: 0,
    referralCode: null,
    referredBy: null,
    firstName: 'User'
};

const CONFIG = {
    MINE_COOLDOWN: 5000,
    REFERRAL_REWARD: 25,
    REFERRER_REWARD: 10,
    
    RANKS: [
        { name: 'Beginner', min: 0, max: 199, reward: 1, power: '10/hour' },
        { name: 'Professional', min: 200, max: 499, reward: 2, power: '25/hour' },
        { name: 'Expert', min: 500, max: 999, reward: 3, power: '50/hour' },
        { name: 'VIP', min: 1000, max: 9999, reward: 5, power: '100/hour' },
        { name: 'Legend', min: 10000, max: Infinity, reward: 10, power: '200/hour' }
    ]
};

// DOM Elements Cache
const elements = {};

// ============================================
// Application Initialization
// ============================================

async function initApp() {
    console.log("🚀 Initializing VIP Mining App...");
    
    try {
        // Initialize Telegram
        initTelegram();
        
        // Initialize Firebase
        initFirebase();
        
        // Cache DOM elements
        cacheElements();
        
        // Setup user
        await setupUser();
        
        // Load user data
        await loadUserData();
        
        // Setup event listeners
        setupEventListeners();
        
        // Update UI
        updateUI();
        
        // Update connection status
        updateConnectionStatus();
        
        // Check for referrals
        checkForReferral();
        
        console.log("✅ App initialized successfully");
        
    } catch (error) {
        console.error("❌ Initialization error:", error);
        showMessage('Error starting app. Please refresh.', 'error');
    }
}

function initTelegram() {
    try {
        tg = window.Telegram.WebApp;
        if (tg) {
            tg.ready();
            tg.expand();
            console.log("✅ Telegram WebApp initialized");
        }
    } catch (e) {
        console.log("⚠️ Not in Telegram environment");
    }
}

function initFirebase() {
    const firebaseConfig = {
        apiKey: "AIzaSyCuzWYapa7LBRg40OzcHLWFBpfSrjEVQoU",
        authDomain: "vip-mining.firebaseapp.com",
        projectId: "vip-mining",
        storageBucket: "vip-mining.firebasestorage.app",
        messagingSenderId: "205041694428",
        appId: "1:205041694428:web:5b9a0ab2cc31b118d8be619"
    };
    
    if (typeof firebase !== 'undefined') {
        try {
            firebaseApp = firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            console.log("✅ Firebase initialized");
        } catch (error) {
            console.error("❌ Firebase initialization error:", error);
        }
    }
}

function cacheElements() {
    const elementIds = [
        'balance', 'referrals', 'totalEarned', 'rankBadge',
        'username', 'userId', 'userAvatar', 'mineBtn',
        'rewardAmount', 'referralLink', 'copyBtn', 'miningPower',
        'refCount', 'refEarned', 'refRank', 'progressFill',
        'nextRank', 'currentPoints', 'targetPoints', 'remainingPoints',
        'connectionStatus', 'cooldownTimer', 'shareBtn', 'whatsappBtn'
    ];
    
    elementIds.forEach(id => {
        elements[id] = document.getElementById(id);
        if (!elements[id]) {
            console.warn(`⚠️ Element not found: ${id}`);
        }
    });
}

// ============================================
// User Management
// ============================================

async function setupUser() {
    console.log("👤 Setting up user...");
    
    let telegramUser = null;
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        telegramUser = tg.initDataUnsafe.user;
        console.log("📱 Telegram user found:", telegramUser);
    }
    
    if (telegramUser) {
        userData.userId = telegramUser.id.toString();
        userData.username = telegramUser.username ? `@${telegramUser.username}` : 
                           telegramUser.first_name ? telegramUser.first_name : 
                           `User${telegramUser.id.toString().slice(-4)}`;
        userData.firstName = telegramUser.first_name || 'User';
    } else {
        const savedUserId = localStorage.getItem('vip_mining_user_id');
        userData.userId = savedUserId || 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        userData.username = 'User';
        userData.firstName = 'User';
        
        if (!savedUserId) {
            localStorage.setItem('vip_mining_user_id', userData.userId);
        }
    }
    
    if (!userData.referralCode) {
        userData.referralCode = generateReferralCode(userData.userId);
        console.log("🔗 Generated referral code:", userData.referralCode);
    }
    
    updateUserUI();
    
    if (db) {
        await syncUserWithFirebase();
    }
}

function generateReferralCode(userId) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const timestamp = Date.now().toString(36);
    const randomPart = Array.from({length: 4}, () => 
        chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
    
    return `${userId.slice(-3)}${randomPart}`.toUpperCase();
}

function updateUserUI() {
    console.log("🎨 Updating user UI...");
    
    if (elements.username) {
        elements.username.textContent = userData.username;
    }
    
    if (elements.userId) {
        elements.userId.textContent = `ID: ${userData.userId.slice(-8)}`;
    }
    
    if (elements.userAvatar) {
        const firstChar = userData.firstName.charAt(0).toUpperCase();
        elements.userAvatar.textContent = firstChar;
        elements.userAvatar.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
    }
    
    updateReferralLink();
}

function updateReferralLink() {
    if (!userData.referralCode) return;
    
    const refLink = `https://t.me/VIPMainingPROBot?start=${userData.referralCode}`;
    
    if (elements.referralLink) {
        elements.referralLink.value = refLink;
    }
}

// ============================================
// Storage System
// ============================================

async function loadUserData() {
    try {
        const storageKey = `vip_mining_${userData.userId}`;
        const saved = localStorage.getItem(storageKey);
        
        if (saved) {
            const data = JSON.parse(saved);
            Object.assign(userData, {
                balance: data.balance || 100,
                referrals: data.referrals || 0,
                totalEarned: data.totalEarned || 100,
                rank: data.rank || 'Beginner',
                referralEarnings: data.referralEarnings || 0,
                lastMineTime: data.lastMineTime || 0,
                referralCode: data.referralCode || userData.referralCode,
                referredBy: data.referredBy || null
            });
            console.log("📂 Loaded local data");
        }
        
        if (db) {
            await loadUserFromFirebase();
        }
        
        saveUserData();
        
    } catch (error) {
        console.error("❌ Load error:", error);
    }
}

function saveUserData() {
    try {
        const storageKey = `vip_mining_${userData.userId}`;
        const dataToSave = {
            balance: userData.balance,
            referrals: userData.referrals,
            totalEarned: userData.totalEarned,
            rank: userData.rank,
            referralEarnings: userData.referralEarnings,
            lastMineTime: userData.lastMineTime,
            referralCode: userData.referralCode,
            referredBy: userData.referredBy,
            userId: userData.userId,
            username: userData.username,
            firstName: userData.firstName,
            saveTime: Date.now()
        };
        
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        
        if (db) {
            saveUserToFirebase();
        }
        
        console.log("💾 Data saved");
    } catch (error) {
        console.error("❌ Save error:", error);
    }
}

// ============================================
// Firebase Integration
// ============================================

async function syncUserWithFirebase() {
    if (!db) return;
    
    try {
        const userRef = db.collection('users').doc(userData.userId);
        const userSnap = await userRef.get();
        
        if (!userSnap.exists) {
            await userRef.set({
                userId: userData.userId,
                username: userData.username,
                firstName: userData.firstName,
                referralCode: userData.referralCode,
                referredBy: userData.referredBy || null,
                balance: userData.balance,
                referrals: userData.referrals,
                referralEarnings: userData.referralEarnings,
                totalEarned: userData.totalEarned,
                rank: userData.rank,
                lastMineTime: userData.lastMineTime || 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log("🔥 Created user in Firebase");
        } else {
            await userRef.update({
                lastActive: firebase.firestore.FieldValue.serverTimestamp(),
                username: userData.username,
                firstName: userData.firstName,
                balance: userData.balance
            });
        }
    } catch (error) {
        console.error("❌ Firebase sync error:", error);
    }
}

async function loadUserFromFirebase() {
    if (!db) return;
    
    try {
        const userRef = db.collection('users').doc(userData.userId);
        const userSnap = await userRef.get();
        
        if (userSnap.exists) {
            const firebaseData = userSnap.data();
            
            userData.balance = firebaseData.balance || userData.balance;
            userData.referrals = firebaseData.referrals || userData.referrals;
            userData.referralEarnings = firebaseData.referralEarnings || userData.referralEarnings;
            userData.totalEarned = firebaseData.totalEarned || userData.totalEarned;
            userData.rank = firebaseData.rank || userData.rank;
            userData.referredBy = firebaseData.referredBy || userData.referredBy;
            
            if (!userData.referralCode && firebaseData.referralCode) {
                userData.referralCode = firebaseData.referralCode;
            }
            
            console.log("🔥 Loaded data from Firebase");
        }
    } catch (error) {
        console.error("❌ Firebase load error:", error);
    }
}

function saveUserToFirebase() {
    if (!db) return;
    
    try {
        const userRef = db.collection('users').doc(userData.userId);
        
        userRef.set({
            userId: userData.userId,
            username: userData.username,
            firstName: userData.firstName,
            referralCode: userData.referralCode,
            referredBy: userData.referredBy,
            balance: userData.balance,
            referrals: userData.referrals,
            referralEarnings: userData.referralEarnings,
            totalEarned: userData.totalEarned,
            rank: userData.rank,
            lastMineTime: userData.lastMineTime,
            lastActive: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(() => {
            console.log("🔥 Saved to Firebase");
        }).catch(error => {
            console.error("❌ Firebase save error:", error);
        });
        
    } catch (error) {
        console.error("❌ Firebase save error:", error);
    }
}

// ============================================
// Mining System
// ============================================

function minePoints() {
    console.log("⛏️ Mining points...");
    
    if (!userData.userId) {
        showMessage('Please wait for user setup to complete', 'error');
        return;
    }
    
    const now = Date.now();
    const timeSinceLastMine = now - userData.lastMineTime;
    
    if (timeSinceLastMine < CONFIG.MINE_COOLDOWN) {
        const secondsLeft = Math.ceil((CONFIG.MINE_COOLDOWN - timeSinceLastMine) / 1000);
        showMessage(`⏳ Wait ${secondsLeft} seconds`, 'warning');
        return;
    }
    
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
    const reward = currentRank.reward;
    
    userData.balance += reward;
    userData.totalEarned += reward;
    userData.lastMineTime = now;
    
    saveUserData();
    updateUI();
    animateMineButton(reward);
    
    showMessage(`⛏️ +${reward} points!`, 'success');
    checkRankUp();
}

function animateMineButton(reward) {
    const btn = elements.mineBtn;
    if (!btn) return;
    
    const originalHTML = btn.innerHTML;
    
    btn.innerHTML = `
        <div class="mine-icon">
            <i class="fas fa-hammer"></i>
        </div>
        <div class="mine-text">
            <div class="mine-title">Mined!</div>
            <div class="mine-reward">+${reward} points</div>
        </div>
        <div class="mine-cooldown" id="cooldownTimer">5s</div>
    `;
    
    btn.disabled = true;
    btn.style.opacity = '0.7';
    
    let secondsLeft = 5;
    
    const updateTimer = () => {
        const timerElement = btn.querySelector('.mine-cooldown');
        if (timerElement) {
            timerElement.textContent = `${secondsLeft}s`;
        }
        
        secondsLeft--;
        
        if (secondsLeft >= 0) {
            setTimeout(updateTimer, 1000);
        } else {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.innerHTML = originalHTML;
            btn.addEventListener('click', minePoints);
        }
    };
    
    updateTimer();
}

// ============================================
// Referral System
// ============================================

function setupEventListeners() {
    console.log("🎯 Setting up event listeners...");
    
    if (elements.mineBtn) {
        elements.mineBtn.addEventListener('click', minePoints);
        console.log("✅ Mine button listener added");
    }
    
    if (elements.copyBtn) {
        elements.copyBtn.addEventListener('click', copyReferralLink);
        console.log("✅ Copy button listener added");
    }
    
    if (elements.shareBtn) {
        elements.shareBtn.addEventListener('click', shareOnTelegram);
        console.log("✅ Share button listener added");
    }
    
    if (elements.whatsappBtn) {
        elements.whatsappBtn.addEventListener('click', shareOnWhatsApp);
        console.log("✅ WhatsApp button listener added");
    }
}

function copyReferralLink() {
    const refLink = elements.referralLink ? elements.referralLink.value : 
                   `https://t.me/VIPMainingPROBot?start=${userData.referralCode}`;
    
    navigator.clipboard.writeText(refLink)
        .then(() => {
            showMessage('✅ Link copied', 'success');
            if (elements.copyBtn) {
                elements.copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    elements.copyBtn.innerHTML = '<i class="far fa-copy"></i>';
                }, 2000);
            }
        })
        .catch(err => {
            console.error('Copy error:', err);
            showMessage('❌ Failed to copy', 'error');
        });
}

function shareOnTelegram() {
    const refLink = elements.referralLink ? elements.referralLink.value : 
                   `https://t.me/VIPMainingPROBot?start=${userData.referralCode}`;
    
    const shareText = `Join me on VIP Mining and earn free points! 🪙\n\nUse my referral link to get extra rewards:\n${refLink}\n\n@VIPMainingPROBot`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`;
    
    window.open(shareUrl, '_blank');
    showMessage('📱 Opening Telegram...', 'info');
}

function shareOnWhatsApp() {
    const refLink = elements.referralLink ? elements.referralLink.value : 
                   `https://t.me/VIPMainingPROBot?start=${userData.referralCode}`;
    
    const shareText = `Join me on VIP Mining and earn free points! 🪙\n\nReferral link: ${refLink}`;
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    
    window.open(shareUrl, '_blank');
    showMessage('💚 Opening WhatsApp...', 'info');
}

function checkForReferral() {
    // Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const referrerCode = urlParams.get('ref') || urlParams.get('start');
    
    // Check Telegram start parameter
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) {
        const telegramRef = tg.initDataUnsafe.start_param;
        if (telegramRef && telegramRef !== userData.referralCode) {
            console.log("Telegram referral detected:", telegramRef);
            processReferral(telegramRef);
        }
    }
    
    // Check URL parameter
    if (referrerCode && referrerCode !== userData.referralCode) {
        console.log("URL referral detected:", referrerCode);
        processReferral(referrerCode);
    }
}

// ============================================
// UI Updates
// ============================================

function updateUI() {
    console.log("🔄 Updating UI...");
    
    // Update numbers
    if (elements.balance) {
        elements.balance.textContent = userData.balance.toLocaleString();
    }
    
    if (elements.referrals) {
        elements.referrals.textContent = `${userData.referrals} Referrals`;
    }
    
    if (elements.totalEarned) {
        elements.totalEarned.textContent = `${userData.totalEarned.toLocaleString()} Total`;
    }
    
    // Update rank
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
    if (elements.rankBadge) {
        elements.rankBadge.textContent = userData.rank;
    }
    
    // Update mining info
    if (elements.rewardAmount) {
        elements.rewardAmount.textContent = currentRank.reward;
    }
    
    if (elements.miningPower) {
        elements.miningPower.innerHTML = `<i class="fas fa-bolt"></i> Power: ${currentRank.power}`;
    }
    
    // Update referral statistics
    if (elements.refCount) {
        elements.refCount.textContent = userData.referrals;
    }
    
    if (elements.refEarned) {
        elements.refEarned.textContent = userData.referralEarnings.toLocaleString();
    }
    
    if (elements.refRank) {
        elements.refRank.textContent = userData.rank;
    }
    
    // Update progress bar
    updateProgress();
    
    // Update referral link
    updateReferralLink();
}

function updateProgress() {
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
    const nextRank = CONFIG.RANKS[CONFIG.RANKS.indexOf(currentRank) + 1];
    
    if (nextRank) {
        const progress = ((userData.totalEarned - currentRank.min) / (nextRank.min - currentRank.min)) * 100;
        const clampedProgress = Math.min(progress, 100);
        
        if (elements.progressFill) {
            elements.progressFill.style.width = `${clampedProgress}%`;
        }
        
        if (elements.nextRank) {
            elements.nextRank.textContent = `Next: ${nextRank.name} (${nextRank.min.toLocaleString()} points)`;
        }
        
        if (elements.currentPoints) {
            elements.currentPoints.textContent = userData.totalEarned.toLocaleString();
        }
        
        if (elements.targetPoints) {
            elements.targetPoints.textContent = nextRank.min.toLocaleString();
        }
        
        if (elements.remainingPoints) {
            elements.remainingPoints.textContent = Math.max(0, nextRank.min - userData.totalEarned).toLocaleString();
        }
    } else {
        if (elements.progressFill) elements.progressFill.style.width = '100%';
        if (elements.nextRank) elements.nextRank.textContent = 'Highest Rank! 🏆';
        if (elements.remainingPoints) elements.remainingPoints.textContent = '0';
    }
}

function checkRankUp() {
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank);
    const newRank = CONFIG.RANKS.find(r => 
        userData.totalEarned >= r.min && userData.totalEarned <= r.max
    );
    
    if (newRank && newRank.name !== userData.rank) {
        const oldRank = userData.rank;
        userData.rank = newRank.name;
        saveUserData();
        updateUI();
        showMessage(`🏆 Rank Up! ${oldRank} → ${newRank.name}`, 'success');
    }
}

function updateConnectionStatus() {
    if (elements.connectionStatus) {
        if (db) {
            elements.connectionStatus.textContent = '🟢 Connected to Firebase';
            elements.connectionStatus.style.color = '#22c55e';
        } else {
            elements.connectionStatus.textContent = '🟡 Local Storage Only';
            elements.connectionStatus.style.color = '#f59e0b';
        }
    }
}

// ============================================
// Utility Functions
// ============================================

function showMessage(text, type = 'info') {
    console.log(`💬 ${type.toUpperCase()}: ${text}`);
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                         type === 'error' ? 'exclamation-circle' : 
                         type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${text}</span>
    `;
    
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: ${type === 'success' ? '#10b981' : 
                     type === 'error' ? '#ef4444' : 
                     type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        padding: 12px 24px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 1000;
        opacity: 0;
        transition: all 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        font-weight: 500;
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateX(-50%) translateY(-100px)';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
}

// ============================================
// Application Startup
// ============================================

// Auto-save every 30 seconds
setInterval(() => {
    if (userData.userId) {
        saveUserData();
    }
}, 30000);

// Check cooldown timer every second
setInterval(() => {
    if (userData.lastMineTime > 0) {
        const timeSinceLastMine = Date.now() - userData.lastMineTime;
        if (timeSinceLastMine < CONFIG.MINE_COOLDOWN) {
            const secondsLeft = Math.ceil((CONFIG.MINE_COOLDOWN - timeSinceLastMine) / 1000);
            if (elements.cooldownTimer) {
                elements.cooldownTimer.textContent = `${secondsLeft}s`;
            }
        } else {
            if (elements.cooldownTimer) {
                elements.cooldownTimer.textContent = '';
            }
        }
    }
}, 1000);

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Export for debugging
window.appData = userData;
window.appConfig = CONFIG;
window.appElements = elements;
window.showMessage = showMessage;
