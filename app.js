// ============================================
// VIP Mining Mini App - Professional Version
// Connected with @VIPMainingPROBot
// ============================================

// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;

// User Data Structure
let userData = {
    // Telegram Data
    userId: null,
    username: 'Guest',
    firstName: 'User',
    
    // Mining Data
    balance: 0,
    referrals: 0,
    totalEarned: 0,
    rank: 'Beginner',
    
    // Referral Data
    referralEarnings: 0,
    referralLink: '',
    
    // Mining Stats
    minesToday: 0,
    lastMineTime: 0,
    totalMines: 0,
    
    // Local Storage Key
    storageKey: 'vip_mining_data'
};

// Configuration
const CONFIG = {
    // Mining Settings
    MINE_COOLDOWN: 5000, // 5 seconds
    BASE_REWARD: 1,
    
    // Referral Settings
    REFERRAL_REWARD: 25,
    REFERRAL_BOT: '@VIPMainingPROBot',
    
    // Rank System
    RANKS: [
        { name: 'Beginner', min: 0, max: 199, reward: 1, power: '10/h', color: '#10B981' },
        { name: 'Pro', min: 200, max: 499, reward: 2, power: '25/h', color: '#3B82F6' },
        { name: 'Expert', min: 500, max: 999, reward: 3, power: '50/h', color: '#8B5CF6' },
        { name: 'VIP', min: 1000, max: 9999, reward: 5, power: '100/h', color: '#F59E0B' },
        { name: 'Master', min: 10000, max: Infinity, reward: 10, power: '250/h', color: '#EF4444' }
    ],
    
    // Storage Version
    VERSION: '1.0.0'
};

// DOM Elements Cache
const elements = {
    // User Info
    username: document.getElementById('username'),
    userId: document.getElementById('userId'),
    userAvatar: document.getElementById('userAvatar'),
    userSection: document.getElementById('userSection'),
    
    // Balance
    balance: document.getElementById('balance'),
    referrals: document.getElementById('referrals'),
    totalEarned: document.getElementById('totalEarned'),
    rankBadge: document.getElementById('rankBadge'),
    
    // Mining
    mineBtn: document.getElementById('mineBtn'),
    rewardAmount: document.getElementById('rewardAmount'),
    cooldownTimer: document.getElementById('cooldownTimer'),
    miningPower: document.getElementById('miningPower'),
    
    // Referral System
    refCount: document.getElementById('refCount'),
    refEarned: document.getElementById('refEarned'),
    refRank: document.getElementById('refRank'),
    referralInput: document.getElementById('referralInput'),
    copyBtn: document.getElementById('copyBtn'),
    shareBtn: document.getElementById('shareBtn'),
    whatsappBtn: document.getElementById('whatsappBtn'),
    
    // Progress
    nextRank: document.getElementById('nextRank'),
    progressFill: document.getElementById('progressFill'),
    currentPoints: document.getElementById('currentPoints'),
    targetPoints: document.getElementById('targetPoints'),
    remainingPoints: document.getElementById('remainingPoints'),
    
    // Toast
    toast: document.getElementById('toast')
};

// ============================================
// INITIALIZATION
// ============================================

function initApp() {
    console.log('🚀 Initializing VIP Mining App...');
    
    // Initialize Telegram WebApp
    if (tg.initDataUnsafe) {
        tg.ready();
        tg.expand();
        initTelegramUser();
    } else {
        initDemoMode();
    }
    
    // Load user data
    loadUserData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start auto-save interval
    setInterval(saveUserData, 30000); // Auto-save every 30 seconds
    
    // Start update loop
    requestAnimationFrame(updateLoop);
    
    console.log('✅ App initialized successfully');
}

function initTelegramUser() {
    const tgUser = tg.initDataUnsafe.user;
    
    if (tgUser) {
        // Set user data from Telegram
        userData.userId = tgUser.id;
        userData.username = tgUser.username ? `@${tgUser.username}` : `User${tgUser.id.toString().slice(-4)}`;
        userData.firstName = tgUser.first_name || 'User';
        
        // Update UI
        elements.username.textContent = userData.username;
        elements.userId.textContent = `ID: ${userData.userId}`;
        elements.userAvatar.textContent = userData.firstName.charAt(0).toUpperCase();
        
        // Generate referral link
        userData.referralLink = generateReferralLink();
        elements.referralInput.value = userData.referralLink;
        
        // Add Telegram specific styles
        elements.userSection.classList.add('telegram-user');
        
        console.log(`👤 Telegram user detected: ${userData.username} (${userData.userId})`);
    }
}

