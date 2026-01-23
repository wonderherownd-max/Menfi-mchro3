// ============================================
// VIP Mining Mini App - Complete with PRO Link
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

// User Data
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

// Configuration - UPDATED REFERRAL REWARDS
const CONFIG = {
    MINE_COOLDOWN: 5000,
    REFERRAL_REWARD: 25,      // مكافأة المحال
    REFERRER_REWARD: 25,      // مكافأة المحيل (تم التحديث من 10 إلى 25)
    
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
        
        console.log("✅ App ready!");
        
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
        'connectionStatus', 'cooldownTimer', 'shareBtn', 'whatsappBtn',
        'telegramBtn' // تمت إضافة زر تيليجرام
    ];
    
    elementIds.forEach(id => {
        elements[id] = document.getElementById(id);
    });
}

// ============================================
// User Management
// ============================================

async function setupUser() {
    console.log("👤 Setting up user...");
    
    // Get Telegram user
    let telegramUser = null;
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        telegramUser = tg.initDataUnsafe.user;
        console.log("📱 Telegram user:", telegramUser);
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
        console.log("🔗 Generated code:", userData.referralCode);
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
// Referral Link System - USING PRO LINK
// ============================================

function generateReferralLink() {
    if (userData.referralCode) {
        // هذا الرابط يفتح التطبيق المصغر مباشرة!
        return `https://t.me/VIPMainingPROBot/PRO?startapp=${userData.referralCode}`;
    }
    return 'https://t.me/VIPMainingPROBot/PRO';
}

function updateReferralLink() {
    const refLink = generateReferralLink();
    
    if (elements.referralLink) {
        elements.referralLink.value = refLink;
        console.log("🔗 Referral link updated:", refLink);
    }
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
        
        // Load from Firebase
        if (db) {
            await loadUserFromFirebase();
        }
        
        // Save instantly to ensure consistency
        saveUserDataInstantly();
        
    } catch (error) {
        console.error("❌ Load error:", error);
    }
}

function saveUserDataInstantly() {
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
        
        // Save to Firebase instantly
        if (db) {
            saveUserToFirebaseInstantly();
        }
        
        console.log("💾 Data saved instantly");
    } catch (error) {
        console.error("❌ Save error:", error);
    }
}

// ============================================
// Firebase Integration - INSTANT SAVE
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
                totalEarned: userData.totalEarned,
                rank: userData.rank,
                referrals: userData.referrals,
                referralEarnings: userData.referralEarnings
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
            
            console.log("🔥 Loaded from Firebase");
        }
    } catch (error) {
        console.error("❌ Firebase load error:", error);
    }
}

function saveUserToFirebaseInstantly() {
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
            console.log("🔥 Saved to Firebase instantly");
        }).catch(error => {
            console.error("❌ Firebase save error:", error);
        });
        
    } catch (error) {
        console.error("❌ Firebase save error:", error);
    }
}

