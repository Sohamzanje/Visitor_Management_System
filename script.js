
const visitorForm = document.getElementById('visitorForm');
const tableBody = document.getElementById('tableBody');
const API_BASE_URL = 'http://localhost:3000/api';
const visitorIdInput = document.getElementById('visitorId');
const submitButton = document.getElementById('submitButton');
const cancelEditButton = document.getElementById('cancelEditButton');
let isEditing = false;

// Load visitors from database
async function loadVisitors() {
    try {
        const response = await fetch(`${API_BASE_URL}/visitors`);
        if (!response.ok) {
            throw new Error('Failed to load visitors');
        }
        const visitors = await response.json();
        renderTable(visitors);
    } catch (error) {
        console.error('Error loading visitors:', error);
        tableBody.innerHTML = '<tr class="no-data"><td colspan="9">Error loading visitors. Please check if the server is running.</td></tr>';
    }
}

function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function setCurrentCheckInTime() {
    const checkInField = document.getElementById('checkInTime');
    if (checkInField) {
        checkInField.value = getCurrentTime();
    }
}

function updateCheckInTimePeriodically() {
    setCurrentCheckInTime();
    // Update every minute to keep the time current
    setTimeout(updateCheckInTimePeriodically, 60000);
}

function validateForm() {
    let isValid = true;
    const errors = [];

    // Name validation
    const name = document.getElementById('name').value.trim();
    if (!name) {
        errors.push('Full Name is required.');
        isValid = false;
    } else if (name.length < 2) {
        errors.push('Full Name must be at least 2 characters long.');
        isValid = false;
    }

    // Phone validation
    const phone = document.getElementById('phone').value.trim();
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phone) {
        errors.push('Phone Number is required.');
        isValid = false;
    } else if (!phoneRegex.test(phone)) {
        errors.push('Please enter a valid phone number.');
        isValid = false;
    }

    // Email validation
    const email = document.getElementById('email').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
        errors.push('Email is required.');
        isValid = false;
    } else if (!emailRegex.test(email)) {
        errors.push('Please enter a valid email address.');
        isValid = false;
    }

    // Purpose validation
    const purpose = document.getElementById('purpose').value;
    if (!purpose) {
        errors.push('Purpose of Visit is required.');
        isValid = false;
    }

    // Visit Date validation
    const visitDate = document.getElementById('visitDate').value;
    if (!visitDate) {
        errors.push('Date of Visit is required.');
        isValid = false;
    } else {
        const today = new Date().toISOString().split('T')[0];
        if (visitDate < today) {
            errors.push('Date of Visit cannot be in the past.');
            isValid = false;
        }
    }

    // Check-In Time validation
    const checkInTime = document.getElementById('checkInTime').value;
    if (!checkInTime) {
        errors.push('Check-In Time is required.');
        isValid = false;
    }

    if (!isValid) {
        alert('Please fix the following errors:\n' + errors.join('\n'));
    }

    return isValid;
}

function renderTable(visitors) {
    tableBody.innerHTML = '';
    if (visitors.length === 0) {
        tableBody.innerHTML = '<tr class="no-data"><td colspan="9">No visitors yet.</td></tr>';
        return;
    }

    visitors.forEach((visitor) => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>${visitor.name}</td>
                    <td>${visitor.phone}</td>
                    <td>${visitor.email}</td>
                    <td>${visitor.company || ''}</td>
                    <td>${visitor.purpose}</td>
                    <td>${visitor.visit_date}</td>
                    <td>${visitor.check_in_time}</td>
                    <td>${visitor.remarks || ''}</td>
                    <td>
                        <button class="btn-edit" onclick="editVisitor(${visitor.id})">Edit</button>
                        <button class="btn-delete" onclick="deleteVisitor(${visitor.id})">Delete</button>
                    </td>
                `;
        tableBody.appendChild(row);
    });
}

visitorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setCurrentCheckInTime();

    if (!validateForm()) {
        return;
    }

    const visitor = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        company: document.getElementById('company').value.trim(),
        purpose: document.getElementById('purpose').value,
        visitDate: document.getElementById('visitDate').value,
        checkInTime: document.getElementById('checkInTime').value,
        remarks: document.getElementById('remarks').value.trim()
    };

    try {
        const url = isEditing ? `${API_BASE_URL}/visitors/${visitorIdInput.value}` : `${API_BASE_URL}/visitors`;
        const method = isEditing ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(visitor)
        });

        if (!response.ok) {
            throw new Error(isEditing ? 'Failed to update visitor' : 'Failed to add visitor');
        }

        const result = await response.json();
        resetForm();
        loadVisitors(); // Reload the table
        alert(isEditing ? 'Visitor updated successfully!' : 'Visitor added successfully!');
    } catch (error) {
        console.error(isEditing ? 'Error updating visitor:' : 'Error adding visitor:', error);
        alert('Error saving visitor. Please check if the server is running.');
    }
});

cancelEditButton.addEventListener('click', () => {
    resetForm();
});

function resetForm() {
    visitorForm.reset();
    visitorIdInput.value = '';
    isEditing = false;
    submitButton.textContent = 'Add Visitor';
    cancelEditButton.style.display = 'none';
}

function populateForm(visitor) {
    document.getElementById('name').value = visitor.name;
    document.getElementById('phone').value = visitor.phone;
    document.getElementById('email').value = visitor.email;
    document.getElementById('company').value = visitor.company || '';
    document.getElementById('purpose').value = visitor.purpose;
    document.getElementById('visitDate').value = visitor.visit_date;
    // Set current time for check-in when editing (automatic system time)
    setCurrentCheckInTime();
    document.getElementById('remarks').value = visitor.remarks || '';
    visitorIdInput.value = visitor.id;
    isEditing = true;
    submitButton.textContent = 'Update Visitor';
    cancelEditButton.style.display = 'inline-block';
}

window.editVisitor = async function(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/visitors`);
        if (!response.ok) {
            throw new Error('Failed to load visitors');
        }
        const visitors = await response.json();
        const visitor = visitors.find((v) => v.id === id);
        if (!visitor) {
            alert('Visitor not found');
            return;
        }
        populateForm(visitor);
    } catch (error) {
        console.error('Error fetching visitor for edit:', error);
        alert('Error loading visitor. Please try again.');
    }
};

async function deleteVisitor(id) {
    if (!confirm('Are you sure you want to delete this visitor?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/visitors/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete visitor');
        }

        loadVisitors(); // Reload the table
        alert('Visitor deleted successfully!');
    } catch (error) {
        console.error('Error deleting visitor:', error);
        alert('Error deleting visitor. Please check if the server is running.');
    }
}

setCurrentCheckInTime();
resetForm();
loadVisitors();

// Start periodic time updates
updateCheckInTimePeriodically();

// Check if there's an edit visitor from admin
const editVisitorData = localStorage.getItem('editVisitor');
if (editVisitorData) {
    const visitor = JSON.parse(editVisitorData);
    localStorage.removeItem('editVisitor');
    populateForm(visitor);
}