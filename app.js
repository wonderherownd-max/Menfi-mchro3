// ============================================
// VIP Mining Mini App - Working Version
// ============================================

// Telegram WebApp
let tg = null;
try {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
} catch (e) {
    console.log("⚠️ Not in Telegram, running in browser mode");
}

// User data - مع بيانات افتراضية
let userData = {
    balance: 100,
    referrals: 0,
    totalEarned: 100,
    rank: 'Beginner',
    userId: null,
    username: 'Guest'
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
    connectionStatus: document.getElementById('connectionStatus')
};

// Configuration
const CONFIG = {
    MINE_COOLDOWN: 5000,
    REFERRAL_REWARD: 25,
    
    RANKS: [
        { name: 'Beginner', min: 0, max: 199, reward: 1, power: '10/h' },
        { name: 'Pro', min: 200, max: 499, reward: 2, power: '25/h' },
        { name: 'Expert', min: 500, max: 999, reward: 3, power: '50/h' },
        { name: 'VIP', min: 1000, max: 9999, reward: 5, power: '100/h' }
    ]
};

// ============================================
// INITIALIZATION
// ============================================

function initApp() {
    console.log("🚀 Starting VIP Mining App...");
    
    try {
        // Setup user from Telegram or Demo
        setupUser();
        
        // Load saved data
        loadUserData();
        
        // Setup event listeners
        setupEventListeners();
        
        // Update UI
        updateUI();
        
        // Show success
        showToast('✅ App loaded successfully!', 'success');
        if (elements.connectionStatus) {
            elements.connectionStatus.textContent = '🟢 Connected';
            elements.connectionStatus.style.color = '#10b981';
        }
        
        console.log("✅ App initialized successfully");
        
    } catch (error) {
        console.error("❌ Init error:", error);
        showToast('⚠️ App loaded in demo mode', 'warning');
        if (elements.connectionStatus) {
            elements.connectionStatus.textContent = '🟡 Demo Mode';
            elements.connectionStatus.style.color = '#f59e0b';
        }
    }
}

function setupUser() {
    // Check if we're in Telegram
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        // Telegram user
        const tgUser = tg.initDataUnsafe.user;
        userData.userId = tgUser.id.toString();
        userData.username = tgUser.username ? `@${tgUser.username}` : `User${tgUser.id.toString().slice(-4)}`;
        
        // Update UI
        if (elements.username) elements.username.textContent = userData.username;
        if (elements.userId) elements.userId.textContent = `ID: ${userData.userId}`;
        if (elements.userInfo) elements.userInfo.textContent = `Welcome, ${userData.username}`;
        if (elements.userAvatar) elements.userAvatar.textContent = userData.username.charAt(0).toUpperCase();
        
        // Hide demo controls
        const demoControls = document.getElementById('demoControls');
        if (demoControls) demoControls.style.display = 'none';
        
    } else {
        // Demo mode
        userData.userId = 'demo_' + Math.random().toString(36).substr(2, 8);
        userData.username = 'Demo User';
        
        // Update UI for demo
        if (elements.username) elements.username.textContent = 'Demo User';
        if (elements.userId) elements.userId.textContent = 'ID: DEMO_USER';
        if (elements.userInfo) elements.userInfo.textContent = 'Demo Mode - Sign in via Telegram';
        if (elements.userAvatar) {
            elements.userAvatar.textContent = 'D';
            elements.userAvatar.style.background = 'linear-gradient(135deg, #8B5CF6, #EC4899)';
        }
    }
    
    // Generate referral link
    const refLink = generateReferralLink();
    if (elements.referralLink) elements.referralLink.value = refLink;
}

function generateReferralLink() {
    if (userData.userId) {
        return `https://t.me/VIPMainingPROBot?start=${userData.userId}`;
    }
    return 'https://t.me/VIPMainingPROBot';
}

// ============================================
// DATA STORAGE
// ============================================

function loadUserData() {
    try {
        const storageKey = `vip_mining_${userData.userId}`;
        const saved = localStorage.getItem(storageKey);
        
        if (saved) {
            const data = JSON.parse(saved);
            userData.balance = data.balance || 100;
            userData.referrals = data.referrals || 0;
            userData.totalEarned = data.totalEarned || 100;
            userData.rank = data.rank || 'Beginner';
            console.log("📂 Loaded saved data");
        }
    } catch (error) {
        console.error("❌ Load error:", error);
    }
}

function saveUserData() {
    try {
        const storageKey = `vip_mining_${userData.userId}`;
        localStorage.setItem(storageKey, JSON.stringify(userData));
        console.log("💾 Saved user data");
    } catch (error) {
        console.error("❌ Save error:", error);
    }
}

// ============================================
// MINING SYSTEM
// ============================================

let lastMineTime = 0;
let mineCooldown = 5000; // 5 seconds