// ============================================
// Referral Processing - UPDATED REWARDS
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
    
    // Check URL parameter (startapp, ref, or start)
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
    
    // Check if already referred
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
                
                // ✅ UPDATE 1: مكافأة المحال (المستخدم الجديد) - 25 نقطة
                userData.balance += CONFIG.REFERRAL_REWARD;
                userData.totalEarned += CONFIG.REFERRAL_REWARD;
                
                // ✅ UPDATE 2: مكافأة المحيل - 25 نقطة (بدلاً من 10)
                await referrerDoc.ref.update({
                    referrals: firebase.firestore.FieldValue.increment(1),
                    referralEarnings: firebase.firestore.FieldValue.increment(CONFIG.REFERRER_REWARD),
                    balance: firebase.firestore.FieldValue.increment(CONFIG.REFERRER_REWARD),
                    totalEarned: firebase.firestore.FieldValue.increment(CONFIG.REFERRER_REWARD)
                });
                
                // Update current user
                userData.referredBy = referralCode;
                
                // Update locally
                userData.referrals += 1;
                userData.referralEarnings += CONFIG.REFERRER_REWARD;
                
                // ✅ UPDATE 3: حفظ فوري
                saveUserDataInstantly();
                updateUI();
                
                // Show success message with both rewards
                showMessage(`🎉 Referral successful! You got +${CONFIG.REFERRAL_REWARD} points and referrer got +${CONFIG.REFERRER_REWARD} points`, 'success');
                
                // Log referral event
                await logReferralEvent(referrerData.userId, userData.userId, referralCode);
                
                console.log("✅ Referral processed successfully with new rewards");
                return true;
            }
        }
        
        // Fallback to local storage if Firebase not available
        userData.referredBy = referralCode;
        // ✅ UPDATE 4: كلا المكافآت في الحالة المحلية
        userData.balance += CONFIG.REFERRAL_REWARD + CONFIG.REFERRER_REWARD;
        userData.totalEarned += CONFIG.REFERRAL_REWARD + CONFIG.REFERRER_REWARD;
        userData.referralEarnings += CONFIG.REFERRER_REWARD;
        
        // ✅ UPDATE 5: حفظ فوري
        saveUserDataInstantly();
        updateUI();
        
        const totalBonus = CONFIG.REFERRAL_REWARD + CONFIG.REFERRER_REWARD;
        showMessage(`🎉 Referral recorded! +${totalBonus} total points`, 'success');
        
        console.log("📝 Referral recorded (local storage) with new rewards");
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
            newUserReward: CONFIG.REFERRAL_REWARD, // مكافأة المحال
            referrerReward: CONFIG.REFERRER_REWARD, // مكافأة المحيل
            totalReward: CONFIG.REFERRAL_REWARD + CONFIG.REFERRER_REWARD,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'completed'
        });
        console.log("📝 Referral logged in Firebase with new rewards");
    } catch (error) {
        console.error("❌ Referral logging error:", error);
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
    
    userData.balance += reward;
    userData.totalEarned += reward;
    userData.lastMineTime = now;
    
    // ✅ UPDATE 6: حفظ فوري بعد التعدين
    saveUserDataInstantly();
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
// Event Listeners - PROFESSIONAL SHARING
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
        elements.copyBtn.addEventListener('click', copyReferralLink);
        console.log("✅ Copy button listener added");
    }
    
    // Share on Telegram
    if (elements.shareBtn) {
        elements.shareBtn.addEventListener('click', shareOnTelegram);
        console.log("✅ Telegram share button added");
    }
    
    // Share on WhatsApp
    if (elements.whatsappBtn) {
        elements.whatsappBtn.addEventListener('click', shareOnWhatsApp);
        console.log("✅ WhatsApp share button added");
    }
    
    // Share via direct Telegram
    if (elements.telegramBtn) {
        elements.telegramBtn.addEventListener('click', shareViaDirectTelegram);
        console.log("✅ Direct Telegram share button added");
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
    const shareText = `🚀 *Join VIP Mining PRO!*\n\n` +
                     `⛏️ *Mine points every 5 seconds*\n` +
                     `👥 *Get +25 BONUS points with my link*\n` +
                     `💰 *Earn 25 points for each referral*\n\n` +
                     `👉 ${refLink}\n\n` +
                     `💎 *Start earning now!* @VIPMainingPROBot`;
    
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`;
    
    window.open(shareUrl, '_blank');
    showMessage('📱 Opening Telegram...', 'info');
}

function shareViaDirectTelegram() {
    const refLink = generateReferralLink();
    const shareText = `🚀 Join VIP Mining PRO!\n\n⛏️ Mine points every 5 seconds\n👥 Get +25 BONUS points with my link\n💰 Earn 25 points for each referral\n\n${refLink}\n\n💎 Start earning now! @VIPMainingPROBot`;
    
    // طريقة احترافية أكثر لمشاركة تيليجرام
    if (tg) {
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`);
    } else {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`, '_blank');
    }
    
    showMessage('📱 Sharing via Telegram...', 'info');
}

function shareOnWhatsApp() {
    const refLink = generateReferralLink();
    const shareText = `🚀 *VIP Mining PRO* 🪙\n\n` +
                     `Join and earn FREE points!\n` +
                     `⛏️ Mine every 5 seconds\n` +
                     `🎁 +25 BONUS with my link\n` +
                     `👥 Earn 25 per referral\n\n` +
                     `${refLink}\n\n` +
                     `Start now and level up! 🏆`;
    
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    
    window.open(shareUrl, '_blank');
    showMessage('💚 Opening WhatsApp...', 'info');
}

// ============================================
// UI Updates - PROFESSIONAL LOOK
// ============================================

function updateUI() {
    // Update numbers with animation
    animateNumberUpdate(elements.balance, userData.balance.toLocaleString(), '💰 ');
    animateNumberUpdate(elements.referrals, `${userData.referrals} Referrals`, '👥 ');
    animateNumberUpdate(elements.totalEarned, `${userData.totalEarned.toLocaleString()} Total`, '📈 ');
    
    // Update rank with badge effect
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
    if (elements.rankBadge) {
        elements.rankBadge.textContent = userData.rank;
        updateRankBadgeStyle(userData.rank);
    }
    
    // Update mining info
    if (elements.rewardAmount) {
        elements.rewardAmount.textContent = currentRank.reward;
    }
    
    if (elements.miningPower) {
        elements.miningPower.innerHTML = `<i class="fas fa-bolt"></i> Mining Power: ${currentRank.power}`;
    }
    
    // Update referral statistics with professional styling
    if (elements.refCount) {
        elements.refCount.innerHTML = `<span class="stat-number">${userData.referrals}</span><span class="stat-label">Referrals</span>`;
    }
    
    if (elements.refEarned) {
        elements.refEarned.innerHTML = `<span class="stat-number">${userData.referralEarnings.toLocaleString()}</span><span class="stat-label">Referral Earnings</span>`;
    }
    
    if (elements.refRank) {
        elements.refRank.innerHTML = `<span class="stat-number">${userData.rank}</span><span class="stat-label">Current Rank</span>`;
    }
    
    // Update progress bar with smooth animation
    updateProgress();
    
    // Update referral link
    updateReferralLink();
}

function animateNumberUpdate(element, newValue, prefix = '') {
    if (!element) return;
    
    const oldValue = element.textContent.replace(prefix, '');
    if (oldValue !== newValue.replace(prefix, '')) {
        element.style.transform = 'scale(1.1)';
        element.style.color = '#10b981';
        
        setTimeout(() => {
            element.textContent = prefix + newValue;
            element.style.transform = 'scale(1)';
            setTimeout(() => {
                element.style.color = '';
            }, 500);
        }, 200);
    }
}

function updateRankBadgeStyle(rank) {
    const badge = elements.rankBadge;
    if (!badge) return;
    
    const rankColors = {
        'Beginner': 'linear-gradient(135deg, #6b7280, #9ca3af)',
        'Professional': 'linear-gradient(135deg, #3b82f6, #60a5fa)',
        'Expert': 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
        'VIP': 'linear-gradient(135deg, #f59e0b, #fbbf24)',
        'Legend': 'linear-gradient(135deg, #ef4444, #f87171)'
    };
    
    badge.style.background = rankColors[rank] || rankColors['Beginner'];
    badge.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
}

function updateProgress() {
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
    const nextRank = CONFIG.RANKS[CONFIG.RANKS.indexOf(currentRank) + 1];
    
    if (nextRank) {
        const progress = ((userData.totalEarned - currentRank.min) / (nextRank.min - currentRank.min)) * 100;
        const clampedProgress = Math.min(progress, 100);
        
        if (elements.progressFill) {
            elements.progressFill.style.width = `${clampedProgress}%`;
            elements.progressFill.style.transition = 'width 0.5s ease-in-out';
        }
        
        if (elements.nextRank) {
            elements.nextRank.innerHTML = `Next Rank: <strong>${nextRank.name}</strong> (${nextRank.min.toLocaleString()} pts)`;
        }
        
        if (elements.currentPoints) {
            elements.currentPoints.innerHTML = `<strong>${userData.totalEarned.toLocaleString()}</strong> points`;
        }
        
        if (elements.targetPoints) {
            elements.targetPoints.innerHTML = `<strong>${nextRank.min.toLocaleString()}</strong> target`;
        }
        
        if (elements.remainingPoints) {
            const remaining = Math.max(0, nextRank.min - userData.totalEarned);
            elements.remainingPoints.innerHTML = `<strong>${remaining.toLocaleString()}</strong> to go`;
        }
    } else {
        if (elements.progressFill) {
            elements.progressFill.style.width = '100%';
            elements.progressFill.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
        }
        if (elements.nextRank) elements.nextRank.innerHTML = '🏆 <strong>MAX RANK ACHIEVED!</strong>';
        if (elements.remainingPoints) elements.remainingPoints.innerHTML = '🎯 <strong>GOAL COMPLETED!</strong>';
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
        
        // ✅ UPDATE 7: حفظ فوري بعد الترقي
        saveUserDataInstantly();
        updateUI();
        
        showMessage(`🏆 RANK UP! ${oldRank} → ${newRank.name}`, 'success');
        
        // إشعار خاص بالترقي
        const rankUpMessage = `🎉 *CONGRATULATIONS!*\n\n` +
                             `You've been promoted to *${newRank.name}*!\n` +
                             `🎁 New mining reward: *${newRank.reward} points*\n` +
                             `⚡ Mining power: *${newRank.power}*\n\n` +
                             `Keep mining to reach the next rank!`;
        
        showMessage(rankUpMessage, 'success');
    }
}

