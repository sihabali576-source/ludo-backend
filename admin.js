// ==========================================
// ADMIN PANEL LOGIC
// ==========================================

const API_BASE = 'http://localhost:3000/api'; // Pointing to your Node Server

// State
let currentSection = 'dashboard';

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadSection('dashboard');
});

// --- Navigation ---
function loadSection(section) {
    currentSection = section;
    
    // Update Active Link
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`a[href="#${section}"]`).classList.add('active');

    // Update Title
    const titles = {
        'dashboard': 'Dashboard Overview',
        'users': 'User Management',
        'finance': 'Finance & Wallet',
        'game-monitor': 'Live Game Monitor',
        'security': 'Security & Fraud',
        'settings': 'System Configuration'
    };
    document.getElementById('page-title').innerText = titles[section];

    // Render Content
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = '<div style="text-align:center; padding:50px;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';

    switch(section) {
        case 'dashboard': renderDashboard(); break;
        case 'finance': renderFinance(); break;
        case 'users': renderUsers(); break;
        default: contentArea.innerHTML = `<h3>${titles[section]} Under Construction</h3>`;
    }
}

// --- RENDERERS ---

async function renderDashboard() {
    try {
        const response = await fetch(`${API_BASE}/admin/stats`);
        const stats = await response.json();

        const html = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Total Users</div>
                    <div class="stat-value">${stats.totalUsers}</div>
                    <div style="color:var(--success); font-size:12px;">+12% this week</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Active Games</div>
                    <div class="stat-value" style="color:var(--primary)">${stats.activeGames}</div>
                    <div style="color:var(--text-muted); font-size:12px;">Live now</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Total Revenue</div>
                    <div class="stat-value" style="color:var(--accent)">$${stats.totalRevenue}</div>
                    <div style="color:var(--success); font-size:12px;">+5% vs yesterday</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Pending Requests</div>
                    <div class="stat-value" style="color:${stats.pendingRequests > 0 ? 'var(--danger)' : 'var(--success)'}">${stats.pendingRequests}</div>
                    <div style="font-size:12px;">Requires attention</div>
                </div>
            </div>
            
            <div class="stat-card">
                <h3 style="margin-bottom:15px; border-bottom:1px solid var(--border); padding-bottom:10px;">Recent Revenue Analytics</h3>
                <div style="height: 200px; display:flex; align-items:flex-end; justify-content:space-between; gap:10px; padding-top:20px;">
                    <!-- Mock Chart Bars -->
                    ${[40, 60, 45, 80, 55, 90, 70].map(h => `
                        <div style="width:100%; background:var(--primary); opacity:0.7; border-radius:4px; height:${h}%; transition:0.5s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.7"></div>
                    `).join('')}
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:10px; color:var(--text-muted); font-size:12px;">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
            </div>
        `;
        document.getElementById('content-area').innerHTML = html;
    } catch (error) {
        console.error("Failed to load dashboard", error);
    }
}

async function renderFinance() {
    try {
        const response = await fetch(`${API_BASE}/admin/requests`);
        const requests = await response.json();

        let rows = '';
        if (requests.length === 0) {
            rows = '<tr><td colspan="6" style="text-align:center;">No pending requests</td></tr>';
        } else {
            requests.forEach(req => {
                rows += `
                    <tr>
                        <td>#${req.id}</td>
                        <td>User ${req.userId}</td>
                        <td><span class="status-badge status-pending">${req.type.toUpperCase()}</span></td>
                        <td>${req.method}</td>
                        <td>${req.amount}</td>
                        <td>
                            <button class="btn-action btn-approve" onclick="handleRequest(${req.id}, 'approve')"><i class="fas fa-check"></i></button>
                            <button class="btn-action btn-reject" onclick="handleRequest(${req.id}, 'reject')"><i class="fas fa-times"></i></button>
                        </td>
                    </tr>
                `;
            });
        }

        const html = `
            <div class="stat-card" style="margin-bottom:20px;">
                <h3>Pending Financial Approvals</h3>
                <p style="color:var(--text-muted); font-size:13px; margin-top:5px;">Verify transactions before approving.</p>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>Type</th>
                        <th>Method</th>
                        <th>Amount</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
        document.getElementById('content-area').innerHTML = html;
    } catch (error) {
        console.error("Failed to load finance", error);
    }
}

function renderUsers() {
    const html = `
        <div class="stat-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3>User Directory</h3>
                <button class="btn-action" style="background:var(--primary);">Export CSV</button>
            </div>
            <input type="text" placeholder="Search users by ID or Mobile..." style="width:100%; padding:10px; background:rgba(0,0,0,0.2); border:1px solid var(--border); color:white; border-radius:6px; margin-bottom:15px;">
            <table class="data-table">
                <thead>
                    <tr><th>ID</th><th>Name</th><th>Mobile</th><th>Balance</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td>101</td><td>Rahim Uddin</td><td>01700000000</td><td>500.00</td>
                        <td><span class="status-badge status-success">Active</span></td>
                        <td><button class="btn-action" style="background:var(--text-muted)">Edit</button></td>
                    </tr>
                     <tr>
                        <td>102</td><td>Karim Ali</td><td>01800000000</td><td>0.00</td>
                        <td><span class="status-badge status-rejected">Banned</span></td>
                        <td><button class="btn-action" style="background:var(--text-muted)">Edit</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    document.getElementById('content-area').innerHTML = html;
}

// --- ACTIONS ---

async function handleRequest(id, action) {
    if(!confirm(`Are you sure you want to ${action} this request?`)) return;

    try {
        const res = await fetch(`${API_BASE}/admin/requests/${id}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: action, note: 'Processed by Super Admin' })
        });
        
        if(res.ok) {
            alert('Request processed successfully');
            renderFinance(); // Reload list
        } else {
            alert('Error processing request');
        }
    } catch (e) {
        alert('Server error');
    }
}

// Modal Utils
function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
}
