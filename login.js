const API_BASE_URL = 'http://localhost:3000/api';

// DOM Elements
const visitorBtn = document.getElementById('visitorBtn');
const adminBtn = document.getElementById('adminBtn');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminSignupForm = document.getElementById('adminSignupForm');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const backBtn = document.getElementById('backBtn');
const signupPrompt = document.getElementById('signupPrompt');
const showSignupLink = document.getElementById('showSignupLink');
const backToLoginLink = document.getElementById('backToLoginLink');

// Event Listeners
visitorBtn.addEventListener('click', () => {
    sessionStorage.setItem('fromLogin', 'true');
    window.location.href = 'index.html';
});

adminBtn.addEventListener('click', () => {
    showAdminLogin();
});

backBtn.addEventListener('click', () => {
    hideAllForms();
    backBtn.parentElement.style.display = 'none';
});

loginForm.addEventListener('submit', handleLogin);
signupForm.addEventListener('submit', handleSignup);
showSignupLink.addEventListener('click', showAdminSignup);
backToLoginLink.addEventListener('click', showAdminLogin);

// Functions
function showAdminLogin() {
    hideAllForms();
    adminLoginForm.style.display = 'block';
    backBtn.parentElement.style.display = 'block';
    checkAdminExists();
}

function showAdminSignup() {
    hideAllForms();
    adminSignupForm.style.display = 'block';
    backBtn.parentElement.style.display = 'block';
}

function hideAllForms() {
    adminLoginForm.style.display = 'none';
    adminSignupForm.style.display = 'none';
}

async function checkAdminExists() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/check`);
        const data = await response.json();
        if (!data.exists) {
            signupPrompt.style.display = 'block';
        } else {
            signupPrompt.style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking admin existence:', error);
        signupPrompt.style.display = 'block'; // Show signup option on error
    }
}

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store admin session
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminName', data.admin.name);
            // Redirect to admin dashboard
            window.location.href = 'admin.html';
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

async function handleSignup(e) {
    e.preventDefault();

    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const name = document.getElementById('adminName').value.trim();
    const email = document.getElementById('adminEmail').value.trim();

    // Validation
    if (!username || !password || !confirmPassword || !name || !email) {
        alert('Please fill in all fields');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password, name, email })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Admin account created successfully! You can now login.');
            showAdminLogin();
        } else {
            alert(data.error || 'Signup failed');
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('Signup failed. Please try again.');
    }
}

// Check if admin is already logged in
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        // Redirect to admin dashboard if already logged in
        window.location.href = 'admin.html';
    }
});