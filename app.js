// ============================================
// VIP Mining Mini App - PROFESSIONAL WALLET v6.3
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
    pendingDeposits: [], // طلبات الإيداع المعلقة
    depositHistory: [], // سجل الإيداعات المعتمدة
    withdrawalHistory: [], // سجل السحوبات المكتملة
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
    
    // Swap Rates
    MIN_SWAP: 10000,
    MWH_TO_USDT_RATE: 1000,
    BNB_TO_MWH_RATE: 870000,
    
    // Withdrawal & Deposit Limits
    MIN_WITHDRAWAL: 50,
    MIN_DEPOSIT_USDT: 10,
    MIN_DEPOSIT_BNB: 0.015,
    WITHDRAWAL_FEE: 0.0005,
    
    // Deposit Address
    DEPOSIT_ADDRESS: "0x790CAB511055F63db2F30AD227f7086bA3B6376a",
    
    // Transaction Hash Validation
    MIN_TRANSACTION_LENGTH: 64
};

// ============================================
// FLOATING NOTIFICATION SYSTEM - NEW
// ============================================

// Notification messages array (200 messages - mixed deposit/withdraw)
const NOTIFICATION_MESSAGES = [
    "Withdraw successful: User ID 599****5486 -200 USDT",
    "Withdraw successful: User ID 537****3870 -150 USDT",
    "Withdraw successful: User ID 553****2730 -70 USDT",
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
    "Deposit successful: User ID 668****8148 +0.273 BNB",
    // Additional 50 withdrawal messages
    "Withdraw successful: User ID 732****5491 -87.5 USDT",
    "Withdraw successful: User ID 419****3876 -106.8 USDT",
    "Withdraw successful: User ID 655****2943 -142.3 USDT",
    "Withdraw successful: User ID 288****8472 -93.7 USDT",
    "Withdraw successful: User ID 177****6354 -78.9 USDT",
    "Withdraw successful: User ID 833****1928 -115.2 USDT",
    "Withdraw successful: User ID 944****4567 -163.5 USDT",
    "Withdraw successful: User ID 611****7389 -71.4 USDT",
    "Withdraw successful: User ID 499****2651 -128.6 USDT",
    "Withdraw successful: User ID 322****9145 -96.3 USDT",
    "Withdraw successful: User ID 755****6832 -152.7 USDT",
    "Withdraw successful: User ID 188****4973 -67.8 USDT",
    "Withdraw successful: User ID 933****1246 -134.9 USDT",
    "Withdraw successful: User ID 634****5728 -89.2 USDT",
    "Withdraw successful: User ID 277****9147 -112.4 USDT",
    "Withdraw successful: User ID 519****6385 -76.5 USDT",
    "Withdraw successful: User ID 864****2719 -143.8 USDT",
    "Withdraw successful: User ID 791****3452 -97.6 USDT",
    "Withdraw successful: User ID 612****4891 -124.7 USDT",
    "Withdraw successful: User ID 389****7365 -68.9 USDT",
    "Withdraw successful: User ID 955****1824 -136.2 USDT",
    "Withdraw successful: User ID 238****5937 -92.1 USDT",
    "Withdraw successful: User ID 671****8243 -117.8 USDT",
    "Withdraw successful: User ID 423****1578 -73.6 USDT",
    "Withdraw successful: User ID 789****2645 -148.9 USDT",
    "Withdraw successful: User ID 356****9172 -101.3 USDT",
    "Withdraw successful: User ID 842****6354 -129.4 USDT",
    "Withdraw successful: User ID 234****7891 -70.7 USDT",
    "Withdraw successful: User ID 678****1426 -137.6 USDT",
    "Withdraw successful: User ID 915****3789 -94.5 USDT",
    "Withdraw successful: User ID 567****9214 -119.2 USDT",
    "Withdraw successful: User ID 392****6548 -75.8 USDT",
    "Withdraw successful: User ID 823****1967 -153.1 USDT",
    "Withdraw successful: User ID 741****5832 -104.7 USDT",
    "Withdraw successful: User ID 258****4369 -131.8 USDT",
    "Withdraw successful: User ID 934****2715 -72.4 USDT",
    "Withdraw successful: User ID 675****9843 -138.9 USDT",
    "Withdraw successful: User ID 416****7281 -96.8 USDT",
    "Withdraw successful: User ID 782****3594 -120.7 USDT",
    "Withdraw successful: User ID 349****8926 -77.3 USDT",
    "Withdraw successful: User ID 897****1438 -155.4 USDT",
    "Withdraw successful: User ID 631****4765 -108.2 USDT",
    "Withdraw successful: User ID 284****6197 -133.5 USDT",
    "Withdraw successful: User ID 968****3254 -74.1 USDT",
    "Withdraw successful: User ID 752****8379 -140.3 USDT",
    "Withdraw successful: User ID 437****5642 -99.2 USDT",
    "Withdraw successful: User ID 819****2961 -122.6 USDT",
    "Withdraw successful: User ID 365****7458 -78.7 USDT"
];