function updateConnectionStatus() {
    if (elements.connectionStatus) {
        if (db) {
            elements.connectionStatus.innerHTML = '<i class="fas fa-wifi"></i> 🟢 Connected to Cloud';
            elements.connectionStatus.style.color = '#10b981';
            elements.connectionStatus.style.fontWeight = '600';
        } else {
            elements.connectionStatus.innerHTML = '<i class="fas fa-database"></i> 🟡 Local Storage Mode';
            elements.connectionStatus.style.color = '#f59e0b';
            elements.connectionStatus.style.fontWeight = '600';
        }
    }
}

// ============================================
// Professional Utility Functions
// ============================================

function showMessage(text, type = 'info') {
    console.log(`💬 ${type.toUpperCase()}: ${text}`);
    
    // إنشاء ID فريد للرسالة
    const messageId = 'msg_' + Date.now();
    
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = `message ${type}`;
    
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-times-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    
    messageDiv.innerHTML = `
        <div class="message-icon">
            <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
        </div>
        <div class="message-content">
            ${text.replace(/\n/g, '<br>')}
        </div>
        <div class="message-close" onclick="document.getElementById('${messageId}').remove()">
            <i class="fas fa-times"></i>
        </div>
    `;
    
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        min-width: 300px;
        max-width: 400px;
        background: ${type === 'success' ? '#10b981' : 
                     type === 'error' ? '#ef4444' : 
                     type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        padding: 15px 20px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 15px;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100px);
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        font-weight: 500;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
    `;
    
    document.body.appendChild(messageDiv);
    
    // إظهار الرسالة مع تأثير
    setTimeout(() => {
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateX(0)';
    }, 10);
    
    // إخفاء الرسالة تلقائياً بعد 4 ثواني
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateX(100px)';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 400);
    }, 4000);
}

// ============================================
// Application Startup - PROFESSIONAL INIT
// ============================================

// ✅ UPDATE 8: إزالة auto-save كل 30 ثانية واستبداله بالحفظ الفوري
// No more 30-second auto-save interval - all saves are instant now

// Check cooldown timer every second
setInterval(() => {
    if (userData.lastMineTime > 0) {
        const timeSinceLastMine = Date.now() - userData.lastMineTime;
        if (timeSinceLastMine < CONFIG.MINE_COOLDOWN) {
            const secondsLeft = Math.ceil((CONFIG.MINE_COOLDOWN - timeSinceLastMine) / 1000);
            if (elements.cooldownTimer) {
                elements.cooldownTimer.textContent = `${secondsLeft}s`;
                elements.cooldownTimer.style.color = secondsLeft <= 2 ? '#10b981' : '#f59e0b';
            }
        } else {
            if (elements.cooldownTimer) {
                elements.cooldownTimer.textContent = 'READY';
                elements.cooldownTimer.style.color = '#10b981';
            }
        }
    }
}, 1000);

// Initialize app with professional loading
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initApp, 500); // تأخير بسيط لمظهر أكثر احترافية
    });
} else {
    setTimeout(initApp, 500);
}

// Export for debugging
window.userData = userData;
window.showMessage = showMessage;
window.generateReferralLink = generateReferralLink;
window.saveUserDataInstantly = saveUserDataInstantly;

console.log("🎮 VIP Mining PRO Loaded with Enhanced Features");
console.log("📊 Config: Referral Reward = 25, Referrer Reward = 25");
console.log("💾 Storage: Instant save mode activated");

// ============================================
// Professional CSS Inline (Optional enhancement)
// ============================================
const professionalStyles = `
<style>
    .stat-number {
        font-size: 1.8rem;
        font-weight: 800;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        display: block;
        line-height: 1;
    }
    
    .stat-label {
        font-size: 0.9rem;
        color: #6b7280;
        font-weight: 500;
        display: block;
        margin-top: 5px;
    }
    
    .message-icon {
        font-size: 1.2rem;
        opacity: 0.9;
    }
    
    .message-content {
        flex: 1;
        font-size: 0.95rem;
        line-height: 1.4;
    }
    
    .message-close {
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s;
        padding: 5px;
        border-radius: 50%;
    }
    
    .message-close:hover {
        opacity: 1;
        background: rgba(255,255,255,0.1);
    }
    
    #cooldownTimer {
        font-weight: 700;
        transition: color 0.3s;
    }
</style>
`;

// إضافة الأنماط المحسنة
document.head.insertAdjacentHTML('beforeend', professionalStyles);
