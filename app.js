// ============================================
// VIP Mining Mini App - FINAL FIXED VERSION
// ============================================

// Telegram WebApp
let tg = null;
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

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCuzWYapa7LBRg40OzcHLWFBpfSrjEVQoU",
    authDomain: "vip-mining.firebaseapp.com",
    projectId: "vip-mining",
    storageBucket: "vip-mining.firebasestorage.app",
    messagingSenderId: "205041694428",
    appId: "1:205041694428:web:5b9a0ab2cc31b118d8be619"
};

// Initialize Firebase
let firebaseApp, db;
if (typeof firebase !== 'undefined') {
    try {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log("✅ Firebase initialized");
    } catch (error) {
        console.error("❌ Firebase error:", error);
    }
}

// User Data - SIMPLE and RELIABLE
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

// Configuration
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

// DOM Elements
const elements = {};

// ============================================
// SIMPLE STORAGE SYSTEM - FIXED
// ============================================

// Function to get storage key
function getStorageKey() {
    return `vip_mining_${userData.userId}`;
}

// Load user data - SIMPLE and RELIABLE
function loadUserData() {
    try {
        const storageKey = getStorageKey();
        const saved = localStorage.getItem(storageKey);
        
        if (saved) {
            const data = JSON.parse(saved);
            
            // ALWAYS load balance first
            userData.balance = parseInt(data.balance) || 100;
            userData.referrals = parseInt(data.referrals) || 0;
            userData.totalEarned = parseInt(data.totalEarned) || 100;
            userData.referralEarnings = parseInt(data.referralEarnings) || 0;
            userData.lastMineTime = parseInt(data.lastMineTime) || 0;
            
            // Load other data
            userData.rank = data.rank || 'Beginner';
            userData.referredBy = data.referredBy || null;
            
            if (data.referralCode) {
                userData.referralCode = data.referralCode;
            }
            
            if (data.username && data.username !== 'User') {
                userData.username = data.username;
            }
            
            console.log("📂 Loaded from localStorage:");
            console.log("- Balance:", userData.balance);
            console.log("- Referrals:", userData.referrals);
            console.log("- Total Earned:", userData.totalEarned);
            
            return true;
        }
        
        // If no saved data, save initial data
        saveUserData();
        return false;
        
    } catch (error) {
        console.error("❌ Load error:", error);
        return false;
    }
}

// Save user data - SIMPLE and RELIABLE
function saveUserData() {
    try {
        const storageKey = getStorageKey();
        
        // Prepare data for saving
        const dataToSave = {
            balance: parseInt(userData.balance),
            referrals: parseInt(userData.referrals),
            totalEarned: parseInt(userData.totalEarned),
            rank: userData.rank,
            referralEarnings: parseInt(userData.referralEarnings),
            lastMineTime: parseInt(userData.lastMineTime),
            referralCode: userData.referralCode,
            referredBy: userData.referredBy,
            userId: userData.userId,
            username: userData.username,
            firstName: userData.firstName,
            saveTime: Date.now()
        };
        
        // Save to localStorage
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        
        console.log("💾 Saved to localStorage:");
        console.log("- Balance:", dataToSave.balance);
        console.log("- Referrals:", dataToSave.referrals);
        
        // Also save to Firebase if available
        if (db) {
            saveUserToFirebase();
        }
        
        return true;
        
    } catch (error) {
        console.error("❌ Save error:", error);
        return false;
    }
}

// ============================================
// Application Initialization - SIMPLE
// ============================================