function minePoints() {
    const now = Date.now();
    const timeSinceLastMine = now - lastMineTime;
    
    // Check cooldown
    if (timeSinceLastMine < mineCooldown) {
        const secondsLeft = Math.ceil((mineCooldown - timeSinceLastMine) / 1000);
        showToast(`⏳ Please wait ${secondsLeft}s`, 'warning');
        return;
    }
    
    // Get reward amount based on rank
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
    const reward = currentRank.reward;
    
    // Update user data
    userData.balance += reward;
    userData.totalEarned += reward;
    lastMineTime = now;
    
    // Save and update
    saveUserData();
    updateUI();
    
    // Animate button
    animateMineButton(reward);
    
    // Show success message
    showToast(`⛏️ +${reward} points mined!`, 'success');
}

function animateMineButton(reward) {
    const btn = elements.mineBtn;
    if (!btn) return;
    
    const originalHTML = btn.innerHTML;
    
    // Change button text
    btn.innerHTML = `
        <div class="mine-icon">
            <i class="fas fa-check"></i>
        </div>
        <div class="mine-text">
            <div class="mine-title">Mined!</div>
            <div class="mine-reward">+${reward} Points</div>
        </div>
        <div class="mine-cooldown">5s</div>
    `;
    
    btn.disabled = true;
    
    // Countdown timer
    let secondsLeft = 5;
    const timerInterval = setInterval(() => {
        secondsLeft--;
        const cooldownElement = btn.querySelector('.mine-cooldown');
        if (cooldownElement) {
            cooldownElement.textContent = `${secondsLeft}s`;
        }
        
        if (secondsLeft <= 0) {
            clearInterval(timerInterval);
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    }, 1000);
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Mining button
    if (elements.mineBtn) {
        elements.mineBtn.addEventListener('click', minePoints);
    }
    
    // Copy referral link
    if (elements.copyBtn) {
        elements.copyBtn.addEventListener('click', () => {
            const refLink = generateReferralLink();
            navigator.clipboard.writeText(refLink)
                .then(() => {
                    showToast('✅ Link copied to clipboard!', 'success');
                    elements.copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        elements.copyBtn.innerHTML = '<i class="far fa-copy"></i>';
                    }, 2000);
                })
                .catch(err => {
                    console.error('Copy failed:', err);
                    showToast('❌ Copy failed', 'error');
                });
        });
    }
    
    // Share on Telegram
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const refLink = generateReferralLink();
            const shareText = `Join me on VIP Mining! Earn free points using my link: ${refLink}`;
            const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`;
            window.open(shareUrl, '_blank');
            showToast('📱 Opening Telegram...', 'info');
        });
    }
    
    // Share on WhatsApp
    const whatsappBtn = document.getElementById('whatsappBtn');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', () => {
            const refLink = generateReferralLink();
            const shareText = `Join me on VIP Mining! Earn free points using my link: ${refLink}`;
            const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
            window.open(shareUrl, '_blank');
            showToast('💚 Opening WhatsApp...', 'info');
        });
    }
}

// ============================================
// UI UPDATES
// ============================================

function updateUI() {
    // Update basic info
    if (elements.balance) elements.balance.textContent = userData.balance;
    if (elements.referrals) elements.referrals.textContent = userData.referrals;
    if (elements.totalEarned) elements.totalEarned.textContent = userData.totalEarned;
    
    // Update rank
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
    if (elements.rank) elements.rank.textContent = `Rank: ${userData.rank}`;
    if (elements.rankBadge) elements.rankBadge.textContent = userData.rank;
    if (elements.refRank) elements.refRank.textContent = userData.rank;
    
    // Update mining info
    if (elements.rewardAmount) elements.rewardAmount.textContent = currentRank.reward;
    if (elements.miningPower) elements.miningPower.innerHTML = `<i class="fas fa-bolt"></i> Power: ${currentRank.power}`;
    
    // Update referral stats
    if (elements.refCount) elements.refCount.textContent = userData.referrals;
    if (elements.refEarned) {
        const refEarnings = userData.referrals * CONFIG.REFERRAL_REWARD;
        elements.refEarned.textContent = refEarnings;
    }
    
    // Update progress
    updateProgress();
    
    // Check rank up
    checkRankUp();
}

function updateProgress() {
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
    const nextRank = CONFIG.RANKS.find(r => r.min > userData.totalEarned);
    
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
        updateUI();
        saveUserData();
        showToast(`🏆 Rank Up! ${oldRank} → ${newRank.name}`, 'success');
    }
}

// ============================================
// UTILITIES
// ============================================

function showToast(message, type = 'info') {
    // Create toast element
    let toast = document.getElementById('toast');
    
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    // Set content
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                             type === 'error' ? 'exclamation-circle' : 
                             type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span class="toast-message">${message}</span>
        </div>
    `;
    
    // Set color
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    toast.style.background = colors[type] || colors.info;
    
    // Show toast
    toast.classList.add('show');
    
    // Auto hide
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// START THE APP
// ============================================

// Make functions globally available for demo buttons
window.userData = userData;
window.updateUI = updateUI;
window.showToast = showToast;

// Auto-save every 30 seconds
setInterval(() => {
    if (userData.userId) {
        saveUserData();
    }
}, 30000);

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initApp);

// Also initialize if already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initApp, 100);
            }