// Notification system variables
let currentNotificationIndex = 0;
let notificationTimer = null;
let isNotificationActive = false;
let notificationTimeout = null;

// DOM Elements
const elements = {};

// ============================================
// Application Initialization
// ============================================

async function initApp() {
    console.log("🚀 Starting VIP Mining App v6.3...");
    
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
        
        // Update wallet UI
        updateWalletUI();
        
        // Check for referrals
        checkForReferral();
        
        // Initialize notification system
        initNotificationSystem();
        
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
        'balanceUSD', 'tokenPrice', 'nextRankBonus'
    ];
    
    elementIds.forEach(id => {
        elements[id] = document.getElementById(id);
    });
    
    console.log("✅ Cached", elementIds.length, "DOM elements");
}

// ============================================
// NOTIFICATION SYSTEM FUNCTIONS - FIXED
// ============================================

function initNotificationSystem() {
    console.log("🔔 Initializing notification system...");
    
    // Reset index to start from beginning
    currentNotificationIndex = 0;
    
    // Start notifications immediately when app loads (for Home page)
    setTimeout(() => {
        const homePage = document.querySelector('.container');
        if (homePage && homePage.classList.contains('active')) {
            startNotificationTimer();
        }
    }, 2000); // Start after 2 seconds to let page load
}

function startNotificationTimer() {
    if (isNotificationActive) {
        console.log("🔔 Notification timer already active");
        return;
    }
    
    console.log("🔔 Starting notification timer");
    isNotificationActive = true;
    
    // Show first notification immediately
    setTimeout(() => {
        showNextNotification();
    }, 1000); // Show first notification after 1 second
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
    
    // Hide notification bar
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
    
    // Get next notification message
    const message = NOTIFICATION_MESSAGES[currentNotificationIndex];
    
    // Update notification bar
    notificationBar.innerHTML = `<span>${message}</span>`;
    
    // Determine color based on message type
    const colorClass = getNotificationColor(message);
    notificationBar.className = 'notification-bar';
    notificationBar.classList.add(colorClass);
    
    // Show notification with animation
    setTimeout(() => {
        notificationBar.classList.add('show');
        notificationBar.classList.add('moving');
    }, 100);
    
    console.log(`🔔 Showing notification ${currentNotificationIndex + 1}/${NOTIFICATION_MESSAGES.length}: ${message}`);
    
    // Move to next notification (loop back to start if at end)
    currentNotificationIndex++;
    if (currentNotificationIndex >= NOTIFICATION_MESSAGES.length) {
        currentNotificationIndex = 0;
    }
    
    // Schedule next notification after 15 seconds (5 seconds show + 10 seconds wait)
    notificationTimer = setTimeout(() => {
        // Hide current notification
        notificationBar.classList.remove('show');
        notificationBar.classList.remove('moving');
        
        // Wait for fade out animation
        notificationTimeout = setTimeout(() => {
            showNextNotification();
        }, 500);
    }, 5000); // Show for 5 seconds
}

function getNotificationColor(message) {
    // Determine color based on message content
    if (message.includes('+') && (message.includes('BNB') || message.includes('USDT'))) {
        return 'notification-deposit'; // Blue for deposits
    } else if (message.includes('-') && message.includes('USDT')) {
        return 'notification-withdraw'; // Green for withdrawals
    }
    return 'notification-deposit'; // Default to blue
}

