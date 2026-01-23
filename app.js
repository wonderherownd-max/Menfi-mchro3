// ============================================
// VIP Mining Mini App - Ultimate Version
// With FIXED Referral System
// ============================================

// Telegram WebApp
let tg = null;
try {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#6366f1');
    tg.setBackgroundColor('#0f172a');
} catch (e) {
    console.log("Running in browser mode");
}

// User Data Structure
let userData = {
    // User Info
    userId: null,
    username: 'Miner',
    firstName: 'User',
    
    // Earnings
    balance: 100,
    referrals: 0,
    totalEarned: 100,
    referralEarnings: 0,
    
    // Ranking
    rank: 'Beginner',
    lastMineTime: 0,
    totalMines: 0,
    minesToday: 0,
    
    // Settings
    soundEnabled: true,
    notifications: true,
    autoSave: true,
    
    // Timestamps
    createdAt: Date.now(),
    lastActive: Date.now(),
    
    // Storage Key
    storageKey: 'vip_mining_pro'
};

// Configuration
const CONFIG = {
    // Mining
    MINE_COOLDOWN: 5000, // 5 seconds
    BASE_REWARD: 1,
    DAILY_BONUS: 10,
    
    // Referral System - FIXED!
    REFERRAL_REWARD: 25,
    MIN_REFERRAL_BONUS: 25,
    
    // Ranks
    RANKS: [
        { name: 'Beginner', min: 0, max: 199, reward: 1, power: '10/h', color: '#10b981' },
        { name: 'Pro', min: 200, max: 499, reward: 2, power: '25/h', color: '#3b82f6' },
        { name: 'Expert', min: 500, max: 999, reward: 3, power: '50/h', color: '#8b5cf6' },
        { name: 'VIP', min: 1000, max: 9999, reward: 5, power: '100/h', color: '#f59e0b' },
        { name: 'Master', min: 10000, max: Infinity, reward: 10, power: '250/h', color: '#ef4444' }
    ],
    
    // App Version
    VERSION: '2.0.0',
    
    // URLs
    TELEGRAM_BOT: 'https://t.me/VIPMainingPROBot',
    APP_BASE_URL: window.location.origin + window.location.pathname
};

// DOM Elements Cache
const elements = {
    // User Info
    username: document.getElementById('username'),
    userId: document.getElementById('userId'),
    userAvatar: document.getElementById('userAvatar'),
    userProfile: document.getElementById('userProfile'),
    onlineStatus: document.getElementById('onlineStatus'),
    
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
    referralLink: document.getElementById('referralLink'),
    copyBtn: document.getElementById('copyBtn'),
    telegramShareBtn: document.getElementById('telegramShareBtn'),
    appShareBtn: document.getElementById('appShareBtn'),
    
    // Progress
    progressFill: document.getElementById('progressFill'),
    progressMarker: document.getElementById('progressMarker'),
    nextRank: document.getElementById('nextRank'),
    currentPoints: document.getElementById('currentPoints'),
    remainingPoints: document.getElementById('remainingPoints'),
    currentLabel: document.getElementById('currentLabel'),
    targetLabel: document.getElementById('targetLabel'),
    
    // Status
    connectionStatus: document.getElementById('connectionStatus'),
    
    // UI
    notificationToast: document.getElementById('notificationToast'),
    toastMessage: document.getElementById('toastMessage'),
    loadingOverlay: document.getElementById('loadingOverlay')
};

// ============================================
// INITIALIZATION
// ============================================

async function initApp() {
    console.log('🚀 Initializing VIP Mining Pro...');
    
    try {
        // Setup user
        await setupUser();
        
        // Load data
        await loadUserData();
        
        // Setup event listeners
        setupEventListeners();
        
        // Process referral if any
        processReferralFromURL();
        
        // Update UI
        updateUI();
        
        // Hide loading
        hideLoading();
        
        // Update connection status
        updateConnectionStatus(true);
        
        // Show welcome message
        setTimeout(() => {
            showToast('🎉 VIP Mining Pro loaded successfully!', 'success');
        }, 1000);
        
        console.log('✅ App initialized successfully');
        
        // Start auto-save
        startAutoSave();
        
        // Start update loop
        startUpdateLoop();
        
    } catch (error) {
        console.error('❌ Initialization error:', error);
        showToast('⚠️ Error loading app, using default settings', 'error');
        hideLoading();
    }
}