async function initApp() {
    console.log("🚀 Starting VIP Mining App...");
    
    try {
        // Setup user first
        await setupUser();
        
        // Cache DOM elements
        cacheElements();
        
        // Load user data (this will also save initial data if needed)
        loadUserData();
        
        // Setup event listeners
        setupEventListeners();
        
        // Update UI with loaded data
        updateUI();
        
        // Check for referrals
        checkForReferral();
        
        console.log("✅ App ready!");
        console.log("💰 Current balance:", userData.balance);
        console.log("👥 Current referrals:", userData.referrals);
        
        // Test: Verify data is loaded correctly
        const testKey = getStorageKey();
        const testData = localStorage.getItem(testKey);
        console.log("🧪 Storage test:", testData ? "Data exists" : "No data");
        
    } catch (error) {
        console.error("❌ Initialization error:", error);
        showMessage('Error starting app. Please refresh.', 'error');
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
// User Management - SIMPLE
// ============================================

async function setupUser() {
    console.log("👤 Setting up user...");
    
    let telegramUser = null;
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        telegramUser = tg.initDataUnsafe.user;
        console.log("📱 Telegram user found");
    }
    
    if (telegramUser) {
        userData.userId = telegramUser.id.toString();
        userData.username = telegramUser.username ? `@${telegramUser.username}` : 
                           telegramUser.first_name ? telegramUser.first_name : 
                           `User${telegramUser.id.toString().slice(-4)}`;
        userData.firstName = telegramUser.first_name || 'User';
    } else {
        // Generate a stable user ID
        let savedUserId = localStorage.getItem('vip_mining_user_id');
        if (!savedUserId) {
            savedUserId = 'user_' + Date.now();
            localStorage.setItem('vip_mining_user_id', savedUserId);
        }
        userData.userId = savedUserId;
    }
    
    // Generate referral code if not exists
    if (!userData.referralCode) {
        userData.referralCode = generateReferralCode(userData.userId);
        console.log("🔗 Generated referral code:", userData.referralCode);
    }
    
    // Update UI
    updateUserUI();
    
    // Sync with Firebase if available
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
    if (elements.username) {
        elements.username.textContent = userData.username;
    }
    
    if (elements.userId) {
        elements.userId.textContent = `ID: ${userData.userId.slice(-8)}`;
    }
    
    if (elements.userAvatar) {
        const firstChar = userData.firstName.charAt(0).toUpperCase();
        elements.userAvatar.textContent = firstChar;
    }
    
    updateReferralLink();
}

// ============================================
// Referral Link System
// ============================================

function generateReferralLink() {
    if (userData.referralCode) {
        return `https://t.me/VIPMainingPROBot/PRO?startapp=${userData.referralCode}`;
    }
    return 'https://t.me/VIPMainingPROBot/PRO';
}

function updateReferralLink() {
    const refLink = generateReferralLink();
    
    if (elements.referralLink) {
        elements.referralLink.value = refLink;
    }
}

// ============================================
// Firebase Integration (Optional)
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
                balance: userData.balance,
                referrals: userData.referrals,
                totalEarned: userData.totalEarned,
                rank: userData.rank,
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log("🔥 Created user in Firebase");
        }
    } catch (error) {
        console.error("❌ Firebase sync error:", error);
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
            balance: userData.balance,
            referrals: userData.referrals,
            totalEarned: userData.totalEarned,
            rank: userData.rank,
            lastActive: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log("🔥 Saved to Firebase");
    } catch (error) {
        console.error("❌ Firebase save error:", error);
    }
}

// ============================================
// Referral Processing
// ============================================

function checkForReferral() {
    // Check Telegram start parameter
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) {
        const telegramRef = tg.initDataUnsafe.start_param;
        if (telegramRef && telegramRef !== userData.referralCode) {
            console.log("📱 Telegram referral detected:", telegramRef);
            processReferral(telegramRef);
            return;
        }
    }
    
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const referrerCode = urlParams.get('startapp') || urlParams.get('ref') || urlParams.get('start');
    
    if (referrerCode && referrerCode !== userData.referralCode) {
        console.log("🔗 URL referral detected:", referrerCode);
        processReferral(referrerCode);
    }
}

