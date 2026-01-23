// Telegram Mini App Initialization
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// User data
let userData = {
    balance: 100,
    referrals: 0,
    totalEarned: 100,
    rank: 'Beginner',
    userId: null,
    username: 'User'
};

// DOM Elements
const elements = {
    balance: document.getElementById('balance'),
    referrals: document.getElementById('referrals'),
    totalEarned: document.getElementById('totalEarned'),
    rank: document.getElementById('rank'),
    userInfo: document.getElementById('userInfo'),
    mineBtn: document.getElementById('mineBtn'),
    rewardAmount: document.getElementById('rewardAmount'),
    referralLink: document.getElementById('referralLink'),
    copyBtn: document.getElementById('copyBtn'),
    miningPower: document.getElementById('miningPower')
};

// Initialize App
function initApp() {
    try {
        // Get user data from Telegram
        const tgUser = tg.initDataUnsafe?.user;
        
        if (tgUser) {
            userData.userId = tgUser.id;
            userData.username = tgUser.username ? `@${tgUser.username}` : `User${tgUser.id.toString().slice(-4)}`;
            elements.userInfo.textContent = `Welcome, ${userData.username}`;
            
            // Generate referral link
            const refLink = `https://t.me/VIPMainingPROBot?start=${userData.userId}`;
            elements.referralLink.textContent = refLink;
            
            // Copy button functionality
            elements.copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(refLink);
                elements.copyBtn.textContent = '✅ Copied!';
                setTimeout(() => {
                    elements.copyBtn.textContent = '📋 Copy Link';
                }, 2000);
            });
        } else {
            elements.userInfo.textContent = 'Demo Mode - Sign in via Telegram';
            elements.referralLink.textContent = 'Sign in to get your link';
        }
        
        // Update UI
        updateUI();
        
        // Mining button
        elements.mineBtn.addEventListener('click', minePoints);
        
        console.log('Mini App initialized successfully');
        
    } catch (error) {
        console.error('Error initializing app:', error);
        elements.userInfo.textContent = 'Error loading app';
    }
}

// Update all UI elements
function updateUI() {
    elements.balance.textContent = userData.balance;
    elements.referrals.textContent = userData.referrals;
    elements.totalEarned.textContent = userData.totalEarned;
    elements.rank.textContent = `Rank: ${userData.rank}`;
    
    // Calculate mining power based on rank
    const miningPower = {
        'Beginner': '10/h',
        'Pro': '25/h',
        'Expert': '50/h',
        'VIP': '100/h'
    };
    
    elements.miningPower.textContent = miningPower[userData.rank] || '10/h';
    
    // Calculate reward amount
    const rewardAmounts = {
        'Beginner': 1,
        'Pro': 2,
        'Expert': 3,
        'VIP': 5
    };
    
    const reward = rewardAmounts[userData.rank] || 1;
    elements.rewardAmount.textContent = reward;
    
    // Auto rank upgrade
    if (userData.totalEarned >= 1000) userData.rank = 'VIP';
    else if (userData.totalEarned >= 500) userData.rank = 'Expert';
    else if (userData.totalEarned >= 200) userData.rank = 'Pro';
}

// Mine points function
function minePoints() {
    const reward = parseInt(elements.rewardAmount.textContent);
    
    // Update user data
    userData.balance += reward;
    userData.totalEarned += reward;
    
    // Update UI
    updateUI();
    
    // Button animation
    elements.mineBtn.textContent = `🎉 +${reward} Mined!`;
    elements.mineBtn.disabled = true;
    
    // Reset button after 1 second
    setTimeout(() => {
        elements.mineBtn.textContent = `⛏️ Mine Now (+${elements.rewardAmount.textContent})`;
        elements.mineBtn.disabled = false;
    }, 1000);
    
    // Vibrate if supported
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// Start the app
initApp();

// Auto-save every 30 seconds (simulated)
setInterval(() => {
    console.log('Auto-saving user data:', userData);
}, 30000);