async function setupUser() {
    // Get user from Telegram or generate ID
    if (tg && tg.initDataUnsafe?.user) {
        const tgUser = tg.initDataUnsafe.user;
        userData.userId = `tg_${tgUser.id}`;
        userData.username = tgUser.username ? `@${tgUser.username}` : `User${tgUser.id.toString().slice(-4)}`;
        userData.firstName = tgUser.first_name || 'User';
        
        // Mark as Telegram user
        userData.isTelegramUser = true;
        
    } else {
        // Generate unique user ID
        userData.userId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        userData.username = 'Web Miner';
        userData.firstName = 'Miner';
    }
    
    // Update UI
    if (elements.username) {
        elements.username.textContent = userData.username;
    }
    if (elements.userId) {
        elements.userId.textContent = `ID: ${userData.userId.slice(-8)}`;
    }
    if (elements.userAvatar) {
        elements.userAvatar.textContent = userData.firstName.charAt(0).toUpperCase();
        elements.userAvatar.style.background = userData.isTelegramUser 
            ? 'linear-gradient(135deg, #0088cc, #34b7f1)'
            : 'linear-gradient(135deg, #10b981, #34d399)';
    }
    
    // Update storage key
    userData.storageKey = `vip_mining_${userData.userId}`;
}

// ============================================
// REFERRAL SYSTEM - FIXED VERSION
// ============================================

function generateReferralLink() {
    // Generate TWO types of links:
    
    // 1. App Link (Primary) - Direct to the Mini App
    const appLink = `${CONFIG.APP_BASE_URL}?ref=${userData.userId}`;
    
    // 2. Bot Link (Secondary) - For Telegram sharing
    const botLink = `${CONFIG.TELEGRAM_BOT}?start=${userData.userId}`;
    
    // Return the app link as primary (THIS IS THE FIX!)
    return appLink;
}

function getShareableReferralText() {
    const appLink = generateReferralLink();
    return `🚀 Join me on VIP Mining and earn crypto points! 🪙\n\n✨ Mine every 5 seconds\n🎯 Rank up for bigger rewards\n👥 +25 points per referral\n\n👉 Start here: ${appLink}\n\n#VIPMining #Crypto #EarnMoney`;
}

async function processReferralFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const referrerId = urlParams.get('ref');
    
    // Check if this is a referral and not self-referral
    if (referrerId && referrerId !== userData.userId) {
        console.log('🔍 Processing referral from:', referrerId);
        
        // Check if already processed
        const processedKey = `processed_ref_${referrerId}`;
        if (localStorage.getItem(processedKey)) {
            console.log('✅ Referral already processed');
            return;
        }
        
        try {
            // Load referrer's data
            const referrerKey = `vip_mining_${referrerId}`;
            const referrerData = localStorage.getItem(referrerKey);
            
            if (referrerData) {
                const parsed = JSON.parse(referrerData);
                
                // Update referrer's stats
                parsed.referrals = (parsed.referrals || 0) + 1;
                parsed.balance += CONFIG.REFERRAL_REWARD;
                parsed.totalEarned += CONFIG.REFERRAL_REWARD;
                parsed.referralEarnings = (parsed.referralEarnings || 0) + CONFIG.REFERRAL_REWARD;
                
                // Save referrer's updated data
                localStorage.setItem(referrerKey, JSON.stringify(parsed));
                
                // Give bonus to new user
                userData.balance += CONFIG.MIN_REFERRAL_BONUS;
                userData.totalEarned += CONFIG.MIN_REFERRAL_BONUS;
                
                // Mark as processed
                localStorage.setItem(processedKey, 'true');
                
                // Save user data
                saveUserData();
                
                // Show success message
                showToast(`🎉 Welcome bonus! +${CONFIG.MIN_REFERRAL_BONUS} points from referral`, 'success');
                
                console.log('✅ Referral processed successfully');
            }
        } catch (error) {
            console.error('❌ Referral processing error:', error);
        }
    }
}

// ============================================
// DATA MANAGEMENT
// ============================================

async function loadUserData() {
    try {
        const saved = localStorage.getItem(userData.storageKey);
        
        if (saved) {
            const parsed = JSON.parse(saved);
            
            // Validate and load
            if (parsed.version === CONFIG.VERSION) {
                Object.assign(userData, parsed);
                console.log('📂 User data loaded from storage');
                
                // Update last active
                userData.lastActive = Date.now();
            } else {
                console.log('🔄 New version detected, using defaults');
                saveUserData();
            }
        } else {
            console.log('🆕 New user detected');
            saveUserData();
        }
    } catch (error) {
        console.error('❌ Load error:', error);
    }
}

function saveUserData() {
    try {
        userData.lastActive = Date.now();
        userData.version = CONFIG.VERSION;
        
        const dataToSave = JSON.stringify(userData);
        localStorage.setItem(userData.storageKey, dataToSave);
        
        console.log('💾 User data saved');
        return true;
    } catch (error) {
        console.error('❌ Save error:', error);
        return false;
    }
}

function startAutoSave() {
    // Auto-save every 30 seconds
    setInterval(() => {
        if (userData.autoSave) {
            saveUserData();
        }
    }, 30000);
}

// ============================================
// MINING SYSTEM
// ============================================

