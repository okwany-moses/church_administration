// --- 1. DATA STORAGE LOGIC ---
// 1. Pull existing data or start fresh
let rawData = JSON.parse(localStorage.getItem('gideonsData')) || {};

// 2. Define the Master Template with all required keys
let defaultData = {
    members: [],
    finances: { tithes: 0, offerings: 0, special: 0, registration: 0, expenses: 0 },
    services: [],
    maintenance: [],
    volunteers: [],
    bulletin: "",
    announcements: [],
    users: [{ username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator' }],
    digitalStats: { website: "Online", facebookFocus: "", posts: [false, false, false, false] }
};

// 3. Merge existing data into the template
// This keeps old members but adds 'special' and 'announcements' if they are missing.
let churchData = { ...defaultData, ...rawData };

// 4. Ensure nested objects like 'finances' are also merged
churchData.finances = { ...defaultData.finances, ...rawData.finances };

// 5. Save the updated structure back immediately
localStorage.setItem('gideonsData', JSON.stringify(churchData));

// --- AUTHENTICATION SYSTEM ---
let isLoggedIn = localStorage.getItem('gideonsLoggedIn') === 'true';
let currentUser = JSON.parse(localStorage.getItem('gideonsCurrentUser')) || null;
let currentRole = currentUser?.role || 'admin';
let authMode = 'login';
let authRole = localStorage.getItem('gideonsLastRole') || 'admin';
let rememberedUsername = localStorage.getItem('gideonsLastUsername') || '';

// --- MODAL FUNCTIONS ---
function showModal(title, message, yesText = null, noText = null) {
    const modal = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalFooter = document.getElementById('modal-footer');
    
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.classList.add('active');

    // Clear previous buttons
    modalFooter.innerHTML = '';

    if (yesText && noText) {
        modalFooter.innerHTML = `
            <button class="modal-btn" id="modal-btn-yes">${yesText}</button>
            <button class="modal-btn" id="modal-btn-no">${noText}</button>
        `;
    } else {
        modalFooter.innerHTML = '<button class="modal-btn" onclick="closeModal()">OK</button>';
    }
}

function showHtmlModal(title, html, yesText = null, noText = null) {
    const modal = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-message');
    const modalFooter = document.getElementById('modal-footer');

    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    modal.classList.add('active');

    if (yesText && noText) {
        modalFooter.innerHTML = `
            <button class="modal-btn" id="modal-btn-yes">${yesText}</button>
            <button class="modal-btn" id="modal-btn-no">${noText}</button>
        `;
    } else {
        modalFooter.innerHTML = '<button class="modal-btn" onclick="closeModal()">OK</button>';
    }
}

function closeModal() {
    const modal = document.getElementById('modal-overlay');
    modal.classList.remove('active');
}

// --- AUTHENTICATION FUNCTIONS ---
function initAuth() {
    const authForm = document.getElementById('auth-form');
    const loginScreen = document.getElementById('login-screen');
    const mainDashboard = document.getElementById('main-dashboard');

    populateSavedUsernames();
    selectAuthRole(authRole);
    switchAuthMode(authMode);

    const savedUsernameField = document.getElementById('authUsername');
    if (rememberedUsername) {
        savedUsernameField.value = rememberedUsername;
    }

    if (isLoggedIn) {
        loginScreen.style.display = 'none';
        mainDashboard.style.display = 'flex';
        updateUserProfileDisplay();
        showModule('home');
    } else {
        loginScreen.style.display = 'flex';
        mainDashboard.style.display = 'none';
    }

    authForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('authUsername').value.trim().toLowerCase();
        const password = document.getElementById('authPassword').value;

        if (authMode === 'login') {
            loginUser(username, password, authRole);
            return;
        }

        const fullName = document.getElementById('authName').value.trim();
        const confirmPassword = document.getElementById('authConfirmPassword').value;

        if (!fullName || !username || !password || !confirmPassword) {
            showModal('Error', 'Please complete all fields for registration.');
            return;
        }

        if (password !== confirmPassword) {
            showModal('Error', 'The passwords do not match. Please confirm your password.');
            return;
        }

        registerUser(fullName, username, password, authRole);
    });
}

function loginUser(username, password, role) {
    if (!username || !password) {
        showModal('Login Failed', 'Please enter both username and password.');
        return;
    }

    const matchedUser = (churchData.users || []).find(user => user.username === username && user.password === password && user.role === role);
    if (!matchedUser) {
        showModal('Login Failed', 'Invalid username or password for the selected role.');
        return;
    }

    isLoggedIn = true;
    currentUser = matchedUser;
    currentRole = matchedUser.role;
    localStorage.setItem('gideonsLoggedIn', 'true');
    localStorage.setItem('gideonsCurrentUser', JSON.stringify(currentUser));

    const rememberMeChecked = document.getElementById('rememberMe').checked;
    if (rememberMeChecked) {
        localStorage.setItem('gideonsLastUsername', username);
        localStorage.setItem('gideonsLastRole', role);
    } else {
        localStorage.removeItem('gideonsLastUsername');
        localStorage.removeItem('gideonsLastRole');
    }

    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-dashboard').style.display = 'flex';
    updateUserProfileDisplay();
    showModal('Welcome', `Successfully logged in as ${role === 'viewer' ? 'read-only viewer' : 'Administrator'}.`);
    populateSavedUsernames();
    showModule('home');
}

function registerUser(name, username, password, role) {
    const taken = (churchData.users || []).some(user => user.username === username);
    if (taken) {
        showModal('Error', 'That username already exists. Please choose a different one.');
        return;
    }

    const newUser = {
        username,
        password,
        role,
        name
    };

    churchData.users = churchData.users || [];
    churchData.users.push(newUser);
    persistData();
    populateSavedUsernames();

    document.getElementById('authName').value = '';
    document.getElementById('authUsername').value = username;
    document.getElementById('authPassword').value = '';
    document.getElementById('authConfirmPassword').value = '';

    showHtmlModal('Account Created', `
        <p>Your ${role === 'viewer' ? 'viewer' : 'admin'} account has been registered successfully.</p>
        <p>Would you like to sign in now with your new credentials?</p>
    `, 'Yes', 'No');

    document.getElementById('modal-btn-yes').onclick = function() {
        closeModal();
        switchAuthMode('login');
    };
    document.getElementById('modal-btn-no').onclick = function() {
        closeModal();
    };
}

function logout() {
    isLoggedIn = false;
    currentUser = null;
    currentRole = 'admin';
    localStorage.removeItem('gideonsLoggedIn');
    localStorage.removeItem('gideonsCurrentUser');
    const loginScreen = document.getElementById('login-screen');
    const mainDashboard = document.getElementById('main-dashboard');
    loginScreen.style.display = 'flex';
    mainDashboard.style.display = 'none';
    // Clear auth form fields
    document.getElementById('authUsername').value = '';
    document.getElementById('authPassword').value = '';
    document.getElementById('authName').value = '';
    document.getElementById('authConfirmPassword').value = '';
    document.getElementById('rememberMe').checked = false;
}

// --- GLOBAL EDIT STATE TRACKING ---
let editingRecord = { type: null, index: null }; // Tracks which record is being edited
let reportPreviewType = ''; // Tracks which CSV preview is active in reports

function getLiveTable(type) {
    const data = churchData[type];
    
    // 1. Safety check for empty or missing data
    if (!data || data.length === 0) {
        return '<p style="color:#64748b; padding:10px; font-style:italic;">No recent records found.</p>';
    }
    
    let tableHTML = '<table style="width:100%; font-size:0.8rem; border-collapse:collapse;">';
    tableHTML += `
        <tr style="text-align:left; color:#94a3b8; border-bottom:1px solid #334155;">
            <th style="padding-bottom:8px;">Entry</th>
            <th style="padding-bottom:8px;">Info</th>
        </tr>`;
    
    // 2. Slice the last 5, but ensure we don't break if there are fewer than 5
    const recentEntries = data.slice(-5).reverse();

    recentEntries.forEach(item => {
        // 3. Dynamic Detail Logic: Choose the best "Detail" based on what the data is
        let detail = "";
        if (type === 'members') detail = item.role;
        else if (type === 'services') detail = item.leader;
        else if (type === 'maintenance') detail = item.status;
        else if (type === 'volunteers') detail = item.dept;
        else detail = "Record Saved";

        tableHTML += `
            <tr style="border-bottom:1px solid #1e293b;">
                <td style="padding:8px 0; font-weight:500; color:var(--accent);">${item.name || item.type || 'N/A'}</td>
                <td style="padding:8px 0; color:#cbd5e1;">${detail}</td>
            </tr>`;
    });

    tableHTML += '</table>';
    return tableHTML;
}

