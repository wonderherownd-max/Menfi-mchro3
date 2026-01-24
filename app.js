// ============================================
// VIP Mining Mini App - FIXED SAVE SYSTEM
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

// User Data - with verification flags
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
    firstName: 'User',
    isInitialized: false,
    lastSaveTime: 0
};

// Configuration
const CONFIG = {
    MINE_COOLDOWN: 5000,
    REFERRAL_REWARD: 25,
    REFERRER_REWARD: 25,
    
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
// Application Initialization
// ============================================

async function initApp() {
    console.log("🚀 Starting VIP Mining App...");
    
    try {
        // Cache DOM elements
        cacheElements();
        
        // Setup user first
        await setupUser();
        
        // Load user data second
        await loadUserData();
        
        // Setup event listeners
        setupEventListeners();
        
        // Update UI
        updateUI();
        
        // Update connection status
        updateConnectionStatus();
        
        // Check for referrals
        checkForReferral();
        
        // Mark as initialized
        userData.isInitialized = true;
        
        console.log("✅ App ready! Balance:", userData.balance, "User ID:", userData.userId);
        
        // Show welcome message
        setTimeout(() => {
            showMessage(`💰 Welcome ${userData.username}! Balance: ${userData.balance} points`, 'success');
        }, 1000);
        
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
        'connectionStatus', 'cooldownTimer', 'shareBtn'
    ];
    
    elementIds.forEach(id => {
        elements[id] = document.getElementById(id);
    });
    
    console.log("✅ Cached", elementIds.length, "DOM elements");
}

// ============================================
// User Management - New Solution
// ============================================

async function setupUser() {
    console.log("👤 Setting up user...");
    
    let telegramUser = null;
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        telegramUser = tg.initDataUnsafe.user;
        console.log("📱 Telegram user found:", telegramUser.id);
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
    
    // Generate referral code
    if (!userData.referralCode) {
        userData.referralCode = generateReferralCode(userData.userId);
        console.log("🔗 Generated referral code:", userData.referralCode);
    }
    
    // Update UI
    updateUserUI();
    
    // Sync with Firebase
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
    // Update username
    if (elements.username) {
        elements.username.textContent = userData.username;
    }
    
    // Update user ID
    if (elements.userId) {
        elements.userId.textContent = `ID: ${userData.userId.slice(-8)}`;
    }
    
    // Update avatar
    if (elements.userAvatar) {
        const firstChar = userData.firstName.charAt(0).toUpperCase();
        elements.userAvatar.textContent = firstChar;
    }
    
    // Update referral link
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
        console.log("🔗 Updated referral link:", refLink);
    }
}

// ============================================
// Storage System - Critical Solution
// ============================================

async function loadUserData() {
    console.log("📂 Loading user data for:", userData.userId);
    
    try {
        const storageKey = `vip_mining_${userData.userId}`;
        console.log("🔍 Looking for key:", storageKey);
        
        // Load from localStorage
        const savedData = localStorage.getItem(storageKey);
        
        if (savedData) {
            console.log("✅ Found saved data");
            const parsedData = JSON.parse(savedData);
            
            // 🔥 This is the critical solution: load balance first
            if (parsedData.balance !== undefined && parsedData.balance !== null) {
                const loadedBalance = Number(parsedData.balance);
                console.log("💰 Loading balance from storage:", loadedBalance);
                userData.balance = loadedBalance;
            }
            
            // Load other data
            if (parsedData.totalEarned !== undefined) {
                userData.totalEarned = Number(parsedData.totalEarned);
            }
            
            if (parsedData.referrals !== undefined) {
                userData.referrals = Number(parsedData.referrals);
            }
            
            if (parsedData.rank && parsedData.rank !== '') {
                userData.rank = parsedData.rank;
            }
            
            if (parsedData.referralEarnings !== undefined) {
                userData.referralEarnings = Number(parsedData.referralEarnings);
            }
            
            if (parsedData.lastMineTime !== undefined) {
                userData.lastMineTime = Number(parsedData.lastMineTime);
            }
            
            if (parsedData.referralCode && parsedData.referralCode !== '') {
                userData.referralCode = parsedData.referralCode;
            }
            
            if (parsedData.referredBy !== undefined) {
                userData.referredBy = parsedData.referredBy;
            }
            
            console.log("📊 Loaded data - Balance:", userData.balance, "Total:", userData.totalEarned);
            
        } else {
            console.log("📝 No saved data found, creating new user");
            // Save initial data only on first time
            saveUserData();
        }
        
        // Load from Firebase
        if (db) {
            await loadUserFromFirebase();
        }
        
        console.log("✅ Data loading complete. Final balance:", userData.balance);
        
    } catch (error) {
        console.error("❌ Error loading user data:", error);
        // In case of error, save current data
        saveUserData();
    }
}

