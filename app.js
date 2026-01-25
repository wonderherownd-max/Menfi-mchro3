// ============================================
// VIP Mining Mini App - COMPLETE UPDATE v5.0
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
    balance: 25,
    referrals: 0,
    totalEarned: 25,
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

// Wallet Data - NEW SYSTEM
let walletData = {
    mwhBalance: 25,
    usdtBalance: 0,
    bnbBalance: 0,
    tonBalance: 0,
    ethBalance: 0,
    totalWithdrawn: 0,
    pendingWithdrawals: []
};

// Configuration - UPDATED WITH NEW REFERRAL REWARDS
const CONFIG = {
    MINE_COOLDOWN: 14400000, // 4 hours
    
    // NEW RANK SYSTEM WITH MWH
    RANKS: [
        { name: 'Beginner', min: 0, max: 4999, reward: 250, power: '250 MWH/4h' },
        { name: 'Professional', min: 5000, max: 14999, reward: 370, power: '370 MWH/4h' },
        { name: 'Expert', min: 15000, max: 29999, reward: 460, power: '460 MWH/4h' },
        { name: 'VIP', min: 30000, max: 59999, reward: 575, power: '575 MWH/4h' },
        { name: 'Legend', min: 60000, max: 119999, reward: 720, power: '720 MWH/4h' },
        { name: 'Elite', min: 120000, max: Infinity, reward: 900, power: '900 MWH/4h' }
    ],
    
    // UPDATED REFERRAL REWARDS (User: 0, Referrer: 50)
    REFERRAL_REWARD: 0,   // New user gets 0 MWH
    REFERRER_REWARD: 50,  // Referrer gets 50 MWH
    
    // Exchange rate
    MWH_TO_USD: 0.001, // 1 MWH = $0.001
    
    // Wallet limits
    MIN_SWAP: 10000,     // Minimum 10,000 MWH for swap
    MIN_WITHDRAWAL: 50,  // Minimum 50 USDT for withdrawal
    MIN_DEPOSIT_USDT: 10, // Minimum 10 USDT deposit
    MIN_DEPOSIT_BNB: 0.015, // Minimum 0.015 BNB deposit
    WITHDRAWAL_FEE: 0.0005, // Fixed BNB fee
    
    // Deposit address (COMMON FOR ALL USERS)
    DEPOSIT_ADDRESS: "0x790CAB511055F63db2F30AD227f7086bA3B6376a",
    
    // Swap rate (Fixed)
    SWAP_RATE: 1000 // 1000 MWH = 1 USDT
};

// DOM Elements
const elements = {};

// ============================================
// Application Initialization
// ============================================

async function initApp() {
    console.log("🚀 Starting VIP Mining App v5.0...");
    
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
            showMessage(`💰 Welcome ${userData.username}! Balance: ${userData.balance} MWH`, 'success');
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
        'connectionStatus', 'cooldownTimer', 'shareBtn',
        'balanceUSD', 'tokenPrice', 'nextRankBonus',
        // Wallet elements
        'walletMWH', 'walletUSDT', 'walletBNB', 'walletTON', 'walletETH',
        'walletMWHValue', 'walletUSDTValue', 'walletBNBValue',
        'swapBtn', 'depositBtn', 'withdrawBtn'
    ];
    
    elementIds.forEach(id => {
        elements[id] = document.getElementById(id);
    });
    
    console.log("✅ Cached", elementIds.length, "DOM elements");
}

// ============================================
// User Management
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
    
    // Update token price in header
    if (elements.tokenPrice) {
        elements.tokenPrice.textContent = "1 MWH ≈ $0.001";
    }
}

// ============================================
// Referral System - UPDATED
// ============================================

function generateReferralLink() {
    if (userData.referralCode) {
        return `http://t.me/MiningWealthbot/PRO?startapp=${userData.referralCode}`;
    }
    return 'http://t.me/MiningWealthbot/PRO';
}

function updateReferralLink() {
    const refLink = generateReferralLink();
    
    if (elements.referralLink) {
        elements.referralLink.value = refLink;
        console.log("🔗 Updated referral link:", refLink);
    }
}

