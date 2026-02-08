// ==========================================
// ADMIN PANEL JAVASCRIPT
// ==========================================

// Firebase Configuration (আপনার Config)
const firebaseConfig = {
  apiKey: "AIzaSyDcQHzGzmXJHdml7j-Ry-tVVAil-KSCyQ4",
  authDomain: "ludo-party-online-65b84.firebaseapp.com",
  databaseURL: "https://ludo-party-online-65b84-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ludo-party-online-65b84",
  storageBucket: "ludo-party-online-65b84.firebasestorage.app",
  messagingSenderId: "405003352009",
  appId: "1:405003352009:web:9683f995ab60e5f0f2da18",
  measurementId: "G-59P5H9MTYR"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Admin Credentials (Change this!)
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "ludo@2024";

// Global Variables
let allUsers = {};
let allTransactions = [];
let allGames = {};

// ==========================================
// LOGIN FUNCTIONS
// ==========================================
function handleAdminLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'flex';
        loadDashboard();
        showToast('Login Successful!', 'success');
    } else {
        showToast('Invalid Credentials!', 'error');
    }
}

function adminLogout() {
    sessionStorage.removeItem('adminLoggedIn');
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    showToast('Logged Out', 'success');
}

function checkAuth() {
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'flex';
        loadDashboard();
    }
}

