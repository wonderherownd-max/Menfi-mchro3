// ============================================
// VIP Mining Mini App - COMPLETE FINAL VERSION 7.0
// All features included: Staking, Card Purchase, Flip Card, Airdrop, History, Locked Bonus
// Based on original working code with all enhancements
// ============================================

// ============================================
// 1. TELEGRAM WEBAPP INITIALIZATION
// ============================================
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

// ============================================
// 2. FIREBASE CONFIGURATION
// ============================================
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

// ============================================
// 3. USER DATA - متغير (بدون قيم ثابتة)
// ============================================
let userData = {
    balance: 0,
    referrals: 0,
    totalEarned: 0,
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

// ============================================
// 4. PROFESSIONAL WALLET DATA - مع الحجز
// ============================================
let walletData = {
    mwhBalance: 0,
    usdtBalance: 0,
    bnbBalance: 0,
    tonBalance: 0,
    ethBalance: 0,
    totalWithdrawn: 0,
    pendingWithdrawals: [],
    pendingDeposits: [],
    depositHistory: [],
    withdrawalHistory: [],
    usedTransactions: [],
    availableMWH: 0,
    lockedMWH: 0,
    lastUpdate: Date.now()
};

// ============================================
// 5. DAILY EARNING STATS
// ============================================
let dailyStats = {
    adsWatched: 0,
    adsEarned: 0,
    referralCount: 0,
    referralEarned: 0,
    lastReset: Date.now()
};

// ============================================
// 6. STAKING DATA - محدث مع دعم الحجز
// ============================================
let stakingData = {
    activeStakes: [],
    totalStaked: 0,
    totalRewards: 0,
    history: [],
    lastUpdate: Date.now()
};

// ============================================
// 7. CARD DATA - بطاقة MWH Pay مع المكافأة المقفلة (مدة القفل 30 يوم)
// ============================================
let cardData = {
    purchased: false,
    purchaseDate: null,
    bonusAmount: 0,
    airdropAmount: 0,
    totalLocked: 0,
    unlockDate: null,
    buyerNumber: 0,
    claimed: false
};

// ============================================
// 8. TRANSACTION HISTORY - جديد لكل المعاملات
// ============================================
let transactionHistory = {
    swaps: [],
    mining: [],
    staking: [],
    card: [],
    referral: []
};

// ============================================
// 9. CONFIGURATION - COMPLETE WITH ALL SETTINGS
// ============================================
const CONFIG = {
    MINE_COOLDOWN: 14400000,
    
    RANKS: [
        { name: 'Beginner', min: 0, max: 4999, reward: 250, power: '250 MWH/4h' },
        { name: 'Professional', min: 5000, max: 14999, reward: 370, power: '370 MWH/4h' },
        { name: 'Expert', min: 15000, max: 29999, reward: 460, power: '460 MWH/4h' },
        { name: 'VIP', min: 30000, max: 59999, reward: 575, power: '575 MWH/4h' },
        { name: 'Legend', min: 60000, max: 119999, reward: 720, power: '720 MWH/4h' },
        { name: 'Elite', min: 120000, max: Infinity, reward: 900, power: '900 MWH/4h' }
    ],
    
    REFERRAL_REWARD: 0,
    REFERRER_REWARD: 50,
    
    MWH_TO_USD: 0.001,
    BNB_TO_USD: 605,
    TON_TO_USD: 1.32,
    ETH_TO_USD: 1926,
    
    MIN_SWAP: 10000,
    MWH_TO_USDT_RATE: 1000,
    BNB_TO_MWH_RATE: 605000,
    
    MIN_WITHDRAWAL: 50,
    MIN_DEPOSIT_USDT: 10,
    MIN_DEPOSIT_BNB: 0.015,
    WITHDRAWAL_FEE: 0.0005,
    
    DEPOSIT_ADDRESS: "0x790CAB511055F63db2F30AD227f7086bA3B6376a",
    
    MIN_TRANSACTION_LENGTH: 64,
    
    AD_REWARD: 50,
    DAILY_AD_LIMIT: 50,
    
    REFERRAL_CHALLENGES: [
        { target: 10, reward: 1000, claimed: false },
        { target: 25, reward: 3000, claimed: false },
        { target: 100, reward: 12000, bonusBNB: 0.05, claimed: false }
    ],
    
    STAKING_PLANS: [
        { 
            name: 'Fast Pool', 
            days: 7, 
            return: 40, 
            minAmount: 5000, 
            maxAmount: 100000,
            color: 'fast',
            icon: 'fa-rocket'
        },
        { 
            name: 'Medium Pool', 
            days: 15, 
            return: 60, 
            minAmount: 50000, 
            maxAmount: 500000,
            color: 'medium',
            icon: 'fa-chart-line'
        },
        { 
            name: 'Gold Pool', 
            days: 30, 
            return: 70, 
            minAmount: 100000, 
            maxAmount: 10000000,
            color: 'gold',
            icon: 'fa-crown'
        },
        { 
            name: 'VIP Pool', 
            days: 90, 
            return: 80, 
            minAmount: 250000, 
            maxAmount: 25000000,
            color: 'vip',
            icon: 'fa-gem'
        }
    ],
    
    EARLY_WITHDRAWAL_PENALTY: 20,
    
    CARD_PRICE_BNB: 0.019,
    CARD_BONUS_MWH: 100000,
    CARD_LOCK_MONTHS: 1, // تم التعديل من 3 إلى 1 (30 يوم)
    CARD_AIRDROP_TOTAL: 500000000,
    CARD_MAX_BUYERS: 5000,
    CARD_CURRENT_BUYERS: 3803
};

// ============================================
// 10. ADMIN PANEL SYSTEM - COMPLETE
// ============================================
let adminAccess = false;
let gemClickCount = 0;
let lastGemClickTime = 0;
const ADMIN_PASSWORD = "Ali97$";
const ADMIN_TELEGRAM_ID = "1653918641";

function initAdminSystem() {
    const gemIcon = document.querySelector('.logo i.fa-gem');
    if (gemIcon) {
        gemIcon.addEventListener('click', handleGemClick);
        console.log("💎 Admin system initialized");
    }
}

function handleGemClick() {
    const now = Date.now();
    
    if (now - lastGemClickTime > 2000) {
        gemClickCount = 0;
    }
    
    gemClickCount++;
    lastGemClickTime = now;
    
    console.log(`💎 Gem click ${gemClickCount}/5`);
    
    if (gemClickCount >= 5) {
        showAdminLogin();
        gemClickCount = 0;
    }
}

function showAdminLogin() {
    const adminLoginHTML = `
        <div class="modal-overlay" id="adminLoginModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-lock"></i> Admin Access</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 48px; margin-bottom: 20px;">🔒</div>
                        <h3 style="color: #f8fafc; margin-bottom: 20px;">Administrator Access</h3>
                        <p style="color: #94a3b8; margin-bottom: 30px;">Enter administrator password</p>
                        
                        <div style="margin-bottom: 20px;">
                            <input type="password" 
                                   id="adminPasswordInput" 
                                   style="width: 100%; padding: 12px 15px; background: rgba(0,0,0,0.3); border: 1px solid rgba(59,130,246,0.3); border-radius: 8px; color: white; font-size: 16px;"
                                   placeholder="Enter password">
                        </div>
                        
                        <button onclick="checkAdminPassword()" 
                                style="width: 100%; padding: 12px; background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                            <i class="fas fa-sign-in-alt"></i> Login
                        </button>
                        
                        <div id="adminError" style="color: #ef4444; margin-top: 15px; display: none;">
                            <i class="fas fa-exclamation-circle"></i> <span id="adminErrorText"></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', adminLoginHTML);
}

function checkAdminPassword() {
    const passwordInput = document.getElementById('adminPasswordInput');
    const errorDiv = document.getElementById('adminError');
    const errorText = document.getElementById('adminErrorText');
    
    if (!passwordInput || !errorDiv || !errorText) return;
    
    if (passwordInput.value !== ADMIN_PASSWORD) {
        errorText.textContent = "Incorrect password";
        errorDiv.style.display = 'block';
        passwordInput.style.borderColor = '#ef4444';
        setTimeout(() => {
            errorDiv.style.display = 'none';
            passwordInput.style.borderColor = 'rgba(59,130,246,0.3)';
        }, 2000);
        return;
    }
    
    let telegramUserId = null;
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        telegramUserId = tg.initDataUnsafe.user.id.toString();
        console.log("🔍 Checking Telegram ID:", telegramUserId);
    }
    
    if (!telegramUserId) {
        errorText.textContent = "Telegram user not detected";
        errorDiv.style.display = 'block';
        passwordInput.style.borderColor = '#ef4444';
        setTimeout(() => {
            errorDiv.style.display = 'none';
            passwordInput.style.borderColor = 'rgba(59,130,246,0.3)';
        }, 2000);
        return;
    }
    
    if (telegramUserId !== ADMIN_TELEGRAM_ID) {
        errorText.textContent = "Access denied: Invalid Telegram ID";
        errorDiv.style.display = 'block';
        passwordInput.style.borderColor = '#ef4444';
        setTimeout(() => {
            errorDiv.style.display = 'none';
            passwordInput.style.borderColor = 'rgba(59,130,246,0.3)';
        }, 2000);
        return;
    }
    
    adminAccess = true;
    closeModal();
    showAdminPanel();
    showMessage('✅ Admin access granted', 'success');
    console.log("🔓 Admin access granted for Telegram ID:", telegramUserId);
}

function showAdminPanel() {
    const adminPanelHTML = `
        <div class="modal-overlay" id="adminPanel">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3><i class="fas fa-user-shield"></i> Admin Panel</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                
                <div class="modal-body">
                    <div style="display: flex; gap: 10px; margin-bottom: 25px;">
                        <button class="tab-btn active" onclick="switchAdminTab('deposits')">
                            <i class="fas fa-download"></i> Pending Deposits
                            <span class="tab-badge" id="pendingDepositsCount">0</span>
                        </button>
                        <button class="tab-btn" onclick="switchAdminTab('withdrawals')">
                            <i class="fas fa-upload"></i> Pending Withdrawals
                            <span class="tab-badge" id="pendingWithdrawalsCount">0</span>
                        </button>
                        <button class="tab-btn" onclick="switchAdminTab('users')">
                            <i class="fas fa-users"></i> User Management
                        </button>
                    </div>
                    
                    <div id="adminDepositsTab">
                        <div class="section-title">
                            <i class="fas fa-download"></i>
                            <span>Pending Deposit Requests</span>
                        </div>
                        <div id="adminDepositsList" style="max-height: 300px; overflow-y: auto; margin-bottom: 20px;">
                            <div class="empty-pending">
                                <div class="empty-icon-small">
                                    <i class="fas fa-clock"></i>
                                </div>
                                <div class="empty-text">Loading pending deposits...</div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="adminWithdrawalsTab" style="display: none;">
                        <div class="section-title">
                            <i class="fas fa-upload"></i>
                            <span>Pending Withdrawal Requests</span>
                        </div>
                        <div id="adminWithdrawalsList" style="max-height: 300px; overflow-y: auto; margin-bottom: 20px;">
                            <div class="empty-pending">
                                <div class="empty-icon-small">
                                    <i class="fas fa-clock"></i>
                                </div>
                                <div class="empty-text">Loading pending withdrawals...</div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="adminUsersTab" style="display: none;">
                        <div class="section-title">
                            <i class="fas fa-user-cog"></i>
                            <span>User Balance Management</span>
                        </div>
                        
                        <div style="background: rgba(15,23,42,0.8); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                            <div style="margin-bottom: 15px;">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                                    <i class="fas fa-user" style="color: #60a5fa;"></i>
                                    <span style="color: #cbd5e0; font-size: 14px;">Add Balance to Specific User</span>
                                </div>
                                
                                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                                    <div style="flex: 1;">
                                        <div style="font-size: 12px; color: #94a3b8; margin-bottom: 5px;">User ID or Username</div>
                                        <input type="text" 
                                               id="adminUserId" 
                                               style="width: 100%; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(59,130,246,0.3); border-radius: 8px; color: white;"
                                               placeholder="Enter user ID or username">
                                    </div>
                                    <div style="flex: 1;">
                                        <div style="font-size: 12px; color: #94a3b8; margin-bottom: 5px;">Amount (MWH)</div>
                                        <input type="number" 
                                               id="adminUserAmount" 
                                               style="width: 100%; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(59,130,246,0.3); border-radius: 8px; color: white;"
                                               placeholder="Amount" 
                                               min="1" 
                                               step="1">
                                    </div>
                                </div>
                                
                                <button onclick="addBalanceToSpecificUser()" 
                                        style="width: 100%; padding: 12px; background: linear-gradient(135deg, #3b82f6, #6366f1); color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                                    <i class="fas fa-plus-circle"></i> Add Balance to User
                                </button>
                            </div>
                            
                            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                                    <i class="fas fa-users" style="color: #fbbf24;"></i>
                                    <span style="color: #cbd5e0; font-size: 14px;">Add Balance to All Users</span>
                                </div>
                                <div style="display: flex; gap: 10px;">
                                    <input type="number" 
                                           id="adminAddAmount" 
                                           style="flex: 1; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(59,130,246,0.3); border-radius: 8px; color: white;"
                                           placeholder="Amount" 
                                           min="1" 
                                           step="1">
                                    <button onclick="addBalanceToAllUsers()" 
                                            style="padding: 10px 20px; background: linear-gradient(135deg, #22c55e, #10b981); color: white; border: none; border-radius: 8px; font-weight: 600;">
                                        Add to All
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div style="background: rgba(15,23,42,0.8); border-radius: 12px; padding: 20px;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                                <i class="fas fa-search" style="color: #8b5cf6;"></i>
                                <span style="color: #cbd5e0; font-size: 14px;">Search User by ID or Username</span>
                            </div>
                            
                            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                                <input type="text" 
                                       id="adminSearchUserId" 
                                       style="flex: 1; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(59,130,246,0.3); border-radius: 8px; color: white;"
                                       placeholder="Enter user ID or username to search">
                                <button onclick="searchUserById()" 
                                        style="padding: 10px 20px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; border: none; border-radius: 8px; font-weight: 600;">
                                    <i class="fas fa-search"></i> Search
                                </button>
                            </div>
                            
                            <div id="adminUserInfo" style="display: none;">
                                <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 15px; margin-top: 15px;">
                                    <div style="font-size: 14px; color: #94a3b8; margin-bottom: 5px;">User Information</div>
                                    <div style="font-size: 16px; color: #f8fafc; font-weight: 600; margin-bottom: 10px;" id="adminFoundUsername">Username</div>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                        <div>
                                            <div style="font-size: 12px; color: #94a3b8;">Balance</div>
                                            <div style="font-size: 14px; color: #fbbf24; font-weight: 600;" id="adminFoundBalance">0 MWH</div>
                                        </div>
                                        <div>
                                            <div style="font-size: 12px; color: #94a3b8;">Total Earned</div>
                                            <div style="font-size: 14px; color: #22c55e; font-weight: 600;" id="adminFoundTotalEarned">0 MWH</div>
                                        </div>
                                        <div>
                                            <div style="font-size: 12px; color: #94a3b8;">Referrals</div>
                                            <div style="font-size: 14px; color: #60a5fa; font-weight: 600;" id="adminFoundReferrals">0</div>
                                        </div>
                                        <div>
                                            <div style="font-size: 12px; color: #94a3b8;">Rank</div>
                                            <div style="font-size: 14px; color: #f59e0b; font-weight: 600;" id="adminFoundRank">Beginner</div>
                                        </div>
                                    </div>
                                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1);">
                                        <div style="font-size: 12px; color: #94a3b8;">User ID in Firebase:</div>
                                        <div style="font-size: 13px; color: #cbd5e0; font-family: monospace; word-break: break-all;" id="adminFoundUserId">-</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', adminPanelHTML);
    loadAdminPendingRequests();
    
    if (window.adminRefreshInterval) clearInterval(window.adminRefreshInterval);
    window.adminRefreshInterval = setInterval(loadAdminPendingRequests, 30000);
}

async function loadAdminPendingRequests() {
    if (!adminAccess || !db) {
        console.log("❌ No admin access or connection");
        return;
    }
    
    console.log("🔄 Loading admin requests...");
    
    try {
        const depositsQuery = await db.collection('deposit_requests')
            .orderBy('timestamp', 'desc')
            .limit(100)
            .get();
        
        console.log(`📥 Total deposits: ${depositsQuery.size}`);
        
        const pendingDeposits = [];
        
        depositsQuery.forEach(doc => {
            const data = doc.data();
            const status = data.status ? data.status.toString().toLowerCase().trim() : '';
            
            console.log(`🔍 Checking deposit ${doc.id}: status="${data.status}"`);
            
            if (!status || status === 'pending' || status === 'قيد الانتظار') {
                pendingDeposits.push({ 
                    firebaseId: doc.id,
                    ...data 
                });
            }
        });
        
        console.log(`⏳ Pending deposits: ${pendingDeposits.length}`);
        
        const depositsList = document.getElementById('adminDepositsList');
        const depositsCount = document.getElementById('pendingDepositsCount');
        
        if (depositsCount) {
            depositsCount.textContent = pendingDeposits.length;
        }
        
        if (depositsList) {
            if (pendingDeposits.length === 0) {
                depositsList.innerHTML = `
                    <div class="empty-pending">
                        <div class="empty-icon-small">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="empty-text">No pending deposit requests</div>
                    </div>
                `;
            } else {
                let html = '';
                pendingDeposits.forEach(item => {
                    const date = item.timestamp?.toDate ? item.timestamp.toDate() : new Date(item.timestamp || Date.now());
                    
                    const currency = item.currency || 'USDT';
                    const safeCurrency = currency.replace(/'/g, "\\'");
                    
                    html += `
                        <div class="transaction-card pending" style="margin-bottom: 10px;">
                            <div class="transaction-header">
                                <div class="transaction-type">
                                    <div class="type-icon deposit">
                                        <i class="fas fa-download"></i>
                                    </div>
                                    <div class="type-info">
                                        <div class="type-title">${item.username || 'User'}</div>
                                        <div class="type-subtitle">ID: ${item.userId || 'Unknown'}</div>
                                    </div>
                                </div>
                                <div class="transaction-status pending-badge">
                                    <i class="fas fa-clock"></i>
                                    <span>Pending</span>
                                </div>
                            </div>
                            <div class="transaction-details">
                                <div class="detail-row">
                                    <span>Amount:</span>
                                    <span class="detail-value">${item.amount || 0} ${currency}</span>
                                </div>
                                <div class="detail-row">
                                    <span>Transaction:</span>
                                    <span class="detail-value hash" title="${item.transactionHash || 'None'}">
                                        ${item.transactionHash ? item.transactionHash.substring(0, 10) + '...' + item.transactionHash.substring(item.transactionHash.length - 6) : 'Not available'}
                                    </span>
                                </div>
                                <div class="detail-row">
                                    <span>Date:</span>
                                    <span class="detail-value">${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px; margin-top: 10px;">
                                <button onclick="approveDepositRequest('${item.firebaseId}', '${item.userId}', ${item.amount}, '${safeCurrency}')" 
                                        style="flex: 1; padding: 8px; background: linear-gradient(135deg, #22c55e, #10b981); color: white; border: none; border-radius: 6px; font-weight: 600;">
                                    <i class="fas fa-check"></i> Approve
                                </button>
                                <button onclick="rejectDepositRequest('${item.firebaseId}')" 
                                        style="flex: 1; padding: 8px; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; border-radius: 6px; font-weight: 600;">
                                    <i class="fas fa-times"></i> Reject
                                </button>
                            </div>
                        </div>
                    `;
                });
                depositsList.innerHTML = html;
            }
        }
        
        const withdrawalsQuery = await db.collection('withdrawals')
            .orderBy('timestamp', 'desc')
            .limit(100)
            .get();
        
        console.log(`📤 Total withdrawals: ${withdrawalsQuery.size}`);
        
        const pendingWithdrawals = [];
        withdrawalsQuery.forEach(doc => {
            const data = doc.data();
            const status = data.status ? data.status.toString().toLowerCase().trim() : '';
            
            if (!status || status === 'pending' || status === 'قيد الانتظار') {
                pendingWithdrawals.push({ 
                    firebaseId: doc.id,
                    ...data 
                });
            }
        });
        
        console.log(`⏳ Pending withdrawals: ${pendingWithdrawals.length}`);
        
        const withdrawalsList = document.getElementById('adminWithdrawalsList');
        const withdrawalsCount = document.getElementById('pendingWithdrawalsCount');
        
        if (withdrawalsCount) {
            withdrawalsCount.textContent = pendingWithdrawals.length;
        }
        
        if (withdrawalsList) {
            if (pendingWithdrawals.length === 0) {
                withdrawalsList.innerHTML = `
                    <div class="empty-pending">
                        <div class="empty-icon-small">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="empty-text">No pending withdrawal requests</div>
                    </div>
                `;
            } else {
                let html = '';
                pendingWithdrawals.forEach(item => {
                    const date = item.timestamp?.toDate ? item.timestamp.toDate() : new Date(item.timestamp || Date.now());
                    html += `
                        <div class="transaction-card pending" style="margin-bottom: 10px;">
                            <div class="transaction-header">
                                <div class="transaction-type">
                                    <div class="type-icon withdrawal">
                                        <i class="fas fa-upload"></i>
                                    </div>
                                    <div class="type-info">
                                        <div class="type-title">${item.username || 'User'}</div>
                                        <div class="type-subtitle">ID: ${item.userId || 'Unknown'}</div>
                                    </div>
                                </div>
                                <div class="transaction-status pending-badge">
                                    <i class="fas fa-clock"></i>
                                    <span>Pending</span>
                                </div>
                            </div>
                            <div class="transaction-details">
                                <div class="detail-row">
                                    <span>Amount:</span>
                                    <span class="detail-value">${item.amount || 0} ${item.currency || 'USDT'}</span>
                                </div>
                                <div class="detail-row">
                                    <span>Address:</span>
                                    <span class="detail-value hash" title="${item.address || 'None'}">
                                        ${item.address ? item.address.substring(0, 10) + '...' + item.address.substring(item.address.length - 6) : 'Not available'}
                                    </span>
                                </div>
                                <div class="detail-row">
                                    <span>Date:</span>
                                    <span class="detail-value">${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px; margin-top: 10px;">
                                <button onclick="approveWithdrawalRequest('${item.firebaseId}')" 
                                        style="flex: 1; padding: 8px; background: linear-gradient(135deg, #22c55e, #10b981); color: white; border: none; border-radius: 6px; font-weight: 600;">
                                    <i class="fas fa-check"></i> Approve
                                </button>
                                <button onclick="rejectWithdrawalRequest('${item.firebaseId}')" 
                                        style="flex: 1; padding: 8px; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; border-radius: 6px; font-weight: 600;">
                                    <i class="fas fa-times"></i> Reject
                                </button>
                            </div>
                        </div>
                    `;
                });
                withdrawalsList.innerHTML = html;
            }
        }
        
        console.log("✅ Admin requests loaded successfully");
        
    } catch (error) {
        console.error("❌ Error loading admin requests:", error);
        showMessage('❌ Error loading admin data. Check console.', 'error');
    }
}

function switchAdminTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById('adminDepositsTab').style.display = tabName === 'deposits' ? 'block' : 'none';
    document.getElementById('adminWithdrawalsTab').style.display = tabName === 'withdrawals' ? 'block' : 'none';
    document.getElementById('adminUsersTab').style.display = tabName === 'users' ? 'block' : 'none';
    
    const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => 
        btn.textContent.includes(tabName === 'deposits' ? 'Deposits' : 
                                tabName === 'withdrawals' ? 'Withdrawals' : 'Users')
    );
    if (activeBtn) activeBtn.classList.add('active');
}