function saveUserData() {
    if (!userData.userId) {
        console.error("❌ Cannot save: No user ID");
        return;
    }
    
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
            saveTime: Date.now(),
            version: '3.0'
        };
        
        console.log("💾 Saving data - Balance:", userData.balance, "Key:", storageKey);
        
        // Save to localStorage
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        
        // Verify save
        const verifyData = localStorage.getItem(storageKey);
        if (verifyData) {
            const parsed = JSON.parse(verifyData);
            console.log("✅ Data saved successfully. Balance stored:", parsed.balance);
        } else {
            console.error("❌ Failed to save to localStorage!");
        }
        
        // Save to Firebase
        if (db) {
            saveUserToFirebase();
        }
        
        userData.lastSaveTime = Date.now();
        
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
            console.log("🔥 Created new user in Firebase");
        } else {
            await userRef.update({
                lastActive: firebase.firestore.FieldValue.serverTimestamp(),
                username: userData.username,
                firstName: userData.firstName
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
            
            // Take the higher value from Firebase and local
            if (firebaseData.balance !== undefined && firebaseData.balance > userData.balance) {
                console.log("📈 Updating balance from Firebase:", firebaseData.balance);
                userData.balance = firebaseData.balance;
            }
            
            if (firebaseData.totalEarned !== undefined && firebaseData.totalEarned > userData.totalEarned) {
                userData.totalEarned = firebaseData.totalEarned;
            }
            
            console.log("✅ Firebase data merged");
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
            lastActive: firebase.firestore.FieldValue.serverTimestamp(),
            lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(() => {
            console.log("✅ Saved to Firebase. Balance:", userData.balance);
        }).catch(error => {
            console.error("❌ Firebase save error:", error);
        });
        
    } catch (error) {
        console.error("❌ Firebase save error:", error);
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
    
    // Check localStorage for pending referral
    const pendingRef = localStorage.getItem('pending_referral');
    if (pendingRef && pendingRef !== userData.referralCode) {
        console.log("💾 Pending referral detected:", pendingRef);
        processReferral(pendingRef);
        localStorage.removeItem('pending_referral');
    }
}

async function processReferral(referralCode) {
    if (!referralCode || referralCode === userData.referralCode) {
        console.log("⚠️ Invalid or self-referral");
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
                
                if (referrerData.userId === userData.userId) {
                    console.log("⚠️ Cannot refer yourself");
                    return;
                }
                
                // Reward for referred user (new user)
                userData.balance += CONFIG.REFERRAL_REWARD;
                userData.totalEarned += CONFIG.REFERRAL_REWARD;
                
                // Reward for referrer
                await referrerDoc.ref.update({
                    referrals: firebase.firestore.FieldValue.increment(1),
                    referralEarnings: firebase.firestore.FieldValue.increment(CONFIG.REFERRER_REWARD),
                    balance: firebase.firestore.FieldValue.increment(CONFIG.REFERRER_REWARD),
                    totalEarned: firebase.firestore.FieldValue.increment(CONFIG.REFERRER_REWARD)
                });
                
                // Update current user
                userData.referredBy = referralCode;
                userData.referrals += 1;
                userData.referralEarnings += CONFIG.REFERRER_REWARD;
                
                // Immediate save
                saveUserData();
                updateUI();
                
                showMessage(`🎉 Referral successful! You got +${CONFIG.REFERRAL_REWARD} points and referrer got +${CONFIG.REFERRER_REWARD} points`, 'success');
                
                await logReferralEvent(referrerData.userId, userData.userId, referralCode);
                
                console.log("✅ Referral processed successfully");
                return true;
            }
        }
        
        // Fallback to local storage
        userData.referredBy = referralCode;
        userData.balance += CONFIG.REFERRAL_REWARD + CONFIG.REFERRER_REWARD;
        userData.totalEarned += CONFIG.REFERRAL_REWARD + CONFIG.REFERRER_REWARD;
        userData.referralEarnings += CONFIG.REFERRER_REWARD;
        
        saveUserData();
        updateUI();
        
        const totalBonus = CONFIG.REFERRAL_REWARD + CONFIG.REFERRER_REWARD;
        showMessage(`🎉 Referral recorded! +${totalBonus} total points`, 'success');
        
        console.log("📝 Referral recorded (local storage)");
        return true;
        
    } catch (error) {
        console.error("❌ Referral processing error:", error);
        showMessage('Error processing referral', 'error');
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
            newUserReward: CONFIG.REFERRAL_REWARD,
            referrerReward: CONFIG.REFERRER_REWARD,
            totalReward: CONFIG.REFERRAL_REWARD + CONFIG.REFERRER_REWARD,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'completed'
        });
        console.log("📝 Referral logged in Firebase");
    } catch (error) {
        console.error("❌ Referral logging error:", error);
    }
}