// ==========================================
// NAVIGATION
// ==========================================
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(s => {
        s.classList.remove('active');
    });
    
    // Remove active from nav
    document.querySelectorAll('.nav-item').forEach(n => {
        n.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById('section-' + section).classList.add('active');
    
    // Update nav
    event.target.closest('.nav-item').classList.add('active');
    
    // Update title
    const titles = {
        'dashboard': 'Dashboard',
        'users': 'User Management',
        'deposits': 'Deposit Requests',
        'withdraws': 'Withdraw Requests',
        'games': 'Live Games',
        'transactions': 'Transactions',
        'settings': 'Settings'
    };
    document.getElementById('page-title').innerText = titles[section] || 'Dashboard';
    
    // Close sidebar on mobile
    if (window.innerWidth <= 1024) {
        document.getElementById('sidebar').classList.remove('active');
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

// ==========================================
// LOAD DASHBOARD DATA
// ==========================================
function loadDashboard() {
    loadUsers();
    loadTransactions();
    loadGames();
    loadSettings();
}

// Load Users
function loadUsers() {
    db.ref('users').on('value', (snapshot) => {
        allUsers = snapshot.val() || {};
        const userCount = Object.keys(allUsers).length;
        
        document.getElementById('stat-users').innerText = userCount;
        document.getElementById('users-count').innerText = userCount;
        
        renderUsersTable();
    });
}

function renderUsersTable() {
    const tbody = document.getElementById('users-table');
    tbody.innerHTML = '';
    
    if (Object.keys(allUsers).length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No users found</td></tr>';
        return;
    }
    
    Object.entries(allUsers).forEach(([id, user]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${id.substring(0, 8)}...</td>
            <td>${user.name || 'Unknown'}</td>
            <td>৳${user.balance || 0}</td>
            <td>${user.wins || 0}</td>
            <td>${user.losses || 0}</td>
            <td><span class="status-badge ${user.online ? 'online' : 'offline'}">${user.online ? 'Online' : 'Offline'}</span></td>
            <td>
                <button class="action-btn view" onclick="viewUser('${id}')"><i class="fas fa-eye"></i></button>
                <button class="action-btn approve" onclick="addBalance('${id}')"><i class="fas fa-plus"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function searchUsers() {
    const query = document.getElementById('user-search').value.toLowerCase();
    const rows = document.querySelectorAll('#users-table tr');
    
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}

// Load Transactions
function loadTransactions() {
    db.ref('transactions').on('value', (snapshot) => {
        const data = snapshot.val() || {};
        allTransactions = [];
        
        let pendingCount = 0;
        let totalRevenue = 0;
        
        Object.entries(data).forEach(([id, tx]) => {
            tx.id = id;
            allTransactions.push(tx);
            
            if (tx.status === 'pending') pendingCount++;
            if (tx.type === 'game_win') totalRevenue += (tx.amount * 0.05); // 5% commission
        });
        
        document.getElementById('stat-pending').innerText = pendingCount;
        document.getElementById('stat-revenue').innerText = '৳' + Math.floor(totalRevenue);
        document.getElementById('deposit-count').innerText = allTransactions.filter(t => t.type === 'deposit' && t.status === 'pending').length;
        document.getElementById('withdraw-count').innerText = allTransactions.filter(t => t.type === 'withdraw' && t.status === 'pending').length;
        
        renderDepositsTable('pending');
        renderWithdrawsTable('pending');
        renderTransactionsTable('all');
        renderRecentActivity();
    });
}

function renderRecentActivity() {
    // Recent Deposits
    const recentDeps = allTransactions
        .filter(t => t.type === 'deposit')
        .slice(0, 5);
    
    const depHtml = recentDeps.length > 0 
        ? recentDeps.map(t => `
            <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border);">
                <span>${t.info || 'Deposit'}</span>
                <span style="color:var(--success);">+৳${t.amount}</span>
            </div>
        `).join('')
        : '<p class="no-data">No recent deposits</p>';
    
    document.getElementById('recent-deposits').innerHTML = depHtml;
    
    // Recent Withdraws
    const recentWith = allTransactions
        .filter(t => t.type === 'withdraw')
        .slice(0, 5);
    
    const withHtml = recentWith.length > 0 
        ? recentWith.map(t => `
            <div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border);">
                <span>${t.info || 'Withdraw'}</span>
                <span style="color:var(--danger);">-৳${t.amount}</span>
            </div>
        `).join('')
        : '<p class="no-data">No recent withdraws</p>';
    
    document.getElementById('recent-withdraws').innerHTML = withHtml;
}

function renderDepositsTable(filter = 'all') {
    const tbody = document.getElementById('deposits-table');
    
    let deposits = allTransactions.filter(t => t.type === 'deposit');
    
    if (filter !== 'all') {
        deposits = deposits.filter(t => t.status === filter);
    }
    
    if (deposits.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="no-data">No deposits found</td></tr>';
        return;
    }
    
    tbody.innerHTML = deposits.map(t => `
        <tr>
            <td>${t.id.substring(0, 8)}...</td>
            <td>${t.userId?.substring(0, 8) || 'N/A'}...</td>
            <td>${t.method || 'bKash'}</td>
            <td>৳${t.amount}</td>
            <td>${t.trxId || 'N/A'}</td>
            <td>${t.number || 'N/A'}</td>
            <td>${new Date(t.date || Date.now()).toLocaleDateString()}</td>
            <td><span class="status-badge ${t.status}">${t.status}</span></td>
            <td>
                ${t.status === 'pending' ? `
                    <button class="action-btn approve" onclick="approveDeposit('${t.id}', ${t.amount}, '${t.userId}')"><i class="fas fa-check"></i></button>
                    <button class="action-btn reject" onclick="rejectTransaction('${t.id}')"><i class="fas fa-times"></i></button>
                ` : '-'}
            </td>
        </tr>
    `).join('');
}

function renderWithdrawsTable(filter = 'all') {
    const tbody = document.getElementById('withdraws-table');
    
    let withdraws = allTransactions.filter(t => t.type === 'withdraw');
    
    if (filter !== 'all') {
        withdraws = withdraws.filter(t => t.status === filter);
    }
    
    if (withdraws.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">No withdraws found</td></tr>';
        return;
    }
    
    tbody.innerHTML = withdraws.map(t => `
        <tr>
            <td>${t.id.substring(0, 8)}...</td>
            <td>${t.userId?.substring(0, 8) || 'N/A'}...</td>
            <td>${t.method || 'bKash'}</td>
            <td>৳${t.amount}</td>
            <td>${t.number || 'N/A'}</td>
            <td>${new Date(t.date || Date.now()).toLocaleDateString()}</td>
            <td><span class="status-badge ${t.status}">${t.status}</span></td>
            <td>
                ${t.status === 'pending' ? `
                    <button class="action-btn approve" onclick="approveWithdraw('${t.id}')"><i class="fas fa-check"></i></button>
                    <button class="action-btn reject" onclick="rejectWithdraw('${t.id}', ${t.amount}, '${t.userId}')"><i class="fas fa-times"></i></button>
                ` : '-'}
            </td>
        </tr>
    `).join('');
}

function renderTransactionsTable(filter = 'all') {
    const tbody = document.getElementById('transactions-table');
    
    let transactions = [...allTransactions];
    
    if (filter === 'deposit') {
        transactions = transactions.filter(t => t.type === 'deposit');
    } else if (filter === 'withdraw') {
        transactions = transactions.filter(t => t.type === 'withdraw');
    } else if (filter === 'game') {
        transactions = transactions.filter(t => t.type === 'game_win' || t.type === 'game_loss');
    }
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No transactions found</td></tr>';
        return;
    }
    
    tbody.innerHTML = transactions.map(t => `
        <tr>
            <td>${t.id.substring(0, 8)}...</td>
            <td>${t.type}</td>
            <td>${t.userId?.substring(0, 8) || 'N/A'}...</td>
            <td style="color: ${t.type.includes('win') || t.type === 'deposit' ? 'var(--success)' : 'var(--danger)'}">
                ${t.type.includes('win') || t.type === 'deposit' ? '+' : '-'}৳${t.amount}
            </td>
            <td>${t.info || '-'}</td>
            <td>${new Date(t.date || Date.now()).toLocaleDateString()}</td>
            <td><span class="status-badge ${t.status}">${t.status}</span></td>
        </tr>
    `).join('');
}

function filterDeposits(filter) {
    document.querySelectorAll('#section-deposits .filter-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderDepositsTable(filter);
}

function filterWithdraws(filter) {
    document.querySelectorAll('#section-withdraws .filter-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderWithdrawsTable(filter);
}

function filterTransactions(filter) {
    document.querySelectorAll('#section-transactions .filter-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderTransactionsTable(filter);
}

// Load Games
function loadGames() {
    db.ref('games').on('value', (snapshot) => {
        allGames = snapshot.val() || {};
        
        const activeGames = Object.values(allGames).filter(g => g.status === 'playing');
        const totalGames = Object.keys(allGames).length;
        
        document.getElementById('stat-games').innerText = totalGames;
        document.getElementById('games-count').innerText = activeGames.length;
        
        renderGamesGrid();
        renderLiveGames();
    });
}

function renderGamesGrid() {
    const container = document.getElementById('games-grid');
    
    const activeGames = Object.entries(allGames).filter(([id, g]) => g.status === 'playing');
    
    if (activeGames.length === 0) {
        container.innerHTML = '<p class="no-data">No active games</p>';
        return;
    }
    
    container.innerHTML = activeGames.map(([id, game]) => `
        <div class="game-card">
            <div class="game-card-header">
                <span class="game-id">ID: ${id.substring(0, 8)}...</span>
                <span class="status-badge success">Playing</span>
            </div>
            <div class="game-players">
                <div class="player-info">
                    <div style="width:50px;height:50px;background:var(--warning);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;">🟡</div>
                    <p class="player-name">Yellow</p>
                </div>
                <div class="vs-badge">VS</div>
                <div class="player-info">
                    <div style="width:50px;height:50px;background:var(--danger);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;">🔴</div>
                    <p class="player-name">Red</p>
                </div>
            </div>
            <div class="game-info">
                <div class="info-item">
                    <span>Bet</span>
                    <strong>৳${game.bet || game.betAmount || 0}</strong>
                </div>
                <div class="info-item">
                    <span>Prize</span>
                    <strong>৳${game.prize || game.winPrize || 0}</strong>
                </div>
                <div class="info-item">
                    <span>Turn</span>
                    <strong>${game.turn || game.currentTurn || '-'}</strong>
                </div>
            </div>
        </div>
    `).join('');
}

function renderLiveGames() {
    const container = document.getElementById('live-games');
    
    const activeGames = Object.entries(allGames).filter(([id, g]) => g.status === 'playing');
    
    if (activeGames.length === 0) {
        container.innerHTML = '<p class="no-data">No live games</p>';
        return;
    }
    
    container.innerHTML = activeGames.slice(0, 3).map(([id, game]) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--border);">
            <div>
                <strong>Game #${id.substring(0, 6)}</strong>
                <span style="color:var(--text-muted); margin-left:10px;">Yellow vs Red</span>
            </div>
            <div>
                <span style="color:var(--warning);">৳${game.bet || game.betAmount || 0}</span>
                <span class="status-badge success" style="margin-left:10px;">Live</span>
            </div>
        </div>
    `).join('');
}

// ==========================================
// ACTION FUNCTIONS
// ==========================================
function approveDeposit(txId, amount, userId) {
    if (!confirm('Approve this deposit?')) return;
    
    // Update transaction status
    db.ref('transactions/' + txId).update({
        status: 'approved'
    });
    
    // Add balance to user
    if (userId && allUsers[userId]) {
        const newBalance = (allUsers[userId].balance || 0) + amount;
        db.ref('users/' + userId).update({
            balance: newBalance
        });
    }
    
    showToast('Deposit Approved!', 'success');
}

function approveWithdraw(txId) {
    if (!confirm('Mark this withdraw as completed?')) return;
    
    db.ref('transactions/' + txId).update({
        status: 'approved'
    });
    
    showToast('Withdraw Approved!', 'success');
}

function rejectTransaction(txId) {
    if (!confirm('Reject this transaction?')) return;
    
    db.ref('transactions/' + txId).update({
        status: 'rejected'
    });
    
    showToast('Transaction Rejected!', 'warning');
}

function rejectWithdraw(txId, amount, userId) {
    if (!confirm('Reject and refund this withdraw?')) return;
    
    // Update transaction status
    db.ref('transactions/' + txId).update({
        status: 'rejected',
        info: 'Rejected - Refunded'
    });
    
    // Refund balance to user
    if (userId && allUsers[userId]) {
        const newBalance = (allUsers[userId].balance || 0) + amount;
        db.ref('users/' + userId).update({
            balance: newBalance
        });
    }
    
    showToast('Withdraw Rejected & Refunded!', 'warning');
}

function addBalance(userId) {
    const amount = prompt('Enter amount to add:');
    if (!amount || isNaN(amount)) return;
    
    const newBalance = (allUsers[userId]?.balance || 0) + parseInt(amount);
    db.ref('users/' + userId).update({
        balance: newBalance
    });
    
    showToast('Balance Added!', 'success');
}

function viewUser(userId) {
    const user = allUsers[userId];
    if (!user) return;
    
    alert(`User Details:\n\nID: ${userId}\nName: ${user.name}\nBalance: ৳${user.balance || 0}\nWins: ${user.wins || 0}\nLosses: ${user.losses || 0}\nStatus: ${user.online ? 'Online' : 'Offline'}`);
}

// ==========================================
// SETTINGS FUNCTIONS
// ==========================================
function loadSettings() {
    db.ref('settings').once('value', (snapshot) => {
        const settings = snapshot.val() || {};
        
        document.getElementById('setting-bkash').value = settings.bkash || '';
        document.getElementById('setting-nagad').value = settings.nagad || '';
        document.getElementById('setting-rocket').value = settings.rocket || '';
        document.getElementById('setting-commission').value = settings.commission || 5;
        document.getElementById('setting-min-bet').value = settings.minBet || 50;
        document.getElementById('setting-max-bet').value = settings.maxBet || 10000;
    });
}

function savePaymentSettings() {
    const bkash = document.getElementById('setting-bkash').value;
    const nagad = document.getElementById('setting-nagad').value;
    const rocket = document.getElementById('setting-rocket').value;
    
    db.ref('settings').update({
        bkash: bkash,
        nagad: nagad,
        rocket: rocket
    });
    
    showToast('Payment Settings Saved!', 'success');
}

function saveGameSettings() {
    const commission = document.getElementById('setting-commission').value;
    const minBet = document.getElementById('setting-min-bet').value;
    const maxBet = document.getElementById('setting-max-bet').value;
    
    db.ref('settings').update({
        commission: parseInt(commission),
        minBet: parseInt(minBet),
        maxBet: parseInt(maxBet)
    });
    
    showToast('Game Settings Saved!', 'success');
}

function changePassword() {
    const current = document.getElementById('current-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-password').value;
    
    if (current !== ADMIN_PASSWORD) {
        showToast('Current password is incorrect!', 'error');
        return;
    }
    
    if (newPass !== confirm) {
        showToast('Passwords do not match!', 'error');
        return;
    }
    
    // Note: In real app, save to database
    showToast('Password changed! (Update in code)', 'success');
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.className = 'toast ' + type + ' show';
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function closeModal() {
    document.getElementById('confirm-modal').classList.remove('show');
}

// ==========================================
// INITIALIZE
// ==========================================
window.addEventListener('load', function() {
    checkAuth();
});

console.log('✅ Admin Panel Loaded!');