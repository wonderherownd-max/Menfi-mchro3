// ============================================
// VIP Mining Mini App - الحل الكامل لمشكلة الرصيد
// ============================================

// ... [بقية الكود كما هو حتى userData] ...

// User Data - تحديث القيمة الابتدائية
let userData = {
    balance: 100, // هذه مجرد قيمة افتراضية أولية
    referrals: 0,
    totalEarned: 100,
    rank: 'Beginner',
    userId: null,
    username: 'User',
    referralEarnings: 0,
    lastMineTime: 0,
    referralCode: null,
    referredBy: null,
    firstName: 'User',
    isDataLoaded: false // ✅ إضافة علامة للتحقق من تحميل البيانات
};

// ... [بقية الكود حتى دالة loadUserData] ...

// ============================================
// Storage System - الحل المحسن
// ============================================

async function loadUserData() {
    console.log("📂 Loading user data...");
    
    try {
        const storageKey = `vip_mining_${userData.userId}`;
        console.log("🔑 Storage key:", storageKey);
        
        // ✅ التحقق من وجود بيانات محفوظة
        const saved = localStorage.getItem(storageKey);
        console.log("💾 Saved data exists:", !!saved);
        
        if (saved) {
            const data = JSON.parse(saved);
            console.log("📊 Parsed saved data:", data);
            
            // ✅ تحميل جميع البيانات المهمة
            if (data.balance !== undefined && data.balance !== null) {
                userData.balance = data.balance;
                console.log("💰 Loaded balance:", userData.balance);
            }
            
            if (data.referrals !== undefined && data.referrals !== null) {
                userData.referrals = data.referrals;
            }
            
            if (data.totalEarned !== undefined && data.totalEarned !== null) {
                userData.totalEarned = data.totalEarned;
            }
            
            if (data.rank && data.rank !== '') {
                userData.rank = data.rank;
            }
            
            if (data.referralEarnings !== undefined && data.referralEarnings !== null) {
                userData.referralEarnings = data.referralEarnings;
            }
            
            if (data.lastMineTime !== undefined && data.lastMineTime !== null) {
                userData.lastMineTime = data.lastMineTime;
            }
            
            if (data.referralCode && data.referralCode !== '') {
                userData.referralCode = data.referralCode;
            }
            
            if (data.referredBy !== undefined && data.referredBy !== null) {
                userData.referredBy = data.referredBy;
            }
            
            console.log("✅ Local data loaded successfully");
        } else {
            console.log("⚠️ No saved data found, using defaults");
            // ✅ حفظ البيانات الابتدائية فقط إذا لم تكن موجودة
            saveUserDataInstantly();
        }
        
        // ✅ Load from Firebase (إذا كان متاحاً)
        if (db) {
            await loadUserFromFirebase();
        }
        
        // ✅ وضع علامة أن البيانات تم تحميلها
        userData.isDataLoaded = true;
        
        console.log("📈 Final balance after load:", userData.balance);
        console.log("🎯 Final totalEarned after load:", userData.totalEarned);
        
    } catch (error) {
        console.error("❌ Load error:", error);
        userData.isDataLoaded = true; // حتى في حالة الخطأ
    }
}

// ============================================
// Firebase Integration - التحسينات
// ============================================

async function loadUserFromFirebase() {
    if (!db) {
        console.log("⚠️ Firebase not available");
        return;
    }
    
    try {
        console.log("🔥 Loading from Firebase...");
        const userRef = db.collection('users').doc(userData.userId);
        const userSnap = await userRef.get();
        
        if (userSnap.exists) {
            const firebaseData = userSnap.data();
            console.log("📊 Firebase data loaded:", firebaseData);
            
            // ✅ دمج البيانات من Firebase مع البيانات المحلية
            // نأخذ القيمة الأعلى من الاثنين
            if (firebaseData.balance !== undefined && firebaseData.balance !== null) {
                userData.balance = Math.max(userData.balance, firebaseData.balance);
                console.log("💰 Firebase balance:", firebaseData.balance, "| Final balance:", userData.balance);
            }
            
            if (firebaseData.totalEarned !== undefined && firebaseData.totalEarned !== null) {
                userData.totalEarned = Math.max(userData.totalEarned, firebaseData.totalEarned);
            }
            
            if (firebaseData.referrals !== undefined && firebaseData.referrals !== null) {
                userData.referrals = Math.max(userData.referrals, firebaseData.referrals);
            }
            
            if (firebaseData.referralEarnings !== undefined && firebaseData.referralEarnings !== null) {
                userData.referralEarnings = Math.max(userData.referralEarnings, firebaseData.referralEarnings);
            }
            
            if (firebaseData.rank && firebaseData.rank !== '') {
                userData.rank = firebaseData.rank;
            }
            
            if (firebaseData.referredBy !== undefined && firebaseData.referredBy !== null) {
                userData.referredBy = firebaseData.referredBy;
            }
            
            if (firebaseData.lastMineTime !== undefined && firebaseData.lastMineTime !== null) {
                userData.lastMineTime = Math.max(userData.lastMineTime, firebaseData.lastMineTime);
            }
            
            console.log("✅ Firebase data merged successfully");
        } else {
            console.log("⚠️ No Firebase data found for user");
        }
    } catch (error) {
        console.error("❌ Firebase load error:", error);
    }
}