function initDemoMode() {
    console.log('🔧 Running in demo mode');
    
    // Generate demo user
    userData.userId = 'demo_' + Math.random().toString(36).substr(2, 9);
    userData.username = 'Demo User';
    userData.firstName = 'Demo';
    
    // Set initial balance for demo
    userData.balance = 150;
    userData.totalEarned = 150;
    userData.referrals = 3;
    userData.referralEarnings = 75;
    
    // Generate demo referral link
    userData.referralLink = generateReferralLink();
    elements.referralInput.value = userData.referralLink;
    
    // Update UI for demo
    elements.username.textContent = 'Demo Mode';
    elements.userId.textContent = 'ID: DEMO_USER';
    elements.userAvatar.textContent = 'D';
    elements.userAvatar.style.background = 'linear-gradient(135deg, #8B5CF6, #EC4899)';
    
    // Show demo badge
    const demoBadge = document.createElement('div');
    demoBadge.className = 'demo-badge';
    demoBadge.textContent = 'DEMO';
    elements.userSection.appendChild(demoBadge);
}

function generateReferralLink() {
    if (userData.userId) {
        // Generate proper Telegram bot referral link
        const encodedId = encodeURIComponent(userData.userId);
        return `https://t.me/VIPMainingPROBot?start=${encodedId}`;
    }
    return `https://t.me/VIPMainingPROBot?start=demo_${Date.now()}`;
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Mining Button
    elements.mineBtn.addEventListener('click', handleMining);
    
    // Copy Referral Link
    elements.copyBtn.addEventListener('click', handleCopyLink);
    
    // Share on Telegram
    elements.shareBtn.addEventListener('click', handleShareTelegram);
    
    // Share on WhatsApp
    elements.whatsappBtn.addEventListener('click', handleShareWhatsApp);
    
    // Save on page unload
    window.addEventListener('beforeunload', saveUserData);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            handleMining();
        }
    });
}

// ============================================
// MINING SYSTEM
// ============================================

function handleMining() {
    const now = Date.now();
    const timeSinceLastMine = now - userData.lastMineTime;
    
    // Check cooldown
    if (timeSinceLastMine < CONFIG.MINE_COOLDOWN) {
        const secondsLeft = Math.ceil((CONFIG.MINE_COOLDOWN - timeSinceLastMine) / 1000);
        showToast(`⏳ Please wait ${secondsLeft}s`, 'warning');
        return;
    }
    
    // Get current rank reward
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
    const reward = currentRank.reward;
    
    // Update user data
    userData.balance += reward;
    userData.totalEarned += reward;
    userData.lastMineTime = now;
    userData.minesToday++;
    userData.totalMines++;
    
    // Update UI
    updateUI();
    saveUserData();
    
    // Button animation
    animateMineButton(reward);
    
    // Show success message
    showToast(`⛏️ +${reward} points mined!`, 'success');
    
    // Check for rank up
    checkRankUp();
}

function animateMineButton(reward) {
    const btn = elements.mineBtn;
    
    // Disable button during cooldown
    btn.disabled = true;
    
    // Change button text
    const originalHTML = btn.innerHTML;
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
    
    // Start cooldown timer
    let cooldown = CONFIG.MINE_COOLDOWN / 1000;
    const timerInterval = setInterval(() => {
        cooldown--;
        if (cooldown > 0) {
            btn.querySelector('.mine-cooldown').textContent = `${cooldown}s`;
        } else {
            clearInterval(timerInterval);
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    }, 1000);
}

// ============================================
// REFERRAL SYSTEM (THE MAIN FOCUS)
// ============================================

function handleCopyLink() {
    if (!userData.referralLink) return;
    
    // Copy to clipboard
    navigator.clipboard.writeText(userData.referralLink)
        .then(() => {
            showToast('✅ Link copied to clipboard!', 'success');
            
            // Animate copy button
            elements.copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                elements.copyBtn.innerHTML = '<i class="far fa-copy"></i>';
            }, 2000);
        })
        .catch(err => {
            console.error('Copy failed:', err);
            showToast('❌ Copy failed, please copy manually', 'error');
        });
}