function minePoints() {
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
    userData.totalMines++;
    userData.minesToday++;
    
    // Save
    saveUserData();
    
    // Update UI
    updateUI();
    
    // Animate
    animateMining(reward);
    
    // Check rank up
    checkRankUp();
    
    // Play sound if enabled
    if (userData.soundEnabled) {
        playMiningSound();
    }
}

function animateMining(reward) {
    const btn = elements.mineBtn;
    if (!btn) return;
    
    // Disable button
    btn.disabled = true;
    
    // Change button text
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `
        <div class="button-content">
            <div class="mining-icon">
                <i class="fas fa-check"></i>
            </div>
            <div class="mining-info">
                <div class="mining-action">Mined!</div>
                <div class="mining-reward">+${reward} Points</div>
            </div>
        </div>
    `;
    
    // Start cooldown timer
    let cooldown = 5;
    const timerInterval = setInterval(() => {
        cooldown--;
        
        if (elements.cooldownTimer) {
            elements.cooldownTimer.textContent = cooldown > 0 ? `${cooldown}s` : 'Ready';
        }
        
        if (cooldown <= 0) {
            clearInterval(timerInterval);
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    }, 1000);
    
    // Show notification
    showToast(`⛏️ Mined +${reward} points!`, 'success');
}

function playMiningSound() {
    // Create a simple mining sound
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        console.log('Audio not supported');
    }
}

// ============================================
// RANKING SYSTEM
// ============================================

function checkRankUp() {
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank);
    const newRank = CONFIG.RANKS.find(r => 
        userData.totalEarned >= r.min && userData.totalEarned <= r.max
    );
    
    if (newRank && newRank.name !== userData.rank) {
        const oldRank = userData.rank;
        userData.rank = newRank.name;
        
        // Save
        saveUserData();
        
        // Show celebration
        showToast(`🏆 Rank Up! ${oldRank} → ${newRank.name}`, 'success');
        
        // Update UI
        updateUI();
    }
}

function updateProgress() {
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
    const nextRank = CONFIG.RANKS.find(r => r.min > userData.totalEarned);
    
    if (nextRank) {
        // Calculate progress percentage
        const progress = ((userData.totalEarned - currentRank.min) / (nextRank.min - currentRank.min)) * 100;
        const clampedProgress = Math.min(progress, 100);
        
        // Update progress bar
        if (elements.progressFill) {
            elements.progressFill.style.width = `${clampedProgress}%`;
        }
        
        // Update progress marker
        if (elements.progressMarker) {
            elements.progressMarker.style.left = `${clampedProgress}%`;
        }
        
        // Update labels
        if (elements.nextRank) {
            elements.nextRank.textContent = `Next: ${nextRank.name} (${nextRank.min} points)`;
        }
        
        if (elements.currentLabel) {
            elements.currentLabel.textContent = currentRank.name;
        }
        
        if (elements.targetLabel) {
            elements.targetLabel.textContent = nextRank.name;
        }
        
        if (elements.currentPoints) {
            elements.currentPoints.textContent = userData.totalEarned;
        }
        
        if (elements.remainingPoints) {
            elements.remainingPoints.textContent = Math.max(0, nextRank.min - userData.totalEarned);
        }
    } else {
        // Max rank achieved
        if (elements.progressFill) {
            elements.progressFill.style.width = '100%';
        }
        
        if (elements.nextRank) {
            elements.nextRank.textContent = 'Maximum Rank Achieved! 🏆';
        }
    }
}

// ============================================
// UI UPDATES
// ============================================

function updateUI() {
    // Update balance
    if (elements.balance) {
        elements.balance.textContent = userData.balance.toLocaleString();
    }
    
    // Update referrals
    if (elements.referrals) {
        elements.referrals.textContent = userData.referrals;
    }
    
    if (elements.refCount) {
        elements.refCount.textContent = userData.referrals;
    }
    
    // Update total earned
    if (elements.totalEarned) {
        elements.totalEarned.textContent = userData.totalEarned.toLocaleString();
    }
    
    // Update referral earnings
    if (elements.refEarned) {
        elements.refEarned.textContent = userData.referralEarnings.toLocaleString();
    }
    
    // Update rank
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
    
    if (elements.rankBadge) {
        elements.rankBadge.textContent = userData.rank;
        elements.rankBadge.style.background = `linear-gradient(135deg, ${currentRank.color}, ${adjustColor(currentRank.color, 20)})`;
    }
    
    if (elements.refRank) {
        elements.refRank.textContent = userData.rank;
    }
    
    // Update mining info
    if (elements.rewardAmount) {
        elements.rewardAmount.textContent = currentRank.reward;
    }
    
    if (elements.miningPower) {
        elements.miningPower.textContent = currentRank.power;
    }
    
    // Update referral link
    if (elements.referralLink) {
        const appLink = generateReferralLink();
        elements.referralLink.value = appLink;
    }
    
    // Update progress
    updateProgress();
}