function saveUserDataInstantly() {
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
            version: '2.0' // ✅ إضافة إصدار للبيانات
        };
        
        console.log("💾 Saving data to localStorage:", dataToSave);
        
        // ✅ حفظ في localStorage
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        
        // ✅ التحقق من الحفظ
        const verify = localStorage.getItem(storageKey);
        if (verify) {
            const parsed = JSON.parse(verify);
            console.log("✅ Data saved successfully. Balance saved:", parsed.balance);
        } else {
            console.error("❌ Data not saved to localStorage!");
        }
        
        // ✅ حفظ في Firebase
        if (db) {
            saveUserToFirebaseInstantly();
        }
        
        console.log("💾 Data saved instantly at", new Date().toLocaleTimeString());
        
    } catch (error) {
        console.error("❌ Save error:", error);
    }
}

function saveUserToFirebaseInstantly() {
    if (!db || !userData.userId) return;
    
    try {
        const userRef = db.collection('users').doc(userData.userId);
        
        const updateData = {
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
            lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
            lastBalance: userData.balance,
            updateCount: firebase.firestore.FieldValue.increment(1)
        };
        
        console.log("🔥 Saving to Firebase:", updateData);
        
        userRef.set(updateData, { merge: true })
            .then(() => {
                console.log("✅ Firebase save successful. Balance:", userData.balance);
            })
            .catch(error => {
                console.error("❌ Firebase save error:", error);
            });
        
    } catch (error) {
        console.error("❌ Firebase save error:", error);
    }
}

// ============================================
// Mining System - مع التحسينات
// ============================================

function minePoints() {
    console.log("⛏️ Mining points...");
    
    if (!userData.userId) {
        showMessage('Please wait for user setup', 'error');
        return;
    }
    
    // ✅ التحقق من تحميل البيانات أولاً
    if (!userData.isDataLoaded) {
        showMessage('Data is still loading, please wait...', 'warning');
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
    
    console.log("📈 Before mining - Balance:", userData.balance, "Total:", userData.totalEarned);
    
    // ✅ تحديث الرصيد
    userData.balance += reward;
    userData.totalEarned += reward;
    userData.lastMineTime = now;
    
    console.log("📈 After mining - Balance:", userData.balance, "Total:", userData.totalEarned);
    
    // ✅ حفظ فوري مع تأكيد
    saveUserDataInstantly();
    updateUI();
    animateMineButton(reward);
    
    showMessage(`⛏️ +${reward} points! Total: ${userData.balance}`, 'success');
    checkRankUp();
}

// ============================================
// Debugging Functions - إضافة دوال للتشخيص
// ============================================

function debugStorage() {
    console.log("🔍 === DEBUG STORAGE ===");
    
    // عرض جميع مفاتيح localStorage
    console.log("📋 All localStorage keys:");
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes('vip_mining')) {
            console.log(`Key: ${key}`);
            try {
                const data = JSON.parse(localStorage.getItem(key));
                console.log(`Data:`, data);
            } catch (e) {
                console.log(`Invalid JSON for key ${key}`);
            }
        }
    }
    
    // عرض بيانات المستخدم الحالي
    const currentKey = `vip_mining_${userData.userId}`;
    const currentData = localStorage.getItem(currentKey);
    console.log(`\n👤 Current user key: ${currentKey}`);
    console.log(`📊 Current user data:`, currentData ? JSON.parse(currentData) : 'No data');
    
    console.log("🔍 === END DEBUG ===");
}