// ============================================
// Mining System
// ============================================

function minePoints() {
    console.log("⛏️ Mining points... Current balance:", userData.balance);
    
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
    
    console.log("📈 Before mining - Balance:", userData.balance);
    
    // Update balance
    userData.balance += reward;
    userData.totalEarned += reward;
    userData.lastMineTime = now;
    
    console.log("📈 After mining - Balance:", userData.balance);
    
    // Immediate save
    saveUserData();
    updateUI();
    animateMineButton(reward);
    
    showMessage(`⛏️ +${reward} points! Total: ${userData.balance}`, 'success');
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
            // Reattach event listener
            reattachMineButton();
        }
    };
    
    updateTimer();
}

// ============================================
// Event Listeners - SIMPLIFIED VERSION
// ============================================

function setupEventListeners() {
    console.log("🎯 Setting up event listeners...");
    
    // Mine button
    if (elements.mineBtn) {
        elements.mineBtn.addEventListener('click', minePoints);
        console.log("✅ Mine button listener added");
    }
    
    // Copy button
    if (elements.copyBtn) {
        elements.copyBtn.addEventListener('click', copyReferralLink);
        console.log("✅ Copy button listener added");
    }
    
    // Share button
    if (elements.shareBtn) {
        elements.shareBtn.addEventListener('click', shareOnTelegram);
        console.log("✅ Share button listener added");
    }
    
    console.log("✅ Event listeners setup complete");
}

function reattachMineButton() {
    if (elements.mineBtn) {
        elements.mineBtn.addEventListener('click', minePoints);
    }
}

function copyReferralLink() {
    const refLink = generateReferralLink();
    
    navigator.clipboard.writeText(refLink)
        .then(() => {
            showMessage('✅ Link copied to clipboard!', 'success');
            if (elements.copyBtn) {
                elements.copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    elements.copyBtn.innerHTML = '<i class="far fa-copy"></i>';
                }, 2000);
            }
        })
        .catch(err => {
            console.error('Copy error:', err);
            showMessage('❌ Failed to copy link', 'error');
        });
}