function handleShareTelegram() {
    if (!userData.referralLink) return;
    
    const shareText = `Join me on VIP Mining and earn free points! 🪙\n\nUse my referral link to get bonus points:\n${userData.referralLink}\n\n@VIPMainingPROBot`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(userData.referralLink)}&text=${encodeURIComponent(shareText)}`;
    
    window.open(shareUrl, '_blank');
    showToast('📱 Opening Telegram...', 'info');
}

function handleShareWhatsApp() {
    if (!userData.referralLink) return;
    
    const shareText = `Join me on VIP Mining! Earn free points using my link: ${userData.referralLink}`;
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    
    window.open(shareUrl, '_blank');
    showToast('💚 Opening WhatsApp...', 'info');
}

function simulateReferral() {
    // Simulate a referral (for demo/testing)
    userData.referrals++;
    userData.balance += CONFIG.REFERRAL_REWARD;
    userData.totalEarned += CONFIG.REFERRAL_REWARD;
    userData.referralEarnings += CONFIG.REFERRAL_REWARD;
    
    updateUI();
    saveUserData();
    
    showToast(`🎉 New referral! +${CONFIG.REFERRAL_REWARD} points`, 'success');
}

// ============================================
// RANK & PROGRESS SYSTEM
// ============================================

function getCurrentRank() {
    return CONFIG.RANKS.find(r => 
        userData.totalEarned >= r.min && userData.totalEarned <= r.max
    ) || CONFIG.RANKS[0];
}

function getNextRank() {
    const currentIndex = CONFIG.RANKS.findIndex(r => r.name === userData.rank);
    return currentIndex < CONFIG.RANKS.length - 1 ? CONFIG.RANKS[currentIndex + 1] : null;
}

function checkRankUp() {
    const currentRank = getCurrentRank();
    
    if (currentRank.name !== userData.rank) {
        const oldRank = userData.rank;
        userData.rank = currentRank.name;
        
        // Show rank up notification
        showToast(`🏆 Rank Up! ${oldRank} → ${currentRank.name}`, 'success');
        
        // Update UI
        updateUI();
    }
}

function updateProgress() {
    const currentRank = getCurrentRank();
    const nextRank = getNextRank();
    
    if (nextRank) {
        // Calculate progress
        const progress = ((userData.totalEarned - currentRank.min) / (nextRank.min - currentRank.min)) * 100;
        const clampedProgress = Math.min(progress, 100);
        
        // Update progress bar
        elements.progressFill.style.width = `${clampedProgress}%`;
        
        // Update progress text
        elements.nextRank.textContent = `Next: ${nextRank.name} (${nextRank.min} points)`;
        elements.currentPoints.textContent = userData.totalEarned;
        elements.targetPoints.textContent = nextRank.min;
        elements.remainingPoints.textContent = Math.max(0, nextRank.min - userData.totalEarned);
    } else {
        // Max rank achieved
        elements.progressFill.style.width = '100%';
        elements.nextRank.textContent = 'Maximum Rank Achieved!';
        elements.currentPoints.textContent = userData.totalEarned;
        elements.targetPoints.textContent = '∞';
        elements.remainingPoints.textContent = '0';
    }
}

// ============================================
// UI UPDATES
// ============================================

function updateUI() {
    // Update balance and stats
    elements.balance.textContent = userData.balance.toLocaleString();
    elements.referrals.textContent = userData.referrals;
    elements.totalEarned.textContent = userData.totalEarned.toLocaleString();
    
    // Update rank
    const currentRank = getCurrentRank();
    elements.rankBadge.textContent = currentRank.name;
    elements.rankBadge.style.background = `rgba(${hexToRgb(currentRank.color)}, 0.2)`;
    elements.rankBadge.style.color = currentRank.color;
    elements.rankBadge.style.borderColor = `rgba(${hexToRgb(currentRank.color)}, 0.3)`;
    
    // Update mining info
    elements.rewardAmount.textContent = currentRank.reward;
    elements.miningPower.innerHTML = `<i class="fas fa-bolt"></i> Power: ${currentRank.power}`;
    
    // Update referral stats
    elements.refCount.textContent = userData.referrals;
    elements.refEarned.textContent = userData.referralEarnings;
    elements.refRank.textContent = currentRank.name;
    
    // Update progress
    updateProgress();
    
    // Format numbers with commas
    formatNumbers();
}

function formatNumbers() {
    // Format all numbers in the UI
    document.querySelectorAll('.balance-amount, .ref-stat-value, .progress-stat span:last-child').forEach(el => {
        if (el.textContent && !isNaN(el.textContent.replace(/,/g, ''))) {
            const num = parseInt(el.textContent.replace(/,/g, ''));
            if (num >= 1000) {
                el.textContent = num.toLocaleString();
            }
        }
    });
}

// ============================================
// DATA STORAGE
// ============================================

function saveUserData() {
    try {
        const dataToSave = {
            ...userData,
            saveTime: Date.now(),
            version: CONFIG.VERSION
        };
        
        localStorage.setItem(userData.storageKey, JSON.stringify(dataToSave));
        console.log('💾 Data saved');
    } catch (error) {
        console.error('❌ Save error:', error);
    }
}

function loadUserData() {
    try {
        const saved = localStorage.getItem(userData.storageKey);
        if (saved) {
            const parsed = JSON.parse(saved);
            
            // Only load if version matches
            if (parsed.version === CONFIG.VERSION) {
                // Merge saved data with current
                Object.assign(userData, parsed);
                
                // Regenerate referral link if needed
                if (!userData.referralLink) {
                    userData.referralLink = generateReferralLink();
                }
                
                console.log('📂 Data loaded from storage');
            }
        }
    } catch (error) {
        console.error('❌ Load error:', error);
    }
}

// ============================================
// UTILITIES
// ============================================

function showToast(message, type = 'info') {
    const toast = elements.toast;
    const toastMessage = toast.querySelector('.toast-message');
    
    // Set message and type
    toastMessage.textContent = message;
    
    // Set color based on type
    const colors = {
        success: 'rgba(34, 197, 94, 0.9)',
        error: 'rgba(239, 68, 68, 0.9)',
        warning: 'rgba(245, 158, 11, 0.9)',
        info: 'rgba(59, 130, 246, 0.9)'
    };
    
    toast.style.background = colors[type] || colors.info;
    
    // Show toast
    toast.classList.add('show');
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
        : '59, 130, 246';
}

function updateLoop() {
    // Update cooldown timer
    if (userData.lastMineTime > 0) {
        const timeSinceLastMine = Date.now() - userData.lastMineTime;
        if (timeSinceLastMine < CONFIG.MINE_COOLDOWN) {
            const secondsLeft = Math.ceil((CONFIG.MINE_COOLDOWN - timeSinceLastMine) / 1000);
            if (elements.cooldownTimer) {
                elements.cooldownTimer.textContent = `${secondsLeft}s`;
            }
        }
    }
    
    requestAnimationFrame(updateLoop);
}

// ============================================
// DEMO FUNCTIONS (FOR TESTING)
// ============================================

function addDemoData() {
    // Only in demo mode
    if (userData.userId && userData.userId.startsWith('demo_')) {
        userData.balance += 100;
        userData.totalEarned += 100;
        userData.referrals += 1;
        userData.referralEarnings += 25;
        
        updateUI();
        saveUserData();
        
        showToast('🎁 Demo: +100 points added', 'info');
    }
}

function resetDemoData() {
    if (confirm('Reset all demo data?')) {
        localStorage.removeItem(userData.storageKey);
        location.reload();
    }
}

// ============================================
// START THE APPLICATION
// ============================================

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Export for debugging (optional)
window.VIPMiningApp = {
    userData,
    CONFIG,
    addDemoData,
    resetDemoData,
    simulateReferral,
    saveUserData,
    loadUserData
};

console.log('🌟 VIP Mining Mini App loaded successfully!');
