// ============================================
// VIP Mining Mini App - PROFESSIONAL WALLET v6.5
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

// Professional Wallet Data
let walletData = {
    mwhBalance: 25,
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
    lastUpdate: Date.now()
};

// Configuration
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
    BNB_TO_USD: 875,
    TON_TO_USD: 1.6,
    ETH_TO_USD: 3000,
    
    MIN_SWAP: 10000,
    MWH_TO_USDT_RATE: 1000,
    BNB_TO_MWH_RATE: 870000,
    
    MIN_WITHDRAWAL: 50,
    MIN_DEPOSIT_USDT: 10,
    MIN_DEPOSIT_BNB: 0.015,
    WITHDRAWAL_FEE: 0.0005,
    
    DEPOSIT_ADDRESS: "0x790CAB511055F63db2F30AD227f7086bA3B6376a",
    
    MIN_TRANSACTION_LENGTH: 64
};

// ============================================
// ADMIN PANEL SYSTEM - HIDDEN ADMIN FEATURES
// ============================================

let adminAccess = false;
let gemClickCount = 0;
let lastGemClickTime = 0;
const ADMIN_PASSWORD = "Ali97$";

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
                            <i class="fas fa-exclamation-circle"></i> Incorrect password
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
    
    if (!passwordInput) return;
    
    if (passwordInput.value === ADMIN_PASSWORD) {
        adminAccess = true;
        closeModal();
        showAdminPanel();
        showMessage('✅ Admin access granted', 'success');
        console.log("🔓 Admin access granted");
    } else {
        if (errorDiv) errorDiv.style.display = 'block';
        passwordInput.style.borderColor = '#ef4444';
        setTimeout(() => {
            if (errorDiv) errorDiv.style.display = 'none';
            passwordInput.style.borderColor = 'rgba(59,130,246,0.3)';
        }, 2000);
    }
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

// ============================================
// ADMIN FUNCTIONS - IMPROVED VERSION
// ============================================

async function loadAdminPendingRequests() {
    if (!adminAccess || !db) {
        console.log("❌ No admin access or no connection");
        return;
    }
    
    console.log("🔄 Loading admin requests...");
    
    try {
        // 1. Load pending deposits
        const depositsSnapshot = await db.collection('deposit_requests')
            .where('status', '==', 'pending')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();
        
        console.log(`📥 Pending deposits found: ${depositsSnapshot.size}`);
        
        const pendingDeposits = [];
        depositsSnapshot.forEach(doc => {
            pendingDeposits.push({ 
                id: doc.id, 
                ...doc.data() 
            });
        });
        
        // 2. Update deposits UI
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
                        <div class="empty-text">No pending deposits</div>
                    </div>
                `;
            } else {
                let html = '';
                pendingDeposits.forEach(item => {
                    const date = item.timestamp?.toDate ? item.timestamp.toDate() : new Date(item.timestamp || Date.now());
                    const currency = item.currency || 'USDT';
                    const amount = parseFloat(item.amount || 0);
                    
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
                                    <span class="detail-value">${amount} ${currency}</span>
                                </div>
                                <div class="detail-row">
                                    <span>Transaction:</span>
                                    <span class="detail-value hash" title="${item.transactionHash || 'None'}">
                                        ${item.transactionHash ? 
                                            item.transactionHash.substring(0, 10) + '...' + item.transactionHash.substring(item.transactionHash.length - 6) : 
                                            'No hash'}
                                    </span>
                                </div>
                                <div class="detail-row">
                                    <span>Date:</span>
                                    <span class="detail-value">${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px; margin-top: 10px;">
                                <button class="admin-action-btn approve" 
                                        data-type="deposit" 
                                        data-id="${item.id}"
                                        data-userid="${item.userId}"
                                        data-amount="${amount}"
                                        data-currency="${currency}">
                                    <i class="fas fa-check"></i> Approve
                                </button>
                                <button class="admin-action-btn reject" 
                                        data-type="deposit" 
                                        data-id="${item.id}">
                                    <i class="fas fa-times"></i> Reject
                                </button>
                            </div>
                        </div>
                    `;
                });
                depositsList.innerHTML = html;
                
                // Add event listeners for deposit buttons
                depositsList.querySelectorAll('.admin-action-btn.approve').forEach(btn => {
                    btn.addEventListener('click', handleApproveAction);
                });
                
                depositsList.querySelectorAll('.admin-action-btn.reject').forEach(btn => {
                    btn.addEventListener('click', handleRejectAction);
                });
            }
        }
        
        // 3. Load pending withdrawals
        const withdrawalsSnapshot = await db.collection('withdrawals')
            .where('status', '==', 'pending')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();
        
        console.log(`📤 Pending withdrawals found: ${withdrawalsSnapshot.size}`);
        
        const pendingWithdrawals = [];
        withdrawalsSnapshot.forEach(doc => {
            pendingWithdrawals.push({ 
                id: doc.id, 
                ...doc.data() 
            });
        });
        
        // 4. Update withdrawals UI
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
                        <div class="empty-text">No pending withdrawals</div>
                    </div>
                `;
            } else {
                let html = '';
                pendingWithdrawals.forEach(item => {
                    const date = item.timestamp?.toDate ? item.timestamp.toDate() : new Date(item.timestamp || Date.now());
                    const amount = parseFloat(item.amount || 0);
                    
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
                                    <span class="detail-value">${amount} USDT</span>
                                </div>
                                <div class="detail-row">
                                    <span>Address:</span>
                                    <span class="detail-value hash" title="${item.address || 'None'}">
                                        ${item.address ? 
                                            item.address.substring(0, 10) + '...' + item.address.substring(item.address.length - 6) : 
                                            'No address'}
                                    </span>
                                </div>
                                <div class="detail-row">
                                    <span>Date:</span>
                                    <span class="detail-value">${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px; margin-top: 10px;">
                                <button class="admin-action-btn approve" 
                                        data-type="withdrawal" 
                                        data-id="${item.id}"
                                        data-userid="${item.userId}"
                                        data-amount="${amount}">
                                    <i class="fas fa-check"></i> Approve
                                </button>
                                <button class="admin-action-btn reject" 
                                        data-type="withdrawal" 
                                        data-id="${item.id}">
                                    <i class="fas fa-times"></i> Reject
                                </button>
                            </div>
                        </div>
                    `;
                });
                withdrawalsList.innerHTML = html;
                
                // Add event listeners for withdrawal buttons
                withdrawalsList.querySelectorAll('.admin-action-btn.approve').forEach(btn => {
                    btn.addEventListener('click', handleApproveAction);
                });
                
                withdrawalsList.querySelectorAll('.admin-action-btn.reject').forEach(btn => {
                    btn.addEventListener('click', handleRejectAction);
                });
            }
        }
        
        console.log("✅ Admin requests loaded successfully");
        
    } catch (error) {
        console.error("❌ Error loading admin requests:", error);
        showMessage('❌ Error loading admin data. Check console.', 'error');
    }
}

