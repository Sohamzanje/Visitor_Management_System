
const visitorForm = document.getElementById('visitorForm');
const tableBody = document.getElementById('tableBody');
let visitors = JSON.parse(localStorage.getItem('visitors')) || [];

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

    if (!isValid) {
        alert('Please fix the following errors:\n' + errors.join('\n'));
    }

    return isValid;
}

function renderTable() {
    tableBody.innerHTML = '';
    if (visitors.length === 0) {
        tableBody.innerHTML = '<tr class="no-data"><td colspan="8">No visitors yet.</td></tr>';
        return;
    }

    visitors.forEach((visitor, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>${visitor.name}</td>
                    <td>${visitor.phone}</td>
                    <td>${visitor.email}</td>
                    <td>${visitor.company}</td>
                    <td>${visitor.purpose}</td>
                    <td>${visitor.visitDate}</td>
                    <td>${visitor.remarks}</td>
                    <td><button class="btn-delete" onclick="deleteVisitor(${index})">Delete</button></td>
                `;
        tableBody.appendChild(row);
    });
}

visitorForm.addEventListener('submit', (e) => {
    e.preventDefault();

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
        remarks: document.getElementById('remarks').value.trim()
    };

    visitors.push(visitor);
    localStorage.setItem('visitors', JSON.stringify(visitors));
    visitorForm.reset();
    renderTable();
    alert('Visitor added successfully!');
});

function deleteVisitor(index) {
    if (confirm('Are you sure?')) {
        visitors.splice(index, 1);
        localStorage.setItem('visitors', JSON.stringify(visitors));
        renderTable();
    }
}

renderTable();