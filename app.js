// ============================================
// VIP Mining Mini App - FINAL WORKING VERSION
// ============================================

// Telegram WebApp
let tg = null;
try {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
} catch (e) {
    console.log("Not in Telegram");
}

// بيانات المستخدم - تبدأ من 100 نقطة
let userData = {
    balance: 100,
    referrals: 0,
    totalEarned: 100,
    rank: 'Beginner',
    userId: null,
    username: 'مستخدم',
    referralEarnings: 0,
    lastMineTime: 0
};

// عناصر الصفحة
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
    connectionStatus: document.getElementById('connectionStatus'),
    cooldownTimer: document.getElementById('cooldownTimer')
};

// الإعدادات
const CONFIG = {
    MINE_COOLDOWN: 5000, // 5 ثواني
    REFERRAL_REWARD: 25, // مكافأة الإحالة
    
    RANKS: [
        { name: 'مبتدئ', min: 0, max: 199, reward: 1, power: '10/س' },
        { name: 'محترف', min: 200, max: 499, reward: 2, power: '25/س' },
        { name: 'خبير', min: 500, max: 999, reward: 3, power: '50/س' },
        { name: 'فائب', min: 1000, max: 9999, reward: 5, power: '100/س' }
    ]
};

// ============================================
// بدء التطبيق
// ============================================

function initApp() {
    console.log("🚀 بدء تطبيق VIP Mining...");
    
    try {
        // تحديد المستخدم
        setupUser();
        
        // تحميل البيانات المحفوظة
        loadUserData();
        
        // إعداد أزرار التحكم
        setupEventListeners();
        
        // تحديث الواجهة
        updateUI();
        
        // تحديث حالة الاتصال
        if (elements.connectionStatus) {
            elements.connectionStatus.textContent = '🟢 متصل';
            elements.connectionStatus.style.color = '#10b981';
        }
        
        console.log("✅ التطبيق جاهز للعمل");
        
    } catch (error) {
        console.error("❌ خطأ:", error);
        showMessage('حدث خطأ، جاري إعادة المحاولة...', 'error');
        setTimeout(initApp, 2000);
    }
}

function setupUser() {
    // التحقق من Telegram
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const tgUser = tg.initDataUnsafe.user;
        userData.userId = tgUser.id.toString();
        userData.username = tgUser.username ? `@${tgUser.username}` : `مستخدم${tgUser.id.toString().slice(-4)}`;
        
        // تحديث الواجهة
        if (elements.username) elements.username.textContent = userData.username;
        if (elements.userId) elements.userId.textContent = `المعرف: ${userData.userId}`;
        if (elements.userInfo) elements.userInfo.textContent = `أهلاً، ${userData.username}`;
        if (elements.userAvatar) {
            elements.userAvatar.textContent = userData.username.charAt(0).toUpperCase();
            elements.userAvatar.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
        }
        
        // إخفاء عناصر التجربة
        const demoControls = document.getElementById('demoControls');
        if (demoControls) demoControls.style.display = 'none';
        
    } else {
        // وضع المستخدم العادي (ليس تجريبي)
        userData.userId = 'user_' + Date.now();
        userData.username = 'مستخدم جديد';
        
        // تحديث الواجهة
        if (elements.username) elements.username.textContent = userData.username;
        if (elements.userId) elements.userId.textContent = 'المعرف: ' + userData.userId.slice(-8);
        if (elements.userInfo) elements.userInfo.textContent = 'أهلاً بك في VIP Mining';
        if (elements.userAvatar) {
            elements.userAvatar.textContent = 'م';
            elements.userAvatar.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
        }
    }
    
    // إنشاء رابط الإحالة
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
// نظام التخزين
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
            userData.rank = data.rank || 'مبتدئ';
            userData.referralEarnings = data.referralEarnings || 0;
            userData.lastMineTime = data.lastMineTime || 0;
            console.log("📂 تم تحميل البيانات المحفوظة");
        } else {
            // حفظ بيانات جديدة
            saveUserData();
        }
    } catch (error) {
        console.error("❌ خطأ في التحميل:", error);
        userData.balance = 100;
        userData.totalEarned = 100;
    }
}