async function approveDepositRequest(firebaseId, userId, amount, currency) {
    if (!adminAccess || !db) return;
    
    if (!confirm(`Approve deposit of ${amount} ${currency} for user ${userId}?`)) return;
    
    try {
        const depositRef = db.collection('deposit_requests').doc(firebaseId);
        await depositRef.update({
            status: 'approved',
            approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
            approvedBy: 'admin',
            adminNote: 'Manually approved'
        });
        
        console.log(`✅ Deposit approved ${firebaseId} for user ${userId}`);
        
        updateLocalUserData(userId, amount, currency);
        
        const walletRef = db.collection('wallets').doc(userId);
        const walletSnap = await walletRef.get();
        
        if (walletSnap.exists) {
            if (currency === 'USDT') {
                await walletRef.update({
                    usdtBalance: firebase.firestore.FieldValue.increment(parseFloat(amount)),
                    lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log(`💰 Added ${amount} USDT to user wallet`);
            } 
            else if (currency === 'BNB') {
                await walletRef.update({
                    bnbBalance: firebase.firestore.FieldValue.increment(parseFloat(amount)),
                    lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log(`💰 Added ${amount} BNB to user wallet`);
            }
            else if (currency === 'MWH') {
                await walletRef.update({
                    mwhBalance: firebase.firestore.FieldValue.increment(parseFloat(amount)),
                    availableMWH: firebase.firestore.FieldValue.increment(parseFloat(amount)),
                    lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log(`💰 Added ${amount} MWH to user wallet`);
                
                const userRef = db.collection('users').doc(userId);
                await userRef.update({
                    balance: firebase.firestore.FieldValue.increment(parseFloat(amount)),
                    totalEarned: firebase.firestore.FieldValue.increment(parseFloat(amount)),
                    lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } else {
            const newWalletData = {
                userId: userId,
                mwhBalance: 0,
                usdtBalance: 0,
                bnbBalance: 0,
                tonBalance: 0,
                ethBalance: 0,
                totalWithdrawn: 0,
                availableMWH: 0,
                lockedMWH: 0,
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (currency === 'USDT') newWalletData.usdtBalance = parseFloat(amount);
            else if (currency === 'BNB') newWalletData.bnbBalance = parseFloat(amount);
            else if (currency === 'MWH') {
                newWalletData.mwhBalance = parseFloat(amount);
                newWalletData.availableMWH = parseFloat(amount);
            }
            
            await walletRef.set(newWalletData);
            console.log(`💼 Created new wallet and added ${amount} ${currency}`);
            
            if (currency === 'MWH') {
                const userRef = db.collection('users').doc(userId);
                await userRef.update({
                    balance: firebase.firestore.FieldValue.increment(parseFloat(amount)),
                    totalEarned: firebase.firestore.FieldValue.increment(parseFloat(amount)),
                    lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        }
        
        showMessage(`✅ Deposit approved! ${amount} ${currency} added to user`, 'success');
        
        setTimeout(loadAdminPendingRequests, 1000);
        
    } catch (error) {
        console.error("❌ Error approving deposit:", error);
        showMessage('❌ Error approving deposit request', 'error');
    }
}

async function rejectDepositRequest(firebaseId) {
    if (!adminAccess || !db) return;
    
    const reason = prompt("Enter rejection reason:", "Invalid transaction hash");
    if (reason === null) return;
    
    try {
        const depositRef = db.collection('deposit_requests').doc(firebaseId);
        const depositSnap = await depositRef.get();
        
        if (!depositSnap.exists) {
            showMessage('❌ Deposit request not found', 'error');
            return;
        }
        
        const depositData = depositSnap.data();
        const userId = depositData.userId;
        
        await depositRef.update({
            status: 'rejected',
            rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
            rejectedBy: 'admin',
            rejectionReason: reason
        });
        
        showMessage(`❌ Deposit request rejected. Reason: ${reason}`, 'warning');
        
        setTimeout(loadAdminPendingRequests, 1000);
        
    } catch (error) {
        console.error("❌ Error rejecting deposit:", error);
        showMessage('❌ Error rejecting deposit', 'error');
    }
}

async function approveWithdrawalRequest(firebaseId) {
    if (!adminAccess || !db) return;
    
    try {
        const requestRef = db.collection('withdrawals').doc(firebaseId);
        const requestSnap = await requestRef.get();
        
        if (!requestSnap.exists) {
            showMessage('❌ Withdrawal request not found', 'error');
            return;
        }
        
        const requestData = requestSnap.data();
        const userId = requestData.userId;
        const amount = requestData.amount;
        
        if (!confirm(`Approve withdrawal of ${amount} USDT for user ${userId}?`)) return;
        
        await requestRef.update({
            status: 'completed',
            completedAt: firebase.firestore.FieldValue.serverTimestamp(),
            completedBy: 'admin'
        });
        
        console.log(`✅ Withdrawal approved ${amount} USDT for user ${userId}`);
        
        showMessage(`✅ Withdrawal approved! ${amount} USDT sent to user`, 'success');
        
        setTimeout(loadAdminPendingRequests, 1000);
        
    } catch (error) {
        console.error("❌ Error approving withdrawal:", error);
        showMessage('❌ Error approving withdrawal', 'error');
    }
}

async function rejectWithdrawalRequest(firebaseId) {
    if (!adminAccess || !db) return;
    
    try {
        const requestRef = db.collection('withdrawals').doc(firebaseId);
        const requestSnap = await requestRef.get();
        
        if (!requestSnap.exists) {
            showMessage('❌ Withdrawal request not found', 'error');
            return;
        }
        
        const requestData = requestSnap.data();
        const userId = requestData.userId;
        
        const reason = prompt("Enter rejection reason:", "Insufficient balance");
        if (reason === null) return;
        
        await requestRef.update({
            status: 'rejected',
            rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
            rejectedBy: 'admin',
            rejectionReason: reason
        });
        
        showMessage(`❌ Withdrawal request rejected. Reason: ${reason}`, 'warning');
        
        setTimeout(loadAdminPendingRequests, 1000);
        
    } catch (error) {
        console.error("❌ Error rejecting withdrawal:", error);
        showMessage('❌ Error rejecting withdrawal', 'error');
    }
}

async function addBalanceToAllUsers() {
    if (!adminAccess || !db) return;
    
    const amountInput = document.getElementById('adminAddAmount');
    if (!amountInput) return;
    
    const amount = parseFloat(amountInput.value);
    if (!amount || amount <= 0) {
        showMessage('❌ Please enter a valid amount', 'error');
        return;
    }
    
    if (!confirm(`Add ${amount} MWH to all users? This action cannot be undone.`)) return;
    
    try {
        showMessage('⏳ Adding balance to all users...', 'info');
        
        const usersSnapshot = await db.collection('users').get();
        let processed = 0;
        
        const batch = db.batch();
        usersSnapshot.forEach(doc => {
            const userRef = db.collection('users').doc(doc.id);
            batch.update(userRef, {
                balance: firebase.firestore.FieldValue.increment(amount),
                totalEarned: firebase.firestore.FieldValue.increment(amount),
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
            });
            processed++;
        });
        
        await batch.commit();
        
        showMessage(`✅ Added ${amount} MWH to ${processed} users`, 'success');
        amountInput.value = '';
        
    } catch (error) {
        console.error("❌ Error adding balance to all users:", error);
        showMessage('❌ Error adding balance to users', 'error');
    }
}

async function addBalanceToSpecificUser() {
    if (!adminAccess || !db) return;
    
    const userIdInput = document.getElementById('adminUserId');
    const amountInput = document.getElementById('adminUserAmount');
    
    if (!userIdInput || !amountInput) return;
    
    const searchTerm = userIdInput.value.trim();
    const amount = parseFloat(amountInput.value);
    
    if (!searchTerm) {
        showMessage('❌ Please enter user ID or username', 'error');
        return;
    }
    
    if (!amount || amount <= 0) {
        showMessage('❌ Please enter a valid amount', 'error');
        return;
    }
    
    if (!confirm(`Add ${amount} MWH to user ${searchTerm}?`)) return;
    
    try {
        showMessage('⏳ Adding balance to user...', 'info');
        
        let userDoc;
        
        const userRefById = db.collection('users').doc(searchTerm);
        let userSnap = await userRefById.get();
        
        if (!userSnap.exists) {
            const usersSnapshot = await db.collection('users')
                .where('username', '==', searchTerm)
                .limit(1)
                .get();
            
            if (!usersSnapshot.empty) {
                userDoc = usersSnapshot.docs[0];
            }
        } else {
            userDoc = { id: searchTerm, data: () => userSnap.data(), ref: userRefById };
        }
        
        if (!userDoc) {
            showMessage(`❌ User ${searchTerm} not found`, 'error');
            return;
        }
        
        const adminTransaction = {
            id: 'admin_bonus_' + Date.now(),
            userId: userDoc.id,
            amount: amount,
            currency: 'MWH',
            type: 'admin_bonus',
            status: 'completed',
            timestamp: Date.now(),
            note: 'Added by admin'
        };
        
        await userDoc.ref.update({
            balance: firebase.firestore.FieldValue.increment(amount),
            totalEarned: firebase.firestore.FieldValue.increment(amount),
            lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        const walletRef = db.collection('wallets').doc(userDoc.id);
        const walletSnap = await walletRef.get();
        
        if (walletSnap.exists) {
            const walletData = walletSnap.data();
            const updatedDepositHistory = walletData.depositHistory || [];
            updatedDepositHistory.unshift(adminTransaction);
            
            await walletRef.update({
                mwhBalance: firebase.firestore.FieldValue.increment(amount),
                availableMWH: firebase.firestore.FieldValue.increment(amount),
                depositHistory: updatedDepositHistory,
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            await walletRef.set({
                userId: userDoc.id,
                mwhBalance: amount,
                usdtBalance: 0,
                bnbBalance: 0,
                tonBalance: 0,
                ethBalance: 0,
                totalWithdrawn: 0,
                pendingWithdrawals: [],
                pendingDeposits: [],
                depositHistory: [adminTransaction],
                withdrawalHistory: [],
                usedTransactions: [],
                availableMWH: amount,
                lockedMWH: 0,
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        showMessage(`✅ Added ${amount} MWH to user ${userDoc.data().username || searchTerm}`, 'success');
        userIdInput.value = '';
        amountInput.value = '';
        
        const userInfoDiv = document.getElementById('adminUserInfo');
        if (userInfoDiv && userInfoDiv.style.display !== 'none') {
            const foundBalance = document.getElementById('adminFoundBalance');
            if (foundBalance) {
                const currentBalance = parseFloat(foundBalance.textContent.replace(' MWH', ''));
                foundBalance.textContent = `${currentBalance + amount} MWH`;
            }
        }
        
    } catch (error) {
        console.error("❌ Error adding balance to user:", error);
        showMessage('❌ Error adding balance to user', 'error');
    }
}

async function searchUserById() {
    if (!adminAccess || !db) return;
    
    const searchInput = document.getElementById('adminSearchUserId');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) {
        showMessage('❌ Please enter user ID or username', 'error');
        return;
    }
    
    try {
        showMessage('🔍 Searching for user...', 'info');
        
        let userDoc;
        let foundById = false;
        
        const userRefById = db.collection('users').doc(searchTerm);
        let userSnap = await userRefById.get();
        
        if (userSnap.exists) {
            userDoc = { id: searchTerm, data: () => userSnap.data(), ref: userRefById };
            foundById = true;
        } else {
            const usersSnapshot = await db.collection('users')
                .where('username', '==', searchTerm)
                .limit(1)
                .get();
            
            if (!usersSnapshot.empty) {
                userDoc = usersSnapshot.docs[0];
            }
        }
        
        if (!userDoc) {
            showMessage(`❌ User ${searchTerm} not found`, 'error');
            document.getElementById('adminUserInfo').style.display = 'none';
            return;
        }
        
        const userData = userDoc.data();
        
        document.getElementById('adminFoundUsername').textContent = userData.username || 'Unknown';
        document.getElementById('adminFoundBalance').textContent = `${userData.balance || 0} MWH`;
        document.getElementById('adminFoundTotalEarned').textContent = `${userData.totalEarned || 0} MWH`;
        document.getElementById('adminFoundReferrals').textContent = userData.referrals || 0;
        document.getElementById('adminFoundRank').textContent = userData.rank || 'Beginner';
        document.getElementById('adminFoundUserId').textContent = userDoc.id;
        
        const addUserIdInput = document.getElementById('adminUserId');
        if (addUserIdInput) {
            if (foundById) {
                addUserIdInput.value = searchTerm;
            } else {
                addUserIdInput.value = userDoc.id;
            }
        }
        
        document.getElementById('adminUserInfo').style.display = 'block';
        
        showMessage(`✅ User found: ${userData.username}`, 'success');
        
    } catch (error) {
        console.error("❌ Error searching for user:", error);
        showMessage('❌ Error searching for user', 'error');
    }
}

// ============================================
// 11. STAKING SYSTEM - COMPLETE WITH ALL FUNCTIONS
// ============================================

function initStakingPage() {
    console.log("💧 Initializing staking page...");
    updateStakingBalance();
    updateStakingStats();
    checkCompletedStakes();
    updateCardStatus();
    updateAirdropStrip();
    updateActivePlansDisplay();
    updateLockedBonusDisplay();
}

function updateStakingBalance() {
    const balanceEl = document.getElementById('stakingMWHBalance');
    if (balanceEl) {
        balanceEl.textContent = formatNumber(walletData.availableMWH) + ' MWH';
    }
}

function updateStakingStats() {
    const totalStakedEl = document.getElementById('totalStaked');
    const expectedReturnsEl = document.getElementById('expectedReturns');
    const activePlansEl = document.getElementById('activePlansCount');
    
    if (totalStakedEl) {
        totalStakedEl.textContent = formatNumber(stakingData.totalStaked);
    }
    
    if (expectedReturnsEl) {
        expectedReturnsEl.textContent = formatNumber(stakingData.totalRewards);
    }
    
    if (activePlansEl) {
        activePlansEl.textContent = stakingData.activeStakes.length;
    }
}

function updateActivePlansDisplay() {
    const activePlansEl = document.getElementById('activePlansCount');
    if (activePlansEl) {
        activePlansEl.textContent = stakingData.activeStakes.length;
    }
}

function openStakingModal(planIndex) {
    const plan = CONFIG.STAKING_PLANS[planIndex];
    if (!plan) return;
    
    // إزالة أي نافذة مفتوحة قبل فتح نافذة جديدة
    const existingModal = document.getElementById('stakingModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHTML = `
        <div class="modal-overlay" id="stakingModal">
            <div class="modal-content staking-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-lock"></i> Stake in ${plan.name}</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                
                <div class="modal-body">
                    <div class="pool-detail-card">
                        <div class="detail-row">
                            <span class="label">Duration</span>
                            <span class="value">${plan.days} Days</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Return</span>
                            <span class="value highlight">+${plan.return}%</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Min Stake</span>
                            <span class="value">${plan.minAmount.toLocaleString()} MWH</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Max Stake</span>
                            <span class="value">${plan.maxAmount.toLocaleString()} MWH</span>
                        </div>
                    </div>
                    
                    <div class="staking-balance">
                        <span class="label">Available MWH Balance</span>
                        <span class="value" id="modalBalance">${formatNumber(walletData.availableMWH)} MWH</span>
                    </div>
                    
                    <div class="staking-input-section">
                        <div class="staking-input-label">
                            <span>Amount to Stake</span>
                            <span>Min: ${plan.minAmount.toLocaleString()} MWH</span>
                        </div>
                        <div class="staking-input-container">
                            <input type="number" 
                                   id="stakingAmount" 
                                   class="staking-input" 
                                   placeholder="Enter amount"
                                   min="${plan.minAmount}"
                                   max="${Math.min(plan.maxAmount, walletData.availableMWH)}"
                                   step="1"
                                   value="${plan.minAmount}"
                                   oninput="validateStakingAmount(${planIndex})">
                            <button class="staking-max-btn" onclick="setMaxStakingAmount(${planIndex})">MAX</button>
                        </div>
                        <div id="stakingAmountError" style="color: #ef4444; font-size: 12px; margin-top: 5px; display: none;"></div>
                    </div>
                    
                    <div class="staking-receive">
                        <span class="label">You will receive</span>
                        <span class="value" id="stakingReturn">${(plan.minAmount * (1 + plan.return/100)).toLocaleString()} MWH</span>
                    </div>
                    
                    <div class="staking-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Early withdrawal penalty: ${CONFIG.EARLY_WITHDRAWAL_PENALTY}% of principal</span>
                    </div>
                    
                    <div class="staking-actions">
                        <button class="btn-secondary" onclick="closeModal()">Cancel</button>
                        <button class="btn-primary" id="confirmStakeBtn" onclick="confirmStake(${planIndex})">Confirm Stake</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function validateStakingAmount(planIndex) {
    const plan = CONFIG.STAKING_PLANS[planIndex];
    const amountInput = document.getElementById('stakingAmount');
    const errorDiv = document.getElementById('stakingAmountError');
    const returnEl = document.getElementById('stakingReturn');
    const confirmBtn = document.getElementById('confirmStakeBtn');
    
    if (!amountInput || !returnEl || !confirmBtn) return;
    
    let amount = parseFloat(amountInput.value) || 0;
    let isValid = true;
    let errorMessage = '';
    
    if (amount < plan.minAmount) {
        isValid = false;
        errorMessage = `Minimum amount is ${plan.minAmount.toLocaleString()} MWH`;
        amount = plan.minAmount;
    }
    
    if (amount > plan.maxAmount) {
        isValid = false;
        errorMessage = `Maximum amount is ${plan.maxAmount.toLocaleString()} MWH`;
        amount = plan.maxAmount;
    }
    
    if (amount > walletData.availableMWH) {
        isValid = false;
        errorMessage = `Insufficient balance. Available: ${walletData.availableMWH.toLocaleString()} MWH`;
        amount = walletData.availableMWH;
    }
    
    if (!isValid && errorMessage) {
        errorDiv.textContent = errorMessage;
        errorDiv.style.display = 'block';
        amountInput.classList.add('error');
        confirmBtn.disabled = true;
    } else {
        errorDiv.style.display = 'none';
        amountInput.classList.remove('error');
        confirmBtn.disabled = false;
    }
    
    if (amount !== parseFloat(amountInput.value)) {
        amountInput.value = amount;
    }
    
    const totalReturn = amount * (1 + plan.return / 100);
    returnEl.textContent = formatNumber(totalReturn) + ' MWH';
}

function setMaxStakingAmount(planIndex) {
    const plan = CONFIG.STAKING_PLANS[planIndex];
    const amountInput = document.getElementById('stakingAmount');
    if (!amountInput) return;
    
    const maxAmount = Math.min(plan.maxAmount, walletData.availableMWH);
    amountInput.value = maxAmount;
    validateStakingAmount(planIndex);
}

function confirmStake(planIndex) {
    const plan = CONFIG.STAKING_PLANS[planIndex];
    const amountInput = document.getElementById('stakingAmount');
    
    if (!amountInput) return;
    
    const amount = parseFloat(amountInput.value) || 0;
    
    if (amount < plan.minAmount) {
        showMessage(`❌ Minimum stake is ${plan.minAmount.toLocaleString()} MWH`, 'error');
        return;
    }
    
    if (amount > plan.maxAmount) {
        showMessage(`❌ Maximum stake is ${plan.maxAmount.toLocaleString()} MWH`, 'error');
        return;
    }
    
    if (amount > walletData.availableMWH) {
        showMessage(`❌ Insufficient available balance. You have ${walletData.availableMWH.toLocaleString()} MWH available`, 'error');
        return;
    }
    
    const reward = amount * (plan.return / 100);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.days);
    
    const stake = {
        id: 'stake_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        plan: plan.name,
        planIndex: planIndex,
        amount: amount,
        reward: reward,
        totalReturn: amount + reward,
        startDate: Date.now(),
        endDate: endDate.getTime(),
        days: plan.days,
        progress: 0,
        status: 'active',
        canClaim: false,
        earlyPenalty: CONFIG.EARLY_WITHDRAWAL_PENALTY
    };
    
    stakingData.activeStakes.push(stake);
    stakingData.totalStaked += amount;
    stakingData.totalRewards += reward;
    
    walletData.availableMWH -= amount;
    walletData.lockedMWH += amount;
    walletData.mwhBalance = walletData.availableMWH + walletData.lockedMWH;
    
    addToStakingHistory({
        type: 'stake_start',
        stakeId: stake.id,
        plan: plan.name,
        amount: amount,
        expectedReturn: amount + reward,
        timestamp: Date.now(),
        status: 'active'
    });
    
    saveStakingData();
    saveWalletData();
    saveUserData();
    
    updateStakingBalance();
    updateStakingStats();
    updateWalletUI();
    updateUI();
    updateActivePlansDisplay();
    
    closeModal();
    
    showMessage(`✅ Successfully staked ${amount.toLocaleString()} MWH in ${plan.name}!`, 'success');
}

function showActivePlans() {
    if (stakingData.activeStakes.length === 0) {
        // إزالة أي نافذة مفتوحة قبل فتح نافذة جديدة
        const existingModal = document.getElementById('activePlansModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalHTML = `
            <div class="modal-overlay" id="activePlansModal" style="display: flex;">
                <div class="modal-content active-plans-modal">
                    <div class="modal-header">
                        <h3><i class="fas fa-list"></i> Your Active Plans</h3>
                        <button class="modal-close" onclick="closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="empty-plans">
                            <i class="fas fa-inbox"></i>
                            <p>No active stakes</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        return;
    }
    
    let plansHTML = '';
    
    stakingData.activeStakes.forEach(stake => {
        const plan = CONFIG.STAKING_PLANS[stake.planIndex];
        if (!plan) return;
        
        const now = Date.now();
        const totalDuration = stake.endDate - stake.startDate;
        const elapsed = now - stake.startDate;
        let progress = Math.min(Math.floor((elapsed / totalDuration) * 100), 100);
        if (progress < 0) progress = 0;
        
        const timeLeft = stake.endDate - now;
        const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        const isCompleted = progress >= 100;
        const statusClass = isCompleted ? 'completed' : 'active';
        const statusText = isCompleted ? '✅ Completed' : '⏳ Active';
        
        plansHTML += `
            <div class="active-plan-card ${plan.color} ${statusClass}" data-stake-id="${stake.id}">
                <div class="active-plan-header">
                    <div class="plan-name-badge">
                        <div class="plan-icon-small ${plan.color}">
                            <i class="fas ${plan.icon}"></i>
                        </div>
                        <span class="plan-name-small">${plan.name}</span>
                    </div>
                    <div class="plan-status-badge ${statusClass}">${statusText}</div>
                </div>
                
                <div class="active-plan-details">
                    <div class="detail-item-small">
                        <span class="detail-label-small">Staked</span>
                        <span class="detail-value-small">${stake.amount.toLocaleString()} MWH</span>
                    </div>
                    <div class="detail-item-small">
                        <span class="detail-label-small">Return</span>
                        <span class="detail-value-small highlight">+${stake.reward.toLocaleString()} MWH</span>
                    </div>
                    <div class="detail-item-small">
                        <span class="detail-label-small">Total</span>
                        <span class="detail-value-small">${stake.totalReturn.toLocaleString()} MWH</span>
                    </div>
                    <div class="detail-item-small">
                        <span class="detail-label-small">Duration</span>
                        <span class="detail-value-small">${plan.days} days</span>
                    </div>
                </div>
                
                <div class="plan-progress-section">
                    <div class="progress-header-small">
                        <span>Progress</span>
                        <span>${progress}%</span>
                    </div>
                    <div class="progress-bar-small">
                        <div class="progress-fill-small" style="width: ${progress}%;"></div>
                    </div>
                    <div class="time-left-small">
                        ${isCompleted ? 'Ready to claim' : `${daysLeft}d ${hoursLeft}h remaining`}
                    </div>
                </div>
                
                <div class="plan-actions">
                    <button class="btn-cancel-plan" onclick="cancelStake('${stake.id}')" ${isCompleted ? 'disabled' : ''}>
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button class="btn-claim-plan" onclick="claimStake('${stake.id}')" ${!isCompleted ? 'disabled' : ''}>
                        <i class="fas fa-gift"></i> Claim
                    </button>
                </div>
            </div>
        `;
    });
    
    // إزالة أي نافذة مفتوحة قبل فتح نافذة جديدة
    const existingModal = document.getElementById('activePlansModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHTML = `
        <div class="modal-overlay" id="activePlansModal" style="display: flex;">
            <div class="modal-content active-plans-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-list"></i> Your Active Plans</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
                    ${plansHTML}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function cancelStake(stakeId) {
    const stakeIndex = stakingData.activeStakes.findIndex(s => s.id === stakeId);
    if (stakeIndex === -1) return;
    
    const stake = stakingData.activeStakes[stakeIndex];
    const plan = CONFIG.STAKING_PLANS[stake.planIndex];
    
    const penalty = stake.amount * (CONFIG.EARLY_WITHDRAWAL_PENALTY / 100);
    const returnAmount = stake.amount - penalty;
    
    // إزالة أي نافذة مفتوحة قبل فتح نافذة جديدة
    const existingModal = document.getElementById('confirmCancelModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const confirmHTML = `
        <div class="modal-overlay" id="confirmCancelModal" style="display: flex;">
            <div class="modal-content" style="max-width: 350px;">
                <div class="modal-header">
                    <h3><i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i> Early Withdrawal</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                        <h3 style="color: #f8fafc; margin-bottom: 15px;">Cancel ${plan.name}?</h3>
                    </div>
                    
                    <div style="background: rgba(15,23,42,0.8); border-radius: 12px; padding: 15px; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: #94a3b8;">Original stake:</span>
                            <span style="color: #f8fafc; font-weight: 600;">${stake.amount.toLocaleString()} MWH</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="color: #94a3b8;">Penalty (20%):</span>
                            <span style="color: #ef4444; font-weight: 600;">-${penalty.toLocaleString()} MWH</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1);">
                            <span style="color: #f8fafc; font-weight: 600;">You will receive:</span>
                            <span style="color: #22c55e; font-weight: 700; font-size: 18px;">${returnAmount.toLocaleString()} MWH</span>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-secondary" onclick="closeModal()" style="flex: 1;">Go Back</button>
                        <button class="btn-primary" onclick="confirmCancelStake('${stakeId}')" style="flex: 1; background: linear-gradient(135deg, #ef4444, #dc2626);">Confirm Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', confirmHTML);
}

function confirmCancelStake(stakeId) {
    const stakeIndex = stakingData.activeStakes.findIndex(s => s.id === stakeId);
    if (stakeIndex === -1) return;
    
    const stake = stakingData.activeStakes[stakeIndex];
    const plan = CONFIG.STAKING_PLANS[stake.planIndex];
    
    const penalty = stake.amount * (CONFIG.EARLY_WITHDRAWAL_PENALTY / 100);
    const returnAmount = stake.amount - penalty;
    
    stakingData.activeStakes.splice(stakeIndex, 1);
    stakingData.totalStaked -= stake.amount;
    stakingData.totalRewards -= stake.reward;
    
    walletData.availableMWH += returnAmount;
    walletData.lockedMWH -= stake.amount;
    walletData.mwhBalance = walletData.availableMWH + walletData.lockedMWH;
    
    addToStakingHistory({
        type: 'stake_cancelled',
        stakeId: stake.id,
        plan: plan.name,
        amount: stake.amount,
        penalty: penalty,
        received: returnAmount,
        timestamp: Date.now(),
        status: 'cancelled'
    });
    
    saveStakingData();
    saveWalletData();
    saveUserData();
    
    updateStakingBalance();
    updateStakingStats();
    updateWalletUI();
    updateActivePlansDisplay();
    
    closeModal();
    
    showMessage(`⚠️ Stake cancelled. You received ${returnAmount.toLocaleString()} MWH (${penalty.toLocaleString()} MWH penalty).`, 'warning');
}

function claimStake(stakeId) {
    const stakeIndex = stakingData.activeStakes.findIndex(s => s.id === stakeId);
    if (stakeIndex === -1) return;
    
    const stake = stakingData.activeStakes[stakeIndex];
    const plan = CONFIG.STAKING_PLANS[stake.planIndex];
    
    const now = Date.now();
    if (now < stake.endDate) {
        showMessage('❌ This stake is not completed yet', 'error');
        return;
    }
    
    stakingData.activeStakes.splice(stakeIndex, 1);
    stakingData.totalStaked -= stake.amount;
    stakingData.totalRewards -= stake.reward;
    
    walletData.availableMWH += stake.totalReturn;
    walletData.lockedMWH -= stake.amount;
    walletData.mwhBalance = walletData.availableMWH + walletData.lockedMWH;
    
    addToStakingHistory({
        type: 'stake_claimed',
        stakeId: stake.id,
        plan: plan.name,
        amount: stake.amount,
        profit: stake.reward,
        totalReceived: stake.totalReturn,
        timestamp: Date.now(),
        status: 'completed'
    });
    
    saveStakingData();
    saveWalletData();
    saveUserData();
    
    updateStakingBalance();
    updateStakingStats();
    updateWalletUI();
    updateActivePlansDisplay();
    
    closeModal();
    
    showMessage(`🎉 Congratulations! You claimed ${stake.totalReturn.toLocaleString()} MWH (${stake.reward.toLocaleString()} MWH profit).`, 'success');
}

function addToStakingHistory(entry) {
    if (!transactionHistory.staking) {
        transactionHistory.staking = [];
    }
    transactionHistory.staking.unshift(entry);
    saveTransactionHistory();
}

function checkCompletedStakes() {
    const now = Date.now();
    let updated = false;
    
    stakingData.activeStakes.forEach(stake => {
        if (now >= stake.endDate && !stake.canClaim) {
            stake.canClaim = true;
            updated = true;
        }
    });
    
    if (updated) {
        saveStakingData();
        updateActivePlansDisplay();
    }
}

function saveStakingData() {
    if (!userData.userId) return;
    
    try {
        const storageKey = `vip_staking_${userData.userId}`;
        localStorage.setItem(storageKey, JSON.stringify({
            activeStakes: stakingData.activeStakes,
            totalStaked: stakingData.totalStaked,
            totalRewards: stakingData.totalRewards,
            history: stakingData.history,
            lastUpdate: Date.now()
        }));
        console.log("💾 Staking data saved");
    } catch (error) {
        console.error("❌ Staking save error:", error);
    }
}

function loadStakingData() {
    if (!userData.userId) return;
    
    try {
        const storageKey = `vip_staking_${userData.userId}`;
        const saved = localStorage.getItem(storageKey);
        
        if (saved) {
            const parsed = JSON.parse(saved);
            stakingData.activeStakes = parsed.activeStakes || [];
            stakingData.totalStaked = parsed.totalStaked || 0;
            stakingData.totalRewards = parsed.totalRewards || 0;
            stakingData.history = parsed.history || [];
            console.log("✅ Staking data loaded");
        }
    } catch (error) {
        console.error("❌ Staking load error:", error);
    }
}

// ============================================
// 12. CARD SYSTEM - COMPLETE WITH LOCKED BONUS
// ============================================

function updateCardStatus() {
    const cardStatus = document.querySelector('.card-status');
    const myCardsSection = document.getElementById('myCardsSection');
    
    if (cardData.purchased) {
        if (cardStatus) {
            cardStatus.textContent = '✅ Active';
            cardStatus.classList.add('active');
        }
        
        // إظهار قسم My Cards
        if (myCardsSection) {
            myCardsSection.style.display = 'block';
        }
        
        // تحديث عداد التنازلي
        updateLockTimer();
        
    } else {
        if (cardStatus) {
            cardStatus.textContent = '🔒 Inactive';
            cardStatus.classList.remove('active');
        }
        
        if (myCardsSection) {
            myCardsSection.style.display = 'none';
        }
    }
}

function updateLockTimer() {
    if (!cardData.purchased || !cardData.unlockDate) return;
    
    const now = Date.now();
    const unlockTime = cardData.unlockDate;
    const timeLeft = unlockTime - now;
    
    if (timeLeft <= 0) {
        // المكافأة أصبحت قابلة للمطالبة
        document.getElementById('unlockDate1').textContent = 'Ready to claim';
        document.getElementById('cardProgress1').style.width = '100%';
        document.getElementById('claimSmallBtn1').disabled = false;
        return;
    }
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    document.getElementById('unlockDate1').textContent = `Unlocks in ${days}d ${hours}h`;
    
    // حساب نسبة التقدم
    const totalLockTime = 30 * 24 * 60 * 60 * 1000; // 30 يوم بالمللي ثانية
    const progress = ((totalLockTime - timeLeft) / totalLockTime) * 100;
    document.getElementById('cardProgress1').style.width = `${progress}%`;
}

function claimLockedBonus() {
    if (!cardData.purchased || cardData.claimed) {
        showMessage('❌ Bonus already claimed', 'error');
        return;
    }
    
    const now = Date.now();
    if (now < cardData.unlockDate) {
        showMessage('❌ Bonus is still locked', 'error');
        return;
    }
    
    // إضافة المكافأة إلى الرصيد المتاح
    walletData.availableMWH += cardData.bonusAmount;
    walletData.mwhBalance = walletData.availableMWH + walletData.lockedMWH;
    
    cardData.claimed = true;
    cardData.totalLocked = 0;
    
    // تسجيل في التاريخ
    addToCardHistory({
        type: 'bonus_claimed',
        amount: cardData.bonusAmount,
        timestamp: Date.now()
    });
    
    saveCardData();
    saveWalletData();
    
    // إخفاء قسم My Cards أو تحديثه
    document.getElementById('myCardsSection').style.display = 'none';
    
    updateStakingBalance();
    updateWalletUI();
    
    showMessage(`✅ Bonus claimed! +${cardData.bonusAmount.toLocaleString()} MWH added to your balance`, 'success');
}

function updateAirdropStrip() {
    const airdropProgress = document.querySelector('.airdrop-progress');
    const airdropLeft = document.getElementById('airdropLeft');
    
    if (airdropProgress) {
        airdropProgress.textContent = `${CONFIG.CARD_CURRENT_BUYERS.toLocaleString()}/${CONFIG.CARD_MAX_BUYERS.toLocaleString()}`;
    }
    
    if (airdropLeft) {
        const left = CONFIG.CARD_MAX_BUYERS - CONFIG.CARD_CURRENT_BUYERS;
        airdropLeft.textContent = `${left.toLocaleString()} left`;
    }
}

function showCardPurchaseModal() {
    if (cardData.purchased) {
        showMessage('✅ You already own this card!', 'success');
        flipCard();
        return;
    }
    
    // إزالة أي نافذة مفتوحة قبل فتح نافذة جديدة
    const existingModal = document.getElementById('cardPurchaseModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const airdropShare = CONFIG.CARD_AIRDROP_TOTAL / CONFIG.CARD_MAX_BUYERS;
    const progressPercent = (CONFIG.CARD_CURRENT_BUYERS / CONFIG.CARD_MAX_BUYERS) * 100;
    const bnbBalance = walletData.bnbBalance || 0;
    
    const modalHTML = `
        <div class="modal-overlay" id="cardPurchaseModal">
            <div class="modal-content purchase-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-credit-card"></i> MWH Pay Card</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">💳</div>
                        <h3 style="color: #f8fafc;">Get Your Premium Card</h3>
                    </div>
                    
                    <div class="purchase-price">
                        <div class="purchase-price-label">Price</div>
                        <div class="purchase-price-value">${CONFIG.CARD_PRICE_BNB} BNB</div>
                        <div class="purchase-price-usd">≈ $${(CONFIG.CARD_PRICE_BNB * CONFIG.BNB_TO_USD).toFixed(2)}</div>
                    </div>
                    
                    <div class="purchase-rewards">
                        <div class="purchase-reward-item">
                            <span class="purchase-reward-label">Bonus (locked 30 days)</span>
                            <span class="purchase-reward-value">+${CONFIG.CARD_BONUS_MWH.toLocaleString()} MWH</span>
                        </div>
                        <div class="purchase-reward-item">
                            <span class="purchase-reward-label">Airdrop share</span>
                            <span class="purchase-reward-value">+${airdropShare.toLocaleString()} MWH</span>
                        </div>
                        <div class="purchase-reward-total">
                            <span class="label">Total</span>
                            <span class="value">+${(CONFIG.CARD_BONUS_MWH + airdropShare).toLocaleString()} MWH</span>
                        </div>
                    </div>
                    
                    <div class="purchase-progress">
                        <div class="purchase-progress-header">
                            <span>Airdrop Progress</span>
                            <span>${CONFIG.CARD_CURRENT_BUYERS.toLocaleString()}/${CONFIG.CARD_MAX_BUYERS.toLocaleString()}</span>
                        </div>
                        <div class="purchase-progress-bar">
                            <div class="purchase-progress-fill" style="width: ${progressPercent}%;"></div>
                        </div>
                        <div class="purchase-progress-stats">
                            <span class="purchase-progress-sold">${progressPercent.toFixed(1)}% Sold</span>
                            <span class="purchase-progress-remaining">${(CONFIG.CARD_MAX_BUYERS - CONFIG.CARD_CURRENT_BUYERS).toLocaleString()} left</span>
                        </div>
                    </div>
                    
                    <div class="purchase-balance">
                        <span class="label">Your BNB Balance</span>
                        <span class="value">${bnbBalance.toFixed(4)} BNB</span>
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-secondary" onclick="closeModal()" style="flex: 1;">Cancel</button>
                        <button class="btn-primary" onclick="purchaseCard()" style="flex: 1;" ${bnbBalance < CONFIG.CARD_PRICE_BNB ? 'disabled' : ''}>
                            Buy Now
                        </button>
                    </div>
                    
                    ${bnbBalance < CONFIG.CARD_PRICE_BNB ? 
                        '<p style="color: #ef4444; font-size: 12px; margin-top: 10px; text-align: center;">Insufficient BNB balance</p>' : ''}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function purchaseCard() {
    if (walletData.bnbBalance < CONFIG.CARD_PRICE_BNB) {
        showMessage('❌ Insufficient BNB balance', 'error');
        return;
    }
    
    if (cardData.purchased) {
        showMessage('❌ You already own this card', 'error');
        return;
    }
    
    walletData.bnbBalance -= CONFIG.CARD_PRICE_BNB;
    
    const airdropShare = CONFIG.CARD_AIRDROP_TOTAL / CONFIG.CARD_MAX_BUYERS;
    const bonusAmount = CONFIG.CARD_BONUS_MWH;
    
    const unlockDate = new Date();
    unlockDate.setDate(unlockDate.getDate() + 30); // 30 يوم بالضبط
    
    cardData.purchased = true;
    cardData.purchaseDate = Date.now();
    cardData.bonusAmount = bonusAmount;
    cardData.airdropAmount = airdropShare;
    cardData.totalLocked = bonusAmount;
    cardData.unlockDate = unlockDate.getTime();
    cardData.buyerNumber = CONFIG.CARD_CURRENT_BUYERS + 1;
    cardData.claimed = false;
    
    CONFIG.CARD_CURRENT_BUYERS++;
    
    walletData.availableMWH += airdropShare;
    walletData.mwhBalance = walletData.availableMWH + walletData.lockedMWH;
    
    addToCardHistory({
        type: 'card_purchase',
        price: CONFIG.CARD_PRICE_BNB,
        instantBonus: airdropShare,
        lockedBonus: bonusAmount,
        unlockDate: unlockDate.getTime(),
        buyerNumber: cardData.buyerNumber,
        timestamp: Date.now()
    });
    
    saveCardData();
    saveWalletData();
    saveUserData();
    
    updateCardStatus();
    updateWalletUI();
    updateStakingBalance();
    updateAirdropStrip();
    
    closeModal();
    
    showMessage(`✅ Card purchased successfully! You received ${airdropShare.toLocaleString()} MWH instantly and ${bonusAmount.toLocaleString()} MWH locked for 30 days.`, 'success');
    
    setTimeout(() => {
        flipCard();
    }, 500);
}

function addToCardHistory(entry) {
    if (!transactionHistory.card) {
        transactionHistory.card = [];
    }
    transactionHistory.card.unshift(entry);
    saveTransactionHistory();
}

function flipCard() {
    const cardInner = document.getElementById('cardFlipInner');
    if (cardInner) {
        if (cardInner.style.transform === 'rotateY(180deg)') {
            cardInner.style.transform = 'rotateY(0deg)';
        } else {
            cardInner.style.transform = 'rotateY(180deg)';
            setTimeout(() => {
                cardInner.style.transform = 'rotateY(0deg)';
            }, 2000);
        }
    }
}

function saveCardData() {
    if (!userData.userId) return;
    
    try {
        const storageKey = `vip_card_${userData.userId}`;
        localStorage.setItem(storageKey, JSON.stringify(cardData));
        console.log("💾 Card data saved");
    } catch (error) {
        console.error("❌ Card save error:", error);
    }
}

function loadCardData() {
    if (!userData.userId) return;
    
    try {
        const storageKey = `vip_card_${userData.userId}`;
        const saved = localStorage.getItem(storageKey);
        
        if (saved) {
            const parsed = JSON.parse(saved);
            cardData = parsed;
            console.log("✅ Card data loaded");
        }
    } catch (error) {
        console.error("❌ Card load error:", error);
    }
}

function showCardActivationModal() {
    const card = document.getElementById('cardFlipContainer');
    if (card) {
        card.classList.add('card-shake');
        card.classList.add('card-glow');
        
        setTimeout(() => {
            card.classList.remove('card-shake');
        }, 500);
        
        setTimeout(() => {
            card.classList.remove('card-glow');
        }, 1000);
    }
    
    if (cardData.purchased) {
        showMessage('✅ Your card is already active!', 'success');
        flipCard();
    } else {
        showCardPurchaseModal();
    }
}

function updateLockedBonusDisplay() {
    if (cardData.purchased && !cardData.claimed) {
        updateLockTimer();
        
        // تحديث عداد التنازلي كل دقيقة
        setInterval(updateLockTimer, 60000);
    }
}

// ============================================
// 13. TRANSACTION HISTORY SYSTEM - النسخة الأصلية
// ============================================

function showTransactionHistory() {
    console.log("📜 Showing enhanced transaction history");
    
    updateHistoryBadges();
    
    const modal = document.getElementById('historyModal');
    if (modal) {
        modal.style.display = 'flex';
        populatePendingTab();
        populateDepositsTab();
        populateWithdrawalsTab();
        populateAllTab();
    } else {
        console.error("❌ History modal not found");
        showMessage("Error opening history", "error");
    }
}

function updateHistoryBadges() {
    const pendingBadge = document.getElementById('pendingBadge');
    if (pendingBadge) {
        const pendingCount = (walletData.pendingDeposits?.length || 0) + (walletData.pendingWithdrawals?.length || 0);
        pendingBadge.textContent = pendingCount;
        pendingBadge.style.display = pendingCount > 0 ? 'flex' : 'none';
    }
}

function populatePendingTab() {
    const pendingDepositsList = document.getElementById('pendingDepositsList');
    if (pendingDepositsList) {
        if (!walletData.pendingDeposits || walletData.pendingDeposits.length === 0) {
            pendingDepositsList.innerHTML = '<div class="empty-text">No pending deposits</div>';
        } else {
            let html = '';
            walletData.pendingDeposits.forEach(deposit => {
                const date = new Date(deposit.timestamp);
                html += `
                    <div class="history-item-card">
                        <div class="history-item-header">
                            <div class="history-item-type">
                                <div class="history-type-icon pending"><i class="fas fa-clock"></i></div>
                                <span class="history-type-name">Deposit Pending</span>
                            </div>
                            <div class="history-item-status pending">Pending</div>
                        </div>
                        <div class="history-item-details">
                            <div class="history-detail-row">
                                <span class="history-detail-label">Amount:</span>
                                <span class="history-detail-value positive">+${deposit.amount} ${deposit.currency}</span>
                            </div>
                            <div class="history-detail-row">
                                <span class="history-detail-label">Hash:</span>
                                <span class="history-detail-value hash">${deposit.transactionHash?.substring(0, 10)}...</span>
                            </div>
                        </div>
                        <div class="history-item-footer">
                            <span class="history-item-time"><i class="far fa-clock"></i> ${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>
                        </div>
                    </div>
                `;
            });
            pendingDepositsList.innerHTML = html;
        }
    }
    
    const pendingWithdrawalsList = document.getElementById('pendingWithdrawalsList');
    if (pendingWithdrawalsList) {
        if (!walletData.pendingWithdrawals || walletData.pendingWithdrawals.length === 0) {
            pendingWithdrawalsList.innerHTML = '<div class="empty-text">No pending withdrawals</div>';
        } else {
            let html = '';
            walletData.pendingWithdrawals.forEach(withdrawal => {
                const date = new Date(withdrawal.timestamp);
                html += `
                    <div class="history-item-card">
                        <div class="history-item-header">
                            <div class="history-item-type">
                                <div class="history-type-icon pending"><i class="fas fa-clock"></i></div>
                                <span class="history-type-name">Withdrawal Pending</span>
                            </div>
                            <div class="history-item-status pending">Pending</div>
                        </div>
                        <div class="history-item-details">
                            <div class="history-detail-row">
                                <span class="history-detail-label">Amount:</span>
                                <span class="history-detail-value negative">-${withdrawal.amount} USDT</span>
                            </div>
                            <div class="history-detail-row">
                                <span class="history-detail-label">Address:</span>
                                <span class="history-detail-value hash">${withdrawal.address?.substring(0, 10)}...</span>
                            </div>
                        </div>
                        <div class="history-item-footer">
                            <span class="history-item-time"><i class="far fa-clock"></i> ${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>
                        </div>
                    </div>
                `;
            });
            pendingWithdrawalsList.innerHTML = html;
        }
    }
}

function populateDepositsTab() {
    const completedDepositsList = document.getElementById('completedDepositsList');
    if (completedDepositsList) {
        const completed = walletData.depositHistory?.filter(d => d.status === 'approved' || d.status === 'completed') || [];
        if (completed.length === 0) {
            completedDepositsList.innerHTML = '<div class="empty-text">No completed deposits</div>';
        } else {
            let html = '';
            completed.forEach(deposit => {
                const date = new Date(deposit.timestamp);
                html += `
                    <div class="history-item-card">
                        <div class="history-item-header">
                            <div class="history-item-type">
                                <div class="history-type-icon deposit"><i class="fas fa-check-circle"></i></div>
                                <span class="history-type-name">Deposit Completed</span>
                            </div>
                            <div class="history-item-status completed">Completed</div>
                        </div>
                        <div class="history-item-details">
                            <div class="history-detail-row">
                                <span class="history-detail-label">Amount:</span>
                                <span class="history-detail-value positive">+${deposit.amount} ${deposit.currency}</span>
                            </div>
                        </div>
                        <div class="history-item-footer">
                            <span class="history-item-time"><i class="far fa-clock"></i> ${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>
                        </div>
                    </div>
                `;
            });
            completedDepositsList.innerHTML = html;
        }
    }
    
    const rejectedDepositsList = document.getElementById('rejectedDepositsList');
    if (rejectedDepositsList) {
        const rejected = walletData.depositHistory?.filter(d => d.status === 'rejected') || [];
        if (rejected.length === 0) {
            rejectedDepositsList.innerHTML = '<div class="empty-text">No rejected deposits</div>';
        } else {
            let html = '';
            rejected.forEach(deposit => {
                const date = new Date(deposit.timestamp);
                html += `
                    <div class="history-item-card">
                        <div class="history-item-header">
                            <div class="history-item-type">
                                <div class="history-type-icon withdraw"><i class="fas fa-times-circle"></i></div>
                                <span class="history-type-name">Deposit Rejected</span>
                            </div>
                            <div class="history-item-status rejected">Rejected</div>
                        </div>
                        <div class="history-item-details">
                            <div class="history-detail-row">
                                <span class="history-detail-label">Amount:</span>
                                <span class="history-detail-value">${deposit.amount} ${deposit.currency}</span>
                            </div>
                            <div class="history-detail-row">
                                <span class="history-detail-label">Reason:</span>
                                <span class="history-detail-value" style="color: #ef4444;">${deposit.rejectionReason || 'Not specified'}</span>
                            </div>
                        </div>
                        <div class="history-item-footer">
                            <span class="history-item-time"><i class="far fa-clock"></i> ${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>
                        </div>
                    </div>
                `;
            });
            rejectedDepositsList.innerHTML = html;
        }
    }
}

function populateWithdrawalsTab() {
    const completedWithdrawalsList = document.getElementById('completedWithdrawalsList');
    if (completedWithdrawalsList) {
        const completed = walletData.withdrawalHistory?.filter(w => w.status === 'completed') || [];
        if (completed.length === 0) {
            completedWithdrawalsList.innerHTML = '<div class="empty-text">No completed withdrawals</div>';
        } else {
            let html = '';
            completed.forEach(withdrawal => {
                const date = new Date(withdrawal.timestamp);
                html += `
                    <div class="history-item-card">
                        <div class="history-item-header">
                            <div class="history-item-type">
                                <div class="history-type-icon withdraw"><i class="fas fa-check-circle"></i></div>
                                <span class="history-type-name">Withdrawal Completed</span>
                            </div>
                            <div class="history-item-status completed">Completed</div>
                        </div>
                        <div class="history-item-details">
                            <div class="history-detail-row">
                                <span class="history-detail-label">Amount:</span>
                                <span class="history-detail-value negative">-${withdrawal.amount} USDT</span>
                            </div>
                        </div>
                        <div class="history-item-footer">
                            <span class="history-item-time"><i class="far fa-clock"></i> ${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>
                        </div>
                    </div>
                `;
            });
            completedWithdrawalsList.innerHTML = html;
        }
    }
    
    const rejectedWithdrawalsList = document.getElementById('rejectedWithdrawalsList');
    if (rejectedWithdrawalsList) {
        const rejected = walletData.withdrawalHistory?.filter(w => w.status === 'rejected') || [];
        if (rejected.length === 0) {
            rejectedWithdrawalsList.innerHTML = '<div class="empty-text">No rejected withdrawals</div>';
        } else {
            let html = '';
            rejected.forEach(withdrawal => {
                const date = new Date(withdrawal.timestamp);
                html += `
                    <div class="history-item-card">
                        <div class="history-item-header">
                            <div class="history-item-type">
                                <div class="history-type-icon withdraw"><i class="fas fa-times-circle"></i></div>
                                <span class="history-type-name">Withdrawal Rejected</span>
                            </div>
                            <div class="history-item-status rejected">Rejected</div>
                        </div>
                        <div class="history-item-details">
                            <div class="history-detail-row">
                                <span class="history-detail-label">Amount:</span>
                                <span class="history-detail-value">${withdrawal.amount} USDT</span>
                            </div>
                            <div class="history-detail-row">
                                <span class="history-detail-label">Reason:</span>
                                <span class="history-detail-value" style="color: #ef4444;">${withdrawal.rejectionReason || 'Not specified'}</span>
                            </div>
                        </div>
                        <div class="history-item-footer">
                            <span class="history-item-time"><i class="far fa-clock"></i> ${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>
                        </div>
                    </div>
                `;
            });
            rejectedWithdrawalsList.innerHTML = html;
        }
    }
}

function populateAllTab() {
    const allList = document.getElementById('allTransactionsList');
    if (!allList) return;
    
    // تجميع جميع المعاملات
    let allTransactions = [];
    
    // إضافة معاملات Swap
    if (transactionHistory.swaps) {
        transactionHistory.swaps.forEach(tx => {
            allTransactions.push({
                ...tx,
                type: 'swap',
                displayType: 'Swap',
                icon: 'swap',
                amount: `${tx.fromAmount} ${tx.fromCurrency} → ${tx.toAmount} ${tx.toCurrency}`,
                status: 'completed'
            });
        });
    }
    
    // إضافة معاملات Mining
    if (transactionHistory.mining) {
        transactionHistory.mining.forEach(tx => {
            allTransactions.push({
                ...tx,
                type: 'mine',
                displayType: 'Mining Reward',
                icon: 'mine',
                amount: `+${tx.amount} MWH`,
                status: 'completed'
            });
        });
    }
    
    // إضافة معاملات Staking
    if (transactionHistory.staking) {
        transactionHistory.staking.forEach(tx => {
            let amountDisplay = '';
            if (tx.type === 'stake_start') {
                amountDisplay = `-${tx.amount} MWH (Staked)`;
            } else if (tx.type === 'stake_claimed') {
                amountDisplay = `+${tx.totalReceived} MWH (Profit: ${tx.profit} MWH)`;
            } else if (tx.type === 'stake_cancelled') {
                amountDisplay = `+${tx.received} MWH (Penalty: ${tx.penalty} MWH)`;
            }
            
            allTransactions.push({
                ...tx,
                type: 'stake',
                displayType: tx.type === 'stake_start' ? 'Stake Started' : 
                             tx.type === 'stake_claimed' ? 'Stake Claimed' : 'Stake Cancelled',
                icon: 'stake',
                amount: amountDisplay,
                status: tx.status
            });
        });
    }
    
    // إضافة معاملات Card
    if (transactionHistory.card) {
        transactionHistory.card.forEach(tx => {
            if (tx.type === 'card_purchase') {
                allTransactions.push({
                    ...tx,
                    type: 'card',
                    displayType: 'Card Purchase',
                    icon: 'card',
                    amount: `-${tx.price} BNB, +${tx.instantBonus} MWH instant, +${tx.lockedBonus} MWH locked`,
                    status: 'completed'
                });
            } else if (tx.type === 'bonus_claimed') {
                allTransactions.push({
                    ...tx,
                    type: 'card',
                    displayType: 'Bonus Claimed',
                    icon: 'card',
                    amount: `+${tx.amount} MWH`,
                    status: 'completed'
                });
            }
        });
    }
    
    // إضافة معاملات Referral
    if (transactionHistory.referral) {
        transactionHistory.referral.forEach(tx => {
            allTransactions.push({
                ...tx,
                type: 'referral',
                displayType: 'Referral Bonus',
                icon: 'referral',
                amount: `+${tx.amount} MWH`,
                status: 'completed'
            });
        });
    }
    
    // ترتيب من الأحدث إلى الأقدم
    allTransactions.sort((a, b) => b.timestamp - a.timestamp);
    
    if (allTransactions.length === 0) {
        allList.innerHTML = '<div class="empty-text">No transactions yet</div>';
        return;
    }
    
    let html = '';
    allTransactions.forEach(tx => {
        const date = new Date(tx.timestamp);
        const timeAgo = getTimeAgo(tx.timestamp);
        
        html += `
            <div class="history-item-card">
                <div class="history-item-header">
                    <div class="history-item-type">
                        <div class="history-type-icon ${tx.icon}">
                            <i class="fas ${tx.icon === 'swap' ? 'fa-exchange-alt' : 
                                         tx.icon === 'mine' ? 'fa-hard-hat' :
                                         tx.icon === 'stake' ? 'fa-chart-line' :
                                         tx.icon === 'card' ? 'fa-credit-card' :
                                         tx.icon === 'referral' ? 'fa-users' : 'fa-clock'}"></i>
                        </div>
                        <span class="history-type-name">${tx.displayType}</span>
                    </div>
                    <div class="history-item-status ${tx.status}">${tx.status}</div>
                </div>
                <div class="history-item-details">
                    <div class="history-detail-row">
                        <span class="history-detail-label">Amount:</span>
                        <span class="history-detail-value ${tx.amount.includes('+') ? 'positive' : 'negative'}">${tx.amount}</span>
                    </div>
                </div>
                <div class="history-item-footer">
                    <span class="history-item-time"><i class="far fa-clock"></i> ${timeAgo}</span>
                    <span class="history-item-hash">${date.toLocaleDateString()}</span>
                </div>
            </div>
        `;
    });
    
    allList.innerHTML = html;
}

function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
}

function switchHistoryTab(tabName) {
    document.querySelectorAll('.history-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.history-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const activeTab = Array.from(document.querySelectorAll('.history-tab')).find(tab => 
        tab.textContent.toLowerCase().includes(tabName)
    );
    if (activeTab) activeTab.classList.add('active');
    
    document.getElementById(tabName + 'TabContent').classList.add('active');
}

function saveTransactionHistory() {
    if (!userData.userId) return;
    try {
        const storageKey = `vip_history_${userData.userId}`;
        localStorage.setItem(storageKey, JSON.stringify(transactionHistory));
    } catch (error) {
        console.error("❌ History save error:", error);
    }
}

function loadTransactionHistory() {
    if (!userData.userId) return;
    try {
        const storageKey = `vip_history_${userData.userId}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            const parsed = JSON.parse(saved);
            transactionHistory = {...transactionHistory, ...parsed};
        }
    } catch (error) {
        console.error("❌ History load error:", error);
    }
}

// ============================================
// 14. EARNING SYSTEM - COMPLETE مع إعلانات حقيقية
// ============================================

function initEarningPage() {
    console.log("💰 Initializing earning page...");
    checkDailyReset();
    updateEarningUI();
}

function checkDailyReset() {
    const now = Date.now();
    const lastReset = dailyStats.lastReset;
    const resetTime = 24 * 60 * 60 * 1000;
    
    if (now - lastReset >= resetTime) {
        resetDailyStats();
    }
    
    updateResetCountdown();
}

function resetDailyStats() {
    dailyStats.adsWatched = 0;
    dailyStats.adsEarned = 0;
    dailyStats.referralCount = 0;
    dailyStats.referralEarned = 0;
    dailyStats.lastReset = Date.now();
    
    CONFIG.REFERRAL_CHALLENGES.forEach(challenge => {
        challenge.claimed = false;
    });
    
    saveDailyStats();
    updateEarningUI();
    
    console.log("🔄 Daily stats reset");
}

function updateResetCountdown() {
    const now = Date.now();
    const resetTime = 24 * 60 * 60 * 1000;
    const nextReset = dailyStats.lastReset + resetTime;
    const timeLeft = nextReset - now;
    
    if (timeLeft <= 0) {
        resetDailyStats();
        return;
    }
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    const countdownElement = document.getElementById('dailyResetCountdown');
    if (countdownElement) {
        countdownElement.textContent = `Resets in: ${hours}h ${minutes}m`;
    }
}

function updateEarningUI() {
    const adsCountElement = document.getElementById('adsWatchedCount');
    const adsEarnedElement = document.getElementById('adsEarnedAmount');
    const adsProgressElement = document.getElementById('adsProgress');
    const adsProgressTextElement = document.getElementById('adsProgressText');
    const watchAdButton = document.getElementById('watchAdButton');
    
    if (adsCountElement) {
        adsCountElement.textContent = `${dailyStats.adsWatched}/${CONFIG.DAILY_AD_LIMIT}`;
    }
    
    if (adsEarnedElement) {
        adsEarnedElement.textContent = `${dailyStats.adsEarned} MWH`;
    }
    
    if (adsProgressElement) {
        const progress = (dailyStats.adsWatched / CONFIG.DAILY_AD_LIMIT) * 100;
        adsProgressElement.style.width = `${progress}%`;
    }
    
    if (adsProgressTextElement) {
        const progress = (dailyStats.adsWatched / CONFIG.DAILY_AD_LIMIT) * 100;
        adsProgressTextElement.textContent = `${progress.toFixed(1)}%`;
    }
    
    if (watchAdButton) {
        if (dailyStats.adsWatched >= CONFIG.DAILY_AD_LIMIT) {
            watchAdButton.disabled = true;
            watchAdButton.innerHTML = '<i class="fas fa-ban"></i> Daily Limit Reached';
        } else {
            watchAdButton.disabled = false;
            watchAdButton.innerHTML = '<i class="fas fa-play"></i> Watch Ad & Earn 50 MWH';
        }
    }
    
    const totalEarnedTodayElement = document.getElementById('totalEarnedToday');
    const dailyReferralCountElement = document.getElementById('dailyReferralCount');
    const dailyReferralEarnedElement = document.getElementById('dailyReferralEarned');
    
    if (totalEarnedTodayElement) {
        const totalEarnedToday = dailyStats.adsEarned + dailyStats.referralEarned;
        totalEarnedTodayElement.textContent = `${totalEarnedToday} MWH`;
    }
    
    if (dailyReferralCountElement) {
        dailyReferralCountElement.textContent = dailyStats.referralCount;
    }
    
    if (dailyReferralEarnedElement) {
        dailyReferralEarnedElement.textContent = `${dailyStats.referralEarned} MWH`;
    }
    
    updateReferralChallengesUI();
}

function updateReferralChallengesUI() {
    const challenges = CONFIG.REFERRAL_CHALLENGES;
    
    challenges.forEach((challenge, index) => {
        const progressElement = document.getElementById(`referralChallenge${index + 1}Progress`);
        const progressBarElement = document.getElementById(`referralChallenge${index + 1}ProgressBar`);
        const rewardElement = document.getElementById(`referralChallenge${index + 1}Reward`);
        const claimButton = document.getElementById(`claimReferralChallenge${index + 1}`);
        
        if (progressElement) {
            const progress = Math.min((dailyStats.referralCount / challenge.target) * 100, 100);
            progressElement.textContent = `${dailyStats.referralCount}/${challenge.target}`;
            
            if (progressBarElement) {
                progressBarElement.style.width = `${progress}%`;
            }
        }
        
        if (rewardElement) {
            let rewardText = `${challenge.reward} MWH`;
            if (challenge.bonusBNB) {
                rewardText += ` + ${challenge.bonusBNB} BNB`;
            }
            rewardElement.textContent = rewardText;
        }
        
        if (claimButton) {
            if (challenge.claimed) {
                claimButton.disabled = true;
                claimButton.innerHTML = '<i class="fas fa-check"></i> Claimed';
            } else if (dailyStats.referralCount >= challenge.target) {
                claimButton.disabled = false;
                claimButton.innerHTML = '<i class="fas fa-gift"></i> Claim Reward';
            } else {
                claimButton.disabled = true;
                claimButton.innerHTML = '<i class="fas fa-lock"></i> In Progress';
            }
        }
    });
}

function watchAd() {
    if (dailyStats.adsWatched >= CONFIG.DAILY_AD_LIMIT) {
        showMessage('❌ Daily ad limit reached! Come back tomorrow.', 'error');
        return;
    }
    
    const watchAdButton = document.getElementById('watchAdButton');
    if (watchAdButton) {
        watchAdButton.disabled = true;
        watchAdButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Watching ad... (20s)';
    }
    
    try {
        if (typeof show_10539656 === 'function') {
            show_10539656('pop').then(() => {
                // بدء العد التنازلي 20 ثانية
                let secondsLeft = 20;
                const timer = setInterval(() => {
                    secondsLeft--;
                    if (watchAdButton) {
                        watchAdButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Watching ad... (${secondsLeft}s)`;
                    }
                    if (secondsLeft <= 0) {
                        clearInterval(timer);
                        rewardAdWatched();
                    }
                }, 1000);
            }).catch(() => {
                if (watchAdButton) {
                    watchAdButton.disabled = false;
                    watchAdButton.innerHTML = '<i class="fas fa-play"></i> Watch Ad & Earn 50 MWH';
                }
            });
        } else {
            // محاكاة للإختبار
            let secondsLeft = 20;
            const timer = setInterval(() => {
                secondsLeft--;
                if (watchAdButton) {
                    watchAdButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Watching ad... (${secondsLeft}s)`;
                }
                if (secondsLeft <= 0) {
                    clearInterval(timer);
                    rewardAdWatched();
                }
            }, 1000);
        }
    } catch (error) {
        console.error("Ad error:", error);
        if (watchAdButton) {
            watchAdButton.disabled = false;
            watchAdButton.innerHTML = '<i class="fas fa-play"></i> Watch Ad & Earn 50 MWH';
        }
        showMessage('❌ Ad service not available', 'error');
    }
}

function rewardAdWatched() {
    const reward = CONFIG.AD_REWARD;
    userData.balance += reward;
    userData.totalEarned += reward;
    
    walletData.availableMWH += reward;
    walletData.mwhBalance = walletData.availableMWH + walletData.lockedMWH;
    
    dailyStats.adsWatched++;
    dailyStats.adsEarned += reward;
    
    addToMiningHistory({
        amount: reward,
        timestamp: Date.now(),
        type: 'ad_reward'
    });
    
    saveUserData();
    saveWalletData();
    saveDailyStats();
    
    updateUI();
    updateWalletUI();
    updateEarningUI();
    updateStakingBalance();
    
    showMessage(`✅ +${reward} MWH earned from watching ad!`, 'success');
    
    const watchAdButton = document.getElementById('watchAdButton');
    if (watchAdButton) {
        if (dailyStats.adsWatched >= CONFIG.DAILY_AD_LIMIT) {
            watchAdButton.disabled = true;
            watchAdButton.innerHTML = '<i class="fas fa-ban"></i> Daily Limit Reached';
        } else {
            watchAdButton.disabled = false;
            watchAdButton.innerHTML = '<i class="fas fa-play"></i> Watch Ad & Earn 50 MWH';
        }
    }
}

function addToMiningHistory(entry) {
    if (!transactionHistory.mining) {
        transactionHistory.mining = [];
    }
    transactionHistory.mining.unshift(entry);
    saveTransactionHistory();
}

function claimReferralChallenge(challengeIndex) {
    const challenge = CONFIG.REFERRAL_CHALLENGES[challengeIndex];
    
    if (!challenge) {
        showMessage('❌ Challenge not found', 'error');
        return;
    }
    
    if (challenge.claimed) {
        showMessage('❌ Challenge already claimed', 'error');
        return;
    }
    
    if (dailyStats.referralCount < challenge.target) {
        showMessage(`❌ Need ${challenge.target - dailyStats.referralCount} more referrals`, 'error');
        return;
    }
    
    userData.balance += challenge.reward;
    userData.totalEarned += challenge.reward;
    
    walletData.availableMWH += challenge.reward;
    walletData.mwhBalance = walletData.availableMWH + walletData.lockedMWH;
    
    if (challenge.bonusBNB) {
        walletData.bnbBalance += challenge.bonusBNB;
    }
    
    dailyStats.referralEarned += challenge.reward;
    challenge.claimed = true;
    
    // تسجيل في تاريخ الإحالات
    if (!transactionHistory.referral) {
        transactionHistory.referral = [];
    }
    transactionHistory.referral.unshift({
        amount: challenge.reward,
        bonusBNB: challenge.bonusBNB || 0,
        timestamp: Date.now()
    });
    
    saveUserData();
    saveWalletData();
    saveDailyStats();
    saveTransactionHistory();
    
    updateUI();
    updateWalletUI();
    updateEarningUI();
    updateStakingBalance();
    
    let message = `✅ +${challenge.reward} MWH earned from referral challenge!`;
    if (challenge.bonusBNB) {
        message += ` +${challenge.bonusBNB} BNB bonus!`;
    }
    showMessage(message, 'success');
}

function saveDailyStats() {
    if (!userData.userId) return;
    
    try {
        const storageKey = `vip_daily_stats_${userData.userId}`;
        
        const dataToSave = {
            ...dailyStats,
            referralChallenges: CONFIG.REFERRAL_CHALLENGES
        };
        
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        console.log("💾 Daily stats saved");
        
    } catch (error) {
        console.error("❌ Daily stats save error:", error);
    }
}

function loadDailyStats() {
    if (!userData.userId) return;
    
    try {
        const storageKey = `vip_daily_stats_${userData.userId}`;
        const savedData = localStorage.getItem(storageKey);
        
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            dailyStats.adsWatched = parsedData.adsWatched || 0;
            dailyStats.adsEarned = parsedData.adsEarned || 0;
            dailyStats.referralCount = parsedData.referralCount || 0;
            dailyStats.referralEarned = parsedData.referralEarned || 0;
            dailyStats.lastReset = parsedData.lastReset || Date.now();
            
            if (parsedData.referralChallenges) {
                parsedData.referralChallenges.forEach((savedChallenge, index) => {
                    if (CONFIG.REFERRAL_CHALLENGES[index]) {
                        CONFIG.REFERRAL_CHALLENGES[index].claimed = savedChallenge.claimed || false;
                    }
                });
            }
            
            console.log("✅ Daily stats loaded");
        }
    } catch (error) {
        console.error("❌ Daily stats load error:", error);
    }
}

// ============================================
// 15. REAL-TIME LISTENER FOR USER DATA - تم تعديله ليشمل المعاملات المالية فقط
// ============================================

function setupRealTimeListeners() {
    if (!db || !userData.userId) return;
    
    console.log("👂 Setting up real-time listeners for financial transactions only...");
    
    // الاستماع فقط لطلبات الإيداع (المعاملات المالية)
    db.collection('deposit_requests')
        .where('userId', '==', userData.userId)
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                const data = change.doc.data();
                console.log('🔄 Deposit update:', data.status);
                
                if (change.type === 'modified') {
                    updateUserLocalDeposit(change.doc.id, data);
                }
            });
        });
    
    // الاستماع فقط لطلبات السحب (المعاملات المالية)
    db.collection('withdrawals')
        .where('userId', '==', userData.userId)
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                const data = change.doc.data();
                console.log('🔄 Withdrawal update:', data.status);
                
                if (change.type === 'modified') {
                    updateUserLocalWithdrawal(change.doc.id, data);
                }
            });
        });
    
    // لم نعد نستمع لتغييرات المستخدم أو المحفظة لأنها ليست معاملات مالية
    console.log("✅ Real-time listeners set for financial transactions only");
}

function updateUserLocalDeposit(firebaseId, depositData) {
    const pendingIndex = walletData.pendingDeposits.findIndex(d => {
        return d.transactionHash === depositData.transactionHash || 
               (d.id && d.id.includes(depositData.transactionHash?.substring(0, 10)));
    });
    
    const historyIndex = walletData.depositHistory.findIndex(d => {
        return d.transactionHash === depositData.transactionHash || 
               (d.id && d.id.includes(depositData.transactionHash?.substring(0, 10)));
    });
    
    const status = depositData.status ? depositData.status.toLowerCase() : '';
    
    if (status === 'approved') {
        if (pendingIndex !== -1) {
            const approvedDeposit = {
                ...walletData.pendingDeposits[pendingIndex],
                status: 'approved',
                approvedAt: depositData.approvedAt || Date.now(),
                adminNote: depositData.adminNote || 'Approved'
            };
            
            walletData.depositHistory.unshift(approvedDeposit);
            walletData.pendingDeposits.splice(pendingIndex, 1);
            
            if (depositData.currency === 'MWH') {
                userData.balance += depositData.amount;
                walletData.availableMWH += depositData.amount;
                walletData.mwhBalance = walletData.availableMWH + walletData.lockedMWH;
                updateStakingBalance();
                showMessage(`✅ Deposit approved! +${depositData.amount} MWH added`, 'success');
            } else if (depositData.currency === 'USDT') {
                walletData.usdtBalance += depositData.amount;
                showMessage(`✅ Deposit approved! +${depositData.amount} USDT added`, 'success');
            } else if (depositData.currency === 'BNB') {
                walletData.bnbBalance += depositData.amount;
                showMessage(`✅ Deposit approved! +${depositData.amount} BNB added`, 'success');
            }
            
            console.log('✅ Deposit approved locally');
            
        } else if (historyIndex !== -1) {
            walletData.depositHistory[historyIndex] = {
                ...walletData.depositHistory[historyIndex],
                status: 'approved',
                approvedAt: depositData.approvedAt || Date.now(),
                adminNote: depositData.adminNote || 'Approved'
            };
        }
        
    } else if (status === 'rejected') {
        if (pendingIndex !== -1) {
            const rejectedDeposit = {
                ...walletData.pendingDeposits[pendingIndex],
                status: 'rejected',
                rejectedAt: depositData.rejectedAt || Date.now(),
                rejectionReason: depositData.rejectionReason || 'Rejected',
                rejectedBy: depositData.rejectedBy || 'admin'
            };
            
            walletData.depositHistory.unshift(rejectedDeposit);
            walletData.pendingDeposits.splice(pendingIndex, 1);
            
            showMessage(`❌ Deposit rejected. Reason: ${depositData.rejectionReason || 'Not specified'}`, 'warning');
            console.log('❌ Deposit rejected locally');
            
        } else if (historyIndex !== -1) {
            walletData.depositHistory[historyIndex] = {
                ...walletData.depositHistory[historyIndex],
                status: 'rejected',
                rejectedAt: depositData.rejectedAt || Date.now(),
                rejectionReason: depositData.rejectionReason || 'Rejected',
                rejectedBy: depositData.rejectedBy || 'admin'
            };
        }
    }
    
    saveWalletData();
    saveUserData();
    updateUI();
    updateWalletUI();
    updateHistoryBadges();
}

function updateUserLocalWithdrawal(firebaseId, withdrawalData) {
    const pendingIndex = walletData.pendingWithdrawals.findIndex(w => {
        return w.address === withdrawalData.address && 
               Math.abs(w.amount - withdrawalData.amount) < 0.01;
    });
    
    const historyIndex = walletData.withdrawalHistory.findIndex(w => {
        return w.address === withdrawalData.address && 
               Math.abs(w.amount - withdrawalData.amount) < 0.01;
    });
    
    const status = withdrawalData.status ? withdrawalData.status.toLowerCase() : '';
    
    if (status === 'completed') {
        if (pendingIndex !== -1) {
            const completedWithdrawal = {
                ...walletData.pendingWithdrawals[pendingIndex],
                status: 'completed',
                completedAt: withdrawalData.completedAt || Date.now(),
                completedBy: withdrawalData.completedBy || 'admin'
            };
            
            walletData.withdrawalHistory.unshift(completedWithdrawal);
            walletData.pendingWithdrawals.splice(pendingIndex, 1);
            
            showMessage(`✅ Withdrawal completed! ${withdrawalData.amount} USDT sent`, 'success');
            console.log('✅ Withdrawal completed locally');
            
        } else if (historyIndex !== -1) {
            walletData.withdrawalHistory[historyIndex] = {
                ...walletData.withdrawalHistory[historyIndex],
                status: 'completed',
                completedAt: withdrawalData.completedAt || Date.now(),
                completedBy: withdrawalData.completedBy || 'admin'
            };
        }
        
    } else if (status === 'rejected') {
        if (pendingIndex !== -1) {
            const rejectedWithdrawal = {
                ...walletData.pendingWithdrawals[pendingIndex],
                status: 'rejected',
                rejectedAt: withdrawalData.rejectedAt || Date.now(),
                rejectionReason: withdrawalData.rejectionReason || 'Rejected',
                rejectedBy: withdrawalData.rejectedBy || 'admin'
            };
            
            walletData.withdrawalHistory.unshift(rejectedWithdrawal);
            walletData.pendingWithdrawals.splice(pendingIndex, 1);
            
            walletData.usdtBalance += withdrawalData.amount;
            walletData.bnbBalance += withdrawalData.fee || 0;
            
            showMessage(`❌ Withdrawal rejected. Reason: ${withdrawalData.rejectionReason || 'Not specified'}`, 'warning');
            console.log('❌ Withdrawal rejected and balance returned');
            
        } else if (historyIndex !== -1) {
            walletData.withdrawalHistory[historyIndex] = {
                ...walletData.withdrawalHistory[historyIndex],
                status: 'rejected',
                rejectedAt: withdrawalData.rejectedAt || Date.now(),
                rejectionReason: withdrawalData.rejectionReason || 'Rejected',
                rejectedBy: withdrawalData.rejectedBy || 'admin'
            };
        }
    }
    
    saveWalletData();
    updateWalletUI();
    updateHistoryBadges();
}

// ============================================
// 16. AUTO-CHECK TRANSACTIONS ON APP START
// ============================================

async function checkAndUpdateTransactionsOnStart() {
    if (!db || !userData.userId) {
        console.log("❌ No connection or user ID");
        return;
    }
    
    console.log("🔍 Checking pending transactions on app start...");
    
    let updated = false;
    
    try {
        const depositsQuery = await db.collection('deposit_requests')
            .where('userId', '==', userData.userId)
            .get();
        
        depositsQuery.forEach(doc => {
            const depositData = doc.data();
            const status = depositData.status ? depositData.status.toLowerCase() : '';
            
            if (status === 'approved' || status === 'rejected') {
                const foundIndex = walletData.pendingDeposits.findIndex(d => 
                    d.transactionHash === depositData.transactionHash
                );
                
                if (foundIndex !== -1) {
                    const processedDeposit = walletData.pendingDeposits.splice(foundIndex, 1)[0];
                    processedDeposit.status = status;
                    processedDeposit.approvedAt = depositData.approvedAt;
                    processedDeposit.rejectedAt = depositData.rejectedAt;
                    processedDeposit.adminNote = depositData.adminNote;
                    processedDeposit.rejectionReason = depositData.rejectionReason;
                    
                    walletData.depositHistory.unshift(processedDeposit);
                    
                    if (status === 'approved') {
                        if (depositData.currency === 'MWH') {
                            userData.balance += depositData.amount;
                            walletData.availableMWH += depositData.amount;
                            walletData.mwhBalance = walletData.availableMWH + walletData.lockedMWH;
                        } else if (depositData.currency === 'USDT') {
                            walletData.usdtBalance += depositData.amount;
                        } else if (depositData.currency === 'BNB') {
                            walletData.bnbBalance += depositData.amount;
                        }
                    }
                    
                    updated = true;
                    console.log(`✅ Updated deposit ${depositData.amount} ${depositData.currency}: ${status}`);
                }
            }
        });
        
        const withdrawalsQuery = await db.collection('withdrawals')
            .where('userId', '==', userData.userId)
            .get();
        
        withdrawalsQuery.forEach(doc => {
            const withdrawalData = doc.data();
            const status = withdrawalData.status ? withdrawalData.status.toLowerCase() : '';
            
            if (status === 'completed' || status === 'rejected') {
                const foundIndex = walletData.pendingWithdrawals.findIndex(w => 
                    w.address === withdrawalData.address && 
                    Math.abs(w.amount - withdrawalData.amount) < 0.01
                );
                
                if (foundIndex !== -1) {
                    const processedWithdrawal = walletData.pendingWithdrawals.splice(foundIndex, 1)[0];
                    processedWithdrawal.status = status;
                    processedWithdrawal.completedAt = withdrawalData.completedAt;
                    processedWithdrawal.rejectedAt = withdrawalData.rejectedAt;
                    processedWithdrawal.rejectionReason = withdrawalData.rejectionReason;
                    
                    walletData.withdrawalHistory.unshift(processedWithdrawal);
                    
                    if (status === 'rejected') {
                        walletData.usdtBalance += withdrawalData.amount;
                        walletData.bnbBalance += withdrawalData.fee || 0;
                    }
                    
                    updated = true;
                    console.log(`✅ Updated withdrawal ${withdrawalData.amount} USDT: ${status}`);
                }
            }
        });
        
        if (updated) {
            saveWalletData();
            saveUserData();
            updateUI();
            updateWalletUI();
            updateStakingBalance();
            showMessage('✅ Your pending transactions have been updated', 'success');
        }
        
    } catch (error) {
        console.error("❌ Error checking transactions:", error);
    }
}

// ============================================
// 17. FLOATING NOTIFICATION SYSTEM
// ============================================

const NOTIFICATION_MESSAGES = [
    "Withdraw successful: User ID 599****5486 -200 USDT",
    "Deposit successful: User ID 848****9393 +100 USDT",
    "Withdraw successful: User ID 966****1763 -80 USDT",
    "Deposit successful: User ID 544****3751 +0.163 BNB",
    "Deposit successful: User ID 271****3446 +0.025 BNB",
    "Deposit successful: User ID 488****1536 +0.04 BNB",
    "Deposit successful: User ID 490****4765 +0.463 BNB",
    "Deposit successful: User ID 200****4324 +200 USDT",
    "Withdraw successful: User ID 538****9231 -65 USDT",
    "Withdraw successful: User ID 447****9577 -90 USDT",
    "Withdraw successful: User ID 510****5431 -150 USDT",
    "Withdraw successful: User ID 945****4413 -400 USDT",
    "Deposit successful: User ID 722****8419 +0.081 BNB",
    "Withdraw successful: User ID 535****7481 -120 USDT",
    "Deposit successful: User ID 762****7750 +400 USDT",
    "Deposit successful: User ID 911****5707 +100 USDT",
    "Withdraw successful: User ID 603****2720 -75 USDT",
    "Withdraw successful: User ID 888****8724 -120 USDT",
    "Withdraw successful: User ID 275****6848 -90 USDT",
    "Deposit successful: User ID 820****3853 +95 USDT",
    "Deposit successful: User ID 797****9600 +0.463 BNB",
    "Deposit successful: User ID 713****4991 +0.445 BNB",
    "Deposit successful: User ID 915****6003 +0.142 BNB",
    "Deposit successful: User ID 515****1941 +0.221 BNB",
    "Deposit successful: User ID 709****2493 +85 USDT",
    "Withdraw successful: User ID 712****2232 -85 USDT",
    "Deposit successful: User ID 407****3765 +0.231 BNB",
    "Deposit successful: User ID 875****3519 +80 USDT",
    "Deposit successful: User ID 806****5674 +0.418 BNB",
    "Withdraw successful: User ID 484****5745 -85 USDT",
    "Deposit successful: User ID 209****4857 +0.105 BNB",
    "Withdraw successful: User ID 346****6451 -400 USDT",
    "Deposit successful: User ID 649****8499 +85 USDT",
    "Withdraw successful: User ID 528****8768 -65 USDT",
    "Deposit successful: User ID 674****2986 +0.287 BNB",
    "Deposit successful: User ID 455****5127 +450 USDT",
    "Deposit successful: User ID 336****1836 +450 USDT",
    "Deposit successful: User ID 254****4683 +450 USDT",
    "Deposit successful: User ID 827****1743 +250 USDT",
    "Deposit successful: User ID 832****8543 +0.483 BNB",
    "Deposit successful: User ID 264****4548 +90 USDT",
    "Deposit successful: User ID 391****1341 +0.134 BNB",
    "Deposit successful: User ID 395****2663 +0.106 BNB",
    "Deposit successful: User ID 642****7536 +95 USDT",
    "Deposit successful: User ID 230****4033 +0.387 BNB",
    "Withdraw successful: User ID 906****1183 -55 USDT",
    "Deposit successful: User ID 282****2796 +0.028 BNB",
    "Deposit successful: User ID 848****7327 +0.482 BNB",
    "Deposit successful: User ID 202****3599 +0.404 BNB",
    "Withdraw successful: User ID 790****5955 -60 USDT",
    "Deposit successful: User ID 858****3490 +0.301 BNB",
    "Withdraw successful: User ID 411****1546 -60 USDT",
    "Deposit successful: User ID 580****5388 +80 USDT",
    "Deposit successful: User ID 664****5710 +350 USDT",
    "Deposit successful: User ID 204****1455 +70 USDT",
    "Deposit successful: User ID 922****3898 +95 USDT",
    "Withdraw successful: User ID 115****7935 -55 USDT",
    "Withdraw successful: User ID 454****9499 -60 USDT",
    "Deposit successful: User ID 548****6236 +0.3 BNB",
    "Deposit successful: User ID 838****6789 +55 USDT",
    "Deposit successful: User ID 356****6757 +0.419 BNB",
    "Deposit successful: User ID 995****6562 +75 USDT",
    "Deposit successful: User ID 560****3520 +0.022 BNB",
    "Deposit successful: User ID 696****5638 +0.386 BNB",
    "Deposit successful: User ID 629****8757 +0.428 BNB",
    "Deposit successful: User ID 266****4986 +0.107 BNB",
    "Withdraw successful: User ID 206****9193 -300 USDT",
    "Deposit successful: User ID 295****7108 +350 USDT",
    "Deposit successful: User ID 654****7297 +120 USDT",
    "Deposit successful: User ID 429****1784 +0.348 BNB",
    "Deposit successful: User ID 710****4523 +250 USDT",
    "Withdraw successful: User ID 857****9454 -55 USDT",
    "Withdraw successful: User ID 887****7465 -55 USDT",
    "Withdraw successful: User ID 679****6626 -65 USDT",
    "Deposit successful: User ID 727****6172 +65 USDT",
    "Withdraw successful: User ID 230****2890 -50 USDT",
    "Withdraw successful: User ID 275****5250 -200 USDT",
    "Deposit successful: User ID 449****7729 +0.436 BNB",
    "Withdraw successful: User ID 940****6719 -95 USDT",
    "Deposit successful: User ID 741****2038 +0.246 BNB",
    "Withdraw successful: User ID 463****5716 -80 USDT",
    "Withdraw successful: User ID 752****9577 -450 USDT",
    "Withdraw successful: User ID 148****8577 -60 USDT",
    "Withdraw successful: User ID 877****9691 -65 USDT",
    "Withdraw successful: User ID 259****3530 -300 USDT",
    "Withdraw successful: User ID 679****5994 -55 USDT",
    "Deposit successful: User ID 247****5109 +75 USDT",
    "Deposit successful: User ID 891****2652 +0.209 BNB",
    "Withdraw successful: User ID 358****6307 -90 USDT",
    "Deposit successful: User ID 799****7712 +400 USDT",
    "Withdraw successful: User ID 628****8276 -300 USDT",
    "Deposit successful: User ID 543****4119 +200 USDT",
    "Withdraw successful: User ID 321****8372 -90 USDT",
    "Deposit successful: User ID 187****9293 +0.334 BNB",
    "Deposit successful: User ID 831****2264 +0.036 BNB",
    "Deposit successful: User ID 487****5143 +0.029 BNB",
    "Withdraw successful: User ID 863****9862 -250 USDT",
    "Withdraw successful: User ID 814****6727 -150 USDT",
    "Withdraw successful: User ID 363****1635 -55 USDT",
    "Deposit successful: User ID 206****6775 +55 USDT",
    "Deposit successful: User ID 756****2564 +350 USDT",
    "Withdraw successful: User ID 763****6682 -150 USDT",
    "Withdraw successful: User ID 588****3006 -75 USDT",
    "Deposit successful: User ID 475****5219 +95 USDT",
    "Withdraw successful: User ID 893****5949 -50 USDT",
    "Withdraw successful: User ID 121****7474 -100 USDT",
    "Deposit successful: User ID 921****7042 +0.446 BNB",
    "Deposit successful: User ID 204****7806 +0.382 BNB",
    "Withdraw successful: User ID 363****3070 -200 USDT",
    "Withdraw successful: User ID 757****1974 -450 USDT",
    "Withdraw successful: User ID 482****7999 -250 USDT",
    "Withdraw successful: User ID 171****3009 -250 USDT",
    "Deposit successful: User ID 592****8793 +0.049 BNB",
    "Deposit successful: User ID 800****8171 +0.348 BNB",
    "Withdraw successful: User ID 410****2681 -50 USDT",
    "Withdraw successful: User ID 749****8570 -120 USDT",
    "Withdraw successful: User ID 726****9389 -55 USDT",
    "Withdraw successful: User ID 812****2303 -65 USDT",
    "Deposit successful: User ID 227****2705 +0.475 BNB",
    "Withdraw successful: User ID 549****9448 -450 USDT",
    "Withdraw successful: User ID 882****3914 -350 USDT",
    "Deposit successful: User ID 572****7404 +80 USDT",
    "Deposit successful: User ID 639****1542 +95 USDT",
    "Deposit successful: User ID 969****6420 +55 USDT",
    "Deposit successful: User ID 437****6942 +350 USDT",
    "Withdraw successful: User ID 918****3276 -100 USDT",
    "Deposit successful: User ID 741****3121 +0.433 BNB",
    "Deposit successful: User ID 790****2041 +0.477 BNB",
    "Deposit successful: User ID 511****4848 +0.215 BNB",
    "Withdraw successful: User ID 140****6211 -150 USDT",
    "Deposit successful: User ID 911****8637 +0.441 BNB",
    "Deposit successful: User ID 813****7922 +0.077 BNB",
    "Deposit successful: User ID 993****1794 +0.361 BNB",
    "Withdraw successful: User ID 274****4827 -350 USDT",
    "Withdraw successful: User ID 535****2753 -300 USDT",
    "Deposit successful: User ID 469****2509 +60 USDT",
    "Withdraw successful: User ID 694****9745 -55 USDT",
    "Deposit successful: User ID 458****4573 +350 USDT",
    "Deposit successful: User ID 285****5704 +200 USDT",
    "Deposit successful: User ID 216****6670 +0.339 BNB",
    "Withdraw successful: User ID 495****9773 -50 USDT",
    "Deposit successful: User ID 850****2348 +0.187 BNB",
    "Deposit successful: User ID 124****8601 +0.374 BNB",
    "Deposit successful: User ID 983****8249 +0.256 BNB",
    "Deposit successful: User ID 171****3881 +0.411 BNB",
    "Withdraw successful: User ID 872****5176 -60 USDT",
    "Deposit successful: User ID 900****9338 +70 USDT",
    "Withdraw successful: User ID 765****1319 -70 USDT",
    "Deposit successful: User ID 748****8995 +70 USDT",
    "Withdraw successful: User ID 918****4649 -70 USDT",
    "Withdraw successful: User ID 487****2122 -150 USDT",
    "Deposit successful: User ID 865****3585 +250 USDT",
    "Deposit successful: User ID 668****8148 +0.273 BNB"
];

let currentNotificationIndex = 0;
let notificationTimer = null;
let isNotificationActive = false;
let notificationTimeout = null;

function initNotificationSystem() {
    console.log("🔔 Initializing notification system...");
    
    currentNotificationIndex = 0;
    
    const homePage = document.querySelector('.container.active');
    if (homePage && !homePage.classList.contains('hidden')) {
        startNotificationTimer();
    }
}

function startNotificationTimer() {
    if (isNotificationActive) {
        console.log("🔔 Notification timer already active");
        return;
    }
    
    console.log("🔔 Starting notification timer");
    isNotificationActive = true;
    
    setTimeout(() => {
        showNextNotification();
    }, 3000);
}

function stopNotificationTimer() {
    console.log("🔔 Stopping notification timer");
    isNotificationActive = false;
    
    if (notificationTimer) {
        clearTimeout(notificationTimer);
        notificationTimer = null;
    }
    
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        notificationTimeout = null;
    }
    
    const notificationBar = document.getElementById('floatingNotification');
    if (notificationBar) {
        notificationBar.classList.remove('show');
        notificationBar.classList.remove('notification-deposit');
        notificationBar.classList.remove('notification-withdraw');
    }
}

function showNextNotification() {
    if (!isNotificationActive) {
        console.log("🔔 Notifications not active");
        return;
    }
    
    const notificationBar = document.getElementById('floatingNotification');
    if (!notificationBar) {
        console.error("❌ Notification bar element not found");
        return;
    }
    
    const message = NOTIFICATION_MESSAGES[currentNotificationIndex];
    
    notificationBar.innerHTML = `<span>${message}</span>`;
    
    const colorClass = getNotificationColor(message);
    notificationBar.className = 'notification-bar';
    notificationBar.classList.add(colorClass);
    
    setTimeout(() => {
        notificationBar.classList.add('show');
        notificationBar.classList.add('moving');
    }, 100);
    
    console.log(`🔔 Showing notification ${currentNotificationIndex + 1}/${NOTIFICATION_MESSAGES.length}: ${message}`);
    
    currentNotificationIndex++;
    if (currentNotificationIndex >= NOTIFICATION_MESSAGES.length) {
        currentNotificationIndex = 0;
    }
    
    notificationTimer = setTimeout(() => {
        notificationBar.classList.remove('show');
        notificationBar.classList.remove('moving');
        
        notificationTimeout = setTimeout(() => {
            showNextNotification();
        }, 500);
    }, 5000);
}

function getNotificationColor(message) {
    if (message.includes('+') && (message.includes('BNB') || message.includes('USDT'))) {
        return 'notification-deposit';
    } else if (message.includes('-') && message.includes('USDT')) {
        return 'notification-withdraw';
    }
    return 'notification-deposit';
}

function checkAndShowNotification() {
    const homePage = document.querySelector('.container.active');
    if (homePage && !homePage.classList.contains('hidden')) {
        if (!isNotificationActive) {
            startNotificationTimer();
        }
    } else {
        if (isNotificationActive) {
            stopNotificationTimer();
        }
    }
}

// ============================================
// 18. DEPOSIT MODAL - مع النص الجديد والعنوان المحسن
// ============================================

function openDepositModal(currency) {
    console.log("💰 Opening deposit modal for:", currency);
    
    // إزالة أي نافذة مفتوحة قبل فتح نافذة جديدة
    const existingModal = document.getElementById('depositModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const depositAddress = CONFIG.DEPOSIT_ADDRESS;
    const minDeposit = getMinDeposit(currency);
    
    // تقسيم العنوان إذا كان طويلاً
    let mainAddress = depositAddress;
    let smallAddress = '';
    
    if (depositAddress.length > 30) {
        mainAddress = depositAddress.substring(0, 30);
        smallAddress = depositAddress.substring(30);
    }
    
    const modalHTML = `
        <div class="modal-overlay" id="depositModal">
            <div class="modal-content deposit-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-download"></i> Deposit ${currency}</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                
                <div class="modal-body">
                    <div class="deposit-warning">
                        <div class="warning-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="warning-content">
                            <div class="warning-title">Important Deposit Instructions</div>
                            <div class="warning-text">
                                Send only <strong>${currency}</strong> to this address on <strong>BEP20</strong> network.
                                Sending other tokens or using wrong network will result in permanent loss.
                            </div>
                        </div>
                    </div>
                    
                    <div class="deposit-address-card">
                        <div class="address-header">
                            <i class="fas fa-wallet"></i>
                            <span>Your ${currency} Deposit Address</span>
                        </div>
                        
                        <div class="address-container-vertical">
                            <div class="address-value-box">
                                <span class="main-address">${mainAddress}</span>
                                ${smallAddress ? `<span class="small-address">${smallAddress}</span>` : ''}
                            </div>
                            
                            <button class="copy-address-btn-large" onclick="copyDepositAddress()">
                                <i class="far fa-copy"></i> Copy Address
                            </button>
                        </div>
                        
                        <div class="network-info">
                            <i class="fas fa-network-wired"></i>
                            <span>Minimum deposit: ${minDeposit} ${currency}</span>
                        </div>
                    </div>
                    
                    <div class="transaction-hash-section">
                        <div class="section-title">
                            <i class="fas fa-receipt"></i>
                            <span>Transaction Verification</span>
                        </div>
                        <div class="transaction-input-group">
                            <div class="input-label">Enter Transaction Hash (TxID)</div>
                            <input type="text" 
                                   id="transactionHash" 
                                   class="transaction-input"
                                   placeholder="0x..."
                                   oninput="validateTransactionHash()"
                                   maxlength="100">
                            <div class="input-hint">
                                Required to verify and process your deposit
                            </div>
                        </div>
                        <div class="transaction-status" id="transactionStatus" style="display: none;">
                            <div class="status-icon" id="statusIcon"></div>
                            <div class="status-text" id="statusText"></div>
                        </div>
                    </div>
                    
                    <div class="transaction-hash-section" style="margin-top: 15px;">
                        <div class="section-title">
                            <i class="fas fa-money-bill-wave"></i>
                            <span>Deposit Amount</span>
                        </div>
                        <div class="transaction-input-group">
                            <div class="input-label">Enter Amount (${currency})</div>
                            <input type="number" 
                                   id="depositAmount" 
                                   class="transaction-input"
                                   placeholder="0.00"
                                   min="${minDeposit}"
                                   step="${currency === 'USDT' ? '0.01' : '0.001'}"
                                   oninput="validateDepositAmount('${currency}')"
                                   value="${minDeposit}">
                            <div class="input-hint">
                                Minimum deposit: ${minDeposit} ${currency}
                            </div>
                        </div>
                        <div class="transaction-status" id="amountStatus" style="display: none;">
                            <div class="status-icon" id="amountIcon"></div>
                            <div class="status-text" id="amountText"></div>
                        </div>
                    </div>
                    
                    <div class="deposit-note">
                        <div class="note-icon">
                            <i class="fas fa-check-circle" style="color: #22c55e;"></i>
                        </div>
                        <div class="note-content">
                            <strong>Confirm blockchain 1-5 minutes</strong>
                        </div>
                    </div>
                    
                    <div class="deposit-actions">
                        <button class="btn-secondary" onclick="closeModal()">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button class="btn-primary" id="verifyDepositBtn" onclick="submitDepositRequest('${currency}')" disabled>
                            <i class="fas fa-paper-plane"></i> Submit Deposit Request
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    setTimeout(() => {
        const input = document.getElementById('transactionHash');
        if (input) input.focus();
        validateDepositAmount(currency);
    }, 100);
}

function validateDepositAmount(currency) {
    const amountInput = document.getElementById('depositAmount');
    const amountStatus = document.getElementById('amountStatus');
    const amountIcon = document.getElementById('amountIcon');
    const amountText = document.getElementById('amountText');
    const verifyBtn = document.getElementById('verifyDepositBtn');
    
    if (!amountInput || !amountStatus) return;
    
    const amount = parseFloat(amountInput.value);
    const minDeposit = getMinDeposit(currency);
    
    if (isNaN(amount) || amount < minDeposit) {
        amountIcon.innerHTML = '<i class="fas fa-times-circle" style="color: #ef4444;"></i>';
        amountText.innerHTML = `<span style="color: #ef4444;">Minimum deposit is ${minDeposit} ${currency}</span>`;
        amountStatus.style.display = 'flex';
        amountStatus.style.background = 'rgba(239, 68, 68, 0.1)';
        amountStatus.style.border = '1px solid rgba(239, 68, 68, 0.3)';
        if (verifyBtn) verifyBtn.disabled = true;
        return false;
    }
    
    amountIcon.innerHTML = '<i class="fas fa-check-circle" style="color: #22c55e;"></i>';
    amountText.innerHTML = `<span style="color: #22c55e;">Valid amount: ${amount} ${currency}</span>`;
    amountStatus.style.display = 'flex';
    amountStatus.style.background = 'rgba(34, 197, 94, 0.1)';
    amountStatus.style.border = '1px solid rgba(34, 197, 94, 0.3)';
    
    validateTransactionHash();
    
    return true;
}

async function submitDepositRequest(currency) {
    const hash = document.getElementById('transactionHash').value.trim();
    const amountInput = document.getElementById('depositAmount').value;
    const verifyBtn = document.getElementById('verifyDepositBtn');
    
    if (!hash || hash.length < CONFIG.MIN_TRANSACTION_LENGTH) {
        showMessage('❌ Please enter a valid transaction hash', 'error');
        return;
    }
    
    const depositAmount = parseFloat(amountInput);
    const minAmount = getMinDeposit(currency);
    
    if (isNaN(depositAmount) || depositAmount < minAmount) {
        showMessage(`❌ Minimum deposit is ${minAmount} ${currency}`, 'error');
        return;
    }
    
    if (walletData.usedTransactions.includes(hash.toLowerCase())) {
        showMessage('❌ This transaction hash has already been used', 'error');
        return;
    }
    
    verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    verifyBtn.disabled = true;
    
    try {
        const formattedAmount = currency === 'USDT' ? 
            Math.round(depositAmount * 100) / 100 :
            Math.round(depositAmount * 1000) / 1000;
        
        const pendingDeposit = {
            id: 'deposit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            userId: userData.userId,
            username: userData.username,
            transactionHash: hash.toLowerCase(),
            currency: currency,
            amount: formattedAmount,
            status: 'pending',
            timestamp: Date.now(),
            reviewNote: 'Awaiting manual review'
        };
        
        walletData.pendingDeposits.push(pendingDeposit);
        walletData.usedTransactions.push(hash.toLowerCase());
        
        saveWalletData();
        
        if (db) {
            await db.collection('deposit_requests').add({
                ...pendingDeposit,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        verifyBtn.innerHTML = '<i class="fas fa-check"></i> Submitted!';
        
        setTimeout(() => {
            closeModal();
            showMessage(`✅ Deposit request submitted for review! Amount: ${formattedAmount} ${currency}`, 'success');
            
            setTimeout(() => {
                showMessage('📋 Your deposit is now pending manual review. Check History for status.', 'info');
            }, 1000);
        }, 1500);
        
    } catch (error) {
        console.error('Deposit submission error:', error);
        verifyBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Deposit Request';
        verifyBtn.disabled = false;
        showMessage('❌ Failed to submit deposit request. Please try again.', 'error');
    }
}

function copyDepositAddress() {
    const depositAddress = CONFIG.DEPOSIT_ADDRESS;
    
    navigator.clipboard.writeText(depositAddress)
        .then(() => {
            const btn = document.querySelector('.copy-address-btn-large');
            if (btn) {
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                btn.style.background = 'linear-gradient(135deg, #22c55e, #10b981)';
                
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.style.background = 'linear-gradient(135deg, #3b82f6, #6366f1)';
                }, 2000);
            }
            showMessage('✅ Address copied to clipboard!', 'success');
        })
        .catch(err => {
            console.error('Copy error:', err);
            showMessage('❌ Failed to copy address', 'error');
        });
}

function validateTransactionHash() {
    const hash = document.getElementById('transactionHash').value.trim();
    const statusDiv = document.getElementById('transactionStatus');
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    const verifyBtn = document.getElementById('verifyDepositBtn');
    
    if (!hash) {
        statusDiv.style.display = 'none';
        verifyBtn.disabled = true;
        return;
    }
    
    if (walletData.usedTransactions.includes(hash.toLowerCase())) {
        statusIcon.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #ef4444;"></i>';
        statusText.innerHTML = '<span style="color: #ef4444;">This transaction hash has already been used</span>';
        statusDiv.style.display = 'flex';
        statusDiv.style.background = 'rgba(239, 68, 68, 0.1)';
        statusDiv.style.border = '1px solid rgba(239, 68, 68, 0.3)';
        verifyBtn.disabled = true;
        return;
    }
    
    if (hash.length < CONFIG.MIN_TRANSACTION_LENGTH) {
        statusIcon.innerHTML = '<i class="fas fa-times-circle" style="color: #ef4444;"></i>';
        statusText.innerHTML = '<span style="color: #ef4444;">Invalid transaction hash (too short)</span>';
        statusDiv.style.display = 'flex';
        statusDiv.style.background = 'rgba(239, 68, 68, 0.1)';
        statusDiv.style.border = '1px solid rgba(239, 68, 68, 0.3)';
        verifyBtn.disabled = true;
        return;
    }
    
    if (!hash.startsWith('0x') || hash.length !== 66) {
        statusIcon.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i>';
        statusText.innerHTML = '<span style="color: #f59e0b;">Verify this is a valid BEP20 transaction hash</span>';
        statusDiv.style.display = 'flex';
        statusDiv.style.background = 'rgba(245, 158, 11, 0.1)';
        statusDiv.style.border = '1px solid rgba(245, 158, 11, 0.3)';
        verifyBtn.disabled = false;
        return;
    }
    
    statusIcon.innerHTML = '<i class="fas fa-check-circle" style="color: #22c55e;"></i>';
    statusText.innerHTML = '<span style="color: #22c55e;">Valid transaction hash detected</span>';
    statusDiv.style.display = 'flex';
    statusDiv.style.background = 'rgba(34, 197, 94, 0.1)';
    statusDiv.style.border = '1px solid rgba(34, 197, 94, 0.3)';
    verifyBtn.disabled = false;
}

// ============================================
// 19. SWAP MODAL - النسخة الأصلية مع التعديل (إزالة النافذة قبل الفتح)
// ============================================

function openSwapModal(currency) {
    console.log("💱 Opening swap modal for:", currency);
    
    // 🟢 إزالة أي نافذة Swap موجودة مسبقاً (كما في الكود الأول)
    const existingModal = document.getElementById('swapModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const isMWH = currency === 'MWH';
    const isUSDT = currency === 'USDT';
    const isBNB = currency === 'BNB';
    
    let fromCurrency = currency;
    let toCurrency = '';
    let rateText = '';
    let minSwap = 0;
    
    if (isMWH) {
        toCurrency = 'USDT';
        rateText = '1,000 MWH = 1 USDT';
        minSwap = CONFIG.MIN_SWAP;
    } else if (isUSDT) {
        toCurrency = 'MWH';
        rateText = '1 USDT = 1,000 MWH';
        minSwap = 0.01;
    } else if (isBNB) {
        toCurrency = 'MWH';
        rateText = `1 BNB = ${CONFIG.BNB_TO_MWH_RATE.toLocaleString()} MWH`;
        minSwap = 0.001;
    }
    
    const fromBalance = getBalanceByCurrency(fromCurrency);
    
    const modalHTML = `
        <div class="modal-overlay" id="swapModal">
            <div class="modal-content swap-modal-professional">
                <div class="modal-header">
                    <h3><i class="fas fa-exchange-alt"></i> Swap ${fromCurrency} to ${toCurrency}</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="swap-rate-info">
                        <div class="rate-card">
                            <div class="rate-label"><i class="fas fa-chart-line"></i> Exchange Rate</div>
                            <div class="rate-value">${rateText}</div>
                        </div>
                        <div class="rate-card">
                            <div class="rate-label"><i class="fas fa-exclamation-circle"></i> Minimum</div>
                            <div class="rate-value">${minSwap.toLocaleString()} ${fromCurrency}</div>
                        </div>
                    </div>
                    
                    <div class="swap-inputs-professional">
                        <div class="swap-amount-section">
                            <div class="amount-header">
                                <div class="amount-label"><i class="fas fa-arrow-up"></i> You Send</div>
                                <div class="amount-balance">Available: ${formatNumber(fromBalance)} ${fromCurrency}</div>
                            </div>
                            <div class="amount-input-container">
                                <span class="currency-prefix">${fromCurrency}</span>
                                <input type="number" id="swapFromAmount" class="swap-amount-input" placeholder="0.00" min="${minSwap}" step="${isBNB ? '0.001' : isUSDT ? '0.01' : '1000'}" oninput="calculateSwap('${fromCurrency}', '${toCurrency}')">
                            </div>
                            <div class="max-btn-container">
                                <button class="max-amount-btn-small" onclick="setMaxSwap('${fromCurrency}')"><i class="fas fa-bolt"></i> MAX</button>
                            </div>
                        </div>
                        
                        <div class="swap-amount-section">
                            <div class="amount-header">
                                <div class="amount-label"><i class="fas fa-arrow-down"></i> You Receive</div>
                                <div class="amount-balance" id="receiveBalance">0 ${toCurrency}</div>
                            </div>
                            <div class="amount-input-container">
                                <span class="currency-prefix">${toCurrency}</span>
                                <input type="text" id="swapToAmount" class="swap-amount-input" placeholder="0.00" readonly>
                            </div>
                        </div>
                    </div>
                    
                    <div class="swap-details-professional">
                        <div class="details-grid">
                            <div class="detail-item"><span>Exchange Rate:</span><span class="detail-value">${rateText}</span></div>
                            <div class="detail-item"><span>Fee:</span><span class="detail-value">0.1%</span></div>
                            <div class="detail-item total"><span>Total Receive:</span><span class="detail-value" id="swapReceive">0 ${toCurrency}</span></div>
                        </div>
                    </div>
                    
                    <div class="swap-warning-professional" id="swapWarning" style="display: none;">
                        <div class="warning-icon"><i class="fas fa-exclamation-triangle"></i></div>
                        <div class="warning-content">
                            <div class="warning-title">Cannot Proceed</div>
                            <div class="warning-text" id="swapWarningText"></div>
                        </div>
                    </div>
                    
                    <div class="swap-actions-professional">
                        <button class="btn-swap-cancel" onclick="closeModal()">Cancel</button>
                        <button class="btn-swap-confirm" id="confirmSwapBtn" onclick="executeSwap('${fromCurrency}', '${toCurrency}')" disabled>Confirm Swap</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    setTimeout(() => {
        const input = document.getElementById('swapFromAmount');
        if (input) input.focus();
        calculateSwap(fromCurrency, toCurrency);
    }, 100);
}

function getBalanceByCurrency(currency) {
    switch(currency) {
        case 'MWH': return walletData.availableMWH;
        case 'USDT': return walletData.usdtBalance;
        case 'BNB': return walletData.bnbBalance;
        default: return 0;
    }
}

function calculateSwap(fromCurrency, toCurrency) {
    const fromAmount = parseFloat(document.getElementById('swapFromAmount')?.value) || 0;
    let toAmount = 0;
    
    if (fromCurrency === 'MWH' && toCurrency === 'USDT') {
        toAmount = fromAmount / CONFIG.MWH_TO_USDT_RATE;
    } else if (fromCurrency === 'USDT' && toCurrency === 'MWH') {
        toAmount = fromAmount * CONFIG.MWH_TO_USDT_RATE;
    } else if (fromCurrency === 'BNB' && toCurrency === 'MWH') {
        toAmount = fromAmount * CONFIG.BNB_TO_MWH_RATE;
    }
    
    const fee = toAmount * 0.001;
    toAmount -= fee;
    
    const decimals = toCurrency === 'USDT' ? 2 : 0;
    document.getElementById('swapToAmount').value = toAmount.toFixed(decimals);
    document.getElementById('swapReceive').textContent = `${toAmount.toFixed(decimals)} ${toCurrency}`;
    document.getElementById('receiveBalance').textContent = `${toAmount.toFixed(decimals)} ${toCurrency}`;
    
    const confirmBtn = document.getElementById('confirmSwapBtn');
    const warning = document.getElementById('swapWarning');
    const warningText = document.getElementById('swapWarningText');
    
    confirmBtn.disabled = true;
    warning.style.display = 'none';
    
    if (fromAmount <= 0) {
        warningText.textContent = "Please enter an amount to swap";
        warning.style.display = 'flex';
        return;
    }
    
    const fromBalance = getBalanceByCurrency(fromCurrency);
    let minSwap = 0;
    
    if (fromCurrency === 'MWH') {
        minSwap = CONFIG.MIN_SWAP;
        if (fromAmount < minSwap) {
            warningText.textContent = `Minimum swap is ${minSwap.toLocaleString()} MWH`;
            warning.style.display = 'flex';
            return;
        }
    } else if (fromCurrency === 'BNB') {
        minSwap = 0.001;
        if (fromAmount < minSwap) {
            warningText.textContent = `Minimum swap is ${minSwap} BNB`;
            warning.style.display = 'flex';
            return;
        }
    } else if (fromCurrency === 'USDT') {
        minSwap = 0.01;
        if (fromAmount < minSwap) {
            warningText.textContent = `Minimum swap is ${minSwap} USDT`;
            warning.style.display = 'flex';
            return;
        }
    }
    
    if (fromAmount > fromBalance) {
        warningText.textContent = `Insufficient ${fromCurrency} balance`;
        warning.style.display = 'flex';
        return;
    }
    
    confirmBtn.disabled = false;
}

function setMaxSwap(currency) {
    const input = document.getElementById('swapFromAmount');
    if (input) {
        const maxBalance = getBalanceByCurrency(currency);
        input.value = maxBalance;
        
        let toCurrency = '';
        if (currency === 'MWH') toCurrency = 'USDT';
        else if (currency === 'USDT') toCurrency = 'MWH';
        else if (currency === 'BNB') toCurrency = 'MWH';
        
        calculateSwap(currency, toCurrency);
    }
}

function executeSwap(fromCurrency, toCurrency) {
    const fromAmount = parseFloat(document.getElementById('swapFromAmount').value);
    const toAmount = parseFloat(document.getElementById('swapToAmount').value);
    
    let minSwap = 0;
    if (fromCurrency === 'MWH') minSwap = CONFIG.MIN_SWAP;
    else if (fromCurrency === 'BNB') minSwap = 0.001;
    else if (fromCurrency === 'USDT') minSwap = 0.01;
    
    if (fromAmount < minSwap) {
        showMessage(`Minimum swap is ${minSwap.toLocaleString()} ${fromCurrency}`, 'error');
        return;
    }
    
    const fromBalance = getBalanceByCurrency(fromCurrency);
    if (fromAmount > fromBalance) {
        showMessage(`Insufficient ${fromCurrency} balance`, 'error');
        return;
    }
    
    const swapRecord = {
        fromCurrency: fromCurrency,
        toCurrency: toCurrency,
        fromAmount: fromAmount,
        toAmount: toAmount,
        timestamp: Date.now()
    };
    
    switch(fromCurrency) {
        case 'MWH':
            walletData.availableMWH -= fromAmount;
            walletData.usdtBalance += toAmount;
            walletData.mwhBalance = walletData.availableMWH + walletData.lockedMWH;
            break;
        case 'USDT':
            walletData.usdtBalance -= fromAmount;
            walletData.availableMWH += toAmount;
            walletData.mwhBalance = walletData.availableMWH + walletData.lockedMWH;
            break;
        case 'BNB':
            walletData.bnbBalance -= fromAmount;
            walletData.availableMWH += toAmount;
            walletData.mwhBalance = walletData.availableMWH + walletData.lockedMWH;
            break;
    }
    
    userData.balance = walletData.availableMWH;
    
    if (!transactionHistory.swaps) {
        transactionHistory.swaps = [];
    }
    transactionHistory.swaps.unshift(swapRecord);
    
    saveWalletData();
    saveUserData();
    saveTransactionHistory();
    
    updateWalletUI();
    updateUI();
    updateStakingBalance();
    
    closeModal();
    
    showMessage(`✅ Swapped ${formatNumber(fromAmount)} ${fromCurrency} to ${formatNumber(toAmount)} ${toCurrency}`, 'success');
}

// ============================================
// 20. WITHDRAWAL MODAL - محسن (من الكود الأصلي)
// ============================================

function openWithdrawalModal() {
    const usdtBalance = walletData.usdtBalance;
    const bnbBalance = walletData.bnbBalance;
    
    // إزالة أي نافذة مفتوحة قبل فتح نافذة جديدة
    const existingModal = document.getElementById('withdrawalModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHTML = `
        <div class="modal-overlay" id="withdrawalModal">
            <div class="modal-content withdrawal-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-upload"></i> Withdraw USDT</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                
                <div class="modal-body">
                    <div class="withdrawal-balance-overview">
                        <div class="balance-card-professional">
                            <div class="balance-header-professional">
                                <i class="fas fa-coins"></i>
                                <span>Available Balance</span>
                            </div>
                            <div class="balance-amount-professional">
                                ${usdtBalance.toFixed(2)} <span class="balance-currency">USDT</span>
                            </div>
                            <div class="balance-subtitle">
                                ≈ $${usdtBalance.toFixed(2)}
                            </div>
                        </div>
                    </div>
                    
                    <div class="withdrawal-form">
                        <div class="form-section">
                            <div class="form-section-header">
                                <i class="fas fa-wallet"></i>
                                <span>Wallet Address</span>
                            </div>
                            <div class="form-group">
                                <label class="form-label">BEP20 USDT Address</label>
                                <div class="input-with-validation">
                                    <input type="text" 
                                           id="withdrawalAddress" 
                                           class="form-input address-input"
                                           placeholder="0x..."
                                           oninput="validateWithdrawalAddress()"
                                           maxlength="42">
                                    <div class="input-validation">
                                        <i class="fas fa-check" id="addressCheck" style="display: none;"></i>
                                        <i class="fas fa-times" id="addressError" style="display: none;"></i>
                                    </div>
                                </div>
                                <div class="form-hint">
                                    Your BEP20 USDT wallet address (must start with 0x)
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <div class="form-section-header">
                                <i class="fas fa-money-bill-wave"></i>
                                <span>Withdrawal Amount</span>
                            </div>
                            <div class="form-group">
                                <div class="amount-input-container">
                                    <div class="amount-input-with-max">
                                        <input type="number" 
                                               id="withdrawalAmount" 
                                               class="form-input amount-input"
                                               value="${usdtBalance > 0 ? usdtBalance.toFixed(2) : '0'}"
                                               min="0"
                                               max="${usdtBalance}"
                                               step="0.01"
                                               oninput="validateWithdrawalAmount()">
                                        <button class="max-amount-btn" onclick="setMaxWithdrawalAmount()">
                                            MAX
                                        </button>
                                    </div>
                                    <div class="amount-slider">
                                        <input type="range" 
                                               id="withdrawalSlider" 
                                               min="0" 
                                               max="${usdtBalance}" 
                                               value="${usdtBalance > 0 ? usdtBalance : '0'}"
                                               step="0.01"
                                               oninput="updateWithdrawalAmountFromSlider()">
                                    </div>
                                    <div class="amount-range-labels">
                                        <span>0 USDT</span>
                                        <span>${usdtBalance.toFixed(2)} USDT</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="requirements-section">
                            <div class="requirements-header">
                                <i class="fas fa-clipboard-check"></i>
                                <span>Withdrawal Requirements</span>
                            </div>
                            <div class="requirements-grid">
                                <div class="requirement-card ${usdtBalance >= CONFIG.MIN_WITHDRAWAL ? 'requirement-met' : 'requirement-not-met'}">
                                    <div class="requirement-icon">
                                        <i class="fas ${usdtBalance >= CONFIG.MIN_WITHDRAWAL ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                    </div>
                                    <div class="requirement-content">
                                        <div class="requirement-title">Minimum Withdrawal</div>
                                        <div class="requirement-value">${CONFIG.MIN_WITHDRAWAL} USDT</div>
                                        <div class="requirement-status">
                                            ${usdtBalance >= CONFIG.MIN_WITHDRAWAL ? '✓ Requirement met' : '✗ Not met'}
                                        </div>
                                    </div>
                                </div>
                                <div class="requirement-card ${bnbBalance >= CONFIG.WITHDRAWAL_FEE ? 'requirement-met' : 'requirement-not-met'}">
                                    <div class="requirement-icon">
                                        <i class="fas ${bnbBalance >= CONFIG.WITHDRAWAL_FEE ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                    </div>
                                    <div class="requirement-content">
                                        <div class="requirement-title">Network Fee</div>
                                        <div class="requirement-value">${CONFIG.WITHDRAWAL_FEE} BNB</div>
                                        <div class="requirement-status">
                                            ${bnbBalance >= CONFIG.WITHDRAWAL_FEE ? '✓ Sufficient BNB' : '✗ Insufficient BNB'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="withdrawal-warning" id="withdrawalWarning" style="display: none;">
                            <div class="warning-header">
                                <i class="fas fa-exclamation-triangle"></i>
                                <span>Cannot Proceed</span>
                            </div>
                            <div class="warning-text" id="withdrawalWarningText"></div>
                        </div>
                        
                        <div class="summary-section">
                            <div class="summary-header">
                                <i class="fas fa-file-invoice-dollar"></i>
                                <span>Withdrawal Summary</span>
                            </div>
                            <div class="summary-details">
                                <div class="summary-row">
                                    <span class="summary-label">Withdrawal Amount:</span>
                                    <span class="summary-value" id="summaryAmount">${usdtBalance > 0 ? usdtBalance.toFixed(2) : '0'} USDT</span>
                                </div>
                                <div class="summary-row">
                                    <span class="summary-label">Network Fee:</span>
                                    <span class="summary-value">${CONFIG.WITHDRAWAL_FEE} BNB</span>
                                </div>
                                <div class="summary-row total">
                                    <span class="summary-label">Total Cost:</span>
                                    <span class="summary-value" id="summaryTotal">${usdtBalance > 0 ? usdtBalance.toFixed(2) : '0'} USDT + ${CONFIG.WITHDRAWAL_FEE} BNB</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-secondary-large" onclick="closeModal()">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button class="btn-primary-large" id="confirmWithdrawalBtn" onclick="submitWithdrawal()">
                            <i class="fas fa-paper-plane"></i> Submit Withdrawal Request
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    validateWithdrawalAmount();
    
    setTimeout(() => {
        const slider = document.getElementById('withdrawalSlider');
        if (slider) {
            slider.value = usdtBalance > 0 ? usdtBalance : 0;
        }
    }, 100);
}

function setMaxWithdrawalAmount() {
    const input = document.getElementById('withdrawalAmount');
    const slider = document.getElementById('withdrawalSlider');
    
    if (input) {
        input.value = walletData.usdtBalance.toFixed(2);
        if (slider) {
            slider.value = walletData.usdtBalance;
        }
        validateWithdrawalAmount();
    }
}

function updateWithdrawalAmountFromSlider() {
    const slider = document.getElementById('withdrawalSlider');
    const input = document.getElementById('withdrawalAmount');
    
    if (slider && input) {
        input.value = parseFloat(slider.value).toFixed(2);
        validateWithdrawalAmount();
    }
}

function validateWithdrawalAmount() {
    const amountInput = document.getElementById('withdrawalAmount');
    const amount = parseFloat(amountInput.value) || 0;
    const slider = document.getElementById('withdrawalSlider');
    const warning = document.getElementById('withdrawalWarning');
    const warningText = document.getElementById('withdrawalWarningText');
    const btn = document.getElementById('confirmWithdrawalBtn');
    const summaryAmount = document.getElementById('summaryAmount');
    const summaryTotal = document.getElementById('summaryTotal');
    
    if (!warning || !btn || !summaryAmount || !summaryTotal) return;
    
    if (slider) {
        slider.value = amount;
    }
    
    summaryAmount.textContent = amount.toFixed(2) + ' USDT';
    summaryTotal.textContent = amount.toFixed(2) + ' USDT + ' + CONFIG.WITHDRAWAL_FEE + ' BNB';
    
    warning.style.display = 'none';
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Withdrawal Request';
    
    const errors = [];
    
    if (amount > 0 && amount < CONFIG.MIN_WITHDRAWAL) {
        errors.push(`Minimum withdrawal is ${CONFIG.MIN_WITHDRAWAL} USDT`);
    }
    
    if (amount > walletData.usdtBalance) {
        errors.push(`Insufficient USDT balance (Available: ${walletData.usdtBalance.toFixed(2)} USDT)`);
    }
    
    if (walletData.bnbBalance < CONFIG.WITHDRAWAL_FEE) {
        errors.push(`Insufficient BNB for network fee (Need: ${CONFIG.WITHDRAWAL_FEE} BNB)`);
    }
    
    if (errors.length > 0) {
        warningText.innerHTML = errors.join('<br>');
        warning.style.display = 'block';
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-ban"></i> Cannot Withdraw';
    }
}

function validateWithdrawalAddress() {
    const address = document.getElementById('withdrawalAddress').value.trim();
    const addressCheck = document.getElementById('addressCheck');
    const addressError = document.getElementById('addressError');
    const warning = document.getElementById('withdrawalWarning');
    const warningText = document.getElementById('withdrawalWarningText');
    const btn = document.getElementById('confirmWithdrawalBtn');
    
    if (!warning || !btn) return;
    
    if (addressCheck) addressCheck.style.display = 'none';
    if (addressError) addressError.style.display = 'none';
    
    if (!address) {
        if (addressError) addressError.style.display = 'block';
        warningText.textContent = "Please enter your USDT wallet address";
        warning.style.display = 'block';
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-ban"></i> Cannot Withdraw';
        return false;
    }
    
    if (!address.startsWith('0x') || address.length !== 42) {
        if (addressError) addressError.style.display = 'block';
        warningText.textContent = "Please enter a valid BEP20 address (must start with 0x and be 42 characters)";
        warning.style.display = 'block';
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-ban"></i> Cannot Withdraw';
        return false;
    }
    
    if (addressCheck) addressCheck.style.display = 'block';
    
    if (warningText.textContent.includes('address')) {
        warning.style.display = 'none';
    }
    
    validateWithdrawalAmount();
    
    return true;
}

function submitWithdrawal() {
    const amount = parseFloat(document.getElementById('withdrawalAmount').value);
    const address = document.getElementById('withdrawalAddress').value.trim();
    
    if (!validateWithdrawalAddress()) return;
    
    const errors = [];
    
    if (amount < CONFIG.MIN_WITHDRAWAL) {
        errors.push(`Minimum withdrawal is ${CONFIG.MIN_WITHDRAWAL} USDT`);
    }
    
    if (amount > walletData.usdtBalance) {
        errors.push('Insufficient USDT balance');
    }
    
    if (walletData.bnbBalance < CONFIG.WITHDRAWAL_FEE) {
        errors.push(`Insufficient BNB for network fee`);
    }
    
    if (errors.length > 0) {
        showMessage(errors.join('. '), 'error');
        return;
    }
    
    const withdrawalRequest = {
        id: 'withdrawal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        userId: userData.userId,
        username: userData.username,
        amount: amount,
        address: address,
        fee: CONFIG.WITHDRAWAL_FEE,
        timestamp: Date.now(),
        status: 'pending',
        reviewNote: 'Awaiting manual processing'
    };
    
    walletData.usdtBalance -= amount;
    walletData.bnbBalance -= CONFIG.WITHDRAWAL_FEE;
    walletData.pendingWithdrawals.push(withdrawalRequest);
    
    saveWalletData();
    updateWalletUI();
    
    if (db) {
        saveWithdrawalToFirebase(withdrawalRequest);
    }
    
    closeModal();
    showMessage(`✅ Withdrawal request submitted for ${amount.toFixed(2)} USDT. Manual processing required.`, 'success');
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
// 21. UTILITY FUNCTIONS
// ============================================

const elements = {};

function cacheElements() {
    const elementIds = [
        'balance', 'referrals', 'totalEarned', 'rankBadge',
        'username', 'userId', 'userAvatar', 'mineBtn',
        'rewardAmount', 'referralLink', 'copyBtn', 'miningPower',
        'refCount', 'refEarned', 'refRank', 'progressFill',
        'nextRank', 'currentPoints', 'targetPoints', 'remainingPoints',
        'cooldownTimer', 'shareBtn', 'balanceUSD', 'tokenPrice', 'nextRankBonus'
    ];
    
    elementIds.forEach(id => {
        elements[id] = document.getElementById(id);
    });
    
    console.log("✅ Cached", elementIds.length, "DOM elements");
}

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
        userData.userId = savedUserId || Date.now().toString() + Math.random().toString(36).substr(2, 4);
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
    const randomPart = Array.from({length: 6}, () => 
        chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
    
    return `${userId.slice(-4)}${randomPart}`.toUpperCase();
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
    
    if (elements.tokenPrice) {
        elements.tokenPrice.textContent = "1 MWH ≈ $0.001";
    }
}

function generateReferralLink() {
    if (userData.referralCode) {
        return `https://t.me/MiningWealthbot/PRO?startapp=${userData.referralCode}`;
    }
    return 'https://t.me/MiningWealthbot/PRO';
}

function updateReferralLink() {
    const refLink = generateReferralLink();
    
    if (elements.referralLink) {
        elements.referralLink.value = refLink;
        console.log("🔗 Updated referral link:", refLink);
    }
}

function checkForReferral() {
    console.log("🔍 Checking for referral...");
    
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) {
        const telegramRef = tg.initDataUnsafe.start_param;
        if (telegramRef && telegramRef !== userData.referralCode) {
            console.log("📱 Telegram referral detected:", telegramRef);
            processReferral(telegramRef);
            return;
        }
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const referrerCode = urlParams.get('startapp') || urlParams.get('ref') || urlParams.get('start');
    
    if (referrerCode && referrerCode !== userData.referralCode) {
        console.log("🔗 URL referral detected:", referrerCode);
        processReferral(referrerCode);
    }
    
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
                
                await referrerDoc.ref.update({
                    referrals: firebase.firestore.FieldValue.increment(1),
                    referralEarnings: firebase.firestore.FieldValue.increment(CONFIG.REFERRER_REWARD),
                    balance: firebase.firestore.FieldValue.increment(CONFIG.REFERRER_REWARD),
                    totalEarned: firebase.firestore.FieldValue.increment(CONFIG.REFERRER_REWARD)
                });
                
                userData.referredBy = referralCode;
                
                walletData.availableMWH += CONFIG.REFERRER_REWARD;
                walletData.mwhBalance = walletData.availableMWH + walletData.lockedMWH;
                userData.balance = walletData.availableMWH;
                
                // تسجيل في تاريخ الإحالات
                if (!transactionHistory.referral) {
                    transactionHistory.referral = [];
                }
                transactionHistory.referral.unshift({
                    amount: CONFIG.REFERRER_REWARD,
                    timestamp: Date.now()
                });
                
                saveUserData();
                saveWalletData();
                saveTransactionHistory();
                updateUI();
                
                showMessage(`🎉 Referral recorded! Referrer got +${CONFIG.REFERRER_REWARD} MWH`, 'success');
                
                await logReferralEvent(referrerData.userId, userData.userId, referralCode);
                
                console.log("✅ Referral processed successfully");
                return true;
            }
        }
        
        userData.referredBy = referralCode;
        
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
    
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
    const reward = currentRank.reward;
    
    console.log("📈 Before mining - Balance:", userData.balance, "Rank:", userData.rank, "Reward:", reward);
    
    userData.balance += reward;
    userData.totalEarned += reward;
    userData.lastMineTime = now;
    
    walletData.availableMWH += reward;
    walletData.mwhBalance = walletData.availableMWH + walletData.lockedMWH;
    
    addToMiningHistory({
        amount: reward,
        timestamp: now,
        type: 'mining_reward'
    });
    
    console.log("📈 After mining - Balance:", userData.balance);
    
    animateBeltEmpty();
    
    saveUserData();
    saveWalletData();
    updateUI();
    updateStakingBalance();
    animateMineButton(reward);
    
    showMessage(`⛏️ +${reward} MWH! Total: ${userData.balance} MWH`, 'success');
    checkRankUp();
    
    setTimeout(updateEnergyBelt, 100);
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
        if (elements.mineBtn) {
            elements.mineBtn.addEventListener('click', minePoints);
        }
    }, 2000);
}

function initWallet() {
    walletData.availableMWH = userData.balance;
    walletData.lockedMWH = 0;
    walletData.mwhBalance = walletData.availableMWH + walletData.lockedMWH;
    
    const savedWallet = localStorage.getItem(`vip_wallet_${userData.userId}`);
    if (savedWallet) {
        try {
            const parsed = JSON.parse(savedWallet);
            walletData.usdtBalance = parsed.usdtBalance || 0;
            walletData.bnbBalance = parsed.bnbBalance || 0;
            walletData.tonBalance = parsed.tonBalance || 0;
            walletData.ethBalance = parsed.ethBalance || 0;
            walletData.totalWithdrawn = parsed.totalWithdrawn || 0;
            walletData.pendingWithdrawals = parsed.pendingWithdrawals || [];
            walletData.pendingDeposits = parsed.pendingDeposits || [];
            walletData.depositHistory = parsed.depositHistory || [];
            walletData.withdrawalHistory = parsed.withdrawalHistory || [];
            walletData.usedTransactions = parsed.usedTransactions || [];
            walletData.availableMWH = parsed.availableMWH || userData.balance;
            walletData.lockedMWH = parsed.lockedMWH || 0;
            walletData.mwhBalance = walletData.availableMWH + walletData.lockedMWH;
            
            console.log("✅ Wallet data loaded");
        } catch (e) {
            console.error("❌ Error loading wallet:", e);
        }
    }
    
    updateWalletUI();
}

function updateWalletUI() {
    if (document.getElementById('walletMWH')) {
        document.getElementById('walletMWH').textContent = formatNumber(walletData.mwhBalance);
    }
    
    if (document.getElementById('walletUSDT')) {
        document.getElementById('walletUSDT').textContent = formatNumber(walletData.usdtBalance, 2);
    }
    
    if (document.getElementById('walletBNB')) {
        document.getElementById('walletBNB').textContent = walletData.bnbBalance.toFixed(4);
    }
    
    if (document.getElementById('walletTON')) {
        document.getElementById('walletTON').textContent = formatNumber(walletData.tonBalance);
    }
    
    if (document.getElementById('walletETH')) {
        document.getElementById('walletETH').textContent = walletData.ethBalance.toFixed(4);
    }
    
    updateWalletValues();
    updateTotalBalance(); // تحديث قيمة MWH
}

function updateWalletValues() {
    const mwhUSD = (walletData.mwhBalance * CONFIG.MWH_TO_USD).toFixed(2);
    const usdtUSD = walletData.usdtBalance.toFixed(2);
    const bnbUSD = (walletData.bnbBalance * CONFIG.BNB_TO_USD).toFixed(2);
    
    if (document.getElementById('walletMWHValue')) {
        document.getElementById('walletMWHValue').textContent = `$${mwhUSD}`;
    }
    
    if (document.getElementById('walletUSDTValue')) {
        document.getElementById('walletUSDTValue').textContent = `$${usdtUSD}`;
    }
    
    if (document.getElementById('walletBNBValue')) {
        document.getElementById('walletBNBValue').textContent = `$${bnbUSD}`;
    }
}

function updateTotalBalance() {
    const totalUSD = (walletData.mwhBalance * CONFIG.MWH_TO_USD) + 
                     walletData.usdtBalance + 
                     (walletData.bnbBalance * CONFIG.BNB_TO_USD);
    
    const totalMWH = walletData.mwhBalance + 
                     (walletData.usdtBalance * CONFIG.MWH_TO_USDT_RATE) + 
                     (walletData.bnbBalance * CONFIG.BNB_TO_MWH_RATE);
    
    const totalUSDElement = document.getElementById('totalBalanceUSD');
    const totalMWHElement = document.getElementById('totalBalanceMWH');
    
    if (totalUSDElement) {
        totalUSDElement.textContent = `$${totalUSD.toFixed(2)}`;
    }
    
    if (totalMWHElement) {
        totalMWHElement.textContent = `≈ ${formatNumber(Math.round(totalMWH))} MWH`;
    }
}

function getMinDeposit(currency) {
    return currency === 'USDT' ? CONFIG.MIN_DEPOSIT_USDT : CONFIG.MIN_DEPOSIT_BNB;
}

function updateUI() {
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
    
    if (elements.balance) {
        elements.balance.textContent = userData.balance.toLocaleString();
    }
    
    if (elements.referrals) {
        elements.referrals.textContent = `${userData.referrals} Referrals`;
    }
    
    if (elements.totalEarned) {
        elements.totalEarned.textContent = `${userData.totalEarned.toLocaleString()} MWH`;
    }
    
    if (elements.rankBadge) {
        elements.rankBadge.textContent = userData.rank;
    }
    
    if (elements.rewardAmount) {
        elements.rewardAmount.textContent = currentRank.reward;
    }
    
    if (elements.miningPower) {
        elements.miningPower.innerHTML = `<i class="fas fa-bolt"></i> Yield: ${currentRank.power}`;
    }
    
    if (elements.refCount) {
        elements.refCount.textContent = userData.referrals;
    }
    
    if (elements.refEarned) {
        elements.refEarned.textContent = userData.referralEarnings.toLocaleString() + " MWH";
    }
    
    if (elements.refRank) {
        elements.refRank.textContent = userData.rank;
    }
    
    updateUSDBalance();
    updateProgress();
    updateEnergyBelt();
}

function updateUSDBalance() {
    if (elements.balanceUSD) {
        elements.balanceUSD.textContent = `≈ $${(userData.balance * CONFIG.MWH_TO_USD).toFixed(3)}`;
    }
}

function updateProgress() {
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
    const nextRank = CONFIG.RANKS[CONFIG.RANKS.indexOf(currentRank) + 1];
    
    if (nextRank && elements.progressFill) {
        const progress = ((userData.totalEarned - currentRank.min) / (nextRank.min - currentRank.min)) * 100;
        elements.progressFill.style.width = `${Math.min(progress, 100)}%`;
        if (elements.nextRank) elements.nextRank.textContent = `Next: ${nextRank.name} (${nextRank.min.toLocaleString()} MWH)`;
        if (elements.currentPoints) elements.currentPoints.textContent = `${userData.totalEarned.toLocaleString()} MWH`;
        if (elements.targetPoints) elements.targetPoints.textContent = `${nextRank.min.toLocaleString()} MWH`;
        if (elements.remainingPoints) elements.remainingPoints.textContent = `${Math.max(0, nextRank.min - userData.totalEarned).toLocaleString()} MWH`;
        if (elements.nextRankBonus) elements.nextRankBonus.textContent = `+${nextRank.reward - currentRank.reward} MWH bonus on upgrade`;
    }
}

function updateEnergyBelt() {
    const beltFill = document.getElementById('beltFill');
    const beltKnob = document.getElementById('beltKnob');
    const mineBtn = document.getElementById('mineBtn');
    const cooldownTimer = document.getElementById('cooldownTimer');
    
    if (!beltFill || !beltKnob || !mineBtn || !cooldownTimer) return;
    
    const now = Date.now();
    const timeSinceLastMine = now - userData.lastMineTime;
    const cooldown = CONFIG.MINE_COOLDOWN;
    const fillPercentage = userData.lastMineTime ? Math.min((timeSinceLastMine / cooldown) * 100, 100) : 100;
    
    beltFill.style.width = `${fillPercentage}%`;
    beltKnob.style.left = `${fillPercentage}%`;
    
    const isReady = fillPercentage >= 100;
    
    if (isReady) {
        mineBtn.disabled = false;
        cooldownTimer.textContent = 'READY';
        cooldownTimer.style.color = '#22c55e';
    } else {
        mineBtn.disabled = true;
        const timeLeft = cooldown - timeSinceLastMine;
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        cooldownTimer.textContent = `${hours}h ${minutes}m`;
        cooldownTimer.style.color = '#ef4444';
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

function checkRankUp() {
    const newRank = CONFIG.RANKS.find(r => userData.totalEarned >= r.min && userData.totalEarned <= r.max);
    if (newRank && newRank.name !== userData.rank) {
        const oldRank = userData.rank;
        userData.rank = newRank.name;
        saveUserData();
        updateUI();
        showMessage(`🏆 Rank Up! ${oldRank} → ${newRank.name}`, 'success');
    }
}

function formatNumber(num, decimals = 0) {
    if (num === undefined || num === null) return '0';
    return Number(num).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function showMessage(text, type = 'info') {
    const msg = document.createElement('div');
    msg.className = `message ${type}`;
    msg.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i><span>${text}</span>`;
    msg.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%) translateY(-100px);
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white; padding: 12px 24px; border-radius: 10px; display: flex; align-items: center; gap: 10px;
        z-index: 2000; opacity: 0; transition: all 0.3s; font-weight: 500;
    `;
    document.body.appendChild(msg);
    
    setTimeout(() => {
        msg.style.opacity = '1';
        msg.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    setTimeout(() => {
        msg.style.opacity = '0';
        msg.style.transform = 'translateX(-50%) translateY(-100px)';
        setTimeout(() => msg.remove(), 300);
    }, 3000);
}

function closeModal() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.remove(); // إزالة كاملة من DOM
    });
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            showMessage('✅ Copied to clipboard!', 'success');
        })
        .catch(err => {
            console.error('Copy error:', err);
            showMessage('❌ Failed to copy', 'error');
        });
}

// ============================================
// 22. FIREBASE FUNCTIONS
// ============================================

async function syncUserWithFirebase() {
    if (!db || !userData.userId) return;
    
    try {
        const userRef = db.collection('users').doc(userData.userId);
        const userSnap = await userRef.get();
        
        if (userSnap.exists) {
            const firebaseData = userSnap.data();
            
            if (firebaseData.balance !== undefined) {
                console.log("🔥 Firebase balance:", firebaseData.balance, "Local balance:", userData.balance);
                
                if (firebaseData.lastUpdate && firebaseData.lastUpdate.toDate) {
                    const firebaseTime = firebaseData.lastUpdate.toDate().getTime();
                    const localTime = userData.lastSaveTime;
                    
                    if (firebaseTime > localTime) {
                        userData.balance = firebaseData.balance || userData.balance;
                        userData.totalEarned = firebaseData.totalEarned || userData.totalEarned;
                        userData.referrals = firebaseData.referrals || userData.referrals;
                        userData.rank = firebaseData.rank || userData.rank;
                        userData.referralEarnings = firebaseData.referralEarnings || userData.referralEarnings;
                        
                        console.log("✅ Synced from Firebase. New balance:", userData.balance);
                    } else if (localTime > firebaseTime) {
                        await userRef.set({
                            balance: userData.balance,
                            totalEarned: userData.totalEarned,
                            referrals: userData.referrals,
                            rank: userData.rank,
                            referralEarnings: userData.referralEarnings,
                            userId: userData.userId,
                            username: userData.username,
                            referralCode: userData.referralCode,
                            referredBy: userData.referredBy,
                            lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });
                        console.log("✅ Pushed local data to Firebase");
                    }
                }
            } else {
                await userRef.set({
                    balance: userData.balance,
                    totalEarned: userData.totalEarned,
                    referrals: userData.referrals,
                    rank: userData.rank,
                    referralEarnings: userData.referralEarnings,
                    userId: userData.userId,
                    username: userData.username,
                    referralCode: userData.referralCode,
                    referredBy: userData.referredBy,
                    lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                console.log("✅ Created new user in Firebase");
            }
        } else {
            await userRef.set({
                balance: userData.balance,
                totalEarned: userData.totalEarned,
                referrals: userData.referrals,
                rank: userData.rank,
                referralEarnings: userData.referralEarnings,
                userId: userData.userId,
                username: userData.username,
                referralCode: userData.referralCode,
                referredBy: userData.referredBy,
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log("✅ Created new user in Firebase");
        }
        
    } catch (error) {
        console.error("❌ Firebase sync error:", error);
    }
}

async function loadUserFromFirebase() {
    if (!db || !userData.userId) return;
    
    try {
        const userRef = db.collection('users').doc(userData.userId);
        const userSnap = await userRef.get();
        
        if (userSnap.exists) {
            const firebaseData = userSnap.data();
            
            if (firebaseData.balance !== undefined && firebaseData.balance !== null) {
                const firebaseBalance = Number(firebaseData.balance);
                console.log("🔥 Loading from Firebase - Balance:", firebaseBalance);
                
                userData.balance = firebaseBalance;
                userData.totalEarned = firebaseData.totalEarned || userData.totalEarned;
                userData.referrals = firebaseData.referrals || userData.referrals;
                userData.rank = firebaseData.rank || userData.rank;
                userData.referralEarnings = firebaseData.referralEarnings || userData.referralEarnings;
                userData.referralCode = firebaseData.referralCode || userData.referralCode;
                userData.referredBy = firebaseData.referredBy || userData.referredBy;
                
                console.log("✅ Loaded from Firebase. Balance:", userData.balance);
                return true;
            }
        }
    } catch (error) {
        console.error("❌ Firebase load error:", error);
    }
    return false;
}

function saveUserToFirebase() {
    if (!db || !userData.userId) return;
    
    try {
        const userRef = db.collection('users').doc(userData.userId);
        
        userRef.set({
            balance: userData.balance,
            totalEarned: userData.totalEarned,
            referrals: userData.referrals,
            rank: userData.rank,
            referralEarnings: userData.referralEarnings,
            userId: userData.userId,
            username: userData.username,
            referralCode: userData.referralCode,
            referredBy: userData.referredBy,
            lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(() => {
            console.log("✅ User saved to Firebase");
        }).catch(error => {
            console.error("❌ User Firebase save error:", error);
        });
        
    } catch (error) {
        console.error("❌ User Firebase save error:", error);
    }
}

function updateLocalUserData(userId, amount, currency) {
    console.log("🔄 Updating local user data for:", userId, amount, currency);
}

// ============================================
// 23. INITIALIZE APPLICATION
// ============================================

async function initApp() {
    console.log("🚀 Starting VIP Mining App v7.0...");
    
    try {
        cacheElements();
        
        await setupUser();
        
        await loadUserData();
        
        setupEventListeners();
        
        initAdminSystem();
        
        setupRealTimeListeners();
        
        initEarningPage();
        
        updateUI();
        
        updateWalletUI();
        
        checkForReferral();
        
        initNotificationSystem();
        
        updateCardStatus();
        
        userData.isInitialized = true;
        
        const activePage = document.querySelector('.page.active, .container.active');
        if (activePage?.id === 'poolsPage') {
            initStakingPage();
        }
        
        console.log("✅ App ready! Balance:", userData.balance, "User ID:", userData.userId);
        
        setTimeout(() => {
            showMessage(`💰 Welcome ${userData.username}! Balance: ${userData.balance} MWH`, 'success');
        }, 1000);
        
    } catch (error) {
        console.error("❌ Initialization error:", error);
        showMessage('Error starting app. Please refresh.', 'error');
    }
}

function setupEventListeners() {
    if (elements.mineBtn) elements.mineBtn.addEventListener('click', minePoints);
    if (elements.copyBtn) elements.copyBtn.addEventListener('click', copyReferralLink);
    if (elements.shareBtn) elements.shareBtn.addEventListener('click', shareOnTelegram);
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
    const shareText = `🚀 *Join VIP Mining Wealth PRO!*\n\n⛏️ *Mine 250 MWH every 4 hours*\n👥 *Get +50 MWH BONUS with my link*\n💰 *Earn 50 MWH for each referral*\n\n👉 ${refLink}\n\n💎 *Start earning now!* @VIPMainingPROBot`;
    
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`;
    
    window.open(shareUrl, '_blank');
    showMessage('📱 Opening Telegram...', 'info');
}

async function loadUserData() {
    console.log("📂 Loading user data for:", userData.userId);
    
    try {
        const storageKey = `vip_mining_${userData.userId}`;
        console.log("🔍 Looking for key:", storageKey);
        
        const savedData = localStorage.getItem(storageKey);
        
        if (savedData) {
            console.log("✅ Found saved data");
            const parsedData = JSON.parse(savedData);
            
            if (parsedData.balance !== undefined && parsedData.balance !== null) {
                const loadedBalance = Number(parsedData.balance);
                console.log("💰 Loading balance from storage:", loadedBalance);
                userData.balance = loadedBalance;
            }
            
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
        
        initWallet();
        
        loadStakingData();
        loadCardData();
        loadDailyStats();
        loadTransactionHistory();
        
        if (db) {
            await loadUserFromFirebase();
            
            setTimeout(() => {
                checkAndUpdateTransactionsOnStart();
            }, 2000);
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
            version: '7.0'
        };
        
        console.log("💾 Saving user data - Balance:", userData.balance);
        
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        
        const verifyData = localStorage.getItem(storageKey);
        if (verifyData) {
            const parsed = JSON.parse(verifyData);
            console.log("✅ User data saved successfully");
        } else {
            console.error("❌ Failed to save to localStorage!");
        }
        
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
            mwhBalance: walletData.mwhBalance,
            availableMWH: walletData.availableMWH,
            lockedMWH: walletData.lockedMWH,
            usdtBalance: walletData.usdtBalance,
            bnbBalance: walletData.bnbBalance,
            tonBalance: walletData.tonBalance,
            ethBalance: walletData.ethBalance,
            totalWithdrawn: walletData.totalWithdrawn,
            pendingWithdrawals: walletData.pendingWithdrawals,
            pendingDeposits: walletData.pendingDeposits,
            depositHistory: walletData.depositHistory,
            withdrawalHistory: walletData.withdrawalHistory,
            usedTransactions: walletData.usedTransactions,
            lastUpdate: Date.now()
        };
        
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        console.log("💾 Wallet data saved");
        
        if (db) {
            saveWalletToFirebase();
        }
        
    } catch (error) {
        console.error("❌ Wallet save error:", error);
    }
}

function saveWalletToFirebase() {
    if (!db || !userData.userId) return;
    
    try {
        const walletRef = db.collection('wallets').doc(userData.userId);
        
        const firebaseData = {
            userId: userData.userId,
            mwhBalance: walletData.mwhBalance,
            availableMWH: walletData.availableMWH,
            lockedMWH: walletData.lockedMWH,
            usdtBalance: walletData.usdtBalance,
            bnbBalance: walletData.bnbBalance,
            tonBalance: walletData.tonBalance,
            ethBalance: walletData.ethBalance,
            totalWithdrawn: walletData.totalWithdrawn,
            depositHistory: walletData.depositHistory.slice(0, 50),
            withdrawalHistory: walletData.withdrawalHistory.slice(0, 50),
            usedTransactions: walletData.usedTransactions.slice(0, 100),
            lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        walletRef.set(firebaseData, { merge: true }).then(() => {
            console.log("✅ Wallet saved to Firebase");
        }).catch(error => {
            console.error("❌ Wallet Firebase save error:", error);
        });
        
    } catch (error) {
        console.error("❌ Wallet Firebase save error:", error);
    }
}

// ============================================
// 24. SET INTERVALS AND WINDOW EVENTS - تم تعديله لتقليل عمليات Firebase
// ============================================

setInterval(updateEnergyBelt, 1000);

// حفظ البيانات كل 5 دقائق في localStorage فقط
// حفظ في Firebase كل ساعة
let lastFirebaseSaveTime = Date.now();

setInterval(() => {
    if (userData.userId && userData.isInitialized) {
        // حفظ محلي (مجاني)
        saveUserData();
        saveWalletData();
        saveStakingData();
        saveCardData();
        saveTransactionHistory();
        saveDailyStats();
        
        // حفظ في Firebase كل ساعة فقط
        const now = Date.now();
        if (now - lastFirebaseSaveTime > 3600000) { // 60 دقيقة
            if (db) {
                saveUserToFirebase();
                saveWalletToFirebase();
                console.log("💾 Hourly Firebase save completed");
            }
            lastFirebaseSaveTime = now;
        }
        
        checkCompletedStakes();
    }
}, 300000); // كل 5 دقائق بدلاً من 30 ثانية

window.addEventListener('beforeunload', () => {
    if (userData.userId) {
        // حفظ محلي فقط عند الخروج
        localStorage.setItem(`vip_mining_${userData.userId}`, JSON.stringify(userData));
        localStorage.setItem(`vip_wallet_${userData.userId}`, JSON.stringify(walletData));
        localStorage.setItem(`vip_staking_${userData.userId}`, JSON.stringify(stakingData));
        localStorage.setItem(`vip_card_${userData.userId}`, JSON.stringify(cardData));
        localStorage.setItem(`vip_history_${userData.userId}`, JSON.stringify(transactionHistory));
        stopNotificationTimer();
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// ============================================
// 25. EXPORT FUNCTIONS TO WINDOW
// ============================================

window.closeModal = closeModal;
window.showMessage = showMessage;
window.showComingSoon = () => showMessage('🚀 Coming Soon!', 'info');
window.openSwapModal = openSwapModal;
window.openDepositModal = openDepositModal;
window.openWithdrawalModal = openWithdrawalModal;
window.showTransactionHistory = showTransactionHistory;
window.updateWalletUI = updateWalletUI;
window.formatNumber = formatNumber;
window.copyDepositAddress = copyDepositAddress;
window.validateTransactionHash = validateTransactionHash;
window.validateDepositAmount = validateDepositAmount;
window.submitDepositRequest = submitDepositRequest;
window.calculateSwap = calculateSwap;
window.setMaxSwap = setMaxSwap;
window.executeSwap = executeSwap;
window.validateWithdrawalAmount = validateWithdrawalAmount;
window.validateWithdrawalAddress = validateWithdrawalAddress;
window.setMaxWithdrawalAmount = setMaxWithdrawalAmount;
window.submitWithdrawal = submitWithdrawal;

window.checkAdminPassword = checkAdminPassword;
window.switchAdminTab = switchAdminTab;
window.addBalanceToSpecificUser = addBalanceToSpecificUser;
window.loadAdminPendingRequests = loadAdminPendingRequests;

window.initEarningPage = initEarningPage;
window.watchAd = watchAd;
window.claimReferralChallenge = claimReferralChallenge;
window.updateEarningUI = updateEarningUI;

window.initNotificationSystem = initNotificationSystem;
window.startNotificationTimer = startNotificationTimer;
window.stopNotificationTimer = stopNotificationTimer;

window.initStakingPage = initStakingPage;
window.openStakingModal = openStakingModal;
window.validateStakingAmount = validateStakingAmount;
window.setMaxStakingAmount = setMaxStakingAmount;
window.confirmStake = confirmStake;
window.cancelStake = cancelStake;
window.confirmCancelStake = confirmCancelStake;
window.claimStake = claimStake;
window.updateStakingBalance = updateStakingBalance;
window.showActivePlans = showActivePlans;

window.updateCardStatus = updateCardStatus;
window.showCardPurchaseModal = showCardPurchaseModal;
window.purchaseCard = purchaseCard;
window.flipCard = flipCard;
window.showCardActivationModal = showCardActivationModal;
window.updateAirdropStrip = updateAirdropStrip;
window.claimLockedBonus = claimLockedBonus;

window.switchHistoryTab = switchHistoryTab;
window.copyReferralLink = copyReferralLink;
window.shareOnTelegram = shareOnTelegram;
window.minePoints = minePoints;
window.updateTotalBalance = updateTotalBalance;

window.switchToPage = window.switchToPage || function(page) {};

console.log("✅ VIP Mining Wallet v7.0 loaded with Advanced Staking System, MWH Pay Card, Locked Bonus, and Complete Transaction History! Auto-save optimized for Firebase cost reduction.");
