// ============================================
// VIP Mining Mini App - PROFESSIONAL FIXED VERSION
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

// User Data - Initialize properly
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
// Application Initialization - FIXED ORDER
// ============================================

async function initApp() {
    console.log("🚀 Starting VIP Mining App...");
    
    try {
        // STEP 1: Setup user FIRST
        await setupUser();
        
        // STEP 2: Load saved data SECOND
        await loadUserData();
        
        // STEP 3: Cache DOM elements
        cacheElements();
        
        // STEP 4: Update user UI with loaded data
        updateUserUI();
        
        // STEP 5: Setup event listeners
        setupEventListeners();
        
        // STEP 6: Update main UI
        updateUI();
        
        // STEP 7: Check for referrals
        checkForReferral();
        
        console.log("✅ App initialized successfully!");
        console.log("👤 User:", userData.username);
        console.log("💰 Balance:", userData.balance);
        console.log("👥 Referrals:", userData.referrals);
        
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
        if (elements[id]) {
            console.log(`✅ Element found: ${id}`);
        } else {
            console.warn(`⚠️ Element not found: ${id}`);
        }
    });
}

// ============================================
// User Management - FIXED
// ============================================

async function setupUser() {
    console.log("👤 Setting up user...");
    
    // Get Telegram user
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
        // Fallback for non-Telegram users
        const savedUserId = localStorage.getItem('vip_mining_user_id');
        userData.userId = savedUserId || 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        userData.username = 'Guest User';
        userData.firstName = 'Guest';
        
        if (!savedUserId) {
            localStorage.setItem('vip_mining_user_id', userData.userId);
        }
    }
    
    // Generate referral code if not exists
    if (!userData.referralCode) {
        userData.referralCode = generateReferralCode(userData.userId);
        console.log("🔗 Generated referral code:", userData.referralCode);
    }
    
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

// ============================================
// User UI Update - FIXED
// ============================================

function updateUserUI() {
    console.log("🎨 Updating user UI...");
    console.log("Username to display:", userData.username);
    console.log("User ID to display:", userData.userId);
    
    // Update username
    if (elements.username) {
        elements.username.textContent = userData.username;
        console.log("✅ Username element updated:", elements.username.textContent);
    } else {
        console.error("❌ Username element not found!");
    }
    
    // Update user ID
    if (elements.userId) {
        elements.userId.textContent = `ID: ${userData.userId?.slice(-8) || '---'}`;
        console.log("✅ User ID element updated:", elements.userId.textContent);
    } else {
        console.error("❌ User ID element not found!");
    }
    
    // Update avatar
    if (elements.userAvatar) {
        const firstChar = userData.firstName?.charAt(0).toUpperCase() || 'U';
        elements.userAvatar.textContent = firstChar;
        elements.userAvatar.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
        console.log("✅ Avatar updated:", firstChar);
    }
    
    // Update referral link
    updateReferralLink();
}

// ============================================
// Storage System - INSTANT SAVE
// ============================================

async function loadUserData() {
    try {
        const storageKey = `vip_mining_${userData.userId}`;
        const saved = localStorage.getItem(storageKey);
        
        if (saved) {
            const data = JSON.parse(saved);
            
            // Load all user data
            userData.balance = Number(data.balance) || 100;
            userData.referrals = Number(data.referrals) || 0;
            userData.totalEarned = Number(data.totalEarned) || 100;
            userData.rank = data.rank || 'Beginner';
            userData.referralEarnings = Number(data.referralEarnings) || 0;
            userData.lastMineTime = Number(data.lastMineTime) || 0;
            userData.referredBy = data.referredBy || null;
            
            // Preserve referral code
            if (data.referralCode) {
                userData.referralCode = data.referralCode;
            }
            
            // Load username if saved
            if (data.username && data.username !== 'User') {
                userData.username = data.username;
            }
            
            console.log("📂 Loaded saved data:");
            console.log("- Balance:", userData.balance);
            console.log("- Referrals:", userData.referrals);
            console.log("- Username:", userData.username);
        }
        
        // Load from Firebase if available
        if (db) {
            await loadUserFromFirebase();
        }
        
        // Save initial data if first time
        saveUserData();
        
    } catch (error) {
        console.error("❌ Load error:", error);
    }
}