function saveUserData() {
    try {
        const storageKey = `vip_mining_${userData.userId}`;
        const dataToSave = {
            balance: userData.balance,
            referrals: userData.referrals,
            totalEarned: userData.totalEarned,
            rank: userData.rank,
            referralEarnings: userData.referralEarnings,
            lastMineTime: userData.lastMineTime,
            saveTime: Date.now()
        };
        
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        console.log("💾 تم حفظ البيانات");
    } catch (error) {
        console.error("❌ خطأ في الحفظ:", error);
    }
}

// ============================================
// نظام التعدين
// ============================================

function minePoints() {
    const now = Date.now();
    const timeSinceLastMine = now - userData.lastMineTime;
    
    // التحقق من وقت الانتظار
    if (timeSinceLastMine < CONFIG.MINE_COOLDOWN) {
        const secondsLeft = Math.ceil((CONFIG.MINE_COOLDOWN - timeSinceLastMine) / 1000);
        showMessage(`⏳ انتظر ${secondsLeft} ثانية`, 'warning');
        return;
    }
    
    // تحديد المكافأة حسب الرتبة
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
    const reward = currentRank.reward;
    
    // تحديث بيانات المستخدم
    userData.balance += reward;
    userData.totalEarned += reward;
    userData.lastMineTime = now;
    
    // حفظ وتحديث
    saveUserData();
    updateUI();
    
    // تأثير الزر
    animateMineButton(reward);
    
    // رسالة النجاح
    showMessage(`⛏️ +${reward} نقطة!`, 'success');
    
    // التحقق من ترقية الرتبة
    checkRankUp();
}

function animateMineButton(reward) {
    const btn = elements.mineBtn;
    if (!btn) return;
    
    const originalHTML = btn.innerHTML;
    const originalText = btn.querySelector('.mine-text').innerHTML;
    
    // تغيير نص الزر
    btn.querySelector('.mine-text').innerHTML = `
        <div class="mine-title">تم التعدين!</div>
        <div class="mine-reward">+${reward} نقطة</div>
    `;
    
    btn.disabled = true;
    btn.style.opacity = '0.7';
    
    // عد تنازلي
    let secondsLeft = 5;
    
    const updateTimer = () => {
        if (elements.cooldownTimer) {
            elements.cooldownTimer.textContent = `${secondsLeft}ث`;
        }
        
        secondsLeft--;
        
        if (secondsLeft >= 0) {
            setTimeout(updateTimer, 1000);
        } else {
            // إعادة الزر لحالته الأصلية
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.querySelector('.mine-text').innerHTML = originalText;
            if (elements.cooldownTimer) {
                elements.cooldownTimer.textContent = '';
            }
        }
    };
    
    updateTimer();
}

// ============================================
// نظام الإحالة
// ============================================

function handleReferral(referrerId) {
    if (!referrerId || referrerId === userData.userId) return;
    
    // زيادة إحالات المحيل
    userData.referrals += 1;
    userData.balance += CONFIG.REFERRAL_REWARD;
    userData.totalEarned += CONFIG.REFERRAL_REWARD;
    userData.referralEarnings += CONFIG.REFERRAL_REWARD;
    
    // حفظ وتحديث
    saveUserData();
    updateUI();
    
    // رسالة النجاح
    showMessage(`🎉 إحالة جديدة! +${CONFIG.REFERRAL_REWARD} نقطة`, 'success');
}