// ============================================
// ADMIN ACTION HANDLERS - NEW SYSTEM
// ============================================

async function handleApproveAction(event) {
    const button = event.currentTarget;
    const type = button.getAttribute('data-type');
    const requestId = button.getAttribute('data-id');
    
    if (!adminAccess || !db) {
        showMessage('❌ No admin access', 'error');
        return;
    }
    
    try {
        if (type === 'deposit') {
            const userId = button.getAttribute('data-userid');
            const amount = parseFloat(button.getAttribute('data-amount'));
            const currency = button.getAttribute('data-currency');
            
            await approveDepositRequest(requestId, userId, amount, currency);
            
        } else if (type === 'withdrawal') {
            const userId = button.getAttribute('data-userid');
            const amount = parseFloat(button.getAttribute('data-amount'));
            
            await approveWithdrawalRequest(requestId, userId, amount);
        }
        
        // Refresh the list after approval
        setTimeout(loadAdminPendingRequests, 1000);
        
    } catch (error) {
        console.error("❌ Error in handleApproveAction:", error);
        showMessage('❌ Error processing approval', 'error');
    }
}

async function handleRejectAction(event) {
    const button = event.currentTarget;
    const type = button.getAttribute('data-type');
    const requestId = button.getAttribute('data-id');
    
    if (!adminAccess || !db) {
        showMessage('❌ No admin access', 'error');
        return;
    }
    
    try {
        if (type === 'deposit') {
            await rejectDepositRequest(requestId);
        } else if (type === 'withdrawal') {
            const userId = button.getAttribute('data-userid');
            const amount = parseFloat(button.getAttribute('data-amount') || 0);
            await rejectWithdrawalRequest(requestId, userId, amount);
        }
        
        // Refresh the list after rejection
        setTimeout(loadAdminPendingRequests, 1000);
        
    } catch (error) {
        console.error("❌ Error in handleRejectAction:", error);
        showMessage('❌ Error processing rejection', 'error');
    }
}