async function processReferral(referralCode) {
    if (!referralCode || referralCode === userData.referralCode) {
        return;
    }
    
    if (userData.referredBy) {
        console.log("User already referred");
        return;
    }
    
    console.log("Processing referral:", referralCode);
    
    // Update local data
    userData.referredBy = referralCode;
    userData.referrals += 1;
    userData.balance += CONFIG.REFERRER_REWARD;
    userData.totalEarned += CONFIG.REFERRER_REWARD;
    userData.referralEarnings += CONFIG.REFERRER_REWARD;
    
    console.log("New balance:", userData.balance);
    console.log("New referrals:", userData.referrals);
    
    // Save immediately
    saveUserData();
    
    // Update UI
    updateUI();
    
    // Show success message
    showMessage(`🎉 Referral successful! +${CONFIG.REFERRER_REWARD} points`, 'success');
    
    // Update Firebase if available
    if (db) {
        try {
            const usersRef = db.collection('users');
            const querySnapshot = await usersRef.where('referralCode', '==', referralCode).get();
            
            if (!querySnapshot.empty) {
                const referrerDoc = querySnapshot.docs[0];
                await referrerDoc.ref.update({
                    referrals: firebase.firestore.FieldValue.increment(1),
                    balance: firebase.firestore.FieldValue.increment(CONFIG.REFERRER_REWARD),
                    totalEarned: firebase.firestore.FieldValue.increment(CONFIG.REFERRER_REWARD)
                });
                
                // Log referral event
                await db.collection('referrals').add({
                    referrerId: referrerDoc.data().userId,
                    referredId: userData.userId,
                    reward: CONFIG.REFERRER_REWARD,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (error) {
            console.error("Firebase referral error:", error);
        }
    }
}

// ============================================
// Mining System - SIMPLE and RELIABLE
// ============================================

function minePoints() {
    console.log("⛏️ Mining points...");
    
    if (!userData.userId) {
        showMessage('Please wait for user setup', 'error');
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
    
    // Update balance
    userData.balance += reward;
    userData.totalEarned += reward;
    userData.lastMineTime = now;
    
    console.log("💰 New mining balance:", userData.balance);
    
    // SAVE IMMEDIATELY
    saveUserData();
    
    // Update UI
    updateUI();
    
    // Animate button
    animateMineButton(reward);
    
    // Show message
    showMessage(`⛏️ +${reward} points!`, 'success');
    
    // Check rank up
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
// Event Listeners
// ============================================

function setupEventListeners() {
    // Mine button
    if (elements.mineBtn) {
        elements.mineBtn.addEventListener('click', minePoints);
    }
    
    // Copy referral link
    if (elements.copyBtn) {
        elements.copyBtn.addEventListener('click', () => {
            const refLink = generateReferralLink();
            navigator.clipboard.writeText(refLink)
                .then(() => {
                    showMessage('✅ Link copied!', 'success');
                    elements.copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        elements.copyBtn.innerHTML = '<i class="far fa-copy"></i>';
                    }, 2000);
                })
                .catch(err => {
                    console.error('Copy error:', err);
                    showMessage('❌ Failed to copy', 'error');
                });
        });
    }
    
    // Share on Telegram
    if (elements.shareBtn) {
        elements.shareBtn.addEventListener('click', () => {
            const refLink = generateReferralLink();
            const shareText = `🚀 Join VIP Mining!\n\n⛏️ Mine points every 5 seconds\n👥 Get +25 bonus points\n\n${refLink}`;
            const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`;
            window.open(shareUrl, '_blank');
            showMessage('📱 Opening Telegram...', 'info');
        });
    }
    
    // Share on WhatsApp
    if (elements.whatsappBtn) {
        elements.whatsappBtn.addEventListener('click', () => {
            const refLink = generateReferralLink();
            const shareText = `Join VIP Mining! 🪙\n\n${refLink}`;
            const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
            window.open(shareUrl, '_blank');
            showMessage('💚 Opening WhatsApp...', 'info');
        });
    }
}

// ============================================
// UI Updates - SIMPLE and CLEAR
// ============================================

function updateUI() {
    // Update main balance (TOP)
    if (elements.balance) {
        elements.balance.textContent = userData.balance;
    }
    
    // Update referrals count (TOP)
    if (elements.referrals) {
        elements.referrals.textContent = `${userData.referrals} Referrals`;
    }
    
    // Update total earned (TOP)
    if (elements.totalEarned) {
        elements.totalEarned.textContent = `${userData.totalEarned} Total`;
    }
    
    // Update rank badge (TOP)
    if (elements.rankBadge) {
        elements.rankBadge.textContent = userData.rank;
    }
    
    // Update mining info
    if (elements.rewardAmount) {
        const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
        elements.rewardAmount.textContent = currentRank.reward;
    }
    
    if (elements.miningPower) {
        const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
        elements.miningPower.innerHTML = `<i class="fas fa-bolt"></i> Power: ${currentRank.power}`;
    }
    
    // Update referral stats (BOTTOM)
    if (elements.refCount) {
        elements.refCount.textContent = userData.referrals;
    }
    
    if (elements.refEarned) {
        elements.refEarned.textContent = userData.referralEarnings;
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
            elements.nextRank.textContent = `Next: ${nextRank.name} (${nextRank.min} points)`;
        }
        
        if (elements.currentPoints) {
            elements.currentPoints.textContent = userData.totalEarned;
        }
        
        if (elements.targetPoints) {
            elements.targetPoints.textContent = nextRank.min;
        }
        
        if (elements.remainingPoints) {
            elements.remainingPoints.textContent = Math.max(0, nextRank.min - userData.totalEarned);
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

// ============================================
// Utility Functions
// ============================================

function showMessage(text, type = 'info') {
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

// Auto-save every 10 seconds for safety
setInterval(() => {
    if (userData.userId) {
        saveUserData();
    }
}, 10000);

// Check cooldown timer
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

// Initialize app
document.addEventListener('DOMContentLoaded', initApp);

// Export for debugging
window.userData = userData;
window.saveUserData = saveUserData;
window.loadUserData = loadUserData;