function checkAndShowNotification() {
    // Check if we're on Home page
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
// TRANSACTION HISTORY IMPROVEMENT - FIXED
// ============================================

function showTransactionHistory() {
    console.log("📜 Showing transaction history");
    
    // Close any existing modal first
    closeModal();
    
    // Always show the modal with "No Transactions Yet" message
    const modalHTML = `
        <div class="modal-overlay" id="historyModal">
            <div class="modal-content history-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-history"></i> Transaction History</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                
                <div class="modal-body">
                    <!-- Tabs -->
                    <div class="history-tabs">
                        <button class="tab-btn active" onclick="switchHistoryTab('pending')">
                            <i class="fas fa-clock"></i>
                            <span>Pending</span>
                        </button>
                        <button class="tab-btn" onclick="switchHistoryTab('deposits')">
                            <i class="fas fa-download"></i>
                            <span>Deposits</span>
                        </button>
                        <button class="tab-btn" onclick="switchHistoryTab('withdrawals')">
                            <i class="fas fa-upload"></i>
                            <span>Withdrawals</span>
                        </button>
                    </div>
                    
                    <!-- Pending Transactions -->
                    <div class="history-content" id="pendingTab">
                        <div class="section-title">
                            <i class="fas fa-clock"></i>
                            <span>Pending Transactions</span>
                        </div>
                        
                        <div class="empty-pending">
                            <div class="empty-icon-small">
                                <i class="fas fa-inbox"></i>
                            </div>
                            <div class="empty-text">No pending transactions</div>
                        </div>
                    </div>
                    
                    <!-- Deposit History -->
                    <div class="history-content" id="depositsTab" style="display: none;">
                        <div class="section-title">
                            <i class="fas fa-download"></i>
                            <span>Deposit History</span>
                        </div>
                        
                        <div class="empty-history-section">
                            <div class="empty-icon-small">
                                <i class="fas fa-download"></i>
                            </div>
                            <div class="empty-text">No completed deposits</div>
                        </div>
                    </div>
                    
                    <!-- Withdrawal History -->
                    <div class="history-content" id="withdrawalsTab" style="display: none;">
                        <div class="section-title">
                            <i class="fas fa-upload"></i>
                            <span>Withdrawal History</span>
                        </div>
                        
                        <div class="empty-history-section">
                            <div class="empty-icon-small">
                                <i class="fas fa-upload"></i>
                            </div>
                            <div class="empty-text">No completed withdrawals</div>
                        </div>
                    </div>
                    
                    <!-- Empty State -->
                    <div class="empty-history" style="display: block; margin-top: 30px;">
                        <div class="empty-icon">
                            <i class="fas fa-history"></i>
                        </div>
                        <div class="empty-title">📭 No Transactions Yet</div>
                        <div class="empty-text">
                            Your transaction history will appear here<br>
                            once you make deposits or withdrawals.
                        </div>
                        <div style="margin-top: 20px;">
                            <button class="btn-primary" onclick="closeModal()" style="width: 100%; padding: 12px;">
                                <i class="fas fa-check"></i> OK
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    console.log("✅ History modal displayed");
}

// ============================================
// PAGE NAVIGATION INTEGRATION - FIXED
// ============================================

// Override the global switchToPage function to handle notifications
const originalSwitchToPage = window.switchToPage;
window.switchToPage = function(pageName) {
    // Call original function
    originalSwitchToPage(pageName);
    
    // Manage notification system based on page
    setTimeout(() => {
        const isHomePage = pageName === 'home';
        
        if (isHomePage && !isNotificationActive) {
            // Start notifications when entering Home page
            startNotificationTimer();
        } else if (!isHomePage && isNotificationActive) {
            // Stop notifications when leaving Home page
            stopNotificationTimer();
        }
    }, 100);
};

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
// Referral System
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
// Mining System
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
    saveWalletData();
    updateUI();
    animateMineButton(reward);
    
    showMessage(`⛏️ +${reward} MWH! Total: ${userData.balance} MWH`, 'success');
    checkRankUp();
    
    // Update energy belt
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
// Professional Wallet System
// ============================================

function initWallet() {
    walletData.mwhBalance = userData.balance;
    
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
            console.log("✅ Wallet data loaded");
        } catch (e) {
            console.error("❌ Error loading wallet:", e);
        }
    }
    
    updateWalletUI();
}

function updateWalletUI() {
    // Update MWH balance
    if (document.getElementById('walletMWH')) {
        document.getElementById('walletMWH').textContent = formatNumber(walletData.mwhBalance);
    }
    
    // Update USDT balance
    if (document.getElementById('walletUSDT')) {
        document.getElementById('walletUSDT').textContent = formatNumber(walletData.usdtBalance, 2);
    }
    
    // Update BNB balance
    if (document.getElementById('walletBNB')) {
        document.getElementById('walletBNB').textContent = walletData.bnbBalance.toFixed(4);
    }
    
    // Update TON balance
    if (document.getElementById('walletTON')) {
        document.getElementById('walletTON').textContent = formatNumber(walletData.tonBalance);
    }
    
    // Update ETH balance
    if (document.getElementById('walletETH')) {
        document.getElementById('walletETH').textContent = walletData.ethBalance.toFixed(4);
    }
    
    // Update USD values
    updateWalletValues();
    
    // Update total balance
    updateTotalBalance();
}

function updateWalletValues() {
    // Calculate USD values
    const mwhUSD = (walletData.mwhBalance * CONFIG.MWH_TO_USD).toFixed(2);
    const usdtUSD = walletData.usdtBalance.toFixed(2);
    const bnbUSD = (walletData.bnbBalance * CONFIG.BNB_TO_USD).toFixed(2);
    const tonUSD = (walletData.tonBalance * CONFIG.TON_TO_USD).toFixed(2);
    const ethUSD = (walletData.ethBalance * CONFIG.ETH_TO_USD).toFixed(2);
    
    // Update display
    if (document.getElementById('walletMWHValue')) {
        document.getElementById('walletMWHValue').textContent = `$${mwhUSD}`;
    }
    
    if (document.getElementById('walletUSDTValue')) {
        document.getElementById('walletUSDTValue').textContent = `$${usdtUSD}`;
    }
    
    if (document.getElementById('walletBNBValue')) {
        document.getElementById('walletBNBValue').textContent = `$${bnbUSD}`;
    }
    
    if (document.getElementById('walletTONValue')) {
        document.getElementById('walletTONValue').textContent = `$${tonUSD}`;
    }
    
    if (document.getElementById('walletETHValue')) {
        document.getElementById('walletETHValue').textContent = `$${ethUSD}`;
    }
}

function updateTotalBalance() {
    const mwhUSD = walletData.mwhBalance * CONFIG.MWH_TO_USD;
    const usdtUSD = walletData.usdtBalance;
    const bnbUSD = walletData.bnbBalance * CONFIG.BNB_TO_USD;
    const tonUSD = walletData.tonBalance * CONFIG.TON_TO_USD;
    const ethUSD = walletData.ethBalance * CONFIG.ETH_TO_USD;
    
    const totalUSD = mwhUSD + usdtUSD + bnbUSD + tonUSD + ethUSD;
    
    if (document.getElementById('totalBalanceUSD')) {
        document.getElementById('totalBalanceUSD').textContent = `$${totalUSD.toFixed(2)}`;
    }
}

// ============================================
// Swap System (MWH ↔ USDT ↔ BNB) - IMPROVED PROFESSIONAL DESIGN
// ============================================

function openSwapModal(currency) {
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
    const toBalance = getBalanceByCurrency(toCurrency);
    
    const modalHTML = `
        <div class="modal-overlay" id="swapModal">
            <div class="modal-content swap-modal-professional">
                <div class="modal-header">
                    <h3><i class="fas fa-exchange-alt"></i> Swap ${fromCurrency} to ${toCurrency}</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <!-- Swap Overview -->
                    <div class="swap-overview">
                        <div class="swap-pair">
                            <div class="swap-from-currency">
                                <div class="currency-icon ${fromCurrency.toLowerCase()}">
                                    <i class="fas ${fromCurrency === 'MWH' ? 'fa-gem' : fromCurrency === 'USDT' ? 'fa-coins' : 'fa-bolt'}"></i>
                                </div>
                                <div class="currency-info">
                                    <div class="currency-name">${fromCurrency}</div>
                                    <div class="currency-balance">Balance: ${formatNumber(fromBalance, isBNB ? 4 : isUSDT ? 2 : 0)}</div>
                                </div>
                            </div>
                            <div class="swap-arrow-container">
                                <i class="fas fa-exchange-alt"></i>
                            </div>
                            <div class="swap-to-currency">
                                <div class="currency-icon ${toCurrency.toLowerCase()}">
                                    <i class="fas ${toCurrency === 'MWH' ? 'fa-gem' : toCurrency === 'USDT' ? 'fa-coins' : 'fa-bolt'}"></i>
                                </div>
                                <div class="currency-info">
                                    <div class="currency-name">${toCurrency}</div>
                                    <div class="currency-balance">Balance: ${formatNumber(toBalance, toCurrency === 'USDT' ? 2 : toCurrency === 'BNB' ? 4 : 0)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Rate Information -->
                    <div class="swap-rate-info">
                        <div class="rate-card">
                            <div class="rate-label">
                                <i class="fas fa-chart-line"></i>
                                <span>Exchange Rate</span>
                            </div>
                            <div class="rate-value">${rateText}</div>
                        </div>
                        <div class="rate-card">
                            <div class="rate-label">
                                <i class="fas fa-exclamation-circle"></i>
                                <span>Minimum Swap</span>
                            </div>
                            <div class="rate-value">${minSwap.toLocaleString()} ${fromCurrency}</div>
                        </div>
                    </div>
                    
                    <!-- Swap Inputs -->
                    <div class="swap-inputs-professional">
                        <div class="swap-amount-section">
                            <div class="amount-header">
                                <div class="amount-label">
                                    <i class="fas fa-arrow-up"></i>
                                    <span>You Send</span>
                                </div>
                                <div class="amount-balance">Available: ${formatNumber(fromBalance, isBNB ? 4 : isUSDT ? 2 : 0)} ${fromCurrency}</div>
                            </div>
                            <div class="amount-input-container">
                                <div class="currency-prefix">${fromCurrency}</div>
                                <input type="number" 
                                       id="swapFromAmount" 
                                       class="swap-amount-input"
                                       placeholder="0.00"
                                       min="${minSwap}" 
                                       step="${isBNB ? '0.001' : isUSDT ? '0.01' : '1000'}"
                                       oninput="calculateSwap('${fromCurrency}', '${toCurrency}')">
                                <button class="max-amount-btn-swap" onclick="setMaxSwap('${fromCurrency}')">MAX</button>
                            </div>
                        </div>
                        
                        <div class="swap-amount-section">
                            <div class="amount-header">
                                <div class="amount-label">
                                    <i class="fas fa-arrow-down"></i>
                                    <span>You Receive</span>
                                </div>
                                <div class="amount-balance">≈ ${(fromBalance * (fromCurrency === 'MWH' ? 1/CONFIG.MWH_TO_USDT_RATE : fromCurrency === 'USDT' ? CONFIG.MWH_TO_USDT_RATE : CONFIG.BNB_TO_MWH_RATE)).toFixed(toCurrency === 'USDT' ? 2 : 0)} ${toCurrency}</div>
                            </div>
                            <div class="amount-input-container">
                                <div class="currency-prefix">${toCurrency}</div>
                                <input type="text" 
                                       id="swapToAmount" 
                                       class="swap-amount-input"
                                       placeholder="0.00"
                                       readonly>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Swap Details -->
                    <div class="swap-details-professional">
                        <div class="detail-header">
                            <i class="fas fa-info-circle"></i>
                            <span>Swap Details</span>
                        </div>
                        <div class="details-grid">
                            <div class="detail-item">
                                <span>Exchange Rate:</span>
                                <span class="detail-value">${rateText}</span>
                            </div>
                            <div class="detail-item">
                                <span>Estimated Fee:</span>
                                <span class="detail-value">0.1%</span>
                            </div>
                            <div class="detail-item">
                                <span>Minimum Amount:</span>
                                <span class="detail-value">${minSwap.toLocaleString()} ${fromCurrency}</span>
                            </div>
                            <div class="detail-item total">
                                <span>Total Receive:</span>
                                <span class="detail-value" id="swapReceive">0 ${toCurrency}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Warning Message -->
                    <div class="swap-warning-professional" id="swapWarning" style="display: none;">
                        <div class="warning-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="warning-content">
                            <div class="warning-title">Cannot Proceed</div>
                            <div class="warning-text" id="swapWarningText"></div>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="swap-actions-professional">
                        <button class="btn-swap-cancel" onclick="closeModal()">
                            <i class="fas fa-times"></i>
                            Cancel
                        </button>
                        <button class="btn-swap-confirm" id="confirmSwapBtn" 
                                onclick="executeSwap('${fromCurrency}', '${toCurrency}')" disabled>
                            <i class="fas fa-exchange-alt"></i>
                            Confirm Swap
                        </button>
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
        case 'MWH': return walletData.mwhBalance;
        case 'USDT': return walletData.usdtBalance;
        case 'BNB': return walletData.bnbBalance;
        case 'TON': return walletData.tonBalance;
        case 'ETH': return walletData.ethBalance;
        default: return 0;
    }
}

function calculateSwap(fromCurrency, toCurrency) {
    const fromAmount = parseFloat(document.getElementById('swapFromAmount').value) || 0;
    let toAmount = 0;
    let rate = 0;
    
    // Calculate based on currency pair
    if (fromCurrency === 'MWH' && toCurrency === 'USDT') {
        rate = 1 / CONFIG.MWH_TO_USDT_RATE;
        toAmount = fromAmount * rate;
    } else if (fromCurrency === 'USDT' && toCurrency === 'MWH') {
        rate = CONFIG.MWH_TO_USDT_RATE;
        toAmount = fromAmount * rate;
    } else if (fromCurrency === 'BNB' && toCurrency === 'MWH') {
        rate = CONFIG.BNB_TO_MWH_RATE;
        toAmount = fromAmount * rate;
    }
    
    // Apply 0.1% fee
    const fee = toAmount * 0.001;
    toAmount -= fee;
    
    // Format based on target currency
    const decimals = toCurrency === 'USDT' ? 2 : toCurrency === 'BNB' ? 4 : 0;
    document.getElementById('swapToAmount').value = toAmount.toFixed(decimals);
    document.getElementById('swapReceive').textContent = `${toAmount.toFixed(decimals)} ${toCurrency}`;
    
    const confirmBtn = document.getElementById('confirmSwapBtn');
    const warning = document.getElementById('swapWarning');
    const warningText = document.getElementById('swapWarningText');
    
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Confirm Swap';
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
    
    // Update button to show estimated receive
    const receiveAmount = toAmount.toFixed(decimals);
    confirmBtn.innerHTML = `<i class="fas fa-exchange-alt"></i> Swap for ${receiveAmount} ${toCurrency}`;
    confirmBtn.disabled = false;
}

function setMaxSwap(currency) {
    const input = document.getElementById('swapFromAmount');
    if (input) {
        const maxBalance = getBalanceByCurrency(currency);
        input.value = currency === 'BNB' ? maxBalance.toFixed(4) : 
                     currency === 'USDT' ? maxBalance.toFixed(2) : maxBalance;
        
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
    
    // Check minimum swap requirements
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
    
    // Update balances
    switch(fromCurrency) {
        case 'MWH':
            walletData.mwhBalance -= fromAmount;
            walletData.usdtBalance += toAmount;
            break;
        case 'USDT':
            walletData.usdtBalance -= fromAmount;
            walletData.mwhBalance += toAmount;
            break;
        case 'BNB':
            walletData.bnbBalance -= fromAmount;
            walletData.mwhBalance += toAmount;
            break;
    }
    
    // Update user balance if MWH changed
    if (fromCurrency === 'MWH' || fromCurrency === 'USDT' || fromCurrency === 'BNB') {
        userData.balance = walletData.mwhBalance;
    }
    
    saveWalletData();
    saveUserData();
    
    updateWalletUI();
    updateUI();
    
    closeModal();
    showMessage(`✅ Swapped ${formatNumber(fromAmount)} ${fromCurrency} to ${formatNumber(toAmount)} ${toCurrency}`, 'success');
}

// ============================================
// Deposit System - UPDATED (No Auto Balance Addition)
// ============================================

function openDepositModal(currency) {
    console.log("💰 Opening deposit modal for:", currency);
    
    const currencyInfo = getCurrencyInfo(currency);
    const depositAddress = CONFIG.DEPOSIT_ADDRESS;
    
    const modalHTML = `
        <div class="modal-overlay" id="depositModal">
            <div class="modal-content deposit-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-download"></i> Deposit ${currency}</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                
                <div class="modal-body">
                    <!-- Warning Section -->
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
                    
                    <!-- Address Card -->
                    <div class="deposit-address-card">
                        <div class="address-header">
                            <i class="fas fa-wallet"></i>
                            <span>Your ${currency} Deposit Address</span>
                        </div>
                        <div class="address-container">
                            <div class="address-value" id="depositAddressDisplay">
                                ${depositAddress}
                            </div>
                            <button class="copy-address-btn" onclick="copyDepositAddress()">
                                <i class="far fa-copy"></i> Copy Address
                            </button>
                        </div>
                        <div class="network-info">
                            <i class="fas fa-network-wired"></i>
                            <span>Minimum deposit ${currency === 'USDT' ? '10 USDT' : '0.015 BNB'}</span>
                        </div>
                    </div>
                    
                    <!-- Transaction Hash Input -->
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
                    
                    <!-- Instructions -->
                    <div class="deposit-instructions">
                        <div class="instructions-title">
                            <i class="fas fa-graduation-cap"></i>
                            <span>How to Deposit ${currency}</span>
                        </div>
                        <div class="instructions-steps">
                            <div class="instruction-step">
                                <div class="step-number">1</div>
                                <div class="step-content">Copy the ${currency} address above</div>
                            </div>
                            <div class="instruction-step">
                                <div class="step-number">2</div>
                                <div class="step-content">Send ${currency} to this address via your wallet (BEP20 network only)</div>
                            </div>
                            <div class="instruction-step">
                                <div class="step-number">3</div>
                                <div class="step-content">Wait for transaction confirmation on BSC Scan</div>
                            </div>
                            <div class="instruction-step">
                                <div class="step-number">4</div>
                                <div class="step-content">Copy the Transaction Hash and paste it above</div>
                            </div>
                            <div class="instruction-step">
                                <div class="step-number">5</div>
                                <div class="step-content">Click "Submit Deposit Request" for manual review</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Minimum Deposit Info -->
                    <div class="minimum-deposit-info">
                        <div class="info-item">
                            <i class="fas fa-coins"></i>
                            <div>
                                <div class="info-label">Minimum Deposit</div>
                                <div class="info-value">${getMinDeposit(currency)} ${currency}</div>
                            </div>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-clock"></i>
                            <div>
                                <div class="info-label">Review Time</div>
                                <div class="info-value">1-5 Minutes(Confirmation 20 networks)</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Important Note -->
                    <div class="deposit-note">
                        <div class="note-icon">
                            <i class="fas fa-info-circle"></i>
                        </div>
                        <div class="note-content">
                            <strong>Note:</strong> Your deposit will be manually reviewed by our team.
                            The balance will be added to your account instant after verification.
                            Check your transaction status in the History section.
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
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
    }, 100);
}

function getCurrencyInfo(currency) {
    const info = {
        'USDT': { color: '#26a17b', icon: 'fa-coins', network: 'BEP20' },
        'BNB': { color: '#f0b90b', icon: 'fa-bolt', network: 'BEP20' },
        'MWH': { color: '#3b82f6', icon: 'fa-gem', network: 'BEP20' }
    };
    return info[currency] || { color: '#6b7280', icon: 'fa-coins', network: 'BEP20' };
}

function getMinDeposit(currency) {
    switch(currency) {
        case 'USDT': return CONFIG.MIN_DEPOSIT_USDT;
        case 'BNB': return CONFIG.MIN_DEPOSIT_BNB;
        default: return 1;
    }
}

function copyDepositAddress() {
    const depositAddress = CONFIG.DEPOSIT_ADDRESS;
    
    navigator.clipboard.writeText(depositAddress)
        .then(() => {
            const btn = document.querySelector('.copy-address-btn');
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
    
    // Check if hash is already used
    if (walletData.usedTransactions.includes(hash.toLowerCase())) {
        statusIcon.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #ef4444;"></i>';
        statusText.innerHTML = '<span style="color: #ef4444;">This transaction hash has already been used</span>';
        statusDiv.style.display = 'flex';
        statusDiv.style.background = 'rgba(239, 68, 68, 0.1)';
        statusDiv.style.border = '1px solid rgba(239, 68, 68, 0.3)';
        verifyBtn.disabled = true;
        return;
    }
    
    // Check minimum length
    if (hash.length < CONFIG.MIN_TRANSACTION_LENGTH) {
        statusIcon.innerHTML = '<i class="fas fa-times-circle" style="color: #ef4444;"></i>';
        statusText.innerHTML = '<span style="color: #ef4444;">Invalid transaction hash (too short)</span>';
        statusDiv.style.display = 'flex';
        statusDiv.style.background = 'rgba(239, 68, 68, 0.1)';
        statusDiv.style.border = '1px solid rgba(239, 68, 68, 0.3)';
        verifyBtn.disabled = true;
        return;
    }
    
    // Check if it looks like a valid hash
    if (!hash.startsWith('0x') || hash.length !== 66) {
        statusIcon.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i>';
        statusText.innerHTML = '<span style="color: #f59e0b;">Verify this is a valid BEP20 transaction hash</span>';
        statusDiv.style.display = 'flex';
        statusDiv.style.background = 'rgba(245, 158, 11, 0.1)';
        statusDiv.style.border = '1px solid rgba(245, 158, 11, 0.3)';
        verifyBtn.disabled = false;
        return;
    }
    
    // Valid hash
    statusIcon.innerHTML = '<i class="fas fa-check-circle" style="color: #22c55e;"></i>';
    statusText.innerHTML = '<span style="color: #22c55e;">Valid transaction hash detected</span>';
    statusDiv.style.display = 'flex';
    statusDiv.style.background = 'rgba(34, 197, 94, 0.1)';
    statusDiv.style.border = '1px solid rgba(34, 197, 94, 0.3)';
    verifyBtn.disabled = false;
}

async function submitDepositRequest(currency) {
    const hash = document.getElementById('transactionHash').value.trim();
    const verifyBtn = document.getElementById('verifyDepositBtn');
    
    if (!hash || hash.length < CONFIG.MIN_TRANSACTION_LENGTH) {
        showMessage('❌ Please enter a valid transaction hash', 'error');
        return;
    }
    
    // Check if hash already used
    if (walletData.usedTransactions.includes(hash.toLowerCase())) {
        showMessage('❌ This transaction hash has already been used', 'error');
        return;
    }
    
    // Disable button and show loading
    verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    verifyBtn.disabled = true;
    
    try {
        // Generate a random deposit amount (for simulation)
        let depositAmount = 0;
        let minAmount = 0;
        
        if (currency === 'USDT') {
            minAmount = CONFIG.MIN_DEPOSIT_USDT;
            // Simulate amount between min and min+100
            depositAmount = minAmount + Math.random() * 100;
            depositAmount = Math.round(depositAmount * 100) / 100; // Round to 2 decimals
        } else if (currency === 'BNB') {
            minAmount = CONFIG.MIN_DEPOSIT_BNB;
            // Simulate amount between min and min+0.5
            depositAmount = minAmount + Math.random() * 0.5;
            depositAmount = Math.round(depositAmount * 1000) / 1000; // Round to 3 decimals
        }
        
        // Create pending deposit request
        const pendingDeposit = {
            id: 'deposit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            userId: userData.userId,
            username: userData.username,
            transactionHash: hash.toLowerCase(),
            currency: currency,
            amount: depositAmount,
            status: 'pending', // قيد المراجعة
            timestamp: Date.now(),
            reviewNote: 'Awaiting manual review'
        };
        
        // Add to pending deposits
        walletData.pendingDeposits.push(pendingDeposit);
        
        // Add to used transactions
        walletData.usedTransactions.push(hash.toLowerCase());
        
        // Save wallet data
        saveWalletData();
        
        // Reset button
        verifyBtn.innerHTML = '<i class="fas fa-check"></i> Submitted!';
        
        // Close modal after delay
        setTimeout(() => {
            closeModal();
            showMessage(`✅ Deposit request submitted for review! Amount: ${depositAmount} ${currency}`, 'success');
            
            // Show notification about manual review
            setTimeout(() => {
                showMessage('📋 Your deposit is now pending manual review. Check History for status.', 'info');
            }, 1000);
        }, 1500);
        
        // Log to Firebase if available
        if (db) {
            logDepositRequestToFirebase(pendingDeposit);
        }
        
    } catch (error) {
        console.error('Deposit submission error:', error);
        verifyBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Deposit Request';
        verifyBtn.disabled = false;
        showMessage('❌ Failed to submit deposit request. Please try again.', 'error');
    }
}

async function logDepositRequestToFirebase(depositRequest) {
    if (!db) return;
    
    try {
        await db.collection('deposit_requests').add({
            ...depositRequest,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("✅ Deposit request logged to Firebase");
    } catch (error) {
        console.error("❌ Deposit request logging error:", error);
    }
}

// ============================================
// Withdrawal System - Professional Version (No Changes)
// ============================================

function openWithdrawalModal() {
    const usdtBalance = walletData.usdtBalance;
    const bnbBalance = walletData.bnbBalance;
    
    const modalHTML = `
        <div class="modal-overlay" id="withdrawalModal">
            <div class="modal-content withdrawal-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-upload"></i> Withdraw USDT</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                
                <div class="modal-body">
                    <!-- Balance Overview - Professional Design -->
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
                    
                    <!-- Withdrawal Form -->
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
                        
                        <!-- Requirements Section - Professional Design -->
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
                        
                        <!-- Warning Message -->
                        <div class="withdrawal-warning" id="withdrawalWarning" style="display: none;">
                            <div class="warning-header">
                                <i class="fas fa-exclamation-triangle"></i>
                                <span>Cannot Proceed</span>
                            </div>
                            <div class="warning-text" id="withdrawalWarningText"></div>
                        </div>
                        
                        <!-- Summary Section - Professional Design -->
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
                    
                    <!-- Action Buttons -->
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
    
    // Initialize slider
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
    
    // Update slider
    if (slider) {
        slider.value = amount;
    }
    
    // Update summary
    summaryAmount.textContent = amount.toFixed(2) + ' USDT';
    summaryTotal.textContent = amount.toFixed(2) + ' USDT + ' + CONFIG.WITHDRAWAL_FEE + ' BNB';
    
    // Reset UI
    warning.style.display = 'none';
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Withdrawal Request';
    
    const errors = [];
    
    // Check minimum amount
    if (amount > 0 && amount < CONFIG.MIN_WITHDRAWAL) {
        errors.push(`Minimum withdrawal is ${CONFIG.MIN_WITHDRAWAL} USDT`);
    }
    
    // Check balance
    if (amount > walletData.usdtBalance) {
        errors.push(`Insufficient USDT balance (Available: ${walletData.usdtBalance.toFixed(2)} USDT)`);
    }
    
    // Check BNB fee
    if (walletData.bnbBalance < CONFIG.WITHDRAWAL_FEE) {
        errors.push(`Insufficient BNB for network fee (Need: ${CONFIG.WITHDRAWAL_FEE} BNB)`);
    }
    
    // Show errors
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
    
    // Reset validation icons
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
    
    // Valid address
    if (addressCheck) addressCheck.style.display = 'block';
    
    // Hide warning if it was just about address
    if (warningText.textContent.includes('address')) {
        warning.style.display = 'none';
    }
    
    // Re-validate amount
    validateWithdrawalAmount();
    
    return true;
}

function submitWithdrawal() {
    const amount = parseFloat(document.getElementById('withdrawalAmount').value);
    const address = document.getElementById('withdrawalAddress').value.trim();
    
    if (!validateWithdrawalAddress()) return;
    
    const errors = [];
    
    // Validate amount
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
    
    // Update balances (deduct immediately for pending withdrawal)
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

// ============================================
// Transaction History System - SIMPLIFIED
// ============================================

function switchHistoryTab(tabName) {
    // Update tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.history-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // Activate selected tab
    const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => 
        btn.querySelector('span').textContent.toLowerCase().includes(tabName)
    );
    
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Show selected content
    const contentId = tabName + 'Tab';
    const content = document.getElementById(contentId);
    if (content) {
        content.style.display = 'block';
    }
}

// ============================================
// Utility Functions
// ============================================

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
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

function formatNumber(num, decimals = 0) {
    return num.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

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
        elements.rewardAmount.textContent = currentRank.reward;
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

function shareOnTelegram() {
    const refLink = generateReferralLink();
    const shareText = `🚀 *Join VIP Mining Wealth PRO!*\n\n⛏️ *Mine 250 MWH every 4 hours*\n👥 *Get +50 MWH BONUS with my link*\n💰 *Earn 50 MWH for each referral*\n\n👉 ${refLink}\n\n💎 *Start earning now!* @VIPMainingPROBot`;
    
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`;
    
    window.open(shareUrl, '_blank');
    showMessage('📱 Opening Telegram...', 'info');
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
            version: '6.3'
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
            mwhBalance: walletData.mwhBalance,
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
            pendingWithdrawals: walletData.pendingWithdrawals,
            pendingDeposits: walletData.pendingDeposits,
            depositHistory: walletData.depositHistory,
            withdrawalHistory: walletData.withdrawalHistory,
            usedTransactions: walletData.usedTransactions,
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
        stopNotificationTimer();
    }
});

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// ============================================
// Export Functions for HTML
// ============================================

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
window.showTransactionHistory = showTransactionHistory;
window.showNoHistoryMessage = function() { showTransactionHistory(); };
window.copyDepositAddress = copyDepositAddress;
window.validateTransactionHash = validateTransactionHash;
window.submitDepositRequest = submitDepositRequest;
window.switchHistoryTab = switchHistoryTab;

console.log("🎮 VIP Mining Wallet v6.3 loaded successfully");