async function approveDepositRequest(requestId, userId, amount, currency) {
    if (!adminAccess || !db) return;
    
    if (!confirm(`Approve deposit of ${amount} ${currency} for user ${userId}?`)) return;
    
    try {
        // 1. Update deposit request status
        const depositRef = db.collection('deposit_requests').doc(requestId);
        await depositRef.update({
            status: 'approved',
            approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
            approvedBy: 'admin',
            adminNote: 'Approved manually'
        });
        
        console.log(`✅ Deposit request ${requestId} approved`);
        
        // 2. Update user balance
        const userRef = db.collection('users').doc(userId);
        const userSnap = await userRef.get();
        
        if (userSnap.exists) {
            const currentData = userSnap.data();
            let mwhAmount = amount;
            
            // Convert if needed
            if (currency === 'USDT') {
                mwhAmount = amount * CONFIG.MWH_TO_USDT_RATE;
            } else if (currency === 'BNB') {
                mwhAmount = amount * CONFIG.BNB_TO_MWH_RATE;
            }
            
            await userRef.update({
                balance: firebase.firestore.FieldValue.increment(mwhAmount),
                totalEarned: firebase.firestore.FieldValue.increment(mwhAmount),
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`💰 Added ${mwhAmount} MWH to user ${userId}`);
        } else {
            console.warn(`⚠️ User ${userId} not found in database`);
        }
        
        showMessage(`✅ Deposit approved! ${amount} ${currency} added to user balance`, 'success');
        
    } catch (error) {
        console.error("❌ Error approving deposit:", error);
        showMessage('❌ Error approving deposit', 'error');
        throw error;
    }
}

async function rejectDepositRequest(requestId) {
    if (!adminAccess || !db) return;
    
    const reason = prompt("Enter rejection reason:", "Invalid transaction");
    if (reason === null) return;
    
    try {
        const depositRef = db.collection('deposit_requests').doc(requestId);
        await depositRef.update({
            status: 'rejected',
            rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
            rejectedBy: 'admin',
            rejectionReason: reason
        });
        
        showMessage(`❌ Deposit rejected. Reason: ${reason}`, 'warning');
        
    } catch (error) {
        console.error("❌ Error rejecting deposit:", error);
        showMessage('❌ Error rejecting deposit', 'error');
        throw error;
    }
}

async function approveWithdrawalRequest(requestId, userId, amount) {
    if (!adminAccess || !db) return;
    
    if (!confirm(`Approve withdrawal of ${amount} USDT for user ${userId}?`)) return;
    
    try {
        const withdrawalRef = db.collection('withdrawals').doc(requestId);
        await withdrawalRef.update({
            status: 'completed',
            completedAt: firebase.firestore.FieldValue.serverTimestamp(),
            completedBy: 'admin'
        });
        
        showMessage(`✅ Withdrawal approved! ${amount} USDT sent to user`, 'success');
        
    } catch (error) {
        console.error("❌ Error approving withdrawal:", error);
        showMessage('❌ Error approving withdrawal', 'error');
        throw error;
    }
}

async function rejectWithdrawalRequest(requestId, userId, amount) {
    if (!adminAccess || !db) return;
    
    const reason = prompt("Enter rejection reason:", "Insufficient funds");
    if (reason === null) return;
    
    try {
        const withdrawalRef = db.collection('withdrawals').doc(requestId);
        await withdrawalRef.update({
            status: 'rejected',
            rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
            rejectedBy: 'admin',
            rejectionReason: reason
        });
        
        showMessage(`❌ Withdrawal rejected. Reason: ${reason}`, 'warning');
        
    } catch (error) {
        console.error("❌ Error rejecting withdrawal:", error);
        showMessage('❌ Error rejecting withdrawal', 'error');
        throw error;
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
    
    if (!confirm(`Add ${amount} MWH to ALL users? This action cannot be undone.`)) return;
    
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
        showMessage('❌ Please enter a user ID or username', 'error');
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
        
        // Try by ID first
        const userRefById = db.collection('users').doc(searchTerm);
        let userSnap = await userRefById.get();
        
        // If not found, try by username
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
        
        await userDoc.ref.update({
            balance: firebase.firestore.FieldValue.increment(amount),
            totalEarned: firebase.firestore.FieldValue.increment(amount),
            lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showMessage(`✅ Added ${amount} MWH to user ${userDoc.data().username || searchTerm}`, 'success');
        userIdInput.value = '';
        amountInput.value = '';
        
        // Update displayed user info if visible
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
        showMessage('❌ Please enter a user ID or username', 'error');
        return;
    }
    
    try {
        showMessage('🔍 Searching for user...', 'info');
        
        let userDoc;
        let foundById = false;
        
        // Try by ID first
        const userRefById = db.collection('users').doc(searchTerm);
        let userSnap = await userRefById.get();
        
        if (userSnap.exists) {
            userDoc = { id: searchTerm, data: () => userSnap.data(), ref: userRefById };
            foundById = true;
        } else {
            // If not found, try by username
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
        
        // Update UI
        document.getElementById('adminFoundUsername').textContent = userData.username || 'Unknown';
        document.getElementById('adminFoundBalance').textContent = `${userData.balance || 0} MWH`;
        document.getElementById('adminFoundTotalEarned').textContent = `${userData.totalEarned || 0} MWH`;
        document.getElementById('adminFoundReferrals').textContent = userData.referrals || 0;
        document.getElementById('adminFoundRank').textContent = userData.rank || 'Beginner';
        document.getElementById('adminFoundUserId').textContent = userDoc.id;
        
        // Populate add balance input
        const addUserIdInput = document.getElementById('adminUserId');
        if (addUserIdInput) {
            if (foundById) {
                addUserIdInput.value = searchTerm;
            } else {
                addUserIdInput.value = userDoc.id;
            }
        }
        
        // Show user info
        document.getElementById('adminUserInfo').style.display = 'block';
        
        showMessage(`✅ User found: ${userData.username}`, 'success');
        
    } catch (error) {
        console.error("❌ Error searching for user:", error);
        showMessage('❌ Error searching for user', 'error');
    }
}

// ============================================
// باقي الكود بدون تغيير (مختصر للتركيز على الإصلاحات)
// ============================================

// [نفس باقي الكود السابق...]

// ملاحظة: تم إزالة الكود الطويل للتبسيط. باقي الدوال مثل:
// initNotificationSystem, showTransactionHistory, openDepositModal, etc.
// تبقى كما هي بدون تغيير

// ============================================
// EXPORT FUNCTIONS TO WINDOW - UPDATED
// ============================================

window.showTransactionHistory = showTransactionHistory;
window.openSwapModal = openSwapModal;
window.openWithdrawalModal = openWithdrawalModal;
window.openDepositModal = openDepositModal;
window.updateWalletUI = updateWalletUI;
window.showMessage = showMessage;
window.switchToPage = window.switchToPage || function(page) {};
window.closeModal = closeModal;
window.copyToClipboard = copyToClipboard;
window.calculateSwap = calculateSwap;
window.setMaxSwap = setMaxSwap;
window.executeSwap = executeSwap;
window.validateWithdrawalAmount = validateWithdrawalAmount;
window.validateWithdrawalAddress = validateWithdrawalAddress;
window.submitWithdrawal = submitWithdrawal;
window.setMaxWithdrawalAmount = setMaxWithdrawalAmount;
window.updateWithdrawalAmountFromSlider = updateWithdrawalAmountFromSlider;
window.copyDepositAddress = copyDepositAddress;
window.validateTransactionHash = validateTransactionHash;
window.validateDepositAmount = validateDepositAmount;
window.submitDepositRequest = submitDepositRequest;
window.switchHistoryTab = switchHistoryTab;
window.showComingSoon = showComingSoon;

window.checkAdminPassword = checkAdminPassword;
window.switchAdminTab = switchAdminTab;
window.approveDepositRequest = approveDepositRequest;
window.rejectDepositRequest = rejectDepositRequest;
window.approveWithdrawalRequest = approveWithdrawalRequest;
window.rejectWithdrawalRequest = rejectWithdrawalRequest;
window.addBalanceToAllUsers = addBalanceToAllUsers;
window.addBalanceToSpecificUser = addBalanceToSpecificUser;
window.searchUserById = searchUserById;

// ============================================
// INITIALIZE APPLICATION
// ============================================

async function initApp() {
    console.log("🚀 Starting VIP Mining App v6.5...");
    
    try {
        cacheElements();
        
        await setupUser();
        
        await loadUserData();
        
        setupEventListeners();
        
        initAdminSystem();
        
        updateUI();
        
        updateWalletUI();
        
        checkForReferral();
        
        initNotificationSystem();
        
        userData.isInitialized = true;
        
        console.log("✅ App ready! Balance:", userData.balance, "User ID:", userData.userId);
        
        setTimeout(() => {
            showMessage(`💰 Welcome ${userData.username}! Balance: ${userData.balance} MWH`, 'success');
        }, 1000);
        
    } catch (error) {
        console.error("❌ Initialization error:", error);
        showMessage('Error starting app. Please refresh.', 'error');
    }
}

// ============================================
// CSS for Admin Action Buttons
// ============================================

const adminButtonStyles = `
    <style>
        .admin-action-btn {
            flex: 1;
            padding: 8px;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .admin-action-btn.approve {
            background: linear-gradient(135deg, #22c55e, #10b981);
        }
        
        .admin-action-btn.approve:hover {
            background: linear-gradient(135deg, #16a34a, #059669);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }
        
        .admin-action-btn.reject {
            background: linear-gradient(135deg, #ef4444, #dc2626);
        }
        
        .admin-action-btn.reject:hover {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }
        
        .admin-action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none !important;
        }
    </style>
`;

// Add styles to document
document.head.insertAdjacentHTML('beforeend', adminButtonStyles);

console.log("🎮 VIP Mining Wallet v6.5 loaded with FIXED Admin Panel");
