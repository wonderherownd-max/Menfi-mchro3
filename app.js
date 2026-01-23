// ============================================
// VIP Mining Mini App - FINAL WORKING VERSION
// ============================================

// Telegram WebApp
let tg = null;
try {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
} catch (e) {
    console.log("Not in Telegram environment");
}

// User data - starts with 100 points
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
    referredBy: null
};

// DOM Elements
const elements = {
    balance: document.getElementById('balance'),
    referrals: document.getElementById('referrals'),
    totalEarned: document.getElementById('totalEarned'),
    rank: document.getElementById('rank'),
    rankBadge: document.getElementById('rankBadge'),
    userInfo: document.getElementById('userInfo'),
    username: document.getElementById('username'),
    userId: document.getElementById('userId'),
    userAvatar: document.getElementById('userAvatar'),
    mineBtn: document.getElementById('mineBtn'),
    rewardAmount: document.getElementById('rewardAmount'),
    referralLink: document.getElementById('referralLink'),
    copyBtn: document.getElementById('copyBtn'),
    miningPower: document.getElementById('miningPower'),
    refCount: document.getElementById('refCount'),
    refEarned: document.getElementById('refEarned'),
    refRank: document.getElementById('refRank'),
    progressFill: document.getElementById('progressFill'),
    nextRank: document.getElementById('nextRank'),
    currentPoints: document.getElementById('currentPoints'),
    targetPoints: document.getElementById('targetPoints'),
    remainingPoints: document.getElementById('remainingPoints'),
    connectionStatus: document.getElementById('connectionStatus'),
    cooldownTimer: document.getElementById('cooldownTimer'),
    referralBalance: document.getElementById('referralBalance'),
    totalReferrals: document.getElementById('totalReferrals')
};

// Configuration
const CONFIG = {
    MINE_COOLDOWN: 5000, // 5 seconds
    REFERRAL_REWARD: 25, // Referral reward points
    REFERRER_REWARD: 10, // Points for referrer when someone uses their code
    
    RANKS: [
        { name: 'Beginner', min: 0, max: 199, reward: 1, power: '10/hour' },
        { name: 'Professional', min: 200, max: 499, reward: 2, power: '25/hour' },
        { name: 'Expert', min: 500, max: 999, reward: 3, power: '50/hour' },
        { name: 'VIP', min: 1000, max: 9999, reward: 5, power: '100/hour' },
        { name: 'Legend', min: 10000, max: Infinity, reward: 10, power: '200/hour' }
    ],
    
    FIREBASE_CONFIG: {
        apiKey: "AIzaSyCuzWYapa7LBRg40OzcHLWFBpfSrjEVQoU",
        authDomain: "vip-mining.firebaseapp.com",
        projectId: "vip-mining",
        storageBucket: "vip-mining.firebasestorage.app",
        messagingSenderId: "205041694428",
        appId: "1:205041694428:web:5b9a0ab2cc31b118d8be619"
    }
};

// Firebase initialization
let firebaseApp, db;
if (typeof firebase !== 'undefined') {
    firebaseApp = firebase.initializeApp(CONFIG.FIREBASE_CONFIG);
    db = firebase.firestore();
}

// ============================================
// Initialize Application
// ============================================

async function initApp() {
    console.log("🚀 Starting VIP Mining App...");
    
    try {
        // Setup user
        await setupUser();
        
        // Load user data (localStorage first, then sync with Firebase if available)
        await loadUserData();
        
        // Setup event listeners
        setupEventListeners();
        
        // Update UI
        updateUI();
        
        // Update connection status
        if (elements.connectionStatus) {
            elements.connectionStatus.textContent = '🟢 Connected';
            elements.connectionStatus.style.color = '#10b981';
        }
        
        console.log("✅ App ready");
        
    } catch (error) {
        console.error("❌ Error:", error);
        showMessage('An error occurred, retrying...', 'error');
        setTimeout(initApp, 2000);
    }
}

async function setupUser() {
    // Check Telegram WebApp
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const tgUser = tg.initDataUnsafe.user;
        userData.userId = tgUser.id.toString();
        userData.username = tgUser.username ? `@${tgUser.username}` : `User${tgUser.id.toString().slice(-4)}`;
        userData.firstName = tgUser.first_name || 'User';
        
        // Check for referral parameter
        const startParam = tg.initDataUnsafe.start_param;
        if (startParam) {
            await processReferral(startParam);
        }
        
        // Generate referral code if not exists
        if (!userData.referralCode) {
            userData.referralCode = generateReferralCode(userData.userId);
        }
        
        // Update UI
        if (elements.username) elements.username.textContent = userData.username;
        if (elements.userId) elements.userId.textContent = `ID: ${userData.userId}`;
        if (elements.userInfo) elements.userInfo.textContent = `Welcome, ${userData.firstName}`;
        if (elements.userAvatar) {
            elements.userAvatar.textContent = userData.firstName.charAt(0).toUpperCase();
            elements.userAvatar.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
        }
        
        // Hide demo controls if exists
        const demoControls = document.getElementById('demoControls');
        if (demoControls) demoControls.style.display = 'none';
        
        // Sync with Firebase if available
        if (db) {
            await syncUserWithFirebase();
        }
        
    } else {
        // Normal user mode (not in Telegram)
        userData.userId = 'user_' + Date.now();
        userData.username = 'New User';
        userData.firstName = 'User';
        userData.referralCode = generateReferralCode(userData.userId);
        
        // Update UI
        if (elements.username) elements.username.textContent = userData.username;
        if (elements.userId) elements.userId.textContent = 'ID: ' + userData.userId.slice(-8);
        if (elements.userInfo) elements.userInfo.textContent = 'Welcome to VIP Mining';
        if (elements.userAvatar) {
            elements.userAvatar.textContent = 'U';
            elements.userAvatar.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
        }
    }
    
    // Update referral link
    updateReferralLink();
}