function updateConnectionStatus(connected) {
    if (elements.connectionStatus) {
        const statusDot = elements.connectionStatus.querySelector('.status-dot');
        const statusText = elements.connectionStatus.querySelector('.status-text');
        
        if (connected) {
            statusDot.style.background = '#10b981';
            statusDot.style.boxShadow = '0 0 10px #10b981';
            statusText.textContent = 'Connected';
        } else {
            statusDot.style.background = '#ef4444';
            statusDot.style.boxShadow = '0 0 10px #ef4444';
            statusText.textContent = 'Disconnected';
        }
    }
}

function hideLoading() {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            elements.loadingOverlay.style.display = 'none';
        }, 300);
    }
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
        elements.copyBtn.addEventListener('click', copyReferralLink);
    }
    
    // Share on Telegram
    if (elements.telegramShareBtn) {
        elements.telegramShareBtn.addEventListener('click', shareOnTelegram);
    }
    
    // Copy app link
    if (elements.appShareBtn) {
        elements.appShareBtn.addEventListener('click', copyAppLink);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Space for mining
        if (e.code === 'Space' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            minePoints();
        }
        
        // R for refresh
        if (e.code === 'KeyR' && e.ctrlKey) {
            e.preventDefault();
            location.reload();
        }
    });
}

function copyReferralLink() {
    const link = generateReferralLink();
    
    navigator.clipboard.writeText(link)
        .then(() => {
            showToast('✅ Link copied to clipboard!', 'success');
            
            // Animate copy button
            if (elements.copyBtn) {
                elements.copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    elements.copyBtn.innerHTML = '<i class="far fa-copy"></i>';
                }, 2000);
            }
        })
        .catch(err => {
            console.error('Copy failed:', err);
            showToast('❌ Failed to copy link', 'error');
            
            // Fallback for older browsers
            elements.referralLink.select();
            document.execCommand('copy');
            showToast('✅ Link copied (fallback)', 'success');
        });
}

function shareOnTelegram() {
    const text = getShareableReferralText();
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(generateReferralLink())}&text=${encodeURIComponent(text)}`;
    
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    showToast('📱 Opening Telegram...', 'info');
}

function copyAppLink() {
    const appLink = generateReferralLink();
    
    navigator.clipboard.writeText(appLink)
        .then(() => {
            showToast('✅ App link copied! Share it anywhere', 'success');
        })
        .catch(err => {
            console.error('Copy failed:', err);
            showToast('❌ Failed to copy link', 'error');
        });
}

// ============================================
// UTILITIES
// ============================================

function showToast(message, type = 'info') {
    if (!elements.notificationToast || !elements.toastMessage) return;
    
    // Set message
    elements.toastMessage.textContent = message;
    
    // Set color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    elements.notificationToast.style.background = colors[type] || colors.info;
    
    // Set icon
    const icon = elements.notificationToast.querySelector('.toast-icon');
    if (icon) {
        icon.className = `fas fa-${type === 'success' ? 'check-circle' : 
                         type === 'error' ? 'exclamation-circle' : 
                         type === 'warning' ? 'exclamation-triangle' : 'info-circle'} toast-icon`;
    }
    
    // Show toast
    elements.notificationToast.classList.add('show');
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        elements.notificationToast.classList.remove('show');
    }, 3000);
}

function adjustColor(color, amount) {
    // Simple color adjustment
    return color.replace(/\d+/g, num => Math.min(255, Math.max(0, parseInt(num) + amount)));
}

function startUpdateLoop() {
    // Update cooldown timer every second
    setInterval(() => {
        if (userData.lastMineTime > 0) {
            const timeSinceLastMine = Date.now() - userData.lastMineTime;
            
            if (timeSinceLastMine < CONFIG.MINE_COOLDOWN) {
                const secondsLeft = Math.ceil((CONFIG.MINE_COOLDOWN - timeSinceLastMine) / 1000);
                
                if (elements.cooldownTimer) {
                    elements.cooldownTimer.textContent = `${secondsLeft}s`;
                    elements.cooldownTimer.style.color = '#ef4444';
                }
            } else {
                if (elements.cooldownTimer) {
                    elements.cooldownTimer.textContent = 'Ready';
                    elements.cooldownTimer.style.color = '#10b981';
                }
            }
        }
    }, 1000);
}

// ============================================
// START APPLICATION
// ============================================

// Make functions globally available
window.userData = userData;
window.showToast = showToast;
window.generateReferralLink = generateReferralLink;
window.copyReferralLink = copyReferralLink;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    setTimeout(initApp, 100);
}

// Save before page unload
window.addEventListener('beforeunload', () => {
    saveUserData();
});

console.log('🌟 VIP Mining Pro loaded successfully!');