function setupEventListeners() {
    // زر التعدين
    if (elements.mineBtn) {
        elements.mineBtn.addEventListener('click', minePoints);
    }
    
    // نسخ رابط الإحالة
    if (elements.copyBtn) {
        elements.copyBtn.addEventListener('click', () => {
            const refLink = generateReferralLink();
            navigator.clipboard.writeText(refLink)
                .then(() => {
                    showMessage('✅ تم نسخ الرابط', 'success');
                    elements.copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        elements.copyBtn.innerHTML = '<i class="far fa-copy"></i>';
                    }, 2000);
                })
                .catch(err => {
                    console.error('خطأ في النسخ:', err);
                    showMessage('❌ فشل النسخ', 'error');
                });
        });
    }
    
    // مشاركة على Telegram
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const refLink = generateReferralLink();
            const shareText = `انضم إلي في VIP Mining واحصل على نقاط مجانية! 🪙\n\nاستخدم رابط الإحالة الخاص بي لتحصل على مكافآت إضافية:\n${refLink}\n\n@VIPMainingPROBot`;
            const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`;
            window.open(shareUrl, '_blank');
            showMessage('📱 جارٍ فتح Telegram...', 'info');
        });
    }
    
    // مشاركة على WhatsApp
    const whatsappBtn = document.getElementById('whatsappBtn');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', () => {
            const refLink = generateReferralLink();
            const shareText = `انضم إلي في VIP Mining واحصل على نقاط مجانية! 🪙\n\nرابط الإحالة: ${refLink}`;
            const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
            window.open(shareUrl, '_blank');
            showMessage('💚 جارٍ فتح WhatsApp...', 'info');
        });
    }
    
    // التحقق من الإحالة عند التحميل
    checkForReferral();
}

function checkForReferral() {
    const urlParams = new URLSearchParams(window.location.search);
    const referrerId = urlParams.get('ref');
    
    if (referrerId && referrerId !== userData.userId) {
        // تأخير بسيط للتأكد من تحميل البيانات أولاً
        setTimeout(() => {
            handleReferral(referrerId);
        }, 1000);
    }
}

// ============================================
// تحديث الواجهة
// ============================================

function updateUI() {
    // تحديث الأرقام
    if (elements.balance) elements.balance.textContent = userData.balance;
    if (elements.referrals) elements.referrals.textContent = userData.referrals;
    if (elements.totalEarned) elements.totalEarned.textContent = userData.totalEarned;
    
    // تحديث الرتبة
    const currentRank = CONFIG.RANKS.find(r => r.name === userData.rank) || CONFIG.RANKS[0];
    if (elements.rank) elements.rank.textContent = `الرتبة: ${userData.rank}`;
    if (elements.rankBadge) elements.rankBadge.textContent = userData.rank;
    if (elements.refRank) elements.refRank.textContent = userData.rank;
    
    // تحديث معلومات التعدين
    if (elements.rewardAmount) elements.rewardAmount.textContent = currentRank.reward;
    if (elements.miningPower) elements.miningPower.innerHTML = `<i class="fas fa-bolt"></i> القوة: ${currentRank.power}`;
    
    // تحديث إحصائيات الإحالة
    if (elements.refCount) elements.refCount.textContent = userData.referrals;
    if (elements.refEarned) elements.refEarned.textContent = userData.referralEarnings;
    
    // تحديث شريط التقدم
    updateProgress();
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
            elements.nextRank.textContent = `التالي: ${nextRank.name} (${nextRank.min} نقطة)`;
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
    } else {
        // وصل لأعلى رتبة
        if (elements.progressFill) elements.progressFill.style.width = '100%';
        if (elements.nextRank) elements.nextRank.textContent = 'أعلى رتبة! 🏆';
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
        showMessage(`🏆 ترقية رتبة! ${oldRank} → ${newRank.name}`, 'success');
    }
}

// ============================================
// الأدوات المساعدة
// ============================================

function showMessage(text, type = 'info') {
    // إنشاء عنصر الرسالة
    let messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                         type === 'error' ? 'exclamation-circle' : 
                         type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${text}</span>
    `;
    
    // إضافة الأنماط
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
        z-index: 1000;
        opacity: 0;
        transition: all 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        font-weight: 500;
    `;
    
    document.body.appendChild(messageDiv);
    
    // إظهار الرسالة
    setTimeout(() => {
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    // إخفاء تلقائي بعد 3 ثواني
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
// بدء التطبيق
// ============================================

// الحفظ التلقائي كل 30 ثانية
setInterval(() => {
    if (userData.userId) {
        saveUserData();
    }
}, 30000);

// التحقق من المؤقت كل ثانية
setInterval(() => {
    if (userData.lastMineTime > 0) {
        const timeSinceLastMine = Date.now() - userData.lastMineTime;
        if (timeSinceLastMine < CONFIG.MINE_COOLDOWN) {
            const secondsLeft = Math.ceil((CONFIG.MINE_COOLDOWN - timeSinceLastMine) / 1000);
            if (elements.cooldownTimer) {
                elements.cooldownTimer.textContent = `${secondsLeft}ث`;
            }
        } else {
            if (elements.cooldownTimer) {
                elements.cooldownTimer.textContent = '';
            }
        }
    }
}, 1000);

// بدء التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initApp);

// التحقق إذا كانت الصفحة محملة مسبقاً
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initApp, 100);
            }