function generateReferralCode(userId) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const timestamp = Date.now().toString(36);
    const randomPart = Array.from({length: 4}, () => 
        chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
    
    return `${userId.slice(-3)}${randomPart}`.toUpperCase();
}

function updateReferralLink() {
    const refLink = generateReferralLink();
    if (elements.referralLink) {
        elements.referralLink.value = refLink;
    }
}

function generateReferralLink() {
    if (userData.referralCode) {
        return `https://t.me/VIPMainingPROBot?start=${userData.referralCode}`;
    }
    return 'https://t.me/VIPMainingPROBot';
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
            console.log("📂 Loaded saved data");
        }
        
        // Load from Firebase if available
        if (db) {
            await loadUserFromFirebase();
        }
        
        // Save to ensure consistency
        saveUserData();
        
    } catch (error) {
        console.error("❌ Load error:", error);
        // Default values
        userData.balance = 100;
        userData.totalEarned = 100;
        userData.referralCode = generateReferralCode(userData.userId);
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
            saveTime: Date.now()
        };
        
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        
        // Save to Firebase if available
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
            // Create new user in Firebase
            await userRef.set({
                userId: userData.userId,
                username: userData.username,
                firstName: userData.firstName || '',
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
            // Update last active time
            await userRef.update({
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
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
            
            // Merge Firebase data (prioritize Firebase for some fields)
            userData.balance = firebaseData.balance || userData.balance;
            userData.referrals = firebaseData.referrals || userData.referrals;
            userData.referralEarnings = firebaseData.referralEarnings || userData.referralEarnings;
            userData.totalEarned = firebaseData.totalEarned || userData.totalEarned;
            userData.rank = firebaseData.rank || userData.rank;
            userData.referredBy = firebaseData.referredBy || userData.referredBy;
            
            // Update referral code if not set
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
            firstName: userData.firstName || '',
            referralCode: userData.referralCode,
            referredBy: userData.referredBy,
            balance: userData.balance,
            referrals: userData.referrals,
            referralEarnings: userData.referralEarnings,
            totalEarned: userData.totalEarned,
            rank: userData.rank,
            lastMineTime: userData.lastMineTime,
            lastActive: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
    } catch (error) {
        console.error("❌ Firebase save error:", error);
    }
}

async function processReferral(referralCode) {
    if (!referralCode || referralCode === userData.referralCode) {
        return false;
    }
    
    // Check if already referred
    if (userData.referredBy) {
        console.log("⚠️ User already referred by:", userData.referredBy);
        return false;
    }
    
    try {
        if (db) {
            // Find referrer in Firebase
            const usersRef = db.collection('users');
            const querySnapshot = await usersRef.where('referralCode', '==', referralCode).get();
            
            if (!querySnapshot.empty) {
                const referrerDoc = querySnapshot.docs[0];
                const referrerData = referrerDoc.data();
                
                // Update referrer's data
                await referrerDoc.ref.update({
                    referrals: firebase.firestore.FieldValue.increment(1),
                    referralEarnings: firebase.firestore.FieldValue.increment(CONFIG.REFERRER_REWARD)
                });
                
                // Update current user
                userData.referredBy = referralCode;
                
                // Update referrer's data locally if it's the same user
                if (referrerData.userId === userData.userId) {
                    console.log("⚠️ Cannot refer yourself");
                    return false;
                }
                
                // Add reward to referrer (async)
                setTimeout(async () => {
                    if (db) {
                        await referrerDoc.ref.update({
                            balance: firebase.firestore.FieldValue.increment(CONFIG.REFERRER_REWARD),
                            totalEarned: firebase.firestore.FieldValue.increment(CONFIG.REFERRER_REWARD)
                        });
                    }
                }, 1000);
                
                // Log referral event
                await logReferralEvent(referrerData.userId, userData.userId, referralCode);
                
                console.log("✅ Referral processed successfully");
                return true;
            }
        } else {
            // Fallback to localStorage if Firebase not available
            userData.referredBy = referralCode;
            console.log("📝 Referral recorded (local storage only)");
        }
        
        return false;
    } catch (error) {
        console.error("❌ Referral processing error:", error);
        return false;
    }
}

async function logReferralEvent(referrerId, referredId, referralCode) {
    if (!db) return;
    
    try {
        await db.collection('referrals').add({
            referrerId: referrerId,
            referredId: referredId,
            referralCode: referralCode,
            reward: CONFIG.REFERRER_REWARD,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'completed'
        });
    } catch (error) {
        console.error("❌ Referral logging error:", error);
    }
}

// ============================================
// Mining System
// ============================================

function minePoints() {
    const now = Date.now();
    const timeSinceLastMine = now - userData.lastMineTime;
    
    // Check cooldown
    if (timeSinceLastMine < CONFIG.MINE_COOLDOWN) {
        const secondsLeft = Math.ceil((CONFIG.MINE_COOLDOWN - timeSinceLastMine) / 1000);
        showMessage(`⏳ Wait ${secondsLeft} seconds`, 'warning');
        return;
    }
    
    // Determine reward based on rank
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
    const reward = currentRank.reward;
    
    // Update user data
    userData.balance += reward;
    userData.totalEarned += reward;
    userData.lastMineTime = now;
    
    // Save and update
    saveUserData();
    updateUI();
    
    // Button animation
    animateMineButton(reward);
    
    // Success message
    showMessage(`⛏️ +${reward} points!`, 'success');
    
    // Check for rank upgrade
    checkRankUp();
}

function animateMineButton(reward) {
    const btn = elements.mineBtn;
    if (!btn) return;
    
    const originalHTML = btn.innerHTML;
    const originalText = btn.querySelector('.mine-text').innerHTML;
    
    // Change button text
    btn.querySelector('.mine-text').innerHTML = `
        <div class="mine-title">Mined!</div>
        <div class="mine-reward">+${reward} points</div>
    `;
    
    btn.disabled = true;
    btn.style.opacity = '0.7';
    
    // Countdown
    let secondsLeft = 5;
    
    const updateTimer = () => {
        if (elements.cooldownTimer) {
            elements.cooldownTimer.textContent = `${secondsLeft}s`;
        }
        
        secondsLeft--;
        
        if (secondsLeft >= 0) {
            setTimeout(updateTimer, 1000);
        } else {
            // Restore button
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.querySelector('.mine-text').innerHTML = originalText;
            if (elements.cooldownTimer) {
                elements.cooldownTimer.textContent = '';
            }
        }
    };
    
    updateTimer();
}

// ============================================
// Referral System
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
                    showMessage('✅ Link copied', 'success');
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
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const refLink = generateReferralLink();
            const shareText = `Join me on VIP Mining and earn free points! 🪙\n\nUse my referral link to get extra rewards:\n${refLink}\n\n@VIPMainingPROBot`;
            const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`;
            window.open(shareUrl, '_blank');
            showMessage('📱 Opening Telegram...', 'info');
        });
    }
    
    // Share on WhatsApp
    const whatsappBtn = document.getElementById('whatsappBtn');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', () => {
            const refLink = generateReferralLink();
            const shareText = `Join me on VIP Mining and earn free points! 🪙\n\nReferral link: ${refLink}`;
            const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
            window.open(shareUrl, '_blank');
            showMessage('💚 Opening WhatsApp...', 'info');
        });
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            updateUI();
            showMessage('🔄 Data refreshed', 'info');
        });
    }
}

// ============================================
// UI Updates
// ============================================

function updateUI() {
    // Update numbers
    if (elements.balance) elements.balance.textContent = userData.balance.toLocaleString();
    if (elements.referrals) elements.referrals.textContent = userData.referrals;
    if (elements.totalEarned) elements.totalEarned.textContent = userData.totalEarned.toLocaleString();
    
    // Update rank
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
    if (elements.rank) elements.rank.textContent = `Rank: ${userData.rank}`;
    if (elements.rankBadge) elements.rankBadge.textContent = userData.rank;
    if (elements.refRank) elements.refRank.textContent = userData.rank;
    
    // Update mining info
    if (elements.rewardAmount) elements.rewardAmount.textContent = currentRank.reward;
    if (elements.miningPower) elements.miningPower.innerHTML = `<i class="fas fa-bolt"></i> Power: ${currentRank.power}`;
    
    // Update referral statistics
    if (elements.refCount) elements.refCount.textContent = userData.referrals;
    if (elements.refEarned) elements.refEarned.textContent = userData.referralEarnings.toLocaleString();
    if (elements.referralBalance) elements.referralBalance.textContent = userData.referralEarnings.toLocaleString();
    if (elements.totalReferrals) elements.totalReferrals.textContent = userData.referrals;
    
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
        // Reached highest rank
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
    // Create message element
    let messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                         type === 'error' ? 'exclamation-circle' : 
                         type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${text}</span>
    `;
    
    // Add styles
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
    
    // Show message
    setTimeout(() => {
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    // Auto hide after 3 seconds
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

// Check timer every second
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

// Start app when page loads
document.addEventListener('DOMContentLoaded', initApp);

// Check if page is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initApp, 100);
}

// Export for debugging
window.appData = userData;
window.appConfig = CONFIG;