function getReportPreviewHtml(type) {
    if (!type) return '';

    let previewTitle = '';
    let tableContent = '';
    let note = '';

    if (type === 'members') {
        previewTitle = 'Members & Leadership Report Preview';
        if (!churchData.members.length) {
            note = '<p style="color:#94a3b8;">No members recorded yet.</p>';
        } else {
            tableContent = `
                <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                    <thead>
                        <tr style="border-bottom:2px solid var(--accent); text-align:left;">
                            <th style="padding:10px;">Name</th>
                            <th style="padding:10px;">Phone</th>
                            <th style="padding:10px;">Role</th>
                            <th style="padding:10px;">Registration</th>
                            <th style="padding:10px;">Monthly</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${churchData.members.map(member => `
                            <tr style="border-bottom:1px solid #334155;">
                                <td style="padding:10px;">${member.name || 'N/A'}</td>
                                <td style="padding:10px;">${member.phone || 'N/A'}</td>
                                <td style="padding:10px;">${member.role || 'N/A'}</td>
                                <td style="padding:10px;">${member.payments?.registration || 0}</td>
                                <td style="padding:10px;">${member.payments?.monthly || 0}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`;
        }
    } else if (type === 'finance') {
        previewTitle = 'Treasury & Finances Report Preview';
        const t = churchData.finances.tithes || 0;
        const o = churchData.finances.offerings || 0;
        const r = churchData.finances.registration || 0;
        const s = churchData.finances.special || 0;
        const e = churchData.finances.expenses || 0;
        const total = t + o + r + s - e;
        tableContent = `
            <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                <thead>
                    <tr style="border-bottom:2px solid var(--accent); text-align:left;">
                        <th style="padding:10px;">Category</th>
                        <th style="padding:10px;">Amount (KSh)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom:1px solid #334155;"><td style="padding:10px;">Registration Funds</td><td style="padding:10px;">${r}</td></tr>
                    <tr style="border-bottom:1px solid #334155;"><td style="padding:10px;">Tithes</td><td style="padding:10px;">${t}</td></tr>
                    <tr style="border-bottom:1px solid #334155;"><td style="padding:10px;">Offerings</td><td style="padding:10px;">${o}</td></tr>
                    <tr style="border-bottom:1px solid #334155;"><td style="padding:10px;">Special Funds</td><td style="padding:10px;">${s}</td></tr>
                    <tr style="border-bottom:1px solid #334155;"><td style="padding:10px;">Facility Expenses</td><td style="padding:10px; color:#f87171;">${e}</td></tr>
                    <tr style="border-top:2px solid #475569; font-weight:700;"><td style="padding:10px;">Total Treasury</td><td style="padding:10px;">${total}</td></tr>
                </tbody>
            </table>`;
    } else if (type === 'volunteers') {
        previewTitle = 'Volunteers Report Preview';
        if (!churchData.volunteers.length) {
            note = '<p style="color:#94a3b8;">No volunteers recorded yet.</p>';
        } else {
            tableContent = `
                <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                    <thead>
                        <tr style="border-bottom:2px solid var(--accent); text-align:left;">
                            <th style="padding:10px;">Name</th>
                            <th style="padding:10px;">Department</th>
                            <th style="padding:10px;">Status</th>
                            <th style="padding:10px;">Date Added</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${churchData.volunteers.map(vol => `
                            <tr style="border-bottom:1px solid #334155;">
                                <td style="padding:10px;">${vol.name || 'N/A'}</td>
                                <td style="padding:10px;">${vol.dept || 'N/A'}</td>
                                <td style="padding:10px;">${vol.status || 'Active'}</td>
                                <td style="padding:10px;">${vol.dateAdded || 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`;
        }
    }

    return `
        <div class="card" style="margin-top:20px; grid-column: span 2; background: rgba(15, 23, 42, 0.6); padding:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div>
                    <h3 style="margin:0; color:var(--accent);">${previewTitle}</h3>
                    <p style="margin:4px 0 0; color:#94a3b8; font-size:0.9rem;">This is a live preview of the selected CSV export.</p>
                </div>
                <button onclick="clearReportPreview()" class="action-btn" style="background:#6b7280;">Clear Preview</button>
            </div>
            ${note || tableContent}
        </div>`;
}

function handleSearch(query) {
    const dropdown = document.getElementById('search-results-dropdown');
    
    if (!query || query.length < 2) {
        dropdown.style.display = 'none';
        return;
    }

    const term = query.toLowerCase();

    // 1. Combine and Search both datasets
    const memberResults = churchData.members
        .filter(m => m.name.toLowerCase().includes(term))
        .map(m => ({ ...m, type: 'Member' }));

    const volunteerResults = churchData.volunteers
        .filter(v => v.name.toLowerCase().includes(term))
        .map(v => ({ ...v, type: 'Volunteer', role: v.dept })); // Map dept to role for consistent UI

    const combined = [...memberResults, ...volunteerResults];

    // 2. Render Results
    if (combined.length > 0) {
        dropdown.style.display = 'block';
        dropdown.innerHTML = combined.slice(0, 8).map(person => `
            <div class="search-item" 
                 style="padding:10px; border-bottom:1px solid #334155; cursor:pointer;" 
                 onclick="viewPerson('${person.name}')">
                <div style="display:flex; justify-content:space-between;">
                    <strong>${person.name}</strong>
                    <span style="font-size:0.7rem; color:var(--accent); text-transform:uppercase;">${person.type}</span>
                </div>
                <small style="color:#94a3b8;">${person.role} • ${person.phone || 'No Phone'}</small>
            </div>
        `).join('');
    } else {
        dropdown.style.display = 'block';
        dropdown.innerHTML = '<div style="padding:10px; color:#94a3b8;">No matches found</div>';
    }
}

function viewPerson(name) {
    // 1. Look in both arrays to find the person
    const person = churchData.members.find(m => m.name === name) || 
                   churchData.volunteers.find(v => v.name === name);

    // 2. Safety check: If for some reason the person isn't found
    if (!person) {
        showModal('Error', 'Profile details could not be retrieved.');
        return;
    }

    // 3. Close the search dropdown so it doesn't block the view
    const dropdown = document.getElementById('search-results-dropdown');
    if (dropdown) dropdown.style.display = 'none';

    // 4. Format the profile details dynamically
    const type = person.payments ? "OFFICIAL MEMBER" : "VOLUNTEER";
    const detailLabel = person.cell ? `Cell Group: ${person.cell}` : `Department: ${person.dept}`;
    const contributionInfo = person.payments 
        ? `\nRegistration: KSh ${person.payments.registration}\nMonthly: KSh ${person.payments.monthly}` 
        : "";

    // 5. Display the details
    alert(
        `GIDEON'S SYSTEM - PROFILE\n` +
        `--------------------------\n` +
        `Status: ${type}\n` +
        `Name: ${person.name}\n` +
        `Phone: ${person.phone || 'N/A'}\n` +
        `Role/Position: ${person.role || person.dept}\n` +
        `${detailLabel}\n` +
        `${contributionInfo}\n` +
        `--------------------------\n` +
        `Joined: ${person.dateJoined || person.dateAdded || 'Unknown'}`
    );
}

function persistData() {
    try {
        // 1. Add a internal timestamp to your data so you know when the last sync happened
        churchData.lastSync = new Date().toISOString();

        // 2. Attempt to save to LocalStorage
        const dataString = JSON.stringify(churchData);
        localStorage.setItem('gideonsData', dataString);
        churchData = JSON.parse(dataString); // Keep in-memory data synced with persisted state
        
        // 3. Log to console for debugging (helpful during development)
        console.log("Database Sync Successful:", new Date().toLocaleTimeString());
        
    } catch (error) {
        // 4. Handle QuotaExceededError or other storage issues
        console.error("Database Sync Failed!", error);
        
        if (error.name === 'QuotaExceededError') {
            showModal('Storage Error', 'Storage Full: Please export your data to CSV and clear some records.');
        } else {
            showModal('System Error', 'Could not save data to browser memory.');
        }
    }
}

// --- EDIT FUNCTIONS ---
function editRecord(type, actualIndex) {
    if (!hasEditPermission()) {
        showModal('Permission Denied', 'Viewer accounts cannot modify records.');
        return;
    }
    const record = churchData[type][actualIndex];
    
    if (!record) {
        showModal('Error', 'Record not found.');
        return;
    }

    editingRecord = { type: type, index: actualIndex };
    
    // Populate form fields based on type
    if (type === 'members') {
        document.getElementById('mName').value = record.name || '';
        document.getElementById('mPhone').value = record.phone || '';
        document.getElementById('mRole').value = record.role || 'General Member';
        document.getElementById('mCell').value = record.cell || '';
        document.getElementById('mReg').value = record.payments?.registration || '';
        document.getElementById('mContrib').value = record.payments?.monthly || '';
        
        // Scroll to form
        document.getElementById('mName').scrollIntoView({ behavior: 'smooth' });
        document.getElementById('mName').focus();
    } 
    else if (type === 'volunteers') {
        document.getElementById('vName').value = record.name || '';
        document.getElementById('vPhone').value = record.phone || '';
        document.getElementById('vDept').value = record.dept || 'Ushers';
        document.getElementById('vName').scrollIntoView({ behavior: 'smooth' });
        document.getElementById('vName').focus();
    }
    else if (type === 'maintenance') {
        document.getElementById('eqType').value = record.type || 'Sound System';
        document.getElementById('eqInCharge').value = record.pic || '';
        document.getElementById('eqCondition').value = record.status || 'Fair';
        document.getElementById('eqAvailability').value = record.avail || '';
        document.getElementById('maintDate').value = record.date || '';
        document.getElementById('eqInCharge').scrollIntoView({ behavior: 'smooth' });
        document.getElementById('eqInCharge').focus();
    }
    else if (type === 'services') {
        document.getElementById('sFreq').value = record.type || 'Sunday Main';
        document.getElementById('sCount').value = record.count || '';
        document.getElementById('sLeader').value = record.leader || '';
        document.getElementById('sOrder').value = record.order || '';
        document.getElementById('sDateTime').value = record.time || '';
        document.getElementById('sLeader').scrollIntoView({ behavior: 'smooth' });
        document.getElementById('sLeader').focus();
    }
    else if (type === 'announcements') {
        document.getElementById('annText').value = record.text || '';
        document.getElementById('annBy').value = record.author || 'Church Admin';
        document.getElementById('annText').scrollIntoView({ behavior: 'smooth' });
        document.getElementById('annText').focus();
    }
}

function cancelEdit() {
    editingRecord = { type: null, index: null };
    // Clear all form fields
    const allInputs = document.querySelectorAll('input, textarea, select');
    allInputs.forEach(input => {
        if (input.type !== 'hidden') {
            input.value = '';
        }
    });
}

function hasEditPermission() {
    return currentRole === 'admin';
}

function isViewerRole() {
    return currentRole === 'viewer';
}

function updateUserProfileDisplay() {
    const profileSpan = document.getElementById('user-display');
    if (profileSpan) {
        profileSpan.textContent = currentUser ? `${currentUser.name} (${currentRole})` : 'Admin';
    }
}

function applyRoleRestrictions() {
    const contentArea = document.querySelector('.content');
    if (!contentArea) return;

    const interactiveElements = contentArea.querySelectorAll('input, select, textarea');
    interactiveElements.forEach(el => {
        el.disabled = isViewerRole();
    });

    const buttons = contentArea.querySelectorAll('button');
    buttons.forEach(btn => {
        if (isViewerRole() && !btn.classList.contains('allow-viewer')) {
            btn.disabled = true;
        } else {
            btn.disabled = false;
        }
    });
}

function populateSavedUsernames() {
    const userList = document.getElementById('saved-usernames');
    if (!userList) return;
    userList.innerHTML = (churchData.users || []).map(user => `<option value="${user.username}"></option>`).join('');
}

function switchAuthMode(mode) {
    authMode = mode;
    const loginBtn = document.getElementById('login-mode-btn');
    const registerBtn = document.getElementById('register-mode-btn');
    const registerExtra = document.getElementById('register-extra');
    const actionBtn = document.getElementById('auth-action-btn');
    const authHint = document.getElementById('auth-hint');

    if (mode === 'login') {
        loginBtn.classList.add('active');
        registerBtn.classList.remove('active');
        registerExtra.classList.add('hidden');
        actionBtn.textContent = `Login as ${authRole === 'admin' ? 'Administrator' : 'Viewer'}`;
        authHint.textContent = authRole === 'viewer'
            ? 'Viewer preview access lets you inspect members, finance and volunteers in read-only mode.'
            : 'Administrator access allows full editing, reporting and system control.';
    } else {
        loginBtn.classList.remove('active');
        registerBtn.classList.add('active');
        registerExtra.classList.remove('hidden');
        actionBtn.textContent = `Register as ${authRole === 'admin' ? 'Administrator' : 'Viewer'}`;
        authHint.textContent = authRole === 'viewer'
            ? 'Create a read-only viewer account to preview members, finance and volunteers.'
            : 'Register a new administrator account for full system management.';
    }
}

function selectAuthRole(role) {
    authRole = role;
    const viewerBtn = document.getElementById('role-viewer-btn');
    const adminBtn = document.getElementById('role-admin-btn');
    viewerBtn.classList.toggle('active', role === 'viewer');
    adminBtn.classList.toggle('active', role === 'admin');
    switchAuthMode(authMode);
}

function openPasswordReset() {
    showHtmlModal('Reset Password', `
        <div class="form-group">
            <input type="text" id="resetUsername" placeholder=" ">
            <label for="resetUsername">Username</label>
        </div>
        <div class="form-group">
            <input type="password" id="resetPassword" placeholder=" ">
            <label for="resetPassword">New Password</label>
        </div>
        <div class="form-group">
            <input type="password" id="resetConfirmPassword" placeholder=" ">
            <label for="resetConfirmPassword">Confirm New Password</label>
        </div>
    `, 'Reset', 'Cancel');

    document.getElementById('modal-btn-yes').onclick = function() {
        resetPassword();
    };
    document.getElementById('modal-btn-no').onclick = function() {
        closeModal();
    };
}

function resetPassword() {
    const username = document.getElementById('resetUsername')?.value.trim().toLowerCase();
    const password = document.getElementById('resetPassword')?.value;
    const confirmPassword = document.getElementById('resetConfirmPassword')?.value;

    if (!username || !password || !confirmPassword) {
        showModal('Error', 'Please complete all fields to reset the password.');
        return;
    }

    if (password !== confirmPassword) {
        showModal('Error', 'The passwords do not match. Please try again.');
        return;
    }

    const user = (churchData.users || []).find(user => user.username === username);
    if (!user) {
        showModal('Error', 'No account found for that username.');
        return;
    }

    user.password = password;
    persistData();
    showModal('Success', 'Password has been reset. You can now login with your new password.');
    closeModal();
}

function setReportPreview(type) {
    reportPreviewType = type;
    showModule('reports');
}

function clearReportPreview() {
    reportPreviewType = '';
    showModule('reports');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    
    // 1. Safety Check: Ensure the sidebar exists before trying to touch it
    if (!sidebar) return;

    // 2. Perform the toggle
    sidebar.classList.toggle('collapsed');

    // 3. Accessibility: Update 'aria-expanded' for screen readers
    const isCollapsed = sidebar.classList.contains('collapsed');
    sidebar.setAttribute('aria-expanded', !isCollapsed);

    // 4. Mobile UX: If we are on a small screen, add an overlay 
    // to dim the background when the sidebar is active
    handleMobileOverlay(isCollapsed);
}

// Helper for better UI behavior
function handleMobileOverlay(isCollapsed) {
    const overlay = document.getElementById('sidebar-overlay');
    if (!overlay) return;
    
    if (window.innerWidth < 768) {
        overlay.style.display = isCollapsed ? 'none' : 'block';
    }
}

// --- 2. MODULE ROUTING ---
function showModule(moduleName) {
    const display = document.getElementById('module-display');
    const title = document.getElementById('module-title');
    const subtitle = document.getElementById('module-subtitle');

    if (moduleName !== 'reports') {
        reportPreviewType = '';
    }

    if (moduleName === 'home') {
        title.innerText = "Command Center";
        subtitle.innerText = `Welcome back${currentUser ? ', ' + currentUser.name : ''}. System is operational.`;
        const viewerBanner = isViewerRole() ? `<div class="viewer-notice">Read-only viewer access is active. Editing and deleting are disabled, but report previews and exports remain available.</div>` : '';
        display.innerHTML = `${viewerBanner}
            <div class="main-dashboard-grid" id="home-grid">
                <div class="nav-card" onclick="showModule('reports')">
                    <div class="card-icon">📊</div>
                    <h3>Report Center</h3>
                    <p>Export Data & Stats</p>
                </div>
                <div class="nav-card" onclick="showModule('clergy')">
                    <div class="card-icon">⛪</div>
                    <h3>Clergy Support</h3>
                    <p>Calendar & Services</p>
                </div>
                <div class="nav-card" onclick="showModule('commms')">
                    <div class="card-icon">📢</div>
                    <h3>Communications</h3>
                    <p>Media & Bulletins</p>
                </div>
                <div class="nav-card" onclick="showModule('facility')">
                    <div class="card-icon">🛠️</div>
                    <h3>Facilities</h3>
                    <p>Maintenance & Ops</p>
                </div>
                <div class="nav-card" onclick="showModule('finance')">
                    <div class="card-icon">💰</div>
                    <h3>Financials</h3>
                    <p>Bookkeeping & Payroll</p>
                </div>
                <div class="nav-card" onclick="showModule('hr')">
                    <div class="card-icon">👥</div>
                    <h3>HR & Volunteers</h3>
                    <p>Onboarding & Staff</p>
                </div>
                <div class="nav-card reset-card" onclick="showModule('home')">
                    <div class="card-icon">🔄</div>
                    <h3>Refresh</h3>
                    <p>Update System</p>
                </div>
            </div>`;
        applyRoleRestrictions();
        return;
    }

    // Map names to display titles
    const info = {
        'finance': ["Financial Management", "Member registration and treasury"],
        'clergy': ["Clergy Support", "Schedules, Responsibilities & Announcements"],
        'commms': ["Communications & Media", "Bulletin drafting and Social Media"],
        'facility': ["Facilities & Operations", "Equipment condition and maintenance"],
        'hr': ["HR & Volunteers", "Volunteer database and department vetting"],
        'reports': ["Report & Export Center", "Generate official documents"]
    };

    title.innerText = info[moduleName][0];
    subtitle.innerText = info[moduleName][1];

    let html = '';

    // --- 3. MODULE CONTENT GENERATION ---
    if (moduleName === 'finance') {
        html = `
            <div class="data-entry-grid">
                <!-- 1. Membership & Leadership Capture -->
                <div class="card entry-form">
                    <h3>Member & Leadership Registry</h3>
                    <p style="font-size:0.8rem; color:var(--text-muted);">Register pastors, committee members, and cell groups.</p>
                    
                    <input type="text" id="mName" placeholder="Full Official Name">
                    <input type="text" id="mPhone" placeholder="Phone Number (e.g., 07...)">
                    
                    <select id="mRole">
                        <option value="General Member">General Member</option>
                        <option value="Pastor">Pastor / Clergy</option>
                        <option value="Committee">Committee Member</option>
                        <option value="Cell Leader">Cell Group Leader</option>
                        <option value="Missioner">Missioner (Outreach)</option>
                    </select>

                    <input type="text" id="mCell" placeholder="Cell Group Name (e.g., Ebenezer, Shiloh)">
                    
                    <div style="display:flex; gap:10px;">
                        <input type="number" id="mReg" placeholder="Yearly Reg Fee">
                        <input type="number" id="mContrib" placeholder="Monthly Contribution">
                    </div>

                    <div style="display:flex; gap:10px;">
                        <button onclick="saveFinancialMember()" class="action-btn" id="financeBtn">${editingRecord.type === 'members' && editingRecord.index !== null ? '✏️ Update Member' : '📝 Register & Capture Data'}</button>
                        ${editingRecord.type === 'members' && editingRecord.index !== null ? '<button onclick="cancelEdit(); showModule(\'finance\');" class="action-btn" style="background:#6b7280;">Cancel</button>' : ''}
                    </div>
                </div>

                <!-- 2. Treasury & Collections -->
                <div class="card entry-form">
                    <h3>Treasury: Tithes & Offerings</h3>
                    <p style="font-size:0.8rem; color:var(--text-muted);">Log general collections for the current service.</p>
                    
                    <label>Total Tithes Collected:</label>
                    <input type="number" id="tAmount" placeholder="KSh 0.00">
                    
                    <label>General Offerings:</label>
                    <input type="number" id="oAmount" placeholder="KSh 0.00">
                    
                    <label>Building/Special Fund:</label>
                    <input type="number" id="sAmount" placeholder="KSh 0.00">

                    <button onclick="updateTreasury()" class="action-btn gold">Update Total Treasury</button>
                </div>

                <!-- 3. Financial Summary Card -->
                <div class="card">
                    <h3>Financial Overview</h3>
                    <div id="financeSummary">
                        <p>Registered Members: <strong>${churchData.members.length}</strong></p>
                        <p>Registration Funds: <strong style="color:var(--accent)">KSh ${(churchData.finances.registration || 0).toLocaleString()}</strong></p>
                        <p>Total Tithes: <strong style="color:var(--accent)">KSh ${churchData.finances.tithes.toLocaleString()}</strong></p>
                        <p>Total Offerings: <strong style="color:var(--accent)">KSh ${churchData.finances.offerings.toLocaleString()}</strong></p>
                        <p>Special Funds: <strong style="color:var(--accent)">KSh ${(churchData.finances.special || 0).toLocaleString()}</strong></p>
                        <p>Facility Expenses: <strong style="color:#f87171">KSh ${(churchData.finances.expenses || 0).toLocaleString()}</strong></p>
                        <p style="margin-top:10px; border-top:1px solid #334155; padding-top:10px; font-weight:700;">Total Treasury: <strong style="color:var(--accent)">KSh ${( (churchData.finances.tithes || 0) + (churchData.finances.offerings || 0) + (churchData.finances.special || 0) + (churchData.finances.registration || 0) - (churchData.finances.expenses || 0) ).toLocaleString()}</strong></p>
                    </div>
                </div>
            </div>`;
    } 
    else if (moduleName === 'clergy') {
        html = `
            <div class="data-entry-grid">
                <!-- 1. Service Scheduler -->
                <div class="card entry-form">
                    <h3>Service & Fellowship Manager</h3>
                    <select id="sFreq">
                        <option value="Sunday Main">Sunday Main Service</option>
                        <option value="Mid-week">Mid-week Fellowship</option>
                        <option value="Kesha">Kesha (Night Vigil)</option>
                        <option value="Special">Special Event</option>
                    </select>
                    <input type="number" id="sCount" placeholder="Service Number (e.g., 1st or 2nd)">
                    <input type="text" id="sLeader" placeholder="Minister in Charge">
                    <textarea id="sOrder" placeholder="Order of Service (Hymn, Sermon, Intercession...)"></textarea>
                    <input type="datetime-local" id="sDateTime">
                    <div style="display:flex; gap:10px;">
                        <button onclick="saveService()" class="action-btn">${editingRecord.type === 'services' && editingRecord.index !== null ? '✏️ Update' : '📅 Update Schedule'}</button>
                        ${editingRecord.type === 'services' && editingRecord.index !== null ? '<button onclick="cancelEdit(); showModule(\'clergy\');" class="action-btn" style="background:#6b7280;">Cancel</button>' : ''}
                    </div>
                </div>

                <!-- 2. Real-time Announcements -->
                <div class="card entry-form">
                    <h3>Post Announcements</h3>
                    <p style="font-size:0.8rem; color:var(--text-muted);">This updates the coordination status for the media team.</p>
                    <textarea id="annText" style="height: 80px;" placeholder="Enter news or alerts for the congregation..."></textarea>
                    <input type="text" id="annBy" placeholder="Announced by (e.g., Church Admin)">
                    <div style="display:flex; gap:10px;">
                        <button onclick="saveAnnouncement()" class="action-btn gold">${editingRecord.type === 'announcements' && editingRecord.index !== null ? '✏️ Update' : '📢 Post Announcement'}</button>
                        ${editingRecord.type === 'announcements' && editingRecord.index !== null ? '<button onclick="cancelEdit(); showModule(\'clergy\');" class="action-btn" style="background:#6b7280;">Cancel</button>' : ''}
                    </div>
                </div>

                <div class="card entry-form" style="grid-column: span 1;">
                    <h3>Posted Announcements</h3>
                    <p style="font-size:0.8rem; color:var(--text-muted);">Announcements stored inside the system.</p>
                    <div id="announcementList" style="font-size:0.85rem; max-height: 250px; overflow-y:auto;">
                        ${churchData.announcements.length === 0 ? '<p style="color:#94a3b8;">No announcements posted yet.</p>' : 
                            churchData.announcements.slice().reverse().map((announcement, index) => {
                                const actualIndex = churchData.announcements.length - 1 - index;
                                return `
                                    <div style="border-bottom:1px solid #334155; padding:10px 0;">
                                        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
                                            <div>
                                                <strong>${announcement.author || 'Church Admin'}</strong>
                                                <div style="font-size:0.75rem; color:#94a3b8;">${announcement.date || 'Unknown date'}</div>
                                            </div>
                                            <div style="display:flex; gap:6px;">
                                                ${hasEditPermission() ? `
                                                    <button onclick="editRecord('announcements', ${actualIndex})" style="background:#3b82f6; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.75rem;">Edit</button>
                                                    <button onclick="deleteRecord('announcements', ${actualIndex})" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.75rem;">Delete</button>
                                                ` : '<span style="color:#94a3b8;">Read-only</span>'}
                                            </div>
                                        </div>
                                        <p style="margin:8px 0 0; color:#cbd5e1; white-space:pre-wrap;">${announcement.text}</p>
                                    </div>`;
                            }).join('')
                        }
                    </div>
                    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px;">
                        <button onclick="downloadAnnouncementsCSV()" class="action-btn">Export Announcements</button>
                        <button onclick="copyAnnouncementsToClipboard()" class="action-btn">Copy to Clipboard</button>
                        <button onclick="shareAnnouncementsEmail()" class="action-btn" style="background:#0ea5e9;">Open Email Draft</button>
                    </div>
                </div>

                <!-- 3. Coordination View -->
                <div class="card" style="grid-column: span 1;">
                    <h3>Live Coordination Status</h3>
                    <div id="serviceList" style="font-size: 0.85rem; max-height: 250px; overflow-y: auto;">
                        ${churchData.services.length === 0 ? '<p>No services scheduled.</p>' : 
                            churchData.services.map((s, index) => `
                                <div style="border-bottom:1px solid #334155; padding:10px 0;">
                                    <span class="status-badge" style="font-size:0.6rem">LIVE</span>
                                    <strong>${s.type} #${s.count}</strong><br>
                                    <small>Leader: ${s.leader} | Time: ${s.time}</small>
                                    <p style="margin-top:5px; color:var(--text-muted); font-style:italic;">Order: ${s.order.substring(0,30)}...</p>
                                </div>
                            `).reverse().join('')
                        }
                    </div>
                </div>
            </div>`;
    }
    else if (moduleName === 'facility') {
        html = `
            <div class="data-entry-grid">
                <div class="card entry-form">
                    <h3>Equipment Registry</h3>
                    <select id="eqType">
                        <option value="Sound System">Sound System Gear</option>
                        <option value="Media">Media/Projector Equipment</option>
                        <option value="Tents/Chairs">Tents and Chairs</option>
                        <option value="Music">Music Instruments</option>
                        <option value="Building">Church Building/Structure</option>
                    </select>
                    <input type="text" id="eqInCharge" placeholder="Individual in Charge">
                    <select id="eqCondition">
                        <option value="Excellent">Condition: Excellent</option>
                        <option value="Fair">Condition: Fair (Needs Check)</option>
                        <option value="Poor">Condition: Poor (Repair Required)</option>
                    </select>
                    <input type="text" id="eqAvailability" placeholder="Availability (e.g., In Store, On Loan)">
                    <input type="number" id="eqExpense" placeholder="KSh Amount Spent" min="0" step="0.01" style="margin-top:1rem;">
                    <label style="font-size:0.8rem; color:var(--text-muted);">Next Maintenance Date:</label>
                    <input type="date" id="maintDate">
                    <div style="display:flex; gap:10px;">
                        <button onclick="saveFacility()" class="action-btn">${editingRecord.type === 'maintenance' && editingRecord.index !== null ? '✏️ Update' : '🛠️ Log Facility Status'}</button>
                        ${editingRecord.type === 'maintenance' && editingRecord.index !== null ? '<button onclick="cancelEdit(); showModule(\'facility\');" class="action-btn" style="background:#6b7280;">Cancel</button>' : ''}
                    </div>
                </div>
                <div class="card">
                    <h3>Current Inventory Status</h3>
                    <div id="facilityList" style="font-size: 0.85rem; max-height: 300px; overflow-y: auto;">
                        ${churchData.maintenance.length === 0 ? '<p>No equipment logged yet.</p>' : 
                            churchData.maintenance.map(item => `
                                <div style="border-bottom:1px solid #334155; padding:10px 0;">
                                    <strong>${item.type}</strong> - ${item.status}<br>
                                    <small>In Charge: ${item.pic} | Next Check: ${item.date} | Spent: KSh ${item.expense || 0}</small>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
            </div>`;
    }

    else if (moduleName === 'commms') {
        html = `
            <div class="data-entry-grid">
                <!-- 1. Bulletin Editor -->
                <div class="card entry-form" style="grid-column: span 2;">
                    <h3>Weekly Bulletin Newsroom</h3>
                    <p style="font-size:0.8rem; color:var(--text-muted);">Draft news, testimonies, and updates for the congregation.</p>
                    <textarea id="bulletinContent" style="height:250px; font-family: 'Courier New', monospace;" 
                        placeholder="Type the weekly news here...">${churchData.bulletin || ""}</textarea>
                    <button onclick="saveBulletin()" class="action-btn">💾 Save & Publish Bulletin</button>
                </div>

                <!-- 2. Website & Social Media Tracker -->
                <div class="card entry-form">
                    <h3>Digital Platform Status</h3>
                    
                    <label>Website Status:</label>
                    <select id="webStatus">
                        <option value="Online">Online & Running</option>
                        <option value="Update Needed">Needs Content Update</option>
                        <option value="Maintenance">Under Maintenance</option>
                    </select>

                    <h4 style="margin-top:20px;">Facebook Post Tracker</h4>
                    <p style="font-size:0.75rem;">Target: 4 Posts Per Week</p>
                    <div style="display:flex; gap:10px; margin: 10px 0;">
                        <input type="checkbox" id="p1"> Post 1
                        <input type="checkbox" id="p2"> Post 2
                        <input type="checkbox" id="p3"> Post 3
                        <input type="checkbox" id="p4"> Post 4
                    </div>
                    
                    <input type="text" id="fbFocus" placeholder="This week's focus (e.g. Youth Rally)">
                    <button onclick="saveDigitalStatus()" class="action-btn gold">Update Media Stats</button>
                </div>

                <!-- 3. Real-time Preview -->
                <div class="card">
                    <h3>Current Live Bulletin</h3>
                    <div id="bulletinPreview" style="background:#0f172a; padding:15px; border-radius:8px; border:1px dashed var(--accent); white-space: pre-wrap; font-size:0.9rem;">
                        ${churchData.bulletin || "No news drafted for this week yet."}
                    </div>
                </div>
            </div>`;
    }
    else if (moduleName === 'hr') {
        html = `
            <div class="data-entry-grid">
                <div class="card entry-form">
                    <h3>Volunteer Onboarding</h3>
                    <input type="text" id="vName" placeholder="Volunteer Name">
                    <input type="text" id="vPhone" placeholder="Phone Number (Optional)">
                    <select id="vDept">
                        <option>Ushers</option>
                        <option>Protocols</option>
                        <option>Praise & Worship</option>
                        <option>Sunday School</option>
                    </select>
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        <button onclick="saveVolunteer()" class="action-btn">${editingRecord.type === 'volunteers' && editingRecord.index !== null ? '✏️ Update' : '👤 Vet & Add'}</button>
                        ${editingRecord.type === 'volunteers' && editingRecord.index !== null ? '<button onclick="cancelEdit(); showModule(\'hr\');" class="action-btn" style="background:#6b7280;">Cancel</button>' : ''}
                    </div>
                </div>
                <div class="card">
                    <h3>Active Roster</h3>
                    <p>Total Volunteers: ${churchData.volunteers.length}</p>
                    <div id="volunteerRoster" style="font-size:0.85rem; max-height: 300px; overflow-y:auto;">
                        ${churchData.volunteers.length === 0 ? '<p style="color:#94a3b8;">No volunteers added yet.</p>' : churchData.volunteers.map(vol => `
                            <div style="border-bottom:1px solid #334155; padding:10px 0;">
                                <strong>${vol.name}</strong> <span style="color:#94a3b8; font-size:0.8rem;">(${vol.dept})</span>
                                <div style="margin-top:4px; color:#cbd5e1;">Phone: ${vol.phone || 'N/A'} | Status: ${vol.status}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>`;
    }

    else if (moduleName === 'reports') {
        html = `
            <div class="data-entry-grid">
                <div class="card entry-form" style="grid-column: span 2; text-align: center;">
                    <h3 style="color: var(--accent);">📊 Centralized Report Center</h3>
                    <p>Select a category below to preview CSV reports. Viewer accounts can only preview; download is disabled.</p>
                </div>

                <div class="card">
                    <h3>Members & Leadership</h3>
                    <p style="font-size:0.8rem; color:var(--text-muted);">Full registry including cell groups and registration status.</p>
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        <button onclick="downloadCSV('members')" class="action-btn" ${isViewerRole() ? 'disabled title="Download disabled for viewer accounts"' : ''}>Download Members CSV</button>
                        <button onclick="setReportPreview('members')" class="action-btn allow-viewer" style="background:#0ea5e9;">Preview Members</button>
                    </div>
                </div>

                <div class="card">
                    <h3>Treasury & Finances</h3>
                    <p style="font-size:0.8rem; color:var(--text-muted);">Summary of Tithes, Offerings, and Special Funds.</p>
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        <button onclick="downloadCSV('finance')" class="action-btn gold" ${isViewerRole() ? 'disabled title="Download disabled for viewer accounts"' : ''}>Download Finance CSV</button>
                        <button onclick="setReportPreview('finance')" class="action-btn allow-viewer" style="background:#0ea5e9;">Preview Finance</button>
                    </div>
                </div>

                <div class="card">
                    <h3>Human Resources</h3>
                    <p style="font-size:0.8rem; color:var(--text-muted);">Current list of vetted volunteers and their departments.</p>
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        <button onclick="downloadCSV('volunteers')" class="action-btn" ${isViewerRole() ? 'disabled title="Download disabled for viewer accounts"' : ''}>Download Volunteers CSV</button>
                        <button onclick="setReportPreview('volunteers')" class="action-btn allow-viewer" style="background:#0ea5e9;">Preview Volunteers</button>
                    </div>
                </div>

                <div class="card">
                    <h3>System Health</h3>
                    <p style="font-size:0.8rem; color:var(--text-muted);">Quick stats of the current database storage.</p>
                    <div style="font-size: 0.9rem; margin-top: 10px; color: var(--accent);">
                        Total Records: ${churchData.members.length + churchData.volunteers.length + churchData.services.length}
                    </div>
                </div>
            </div>`;

        // Update the header titles for this module
        title.innerText = "Report & Export Center";
        subtitle.innerText = "Generate official documents for the Gideons administration.";
    }

    let reportPreviewHtml = '';
    if (moduleName === 'reports' && reportPreviewType) {
        reportPreviewHtml = getReportPreviewHtml(reportPreviewType);
    }

    // --- START OF PREVIEW LOGIC ---
    let previewData = [];
    let dataType = '';

    if (moduleName === 'finance') { dataType = 'members'; previewData = churchData.members; }
    else if (moduleName === 'hr') { dataType = 'volunteers'; previewData = churchData.volunteers; }
    else if (moduleName === 'facility') { dataType = 'maintenance'; previewData = churchData.maintenance; }
    else if (moduleName === 'clergy') { dataType = 'services'; previewData = churchData.services; }
    else if (moduleName === 'commms') { dataType = 'announcements'; previewData = churchData.announcements || []; }

    const canEditRecords = hasEditPermission();
    let previewHtml = "";
    
    if (previewData.length > 0) {
        previewHtml = `
            <div class="card" style="margin-top:20px; grid-column: span 2; background: rgba(15, 23, 42, 0.6);">
                <h3 style="color: var(--accent);">Live Records Management</h3>
                <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; font-size:0.85rem; margin-top:10px;">
                        <thead>
                            <tr style="border-bottom: 2px solid var(--accent); text-align: left;">
                                <th style="padding:10px;">Name/Type</th>
                                <th style="padding:10px;">Details</th>
                                <th style="padding:10px; text-align:center;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${previewData.slice().reverse().map((item, index) => {
                                // Important: Calculate the real index for the database
                                const actualIndex = previewData.length - 1 - index;
                                let displayName = item.name || item.type || item.text?.substring(0, 30) || "N/A";
                                let displayDetail = "";
                                
                                if (dataType === 'announcements') {
                                    displayDetail = item.author || "Church Admin";
                                } else {
                                    displayDetail = item.role || item.status || (item.leader ? 'Led by ' + item.leader : 'Record');
                                }
                                
                                return `
                                    <tr style="border-bottom: 1px solid #334155;">
                                        <td style="padding:10px;">${displayName}</td>
                                        <td style="padding:10px; color: var(--text-muted);">
                                            ${displayDetail}
                                        </td>
                                        <td style="padding:10px; text-align:center; display:flex; gap:6px; justify-content:center;">
                                            ${canEditRecords ? `
                                                <button onclick="editRecord('${dataType}', ${actualIndex})" 
                                                    style="background:#3b82f6; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:0.75rem; font-weight:bold;">
                                                    Edit
                                                </button>
                                                <button onclick="deleteRecord('${dataType}', ${actualIndex})" 
                                                    style="background:#ef4444; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:0.75rem; font-weight:bold;">
                                                    Delete
                                                </button>
                                            ` : '<span style="color:#94a3b8;">Read-only access</span>'}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    }

    const viewerBanner = isViewerRole() ? `<div class="viewer-notice">Read-only viewer access is active. Editing, deleting, posting and downloads are disabled; report previews remain available.</div>` : '';
    display.innerHTML = viewerBanner + html + reportPreviewHtml + previewHtml;
    applyRoleRestrictions();
}

// --- 4. DATA CAPTURE FUNCTIONS ---
function saveFinancialMember() {
    if (!hasEditPermission()) {
        showModal('Permission Denied', 'Viewer accounts cannot register or edit members.');
        return;
    }
    const name = document.getElementById('mName').value;
    const phone = document.getElementById('mPhone').value;
    const role = document.getElementById('mRole').value;
    const cell = document.getElementById('mCell').value;
    const reg = document.getElementById('mReg').value;
    const monthly = document.getElementById('mContrib').value;

    if (name && phone) {
        const memberEntry = {
            name: name,
            phone: phone,
            role: role,
            cell: cell || "N/A",
            payments: { 
                registration: Number(reg) || 0,
                monthly: Number(monthly) || 0
            },
            dateJoined: editingRecord.type === 'members' && editingRecord.index !== null 
                ? churchData.members[editingRecord.index].dateJoined 
                : new Date().toLocaleDateString()
        };

        // Ensure financial totals are initialized
        if (typeof churchData.finances.special === 'undefined') {
            churchData.finances.special = 0;
        }
        if (typeof churchData.finances.tithes === 'undefined') {
            churchData.finances.tithes = 0;
        }
        if (typeof churchData.finances.registration === 'undefined') {
            churchData.finances.registration = 0;
        }

        const regAmount = Number(reg) || 0;
        const monthlyAmount = Number(monthly) || 0;

        // Check if we're editing an existing record
        if (editingRecord.type === 'members' && editingRecord.index !== null) {
            const existingMember = churchData.members[editingRecord.index];
            const oldRegistration = existingMember.payments?.registration || 0;
            const oldMonthly = existingMember.payments?.monthly || 0;

            churchData.members[editingRecord.index] = memberEntry;

            // Adjust treasury by the difference between new and old payment values
            churchData.finances.registration += regAmount - oldRegistration;
            churchData.finances.tithes += monthlyAmount - oldMonthly;

            showModal('Success', `Successfully updated ${name}`);
        } else {
            churchData.members.push(memberEntry);

            // Add registration and monthly contribution to treasury automatically
            churchData.finances.registration += regAmount;
            churchData.finances.tithes += monthlyAmount;

            showModal('Success', `Successfully registered ${name} as ${role}`);
        }

        persistData();
        cancelEdit();
        showModule('finance');
        
    } else {
        showModal('Error', 'Name and Phone Number are required.');
    }
}

function updateTreasury() {
    if (!hasEditPermission()) {
        showModal('Permission Denied', 'Viewer accounts cannot update treasury records.');
        return;
    }
    // 1. Capture and validate numbers (defaulting to 0 if empty)
    const t = Number(document.getElementById('tAmount').value) || 0;
    const o = Number(document.getElementById('oAmount').value) || 0;
    const s = Number(document.getElementById('sAmount').value) || 0;

    // 2. Prevent accidental empty updates
    if (t === 0 && o === 0 && s === 0) {
        showModal('Error', 'Please enter an amount before updating.');
        return;
    }

    // 3. Update global churchData
    churchData.finances.tithes += t;
    churchData.finances.offerings += o;
    
    // Ensure special exists before adding to it
    if (typeof churchData.finances.special === 'undefined') {
        churchData.finances.special = 0;
    }
    churchData.finances.special += s;

    // 4. Save and Refresh UI
    persistData();
    
    // 5. CRITICAL: Clear the input fields so they don't get submitted twice
    document.getElementById('tAmount').value = "";
    document.getElementById('oAmount').value = "";
    document.getElementById('sAmount').value = "";

    showModal('Success', 'Treasury records updated successfully.');
    showModule('finance');
}

function saveBulletin() {
    if (!hasEditPermission()) {
        showModal('Permission Denied', 'Viewer accounts cannot publish bulletins.');
        return;
    }
    const content = document.getElementById('bulletinContent').value;
    
    if (content.trim()) { // .trim() prevents saving empty spaces/lines
        churchData.bulletin = content;
        
        persistData(); 

        // 1. Instantly update the preview window if it exists on the page
        const preview = document.getElementById('bulletinPreview');
        if (preview) {
            preview.innerText = content;
        }

        showModal('Success', 'Bulletin has been saved and is ready for printing/distribution.');
        
        // 2. Refresh the module to ensure all UI elements are in sync
        showModule('commms'); 
    } else {
        showModal('Error', 'The bulletin is currently empty. Please type something before saving.');
    }
}

function saveDigitalStatus() {
    if (!hasEditPermission()) {
        showModal('Permission Denied', 'Viewer accounts cannot update media status.');
        return;
    }
    // 1. Check if elements exist to prevent script crashes
    const p1 = document.getElementById('p1');
    if (!p1) return; // Exit quietly if we aren't currently on the comms page

    const web = document.getElementById('webStatus').value;
    const focus = document.getElementById('fbFocus').value;
    
    // 2. Map and Store data
    churchData.digitalStats = {
        website: web,
        facebookFocus: focus || "General Updates",
        posts: [
            p1.checked,
            document.getElementById('p2').checked,
            document.getElementById('p3').checked,
            document.getElementById('p4').checked
        ],
        lastUpdated: new Date().toLocaleString()
    };
    
    persistData();
    showModal('Success', 'Digital platforms status updated!');

    // 3. Refresh to keep UI in sync
    showModule('commms');
}

function saveVolunteer() {
    if (!hasEditPermission()) {
        showModal('Permission Denied', 'Viewer accounts cannot add or edit volunteers.');
        return;
    }
    const nameInput = document.getElementById('vName');
    const deptInput = document.getElementById('vDept');
    const phoneInput = document.getElementById('vPhone');

    // 1. Validation: Prevent adding empty names
    if (!nameInput.value.trim()) {
        showModal('Error', 'Please enter a volunteer name.');
        return;
    }

    // 2. Create the record with a consistent structure
    const newVolunteer = {
        name: nameInput.value.trim(),
        dept: deptInput.value,
        phone: phoneInput.value.trim() || 'N/A',
        status: 'Active',
        dateAdded: editingRecord.type === 'volunteers' && editingRecord.index !== null
            ? churchData.volunteers[editingRecord.index].dateAdded
            : new Date().toLocaleDateString()
    };

    // 3. Check if we're editing an existing record
    if (editingRecord.type === 'volunteers' && editingRecord.index !== null) {
        churchData.volunteers[editingRecord.index] = newVolunteer;
        showModal('Success', `Successfully updated ${newVolunteer.name}`);
    } else {
        churchData.volunteers.push(newVolunteer);
        showModal('Success', `${newVolunteer.name} has been added to ${newVolunteer.dept}!`);
    }
    
    persistData();
    cancelEdit();
    showModule('hr');
}

function saveFacility() {
    if (!hasEditPermission()) {
        showModal('Permission Denied', 'Viewer accounts cannot update facility records.');
        return;
    }
    const type = document.getElementById('eqType').value;
    const picInput = document.getElementById('eqInCharge');
    const status = document.getElementById('eqCondition').value;
    const availInput = document.getElementById('eqAvailability');
    const dateInput = document.getElementById('maintDate');

    // 1. Validation: Ensure we have the critical tracking info
    const expenseValue = Number(document.getElementById('eqExpense').value) || 0;
    if (picInput.value.trim() && dateInput.value) {
        const newItem = { 
            type: type, 
            pic: picInput.value.trim(), 
            status: status, 
            avail: availInput.value.trim() || "In Church",
            date: dateInput.value,
            expense: expenseValue
        };

        if (typeof churchData.finances.expenses === 'undefined') {
            churchData.finances.expenses = 0;
        }

        if (editingRecord.type === 'maintenance' && editingRecord.index !== null) {
            const oldExpense = churchData.maintenance[editingRecord.index]?.expense || 0;
            churchData.finances.expenses += expenseValue - oldExpense;
            churchData.maintenance[editingRecord.index] = newItem;
            showModal('Success', `${type} status has been updated!`);
        } else {
            churchData.finances.expenses += expenseValue;
            churchData.maintenance.push(newItem);
            showModal('Success', `${type} status has been updated!`);
        }
        
        persistData();
        cancelEdit();
        showModule('facility');
        
    } else {
        showModal('Error', 'Please fill in the Person in Charge and Maintenance Date.');
    }
}

function saveService() {
    if (!hasEditPermission()) {
        showModal('Permission Denied', 'Viewer accounts cannot change service schedules.');
        return;
    }
    const type = document.getElementById('sFreq').value;
    const countInput = document.getElementById('sCount');
    const leaderInput = document.getElementById('sLeader');
    const orderInput = document.getElementById('sOrder');
    const timeInput = document.getElementById('sDateTime');

    // 1. Validation: Ensure required fields have actual text (not just spaces)
    if (leaderInput.value.trim() && timeInput.value && orderInput.value.trim()) {
        
        const newService = { 
            type: type, 
            count: countInput.value || "1",
            leader: leaderInput.value.trim(), 
            order: orderInput.value.trim(), 
            time: timeInput.value 
        };

        // 2. Check if we're editing an existing record
        if (editingRecord.type === 'services' && editingRecord.index !== null) {
            churchData.services[editingRecord.index] = newService;
            showModal('Success', `Schedule Updated: ${type} service is now live!`);
        } else {
            churchData.services.push(newService);
            showModal('Success', `Schedule Updated: ${type} service is now live!`);
        }
        
        persistData();
        cancelEdit();
        showModule('clergy');
        
    } else {
        showModal('Error', 'Please fill in Minister in Charge, Date/Time, and Order of Service.');
    }
}

function saveAnnouncement() {
    if (!hasEditPermission()) {
        showModal('Permission Denied', 'Viewer accounts cannot post or edit announcements.');
        return;
    }
    const textInput = document.getElementById('annText');
    const authorInput = document.getElementById('annBy');

    // 1. Validation: Ensure there is actually a message to post
    if (textInput.value.trim()) {
        
        // 2. Initialize the array if it doesn't exist (Safety Check)
        if (!churchData.announcements) {
            churchData.announcements = [];
        }

        // 3. Create the announcement object
        const newAnnouncement = { 
            text: textInput.value.trim(), 
            author: authorInput.value.trim() || "Church Admin",
            date: editingRecord.type === 'announcements' && editingRecord.index !== null
                ? churchData.announcements[editingRecord.index].date
                : new Date().toLocaleString()
        };

        // 4. Check if we're editing an existing record
        if (editingRecord.type === 'announcements' && editingRecord.index !== null) {
            churchData.announcements[editingRecord.index] = newAnnouncement;
            showModal('Success', 'Announcement Updated!');
        } else {
            churchData.announcements.push(newAnnouncement);
            showModal('Success', 'Announcement Posted! Media team notified.');
        }
        
        persistData();
        cancelEdit();
        showModule('clergy');
        
    } else {
        showModal('Error', 'Please enter the announcement text.');
    }
}

function downloadCSV(type) {
    if (isViewerRole()) {
        showModal('Access Denied', 'Download is disabled for viewer accounts. Please use preview only.');
        return;
    }

    // Helper function to safely escape CSV values
    const escapeCSV = (val) => {
        if (val === undefined || val === null) return '""';
        // Convert to string and escape double quotes by doubling them
        const stringVal = String(val).replace(/"/g, '""');
        return `"${stringVal}"`;
    };

    let csvHeader = "";
    let rows = [];

    if (type === 'members') {
        csvHeader = "Name,Phone,Role,Cell Group,Date Registered\n";
        rows = churchData.members.map(m => 
            `${escapeCSV(m.name)},${escapeCSV(m.phone)},${escapeCSV(m.role)},${escapeCSV(m.cell)},${escapeCSV(m.dateJoined)}`
        );
    } else if (type === 'volunteers') {
        csvHeader = "Name,Department,Status,Phone\n";
        rows = churchData.volunteers.map(v => 
            `${escapeCSV(v.name)},${escapeCSV(v.dept)},${escapeCSV(v.status)},${escapeCSV(v.phone || 'N/A')}`
        );
    } else if (type === 'finance') {
        csvHeader = "Category,Total Amount (KSh)\n";
        const expenses = churchData.finances.expenses || 0;
        const netTreasury = (churchData.finances.tithes || 0) + (churchData.finances.offerings || 0) + (churchData.finances.special || 0) + (churchData.finances.registration || 0) - expenses;
        rows = [
            `Registration Funds,${churchData.finances.registration || 0}`,
            `Tithes,${churchData.finances.tithes}`,
            `Offerings,${churchData.finances.offerings}`,
            `Special Funds,${churchData.finances.special || 0}`,
            `Facility Expenses,${expenses}`,
            `Net Treasury,${netTreasury}`
        ];
    }

    // Combine Header and Rows
    const csvString = csvHeader + rows.join("\n");

    // Create a BLOB with Byte Order Mark (BOM) to support Excel special characters
    const blob = new Blob(["\ufeff", csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Gideons_${type}_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup the URL to free up browser memory
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

function downloadAnnouncementsCSV() {
    if (isViewerRole()) {
        showModal('Access Denied', 'Download is disabled for viewer accounts. Please use preview only.');
        return;
    }

    const escapeCSV = (val) => {
        if (val === undefined || val === null) return '""';
        const stringVal = String(val).replace(/"/g, '""');
        return `"${stringVal}"`;
    };

    const header = 'Date,Author,Message\n';
    const rows = (churchData.announcements || []).map(item =>
        `${escapeCSV(item.date)},${escapeCSV(item.author)},${escapeCSV(item.text)}`
    );

    const csvString = header + rows.join('\n');
    const blob = new Blob(["\ufeff", csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Gideons_Announcements_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

function copyAnnouncementsToClipboard() {
    const announcements = (churchData.announcements || []).map((ann, index) =>
        `${index + 1}. ${ann.text}\n- ${ann.author} (${ann.date})`
    ).join('\n\n');

    if (!announcements) {
        showModal('Info', 'There are no announcements to copy.');
        return;
    }

    navigator.clipboard.writeText(announcements)
        .then(() => showModal('Success', 'Announcements copied to clipboard.'))
        .catch(() => showModal('Error', 'Could not copy announcements.'));
}

function shareAnnouncementsEmail() {
    const announcements = (churchData.announcements || []).map((ann, index) =>
        `${index + 1}. ${ann.text} - ${ann.author} (${ann.date})`
    ).join('\n\n');

    if (!announcements) {
        showModal('Info', 'There are no announcements to email.');
        return;
    }

    const subject = encodeURIComponent('Gideons Announcements');
    const body = encodeURIComponent(announcements);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

function deleteRecord(type, actualIndex) {
    if (!hasEditPermission()) {
        showModal('Permission Denied', 'Viewer accounts cannot delete records.');
        return;
    }
    // 1. Double-check that the record exists at that index
    if (!churchData[type] || churchData[type][actualIndex] === undefined) {
        showModal('Error', 'Record not found.');
        return;
    }

    const recordName = churchData[type][actualIndex].name || churchData[type][actualIndex].type || "this item";

    // 2. Clear confirmation including the name of the item
    if (confirm(`Are you sure you want to permanently delete "${recordName}"? This cannot be undone.`)) {
        
        // 3. Remove from the array
        churchData[type].splice(actualIndex, 1);
        
        // 4. Save the change
        persistData();
        
        // 5. Map the internal data key to the UI module name
        const moduleMap = {
            'members': 'finance',
            'volunteers': 'hr',
            'maintenance': 'facility',
            'services': 'clergy',
            'announcements': 'clergy' // Added this in case you delete announcements
        };
        
        // 6. Refresh the UI
        const targetModule = moduleMap[type] || 'home';
        showModule(targetModule);
        
        showModal('Success', 'Record deleted successfully.');
    }
}

// Initialize authentication on page load
initAuth();