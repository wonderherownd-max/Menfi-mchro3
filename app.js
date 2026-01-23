// ============================================
// VIP Mining Mini App - Firebase Version
// ============================================

// Telegram WebApp Initialization
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCuZwYapa7LBRg4OOzcHLWFBpfSrjEVQ0U",
  authDomain: "vip-mining.firebaseapp.com",
  projectId: "vip-mining",
  storageBucket: "vip-mining.firebasestorage.app",
  messagingSenderId: "205041694428",
  appId: "1:205041694428:web:5b90ab2cc31b118d8be619"
};

// Import Firebase functions directly (لا تحتاج import منفصل)
// استخدم CDN بدلاً من modules

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

// Firebase variables
let db = null;

// Initialize Firebase
async function initializeFirebase() {
    try {
        // Load Firebase SDKs from CDN (لا تحتاج npm)
        const firebaseScript = document.createElement('script');
        firebaseScript.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
        document.head.appendChild(firebaseScript);
        
        await new Promise(resolve => firebaseScript.onload = resolve);
        
        const firestoreScript = document.createElement('script');
        firestoreScript.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
        document.head.appendChild(firestoreScript);
        
        await new Promise(resolve => firestoreScript.onload = resolve);
        
        // Initialize Firebase
        const app = firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        
        console.log('✅ Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        return false;
    }
}

// Initialize App
async function initApp() {
    console.log('🚀 Initializing app...');
    
    try {
        // Get user data from Telegram
        const tgUser = tg.initDataUnsafe?.user;
        
        if (!tgUser) {
            showMessage('Please open from Telegram', 'error');
            return;
        }
        
        userData.userId = tgUser.id.toString();
        userData.username = tgUser.username ? `@${tgUser.username}` : `User${tgUser.id.toString().slice(-4)}`;
        elements.userInfo.textContent = `Welcome, ${userData.username}`;
        
        // Initialize Firebase
        const firebaseReady = await initializeFirebase();
        
        if (!firebaseReady) {
            showMessage('Using local storage (Firebase failed)', 'warning');
            loadFromLocalStorage();
        } else {
            // Load from Firebase
            await loadUserFromFirebase();
        }
        
        // Generate referral link
        const refLink = `https://t.me/VIPMainingPROBot?start=${userData.userId}`;
        elements.referralLink.textContent = refLink;
        
        // Copy button functionality
        elements.copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(refLink);
            showMessage('✅ Link copied!', 'success');
            elements.copyBtn.textContent = '✅ Copied!';
            setTimeout(() => {
                elements.copyBtn.textContent = '📋 Copy Link';
            }, 2000);
        });
        
        // Mining button
        elements.mineBtn.addEventListener('click', minePoints);
        
        // Update UI
        updateUI();
        
        console.log('✅ App initialized successfully');
        
    } catch (error) {
        console.error('❌ Error initializing app:', error);
        showMessage('Failed to load app', 'error');
    }
}

// Load user from Firebase
async function loadUserFromFirebase() {
    try {
        const userRef = db.collection('users').doc(userData.userId);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const data = userDoc.data();
            userData.balance = data.balance || 100;
            userData.referrals = data.referrals || 0;
            userData.totalEarned = data.totalEarned || 100;
            userData.rank = data.rank || 'Beginner';
            console.log('📂 Loaded from Firebase');
        } else {
            // Create new user
            await userRef.set({
                userId: userData.userId,
                username: userData.username,
                balance: 100,
                referrals: 0,
                totalEarned: 100,
                rank: 'Beginner',
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString()
            });
            console.log('🆕 Created new user in Firebase');
        }
        
        // Update last active
        await userRef.update({
            lastActive: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Firebase load error:', error);
        loadFromLocalStorage();
    }
}

// Save to Firebase
async function saveToFirebase() {
    if (!db) return;
    
    try {
        const userRef = db.collection('users').doc(userData.userId);
        await userRef.update({
            balance: userData.balance,
            referrals: userData.referrals,
            totalEarned: userData.totalEarned,
            rank: userData.rank,
            lastActive: new Date().toISOString()
        });
        console.log('💾 Saved to Firebase');
    } catch (error) {
        console.error('❌ Save error:', error);
        saveToLocalStorage();
    }
}

// Local storage fallback
function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem(`vip_mining_${userData.userId}`);
        if (saved) {
            const data = JSON.parse(saved);
            userData.balance = data.balance || 100;
            userData.referrals = data.referrals || 0;
            userData.totalEarned = data.totalEarned || 100;
            userData.rank = data.rank || 'Beginner';
            console.log('📂 Loaded from local storage');
        }
    } catch (error) {
        console.error('❌ Local storage error:', error);
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem(`vip_mining_${userData.userId}`, JSON.stringify(userData));
        console.log('💾 Saved to local storage');
    } catch (error) {
        console.error('❌ Local save error:', error);
    }
}

// Mine points function
async function minePoints() {
    const reward = parseInt(elements.rewardAmount.textContent);
    
    // Update user data
    userData.balance += reward;
    userData.totalEarned += reward;
    
    // Save to Firebase or local storage
    if (db) {
        await saveToFirebase();
    } else {
        saveToLocalStorage();
    }
    
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
    
    showMessage(`⛏️ +${reward} points!`, 'success');
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

// Show message
function showMessage(text, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 20px;
        border-radius: 10px;
        background: ${type === 'error' ? '#ef4444' : 
                     type === 'success' ? '#10b981' : 
                     type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        z-index: 1000;
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Auto-save every 30 seconds
setInterval(() => {
    if (userData.userId) {
        if (db) {
            saveToFirebase();
        } else {
            saveToLocalStorage();
        }
    }
}, 30000);

// Start the app
document.addEventListener('DOMContentLoaded', initApp);
