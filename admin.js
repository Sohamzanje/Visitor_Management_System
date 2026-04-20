const API_BASE_URL = 'http://localhost:3000/api';

// DOM Elements
const adminNameSpan = document.getElementById('adminName');
const logoutBtn = document.getElementById('logoutBtn');
const refreshBtn = document.getElementById('refreshBtn');
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const filterPurpose = document.getElementById('filterPurpose');
const totalVisitorsSpan = document.getElementById('totalVisitors');
const todayVisitorsSpan = document.getElementById('todayVisitors');
const weekVisitorsSpan = document.getElementById('weekVisitors');

let allVisitors = [];

// Check authentication on page load
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    const adminName = localStorage.getItem('adminName');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    adminNameSpan.textContent = `Welcome, ${adminName}`;
    loadVisitors();
});

// Event Listeners
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminName');
    window.location.href = 'login.html';
});

refreshBtn.addEventListener('click', () => {
    loadVisitors();
});

searchInput.addEventListener('input', filterVisitors);
filterPurpose.addEventListener('change', filterVisitors);

// Functions
async function loadVisitors() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/admin/visitors`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminName');
            window.location.href = 'login.html';
            return;
        }

        if (!response.ok) {
            throw new Error('Failed to load visitors');
        }

        allVisitors = await response.json();
        updateStats();
        renderTable(allVisitors);
    } catch (error) {
        console.error('Error loading visitors:', error);
        tableBody.innerHTML = '<tr class="no-data"><td colspan="11">Error loading visitors. Please try again.</td></tr>';
    }
}

function updateStats() {
    const total = allVisitors.length;
    const today = new Date().toISOString().split('T')[0];
    const todayCount = allVisitors.filter(v => v.visit_date === today).length;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekCount = allVisitors.filter(v => new Date(v.visit_date) >= weekAgo).length;

    totalVisitorsSpan.textContent = total;
    todayVisitorsSpan.textContent = todayCount;
    weekVisitorsSpan.textContent = weekCount;
}

function filterVisitors() {
    const searchTerm = searchInput.value.toLowerCase();
    const purposeFilter = filterPurpose.value;

    let filtered = allVisitors;

    if (searchTerm) {
        filtered = filtered.filter(visitor =>
            visitor.name.toLowerCase().includes(searchTerm) ||
            visitor.email.toLowerCase().includes(searchTerm) ||
            visitor.company.toLowerCase().includes(searchTerm) ||
            visitor.phone.includes(searchTerm)
        );
    }

    if (purposeFilter) {
        filtered = filtered.filter(visitor => visitor.purpose === purposeFilter);
    }

    renderTable(filtered);
}

function renderTable(visitors) {
    tableBody.innerHTML = '';
    if (visitors.length === 0) {
        tableBody.innerHTML = '<tr class="no-data"><td colspan="11">No visitors found.</td></tr>';
        return;
    }

    visitors.forEach((visitor) => {
        const row = document.createElement('tr');
        const createdDate = new Date(visitor.created_at).toLocaleDateString();
        const createdTime = new Date(visitor.created_at).toLocaleTimeString();

        row.innerHTML = `
            <td>${visitor.id}</td>
            <td>${visitor.name}</td>
            <td>${visitor.phone}</td>
            <td>${visitor.email}</td>
            <td>${visitor.company || ''}</td>
            <td>${visitor.purpose}</td>
            <td>${visitor.visit_date}</td>
            <td>${visitor.check_in_time}</td>
            <td>${visitor.remarks || ''}</td>
            <td>${createdDate} ${createdTime}</td>
            <td>
                <button class="btn-edit" onclick="editVisitor(${visitor.id})">Edit</button>
                <button class="btn-delete" onclick="deleteVisitor(${visitor.id})">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

window.editVisitor = async function(id) {
    const visitor = allVisitors.find(v => v.id === id);
    if (!visitor) {
        alert('Visitor not found');
        return;
    }

    // For now, redirect to the main form with edit functionality
    // In a full implementation, you might want a modal or separate edit page
    localStorage.setItem('editVisitor', JSON.stringify(visitor));
    window.location.href = 'index.html';
};

window.deleteVisitor = async function(id) {
    if (!confirm('Are you sure you want to delete this visitor?')) {
        return;
    }

    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/admin/visitors/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete visitor');
        }

        loadVisitors(); // Reload the table
        alert('Visitor deleted successfully!');
    } catch (error) {
        console.error('Error deleting visitor:', error);
        alert('Error deleting visitor. Please try again.');
    }
};