// ============================================
// Updated Referral Processing (50/0 System)
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
                
                // UPDATED: New user gets 0 MWH
                // No reward for referred user
                
                // UPDATED: Reward for referrer - 50 MWH
                await referrerDoc.ref.update({
                    referrals: firebase.firestore.FieldValue.increment(1),
                    referralEarnings: firebase.firestore.FieldValue.increment(CONFIG.REFERRER_REWARD),
                    balance: firebase.firestore.FieldValue.increment(CONFIG.REFERRER_REWARD),
                    totalEarned: firebase.firestore.FieldValue.increment(CONFIG.REFERRER_REWARD)
                });
                
                // Update current user - ONLY set referredBy
                userData.referredBy = referralCode;
                
                // Sync wallet data
                walletData.mwhBalance = userData.balance;
                
                // Immediate save
                saveUserData();
                updateUI();
                
                // UPDATED: Show message with new rewards (0 for user, 50 for referrer)
                showMessage(`🎉 Referral recorded! Referrer got +${CONFIG.REFERRER_REWARD} MWH`, 'success');
                
                await logReferralEvent(referrerData.userId, userData.userId, referralCode);
                
                console.log("✅ Referral processed successfully");
                return true;
            }
        }
        
        // Fallback to local storage
        userData.referredBy = referralCode;
        // No reward for new user in local storage fallback
        
        saveUserData();
        updateUI();
        
        showMessage(`🎉 Referral recorded!`, 'success');
        
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
            newUserReward: CONFIG.REFERRAL_REWARD, // 0
            referrerReward: CONFIG.REFERRER_REWARD, // 50
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
// Mining System - FIXED REWARD DISPLAY
// ============================================

function minePoints() {
    console.log("⛏️ Mining MWH... Current balance:", userData.balance);
    
    if (!userData.userId) {
        showMessage('Please wait for user setup', 'error');
        return;
    }
    
    const now = Date.now();
    const timeSinceLastMine = now - userData.lastMineTime;
    
    if (timeSinceLastMine < CONFIG.MINE_COOLDOWN) {
        const hoursLeft = Math.ceil((CONFIG.MINE_COOLDOWN - timeSinceLastMine) / (1000 * 60 * 60));
        showMessage(`⏳ Wait ${hoursLeft} hours`, 'warning');
        return;
    }
    
    // Get reward based on current rank
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
    const reward = currentRank.reward;
    
    console.log("📈 Before mining - Balance:", userData.balance, "Rank:", userData.rank, "Reward:", reward);
    
    // Update balance
    userData.balance += reward;
    userData.totalEarned += reward;
    userData.lastMineTime = now;
    
    // Update wallet balance
    walletData.mwhBalance = userData.balance;
    
    console.log("📈 After mining - Balance:", userData.balance);
    
    // Animate belt emptying
    animateBeltEmpty();
    
    // Immediate save
    saveUserData();
    updateUI();
    animateMineButton(reward);
    
    showMessage(`⛏️ +${reward} MWH! Total: ${userData.balance} MWH`, 'success');
    checkRankUp();
    
    // Update belt immediately
    setTimeout(updateEnergyBelt, 100);
}

function animateMineButton(reward) {
    const btn = elements.mineBtn;
    if (!btn) return;
    
    const originalHTML = btn.innerHTML;
    
    // FIXED: Use actual reward value from current rank
    btn.innerHTML = `
        <div class="mine-icon">
            <i class="fas fa-hammer"></i>
        </div>
        <div class="mine-text">
            <div class="mine-title">Claimed!</div>
            <div class="mine-reward">+${reward} MWH</div>
            <div class="mine-subtitle">Come back in 4 hours</div>
        </div>
        <div class="mine-cooldown" id="cooldownTimer">4h</div>
    `;
    
    btn.disabled = true;
    btn.style.opacity = '0.7';
    
    setTimeout(() => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.innerHTML = originalHTML;
        // Reattach event listener
        if (elements.mineBtn) {
            elements.mineBtn.addEventListener('click', minePoints);
        }
    }, 2000);
}

// ============================================
// Wallet System - NEW
// ============================================

function initWallet() {
    // Sync MWH balance
    walletData.mwhBalance = userData.balance;
    
    // Load wallet data from localStorage
    const savedWallet = localStorage.getItem(`vip_wallet_${userData.userId}`);
    if (savedWallet) {
        try {
            const parsed = JSON.parse(savedWallet);
            walletData.usdtBalance = parsed.usdtBalance || 0;
            walletData.bnbBalance = parsed.bnbBalance || 0;
            walletData.tonBalance = parsed.tonBalance || 0;
            walletData.ethBalance = parsed.ethBalance || 0;
            walletData.totalWithdrawn = parsed.totalWithdrawn || 0;
            console.log("✅ Wallet data loaded");
        } catch (e) {
            console.error("❌ Error loading wallet:", e);
        }
    }
    
    updateWalletUI();
}

function updateWalletUI() {
    // Update wallet balances in UI
    if (elements.walletMWH) {
        elements.walletMWH.textContent = walletData.mwhBalance.toLocaleString();
    }
    
    if (elements.walletUSDT) {
        elements.walletUSDT.textContent = walletData.usdtBalance.toLocaleString();
    }
    
    if (elements.walletBNB) {
        elements.walletBNB.textContent = walletData.bnbBalance.toFixed(4);
    }
    
    if (elements.walletTON) {
        elements.walletTON.textContent = walletData.tonBalance.toLocaleString();
    }
    
    if (elements.walletETH) {
        elements.walletETH.textContent = walletData.ethBalance.toFixed(4);
    }
    
    // Update values in USD
    updateWalletValues();
    
    // Update withdrawal button state
    updateWithdrawalButton();
}