function saveUserData() {
    try {
        if (!userData.userId) {
            console.error("❌ Cannot save: No user ID");
            return;
        }
        
        const storageKey = `vip_mining_${userData.userId}`;
        const dataToSave = {
            balance: Number(userData.balance),
            referrals: Number(userData.referrals),
            totalEarned: Number(userData.totalEarned),
            rank: userData.rank,
            referralEarnings: Number(userData.referralEarnings),
            lastMineTime: Number(userData.lastMineTime),
            referralCode: userData.referralCode,
            referredBy: userData.referredBy,
            userId: userData.userId,
            username: userData.username,
            firstName: userData.firstName,
            saveTime: Date.now()
        };
        
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        
        console.log("💾 Data saved INSTANTLY:");
        console.log("- Balance:", dataToSave.balance);
        console.log("- Referrals:", dataToSave.referrals);
        console.log("- Username:", dataToSave.username);
        
        // Save to Firebase if available
        if (db) {
            saveUserToFirebase();
        }
        
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
                balance: userData.balance,
                referrals: userData.referrals
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
            
            // Update from Firebase
            if (firebaseData.balance !== undefined) {
                userData.balance = Number(firebaseData.balance);
            }
            if (firebaseData.referrals !== undefined) {
                userData.referrals = Number(firebaseData.referrals);
            }
            if (firebaseData.username) {
                userData.username = firebaseData.username;
            }
            
            console.log("🔥 Loaded from Firebase");
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
// Referral Processing
// ============================================

function checkForReferral() {
    console.log("🔍 Checking for referral...");
    
    // Check Telegram start parameter
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) {
        const telegramRef = tg.initDataUnsafe.start_param;
        if (telegramRef && telegramRef !== userData.referralCode) {
            console.log("📱 Telegram referral detected:", telegramRef);
            processReferral(telegramRef);
            return;
        }
    }
    
    // Check URL parameter
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
        console.log("⚠️ User already referred by:", userData.referredBy);
        return;
    }
    
    console.log("🎯 Processing referral:", referralCode);
    
    try {
        // Find referrer in Firebase
        if (db) {
            const usersRef = db.collection('users');
            const querySnapshot = await usersRef.where('referralCode', '==', referralCode).get();
            
            if (!querySnapshot.empty) {
                const referrerDoc = querySnapshot.docs[0];
                const referrerData = referrerDoc.data();
                
                // Prevent self-referral
                if (referrerData.userId === userData.userId) {
                    console.log("⚠️ Cannot refer yourself");
                    return;
                }
                
                // Update referrer's data
                await referrerDoc.ref.update({
                    referrals: firebase.firestore.FieldValue.increment(1),
                    referralEarnings: firebase.firestore.FieldValue.increment(CONFIG.REFERRER_REWARD),
                    balance: firebase.firestore.FieldValue.increment(CONFIG.REFERRER_REWARD),
                    totalEarned: firebase.firestore.FieldValue.increment(CONFIG.REFERRER_REWARD)
                });
                
                // Update current user
                userData.referredBy = referralCode;
            }
        }
        
        // Update user data
        userData.referrals += 1;
        userData.balance += CONFIG.REFERRER_REWARD;
        userData.totalEarned += CONFIG.REFERRER_REWARD;
        userData.referralEarnings += CONFIG.REFERRER_REWARD;
        
        // SAVE INSTANTLY
        saveUserData();
        
        // Update UI
        updateUI();
        
        // Show success message
        showMessage(`🎉 Referral successful! +${CONFIG.REFERRER_REWARD} points`, 'success');
        
        console.log("✅ Referral processed");
        
    } catch (error) {
        console.error("❌ Referral processing error:", error);
        showMessage('Error processing referral', 'error');
    }
}

// ============================================
// Mining System - INSTANT SAVE
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
    
    console.log("💰 New balance:", userData.balance);
    
    // SAVE INSTANTLY
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
        <div class="mine-cooldown">5s</div>
    `;
    
    btn.disabled = true;
    btn.style.opacity = '0.7';
    
    let secondsLeft = 5;
    const interval = setInterval(() => {
        secondsLeft--;
        const timer = btn.querySelector('.mine-cooldown');
        if (timer) timer.textContent = `${secondsLeft}s`;
        
        if (secondsLeft <= 0) {
            clearInterval(interval);
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.innerHTML = originalHTML;
        }
    }, 1000);
}

// ============================================
// Event Listeners
// ============================================

function setupEventListeners() {
    console.log("🎯 Setting up event listeners...");
    
    // Mine button
    if (elements.mineBtn) {
        elements.mineBtn.addEventListener('click', minePoints);
        console.log("✅ Mine button listener added");
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
        console.log("✅ Copy button listener added");
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
        console.log("✅ Telegram share button added");
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
        console.log("✅ WhatsApp share button added");
    }
}

// ============================================
// UI Updates
// ============================================

function updateUI() {
    console.log("🔄 Updating UI...");
    
    // Update main balance
    if (elements.balance) {
        elements.balance.textContent = userData.balance;
    }
    
    // Update referrals count
    if (elements.referrals) {
        elements.referrals.textContent = `${userData.referrals} Referrals`;
    }
    
    // Update total earned
    if (elements.totalEarned) {
        elements.totalEarned.textContent = `${userData.totalEarned} Total`;
    }
    
    // Update rank badge
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
    
    // Update referral stats
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
        
        // Save instantly
        saveUserData();
        
        // Update UI
        updateUI();
        
        // Show message
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

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM loaded, starting app...");
    setTimeout(initApp, 100);
});

// If page already loaded
if (document.readyState === 'complete') {
    console.log("⚡ Page already loaded, starting app...");
    setTimeout(initApp, 200);
}

// Export for debugging
window.userData = userData;
window.showMessage = showMessage;
window.generateReferralLink = generateReferralLink;
window.saveUserData = saveUserData;
window.loadUserData = loadUserData;