function resetLocalStorage() {
    if (confirm('⚠️ Are you sure you want to reset local storage? This will delete all saved data.')) {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.includes('vip_mining')) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🗑️ Removed: ${key}`);
        });
        
        location.reload();
    }
}

// ============================================
// Event Listeners - مع التحسينات
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
    
    // Share buttons...
    
    // ✅ إضافة أزرار للتصحيح (فقط في وضع التطوير)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const debugBtn = document.createElement('button');
        debugBtn.textContent = 'Debug Storage';
        debugBtn.style.position = 'fixed';
        debugBtn.style.bottom = '10px';
        debugBtn.style.left = '10px';
        debugBtn.style.zIndex = '9999';
        debugBtn.style.padding = '5px 10px';
        debugBtn.style.background = '#f59e0b';
        debugBtn.style.color = 'white';
        debugBtn.style.border = 'none';
        debugBtn.style.borderRadius = '5px';
        debugBtn.onclick = debugStorage;
        document.body.appendChild(debugBtn);
        
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Reset Storage';
        resetBtn.style.position = 'fixed';
        resetBtn.style.bottom = '10px';
        resetBtn.style.right = '10px';
        resetBtn.style.zIndex = '9999';
        resetBtn.style.padding = '5px 10px';
        resetBtn.style.background = '#ef4444';
        resetBtn.style.color = 'white';
        resetBtn.style.border = 'none';
        resetBtn.style.borderRadius = '5px';
        resetBtn.onclick = resetLocalStorage;
        document.body.appendChild(resetBtn);
    }
}

// ============================================
// Application Initialization - مع التحسينات
// ============================================

async function initApp() {
    console.log("🚀 Starting VIP Mining App...");
    
    try {
        // Cache DOM elements
        cacheElements();
        
        // Setup user
        await setupUser();
        
        // ✅ عرض معلومات التخزين قبل التحميل
        console.log("🔍 Pre-load storage check...");
        debugStorage();
        
        // Load user data
        await loadUserData();
        
        // ✅ عرض معلومات التخزين بعد التحميل
        console.log("🔍 Post-load storage check...");
        debugStorage();
        
        // Setup event listeners
        setupEventListeners();
        
        // Update UI
        updateUI();
        
        // Update connection status
        updateConnectionStatus();
        
        // Check for referrals
        checkForReferral();
        
        // ✅ إضافة حدث لحفظ البيانات عند إغلاق الصفحة
        window.addEventListener('beforeunload', function() {
            console.log("🔄 Saving data before page unload...");
            saveUserDataInstantly();
        });
        
        // ✅ إضافة حدث لحفظ البيانات عند تغيير التبويب
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                console.log("📝 Page hidden, saving data...");
                saveUserDataInstantly();
            }
        });
        
        console.log("✅ App ready! Balance:", userData.balance);
        
    } catch (error) {
        console.error("❌ Initialization error:", error);
        showMessage('Error starting app. Please refresh.', 'error');
    }
}

// ============================================
// Application Startup
// ============================================

// ✅ إزالة أي فاصل زمني للتحديث التلقائي
// No auto-save intervals anymore

// Check cooldown timer every second
setInterval(() => {
    if (userData.lastMineTime > 0) {
        const timeSinceLastMine = Date.now() - userData.lastMineTime;
        if (timeSinceLastMine < CONFIG.MINE_COOLDOWN) {
            const secondsLeft = Math.ceil((CONFIG.MINE_COOLDOWN - timeSinceLastMine) / 1000);
            if (elements.cooldownTimer) {
                elements.cooldownTimer.textContent = `${secondsLeft}s`;
            }
        } else {
            if (elements.cooldownTimer) {
                elements.cooldownTimer.textContent = 'READY';
            }
        }
    }
}, 1000);

// ✅ حماية البيانات كل 10 دقائق (كإجراء احتياطي)
setInterval(() => {
    if (userData.userId && userData.isDataLoaded) {
        console.log("🛡️ Periodic data protection save...");
        saveUserDataInstantly();
    }
}, 600000); // 10 دقائق

// Initialize app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Export for debugging
window.userData = userData;
window.showMessage = showMessage;
window.generateReferralLink = generateReferralLink;
window.saveUserDataInstantly = saveUserDataInstantly;
window.debugStorage = debugStorage;
window.resetLocalStorage = resetLocalStorage;