function updateWalletValues() {
    // Calculate USD values
    const mwhUSD = (walletData.mwhBalance * CONFIG.MWH_TO_USD).toFixed(2);
    const bnbUSD = (walletData.bnbBalance * 400).toFixed(2); // Approx BNB price
    
    if (elements.walletMWHValue) {
        elements.walletMWHValue.textContent = `≈ $${mwhUSD}`;
    }
    
    if (elements.walletUSDTValue) {
        elements.walletUSDTValue.textContent = `≈ $${walletData.usdtBalance.toFixed(2)}`;
    }
    
    if (elements.walletBNBValue) {
        elements.walletBNBValue.textContent = `≈ $${bnbUSD}`;
    }
}

// ============================================
// Swap System (MWH ↔ USDT)
// ============================================

function openSwapModal() {
    // Create swap modal
    const modalHTML = `
        <div class="modal-overlay" id="swapModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>⚡ Swap MWH to USDT</h3>
                    <button class="modal-close" onclick="closeSwapModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="swap-info">
                        <p>Fixed Rate: <strong>1,000 MWH = 1 USDT</strong></p>
                        <p>Minimum Swap: <strong>10,000 MWH</strong></p>
                    </div>
                    
                    <div class="swap-inputs">
                        <div class="swap-from">
                            <label>From (MWH)</label>
                            <div class="input-with-max">
                                <input type="number" id="swapFromAmount" 
                                       placeholder="Enter amount" 
                                       min="${CONFIG.MIN_SWAP}" 
                                       step="1000"
                                       oninput="calculateSwap()">
                                <button class="max-btn" onclick="setMaxSwap()">MAX</button>
                            </div>
                            <div class="balance-info">
                                Available: ${walletData.mwhBalance.toLocaleString()} MWH
                            </div>
                        </div>
                        
                        <div class="swap-arrow">
                            <i class="fas fa-exchange-alt"></i>
                        </div>
                        
                        <div class="swap-to">
                            <label>To (USDT)</label>
                            <input type="text" id="swapToAmount" readonly placeholder="0.00">
                            <div class="balance-info">
                                Will receive: <span id="swapReceive">0</span> USDT
                            </div>
                        </div>
                    </div>
                    
                    <div class="swap-warning" id="swapWarning" style="display: none;">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span id="swapWarningText"></span>
                    </div>
                    
                    <div class="swap-actions">
                        <button class="btn-secondary" onclick="closeSwapModal()">Cancel</button>
                        <button class="btn-primary" id="confirmSwapBtn" onclick="executeSwap()" disabled>
                            Confirm Swap
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Focus on input
    setTimeout(() => {
        const input = document.getElementById('swapFromAmount');
        if (input) input.focus();
        calculateSwap();
    }, 100);
}

function closeSwapModal() {
    const modal = document.getElementById('swapModal');
    if (modal) {
        modal.remove();
    }
}

function calculateSwap() {
    const fromAmount = parseFloat(document.getElementById('swapFromAmount').value) || 0;
    const toAmount = fromAmount / CONFIG.SWAP_RATE;
    
    // Update to amount
    document.getElementById('swapToAmount').value = toAmount.toFixed(2);
    document.getElementById('swapReceive').textContent = toAmount.toFixed(2);
    
    // Get button and warning elements
    const confirmBtn = document.getElementById('confirmSwapBtn');
    const warning = document.getElementById('swapWarning');
    const warningText = document.getElementById('swapWarningText');
    
    // Reset
    confirmBtn.disabled = true;
    warning.style.display = 'none';
    
    // Validations
    if (fromAmount <= 0) {
        warningText.textContent = "Please enter an amount";
        warning.style.display = 'flex';
        return;
    }
    
    if (fromAmount < CONFIG.MIN_SWAP) {
        warningText.textContent = `Minimum swap is ${CONFIG.MIN_SWAP.toLocaleString()} MWH`;
        warning.style.display = 'flex';
        return;
    }
    
    if (fromAmount > walletData.mwhBalance) {
        warningText.textContent = `Insufficient MWH balance. Available: ${walletData.mwhBalance.toLocaleString()} MWH`;
        warning.style.display = 'flex';
        return;
    }
    
    // All validations passed
    confirmBtn.disabled = false;
}

function setMaxSwap() {
    const input = document.getElementById('swapFromAmount');
    if (input) {
        input.value = walletData.mwhBalance;
        calculateSwap();
    }
}

function executeSwap() {
    const fromAmount = parseFloat(document.getElementById('swapFromAmount').value);
    const toAmount = fromAmount / CONFIG.SWAP_RATE;
    
    // Final validation
    if (fromAmount < CONFIG.MIN_SWAP) {
        showMessage(`Minimum swap is ${CONFIG.MIN_SWAP.toLocaleString()} MWH`, 'error');
        return;
    }
    
    if (fromAmount > walletData.mwhBalance) {
        showMessage('Insufficient MWH balance', 'error');
        return;
    }
    
    // Execute swap
    walletData.mwhBalance -= fromAmount;
    walletData.usdtBalance += toAmount;
    
    // Update user balance
    userData.balance = walletData.mwhBalance;
    
    // Save
    saveWalletData();
    saveUserData();
    
    // Update UI
    updateWalletUI();
    updateUI();
    
    // Close modal and show success
    closeSwapModal();
    showMessage(`✅ Swapped ${fromAmount.toLocaleString()} MWH to ${toAmount.toFixed(2)} USDT`, 'success');
    
    // Log transaction
    logTransaction('SWAP', fromAmount, 'MWH', toAmount, 'USDT');
}

// ============================================
// Deposit System
// ============================================

function openDepositModal() {
    const modalHTML = `
        <div class="modal-overlay" id="depositModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📥 Deposit BNB</h3>
                    <button class="modal-close" onclick="closeDepositModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="deposit-info">
                        <p>Send <strong>BNB (BEP20 only)</strong> to this address:</p>
                        <div class="deposit-address">
                            <code>${CONFIG.DEPOSIT_ADDRESS}</code>
                            <button class="copy-btn-small" onclick="copyToClipboard('${CONFIG.DEPOSIT_ADDRESS}')">
                                <i class="far fa-copy"></i>
                            </button>
                        </div>
                        
                        <div class="qr-code-placeholder">
                            <div style="text-align: center; padding: 20px; background: #f8fafc; border-radius: 10px;">
                                <div style="color: #666; font-size: 14px;">QR Code Placeholder</div>
                                <div style="font-size: 12px; color: #999; margin-top: 10px;">
                                    (QR Code would be generated here)
                                </div>
                            </div>
                        </div>
                        
                        <div class="deposit-instructions">
                            <h4>⚠️ Important Instructions:</h4>
                            <ol>
                                <li>Send only <strong>BNB (BEP20)</strong> to this address</li>
                                <li>Minimum deposit: <strong>${CONFIG.MIN_DEPOSIT_BNB} BNB</strong></li>
                                <li>Manual credit within <strong>2 hours</strong></li>
                                <li>Contact support if not credited after 2 hours</li>
                                <li>This is a <strong>shared address</strong> for all users</li>
                            </ol>
                        </div>
                        
                        <div class="deposit-note">
                            <i class="fas fa-info-circle"></i>
                            <span>After sending, BNB balance will be updated manually by admin</span>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="closeDepositModal()">Close</button>
                        <button class="btn-primary" onclick="copyToClipboard('${CONFIG.DEPOSIT_ADDRESS}')">
                            <i class="far fa-copy"></i> Copy Address
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeDepositModal() {
    const modal = document.getElementById('depositModal');
    if (modal) {
        modal.remove();
    }
}

// ============================================
// Withdrawal System
// ============================================

function updateWithdrawalButton() {
    const btn = elements.withdrawBtn;
    if (!btn) return;
    
    const usdtBalance = walletData.usdtBalance;
    const bnbBalance = walletData.bnbBalance;
    
    // Reset button
    btn.disabled = false;
    btn.className = 'action-btn';
    
    if (usdtBalance < CONFIG.MIN_WITHDRAWAL) {
        // Case 1: Less than 50 USDT
        btn.innerHTML = `<i class="fas fa-lock"></i> Need ${CONFIG.MIN_WITHDRAWAL} USDT`;
        btn.style.background = '#ef4444';
        btn.disabled = true;
        return;
    }
    
    if (bnbBalance < CONFIG.WITHDRAWAL_FEE) {
        // Case 2: Has USDT but no BNB for fees
        btn.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Need ${CONFIG.WITHDRAWAL_FEE} BNB`;
        btn.style.background = '#f59e0b';
        return;
    }
    
    // Case 3: Ready to withdraw
    btn.innerHTML = `<i class="fas fa-wallet"></i> Withdraw USDT`;
    btn.style.background = '#22c55e';
}

function openWithdrawalModal() {
    const usdtBalance = walletData.usdtBalance;
    const bnbBalance = walletData.bnbBalance;
    
    // Final validation
    if (usdtBalance < CONFIG.MIN_WITHDRAWAL) {
        showMessage(`Minimum withdrawal is ${CONFIG.MIN_WITHDRAWAL} USDT`, 'error');
        return;
    }
    
    if (bnbBalance < CONFIG.WITHDRAWAL_FEE) {
        showMessage(`Need ${CONFIG.WITHDRAWAL_FEE} BNB for network fees`, 'error');
        return;
    }
    
    const modalHTML = `
        <div class="modal-overlay" id="withdrawalModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📤 Withdraw USDT</h3>
                    <button class="modal-close" onclick="closeWithdrawalModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="withdrawal-info">
                        <p>Available: <strong>${usdtBalance.toFixed(2)} USDT</strong></p>
                        <p>Network Fee: <strong>${CONFIG.WITHDRAWAL_FEE} BNB</strong> (Fixed)</p>
                        <p>Your BNB: <strong>${bnbBalance.toFixed(4)} BNB</strong></p>
                    </div>
                    
                    <div class="withdrawal-form">
                        <div class="form-group">
                            <label>USDT Amount</label>
                            <input type="number" 
                                   id="withdrawalAmount" 
                                   value="${usdtBalance.toFixed(2)}"
                                   min="${CONFIG.MIN_WITHDRAWAL}"
                                   max="${usdtBalance}"
                                   step="0.01"
                                   oninput="validateWithdrawalAmount()">
                            <div class="form-hint">
                                Min: ${CONFIG.MIN_WITHDRAWAL} USDT, Max: ${usdtBalance.toFixed(2)} USDT
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>USDT Address (BEP20)</label>
                            <input type="text" 
                                   id="withdrawalAddress" 
                                   placeholder="0x..."
                                   oninput="validateWithdrawalAddress()">
                            <div class="form-hint">
                                Enter your BEP20 USDT wallet address
                            </div>
                        </div>
                        
                        <div class="withdrawal-summary">
                            <h4>Summary:</h4>
                            <div class="summary-row">
                                <span>Amount to withdraw:</span>
                                <span id="summaryAmount">${usdtBalance.toFixed(2)} USDT</span>
                            </div>
                            <div class="summary-row">
                                <span>Network fee:</span>
                                <span>${CONFIG.WITHDRAWAL_FEE} BNB</span>
                            </div>
                            <div class="summary-row">
                                <span>You will receive:</span>
                                <span id="summaryReceive">${usdtBalance.toFixed(2)} USDT</span>
                            </div>
                        </div>
                        
                        <div class="withdrawal-warning" id="withdrawalWarning" style="display: none;">
                            <i class="fas fa-exclamation-triangle"></i>
                            <span id="withdrawalWarningText"></span>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="closeWithdrawalModal()">Cancel</button>
                        <button class="btn-primary" id="confirmWithdrawalBtn" onclick="submitWithdrawal()">
                            Request Withdrawal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    validateWithdrawalAmount();
}

function closeWithdrawalModal() {
    const modal = document.getElementById('withdrawalModal');
    if (modal) {
        modal.remove();
    }
}

function validateWithdrawalAmount() {
    const input = document.getElementById('withdrawalAmount');
    const amount = parseFloat(input.value) || 0;
    const usdtBalance = walletData.usdtBalance;
    const warning = document.getElementById('withdrawalWarning');
    const warningText = document.getElementById('withdrawalWarningText');
    const btn = document.getElementById('confirmWithdrawalBtn');
    
    // Update summary
    document.getElementById('summaryAmount').textContent = amount.toFixed(2) + ' USDT';
    document.getElementById('summaryReceive').textContent = amount.toFixed(2) + ' USDT';
    
    // Hide warning by default
    warning.style.display = 'none';
    btn.disabled = false;
    
    // Validations
    if (amount < CONFIG.MIN_WITHDRAWAL) {
        warningText.textContent = `Minimum withdrawal is ${CONFIG.MIN_WITHDRAWAL} USDT`;
        warning.style.display = 'flex';
        btn.disabled = true;
        return;
    }
    
    if (amount > usdtBalance) {
        warningText.textContent = `Insufficient USDT balance. Available: ${usdtBalance.toFixed(2)} USDT`;
        warning.style.display = 'flex';
        btn.disabled = true;
        return;
    }
    
    // Check BNB balance for fees
    if (walletData.bnbBalance < CONFIG.WITHDRAWAL_FEE) {
        warningText.textContent = `Insufficient BNB for fees. Need ${CONFIG.WITHDRAWAL_FEE} BNB`;
        warning.style.display = 'flex';
        btn.disabled = true;
    }
}

function validateWithdrawalAddress() {
    const address = document.getElementById('withdrawalAddress').value.trim();
    const warning = document.getElementById('withdrawalWarning');
    const warningText = document.getElementById('withdrawalWarningText');
    const btn = document.getElementById('confirmWithdrawalBtn');
    
    if (!address) {
        warningText.textContent = "Please enter your USDT address";
        warning.style.display = 'flex';
        btn.disabled = true;
        return false;
    }
    
    // Basic address validation (starts with 0x and has 42 chars)
    if (!address.startsWith('0x') || address.length !== 42) {
        warningText.textContent = "Please enter a valid BEP20 address (0x...)";
        warning.style.display = 'flex';
        btn.disabled = true;
        return false;
    }
    
    warning.style.display = 'none';
    btn.disabled = false;
    return true;
}

function submitWithdrawal() {
    const amount = parseFloat(document.getElementById('withdrawalAmount').value);
    const address = document.getElementById('withdrawalAddress').value.trim();
    
    // Final validations
    if (!validateWithdrawalAddress()) {
        return;
    }
    
    if (amount < CONFIG.MIN_WITHDRAWAL) {
        showMessage(`Minimum withdrawal is ${CONFIG.MIN_WITHDRAWAL} USDT`, 'error');
        return;
    }
    
    if (amount > walletData.usdtBalance) {
        showMessage('Insufficient USDT balance', 'error');
        return;
    }
    
    if (walletData.bnbBalance < CONFIG.WITHDRAWAL_FEE) {
        showMessage(`Insufficient BNB for fees. Need ${CONFIG.WITHDRAWAL_FEE} BNB`, 'error');
        return;
    }
    
    // Create withdrawal request
    const withdrawalRequest = {
        userId: userData.userId,
        amount: amount,
        address: address,
        fee: CONFIG.WITHDRAWAL_FEE,
        timestamp: Date.now(),
        status: 'pending'
    };
    
    // Update balances
    walletData.usdtBalance -= amount;
    walletData.bnbBalance -= CONFIG.WITHDRAWAL_FEE;
    walletData.totalWithdrawn += amount;
    
    // Add to pending withdrawals
    walletData.pendingWithdrawals.push(withdrawalRequest);
    
    // Save
    saveWalletData();
    updateWalletUI();
    updateWithdrawalButton();
    
    // Save to Firebase if available
    if (db) {
        saveWithdrawalToFirebase(withdrawalRequest);
    }
    
    // Close modal and show success
    closeWithdrawalModal();
    showMessage(`✅ Withdrawal request submitted! ${amount} USDT will be sent within 24-48 hours`, 'success');
    
    // Log transaction
    logTransaction('WITHDRAWAL', amount, 'USDT', CONFIG.WITHDRAWAL_FEE, 'BNB');
}

// ============================================
// Storage System
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
            
            // Load balance
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
            saveUserData();
        }
        
        // Load wallet data
        initWallet();
        
        // Load from Firebase
        if (db) {
            await loadUserFromFirebase();
        }
        
        console.log("✅ Data loading complete. Final balance:", userData.balance);
        
    } catch (error) {
        console.error("❌ Error loading user data:", error);
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
            version: '5.0'
        };
        
        console.log("💾 Saving user data - Balance:", userData.balance);
        
        // Save to localStorage
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        
        // Verify save
        const verifyData = localStorage.getItem(storageKey);
        if (verifyData) {
            const parsed = JSON.parse(verifyData);
            console.log("✅ User data saved successfully");
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

function saveWalletData() {
    if (!userData.userId) return;
    
    try {
        const storageKey = `vip_wallet_${userData.userId}`;
        
        const dataToSave = {
            usdtBalance: walletData.usdtBalance,
            bnbBalance: walletData.bnbBalance,
            tonBalance: walletData.tonBalance,
            ethBalance: walletData.ethBalance,
            totalWithdrawn: walletData.totalWithdrawn,
            pendingWithdrawals: walletData.pendingWithdrawals,
            lastUpdate: Date.now()
        };
        
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        console.log("💾 Wallet data saved");
        
        // Save to Firebase if available
        if (db) {
            saveWalletToFirebase();
        }
        
    } catch (error) {
        console.error("❌ Wallet save error:", error);
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
                walletData.mwhBalance = firebaseData.balance;
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
            console.log("✅ User saved to Firebase");
        }).catch(error => {
            console.error("❌ Firebase save error:", error);
        });
        
    } catch (error) {
        console.error("❌ Firebase save error:", error);
    }
}