function shareOnTelegram() {
    const refLink = generateReferralLink();
    const shareText = `🚀 *Join VIP Mining PRO!*\n\n⛏️ *Mine points every 5 seconds*\n👥 *Get +25 BONUS points with my link*\n💰 *Earn 25 points for each referral*\n\n👉 ${refLink}\n\n💎 *Start earning now!* @VIPMainingPROBot`;
    
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`;
    
    window.open(shareUrl, '_blank');
    showMessage('📱 Opening Telegram...', 'info');
}

// ============================================
// UI Updates
// ============================================

function updateUI() {
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
    
    // Update wallet balance immediately
    updateWalletBalanceDirect();
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
// 🔥 NEW: Instant Wallet Update System
// ============================================

function updateWalletBalanceDirect() {
    // Direct update of wallet balance
    const walletPoints = document.getElementById('walletPoints');
    if (walletPoints) {
        walletPoints.textContent = userData.balance.toLocaleString();
        console.log("💰 Wallet updated directly:", userData.balance);
    }
}

// ============================================
// 🔥 ULTIMATE FIX: Navigation System
// ============================================

function switchPageFixed(pageName) {
    console.log("🎯 ULTIMATE SWITCH to:", pageName);
    
    // Hide all pages and container
    const allPages = document.querySelectorAll('.page, .container');
    allPages.forEach(element => {
        element.classList.remove('active');
        element.classList.add('hidden');
    });
    
    // Remove active from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show requested page and activate icon
    if (pageName === 'home') {
        const homeContainer = document.querySelector('.container');
        if (homeContainer) {
            homeContainer.classList.remove('hidden');
            homeContainer.classList.add('active');
        }
        
        // Activate home icon
        document.querySelectorAll('.nav-item').forEach(item => {
            const span = item.querySelector('span');
            if (span && span.textContent.toLowerCase().includes('home')) {
                item.classList.add('active');
            }
        });
        
        // Reattach event listeners after a short delay
        setTimeout(() => {
            reattachAllEventListeners();
        }, 100);
        
        // Update UI
        updateUI();
        
    } else if (pageName === 'wallet') {
        const walletPage = document.getElementById('walletPage');
        if (walletPage) {
            walletPage.classList.remove('hidden');
            walletPage.classList.add('active');
        }
        
        // Activate wallet icon
        document.querySelectorAll('.nav-item').forEach(item => {
            const span = item.querySelector('span');
            if (span && span.textContent.toLowerCase().includes('wallet')) {
                item.classList.add('active');
            }
        });
        
        // Update wallet balance
        updateWalletBalanceDirect();
        
    } else if (pageName === 'earning') {
        const earningPage = document.getElementById('earningPage');
        if (earningPage) {
            earningPage.classList.remove('hidden');
            earningPage.classList.add('active');
        }
        
        // Activate earning icon
        document.querySelectorAll('.nav-item').forEach(item => {
            const span = item.querySelector('span');
            if (span && span.textContent.toLowerCase().includes('earning')) {
                item.classList.add('active');
            }
        });
    }
}

// Reattach ALL event listeners - SIMPLIFIED
function reattachAllEventListeners() {
    console.log("🔧 Reattaching all event listeners...");
    
    // Mine button
    const mineBtn = document.getElementById('mineBtn');
    if (mineBtn) {
        // Remove old listener by cloning
        const newMineBtn = mineBtn.cloneNode(true);
        mineBtn.parentNode.replaceChild(newMineBtn, mineBtn);
        
        // Add fresh listener to new button
        document.getElementById('mineBtn').addEventListener('click', minePoints);
        console.log("✅ Mine button reattached");
    }
    
    // Copy button
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
        const newCopyBtn = copyBtn.cloneNode(true);
        copyBtn.parentNode.replaceChild(newCopyBtn, copyBtn);
        
        document.getElementById('copyBtn').addEventListener('click', copyReferralLink);
        console.log("✅ Copy button reattached");
    }
    
    // Share button
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        const newShareBtn = shareBtn.cloneNode(true);
        shareBtn.parentNode.replaceChild(newShareBtn, shareBtn);
        
        document.getElementById('shareBtn').addEventListener('click', shareOnTelegram);
        console.log("✅ Share button reattached");
    }
    
    console.log("✅ All event listeners reattached successfully");
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
        z-index: 2000;
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

// Auto-save every 30 seconds as backup
setInterval(() => {
    if (userData.userId && userData.isInitialized) {
        saveUserData();
    }
}, 30000);

// Save data before page unload
window.addEventListener('beforeunload', function() {
    if (userData.userId) {
        console.log("💾 Saving data before page unload...");
        saveUserData();
    }
});

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Export for debugging and HTML access
window.userData = userData;
window.showMessage = showMessage;
window.generateReferralLink = generateReferralLink;
window.processReferral = processReferral;
window.saveUserData = saveUserData;
window.updateWalletBalanceDirect = updateWalletBalanceDirect;
window.switchPageFixed = switchPageFixed;
window.reinitializeEventListeners = reattachAllEventListeners;

// Debug function
window.debugStorage = function() {
    console.log("🔍 === STORAGE DEBUG ===");
    console.log("User ID:", userData.userId);
    console.log("Storage key:", `vip_mining_${userData.userId}`);
    
    const saved = localStorage.getItem(`vip_mining_${userData.userId}`);
    if (saved) {
        const data = JSON.parse(saved);
        console.log("Saved data:", data);
        console.log("Balance in storage:", data.balance);
    } else {
        console.log("No data saved for current user");
    }
    
    // Show all vip_mining keys
    console.log("\nAll VIP Mining keys in localStorage:");
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes('vip_mining')) {
            console.log(key);
        }
    }
    console.log("🔍 === END DEBUG ===");
};

console.log("🎮 VIP Mining App loaded successfully");
console.log("✅ ULTIMATE navigation system ready");