function saveWalletToFirebase() {
    if (!db) return;
    
    try {
        const walletRef = db.collection('wallets').doc(userData.userId);
        
        walletRef.set({
            userId: userData.userId,
            mwhBalance: walletData.mwhBalance,
            usdtBalance: walletData.usdtBalance,
            bnbBalance: walletData.bnbBalance,
            tonBalance: walletData.tonBalance,
            ethBalance: walletData.ethBalance,
            totalWithdrawn: walletData.totalWithdrawn,
            lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(() => {
            console.log("✅ Wallet saved to Firebase");
        }).catch(error => {
            console.error("❌ Wallet Firebase save error:", error);
        });
        
    } catch (error) {
        console.error("❌ Wallet Firebase save error:", error);
    }
}

function saveWithdrawalToFirebase(withdrawalRequest) {
    if (!db) return;
    
    try {
        db.collection('withdrawals').add({
            ...withdrawalRequest,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            console.log("✅ Withdrawal saved to Firebase");
        }).catch(error => {
            console.error("❌ Withdrawal save error:", error);
        });
    } catch (error) {
        console.error("❌ Withdrawal Firebase save error:", error);
    }
}

// ============================================
// Transaction Logging
// ============================================

function logTransaction(type, amount, fromCurrency, fee, feeCurrency) {
    const transaction = {
        type: type,
        userId: userData.userId,
        amount: amount,
        fromCurrency: fromCurrency,
        fee: fee,
        feeCurrency: feeCurrency,
        timestamp: Date.now(),
        status: 'completed'
    };
    
    // Save locally
    const transactions = JSON.parse(localStorage.getItem(`vip_transactions_${userData.userId}`) || '[]');
    transactions.push(transaction);
    localStorage.setItem(`vip_transactions_${userData.userId}`, JSON.stringify(transactions));
    
    // Save to Firebase if available
    if (db) {
        db.collection('transactions').add({
            ...transaction,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(error => {
            console.error("❌ Transaction logging error:", error);
        });
    }
}

// ============================================
// Energy Belt System
// ============================================

function updateEnergyBelt() {
    const energyBelt = document.getElementById('energyBelt');
    const beltFill = document.getElementById('beltFill');
    const beltKnob = document.getElementById('beltKnob');
    const mineBtn = document.getElementById('mineBtn');
    const cooldownTimer = document.getElementById('cooldownTimer');
    
    if (!energyBelt || !beltFill || !beltKnob || !mineBtn) return;
    
    const now = Date.now();
    const timeSinceLastMine = now - userData.lastMineTime;
    const cooldown = CONFIG.MINE_COOLDOWN;
    
    // Calculate fill percentage (0 to 100)
    let fillPercentage = 0;
    
    if (userData.lastMineTime > 0) {
        fillPercentage = Math.min((timeSinceLastMine / cooldown) * 100, 100);
    } else {
        fillPercentage = 100; // First time, ready immediately
    }
    
    // Update visual elements
    beltFill.style.width = `${fillPercentage}%`;
    beltKnob.style.left = `${fillPercentage}%`;
    
    // Check if ready
    const isReady = timeSinceLastMine >= cooldown || userData.lastMineTime === 0;
    
    if (isReady) {
        // Ready to claim
        energyBelt.classList.add('belt-ready');
        energyBelt.classList.remove('belt-emptying');
        mineBtn.classList.add('mine-ready');
        mineBtn.disabled = false;
        
        if (cooldownTimer) {
            cooldownTimer.textContent = 'READY';
            cooldownTimer.style.color = '#22c55e';
            cooldownTimer.style.background = 'rgba(34, 197, 94, 0.1)';
        }
    } else {
        // Waiting
        energyBelt.classList.remove('belt-ready');
        mineBtn.classList.remove('mine-ready');
        mineBtn.disabled = true;
        
        // Update cooldown timer
        if (cooldownTimer) {
            const timeLeft = cooldown - timeSinceLastMine;
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            
            cooldownTimer.textContent = `${hours}h ${minutes}m`;
            cooldownTimer.style.color = '#ef4444';
            cooldownTimer.style.background = 'rgba(239, 68, 68, 0.1)';
        }
    }
}

function animateBeltEmpty() {
    const energyBelt = document.getElementById('energyBelt');
    if (energyBelt) {
        energyBelt.classList.add('belt-emptying');
        setTimeout(() => {
            energyBelt.classList.remove('belt-emptying');
        }, 1000);
    }
}

// ============================================
// UI Updates
// ============================================

function updateUI() {
    // Get current rank
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
    
    // Update numbers
    if (elements.balance) {
        elements.balance.textContent = userData.balance.toLocaleString();
    }
    
    if (elements.referrals) {
        elements.referrals.textContent = `${userData.referrals} Referrals`;
    }
    
    if (elements.totalEarned) {
        elements.totalEarned.textContent = `${userData.totalEarned.toLocaleString()} MWH`;
    }
    
    // Update rank
    if (elements.rankBadge) {
        elements.rankBadge.textContent = userData.rank;
    }
    
    // FIXED: Update mining info with current rank reward
    if (elements.rewardAmount) {
        elements.rewardAmount.textContent = currentRank.reward; // This is correct
    }
    
    if (elements.miningPower) {
        elements.miningPower.innerHTML = `<i class="fas fa-bolt"></i> Yield: ${currentRank.power}`;
    }
    
    // Update referral statistics
    if (elements.refCount) {
        elements.refCount.textContent = userData.referrals;
    }
    
    if (elements.refEarned) {
        elements.refEarned.textContent = userData.referralEarnings.toLocaleString() + " MWH";
    }
    
    if (elements.refRank) {
        elements.refRank.textContent = userData.rank;
    }
    
    // Update USD balance
    updateUSDBalance();
    
    // Update progress bar
    updateProgress();
    
    // Update referral link
    updateReferralLink();
    
    // Update wallet balance
    updateWalletUI();
    
    // Update energy belt
    updateEnergyBelt();
}

function updateUSDBalance() {
    // Calculate USD value
    const usdValue = (userData.balance * CONFIG.MWH_TO_USD).toFixed(3);
    
    // Update in balance card
    if (elements.balanceUSD) {
        elements.balanceUSD.textContent = `≈ $${usdValue}`;
    }
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
            elements.nextRank.textContent = `Next: ${nextRank.name} (${nextRank.min.toLocaleString()} MWH)`;
        }
        
        if (elements.currentPoints) {
            elements.currentPoints.textContent = `${userData.totalEarned.toLocaleString()} MWH`;
        }
        
        if (elements.targetPoints) {
            elements.targetPoints.textContent = `${nextRank.min.toLocaleString()} MWH`;
        }
        
        if (elements.remainingPoints) {
            const remaining = Math.max(0, nextRank.min - userData.totalEarned);
            elements.remainingPoints.textContent = `${remaining.toLocaleString()} MWH`;
        }
        
        // Show next rank bonus
        if (elements.nextRankBonus) {
            const bonusIncrease = nextRank.reward - currentRank.reward;
            elements.nextRankBonus.textContent = `+${bonusIncrease} MWH bonus on upgrade`;
        }
    } else {
        if (elements.progressFill) elements.progressFill.style.width = '100%';
        if (elements.nextRank) elements.nextRank.textContent = 'Highest Rank! 🏆';
        if (elements.remainingPoints) elements.remainingPoints.textContent = '0 MWH';
        if (elements.nextRankBonus) elements.nextRankBonus.textContent = 'Max rank achieved!';
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
        
        const oldReward = currentRank ? currentRank.reward : 250;
        const increase = newRank.reward - oldReward;
        
        showMessage(`🏆 Rank Up! ${oldRank} → ${newRank.name} (+${increase} MWH bonus!)`, 'success');
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
// Event Listeners
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
    
    // Wallet buttons
    if (elements.swapBtn) {
        elements.swapBtn.addEventListener('click', openSwapModal);
        console.log("✅ Swap button listener added");
    }
    
    if (elements.depositBtn) {
        elements.depositBtn.addEventListener('click', openDepositModal);
        console.log("✅ Deposit button listener added");
    }
    
    if (elements.withdrawBtn) {
        elements.withdrawBtn.addEventListener('click', openWithdrawalModal);
        console.log("✅ Withdraw button listener added");
    }
    
    console.log("✅ Event listeners setup complete");
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

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            showMessage('✅ Address copied to clipboard!', 'success');
        })
        .catch(err => {
            console.error('Copy error:', err);
            showMessage('❌ Failed to copy', 'error');
        });
}

function shareOnTelegram() {
    const refLink = generateReferralLink();
    const shareText = `🚀 *Join VIP Mining Wealth PRO!*\n\n⛏️ *Mine 250 MWH every 4 hours*\n👥 *Get +50 MWH BONUS with my link*\n💰 *Earn 50 MWH for each referral*\n\n👉 ${refLink}\n\n💎 *Start earning now!* @VIPMainingPROBot`;
    
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`;
    
    window.open(shareUrl, '_blank');
    showMessage('📱 Opening Telegram...', 'info');
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

// Check cooldown and update belt every second
setInterval(() => {
    updateEnergyBelt();
}, 1000);

// Auto-save every 30 seconds as backup
setInterval(() => {
    if (userData.userId && userData.isInitialized) {
        saveUserData();
        saveWalletData();
    }
}, 30000);

// Save data before page unload
window.addEventListener('beforeunload', function() {
    if (userData.userId) {
        console.log("💾 Saving data before page unload...");
        saveUserData();
        saveWalletData();
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
window.walletData = walletData;
window.showMessage = showMessage;
window.generateReferralLink = generateReferralLink;
window.processReferral = processReferral;
window.saveUserData = saveUserData;
window.updateWalletUI = updateWalletUI;
window.openSwapModal = openSwapModal;
window.openDepositModal = openDepositModal;
window.openWithdrawalModal = openWithdrawalModal;
window.switchPageFixed = switchPageFixed;
window.reinitializeEventListeners = reinitializeEventListeners;

// Debug function
window.debugStorage = function() {
    console.log("🔍 === STORAGE DEBUG ===");
    console.log("User ID:", userData.userId);
    console.log("User balance:", userData.balance);
    console.log("Wallet USDT:", walletData.usdtBalance);
    console.log("Wallet BNB:", walletData.bnbBalance);
    console.log("Version: 5.0 - Complete Update");
    console.log("🔍 === END DEBUG ===");
};

console.log("🎮 VIP Mining App v5.0 loaded successfully");
console.log("✅ New referral system: 50/0");
console.log("✅ Wallet system activated");
console.log("✅ Fixed mining reward display");
