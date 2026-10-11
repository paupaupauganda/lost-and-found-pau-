// Auto-generate Item ID on load
document.addEventListener('DOMContentLoaded', () => {
    generateItemId();
    loadItems();
    setupSearchFilter();
});

// Generate unique ID
function generateItemId() {
    const now = new Date();
    const id = `ITEM-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(Math.floor(Math.random()*9999)).padStart(4,'0')}`;
    document.getElementById('itemId').value = id;
}

// Get items from localStorage
function getItems() {
    return JSON.parse(localStorage.getItem('lostFoundItems')) || [];
}

// Save items to localStorage
function saveItems(items) {
    localStorage.setItem('lostFoundItems', JSON.stringify(items));
}

// Add new item
document.getElementById('itemForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const items = getItems();
    const existingId = document.getElementById('itemId').value;
    const existingIndex = items.findIndex(i => i.id === existingId);

    if (existingIndex !== -1) {
        // EDIT MODE — keep original status & claim info
        const originalStatus = items[existingIndex].status;
        const originalClaimer = items[existingIndex].claimerName;
        const originalClaimerContact = items[existingIndex].claimerContact;
        const originalDateClaimed = items[existingIndex].dateClaimed;

        items[existingIndex] = {
            id: existingId,
            dateTime: document.getElementById('dateTime').value,
            itemName: document.getElementById('itemName').value,
            location: document.getElementById('location').value,
            status: originalStatus, // PROTECTED — hindi mababago
            contact: document.getElementById('contact').value || '-',
            claimerName: originalClaimer, // PROTECTED
            claimerContact: originalClaimerContact, // PROTECTED
            dateClaimed: originalDateClaimed // PROTECTED
        };
        showNotification('Item updated! Status protected ✅');
    } else {
        // ADD NEW MODE
        const newItem = {
            id: existingId,
            dateTime: document.getElementById('dateTime').value,
            itemName: document.getElementById('itemName').value,
            location: document.getElementById('location').value,
            status: document.getElementById('status').value,
            contact: document.getElementById('contact').value || '-',
            claimerName: '-',
            claimerContact: '-',
            dateClaimed: '-'
        };
        items.unshift(newItem);
        showNotification('Item added successfully! ✅');
    }

    saveItems(items);
    renderItems();
    e.target.reset();
    generateItemId();
});

// Claim item
document.getElementById('claimForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const itemId = document.getElementById('claimItemId').value.trim();
    const items = getItems();
    const itemIndex = items.findIndex(i => i.id === itemId);

    if (itemIndex === -1) {
        alert('Item ID not found! ❌');
        return;
    }

    if (items[itemIndex].status === 'Claimed') {
        alert('This item is already claimed! ⚠️');
        return;
    }

    items[itemIndex].status = 'Claimed';
    items[itemIndex].claimerName = document.getElementById('claimerName').value;
    items[itemIndex].claimerContact = document.getElementById('claimerContact').value;
    items[itemIndex].dateClaimed = document.getElementById('dateClaimed').value;

    saveItems(items);
    renderItems();
    e.target.reset();
    showNotification('Item marked as Claimed! 🎉');
});

// Render table — DELETE BUTTON REMOVED
function renderItems(filteredItems = null) {
    const tbody = document.getElementById('itemsBody');
    const items = filteredItems || getItems();
    const noRecords = document.getElementById('noRecords');

    tbody.innerHTML = '';

    if (items.length === 0) {
        noRecords.style.display = 'block';
        return;
    }
    noRecords.style.display = 'none';

    items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDateTime(item.dateTime)}</td>
            <td><strong>${item.id}</strong></td>
            <td>${item.itemName}</td>
            <td>${item.location}</td>
            <td><span class="status-tag status-${item.status}">${item.status}</span></td>
            <td>
                ${item.claimerName !== '-' ? 
                    `<strong>${item.claimerName}</strong><br>${item.claimerContact}<br>${formatDateTime(item.dateClaimed)}` 
                    : 'Not claimed yet'}
            </td>
            <td>
                <button class="btn action-btn edit-btn" data-id="${item.id}">Edit</button>
                <!-- DELETE BUTTON REMOVED -->
            </td>
        `;
        tbody.appendChild(row);
    });

    attachActionListeners();
}

// Format date for display
function formatDateTime(dt) {
    if (!dt || dt === '-') return '-';
    return new Date(dt).toLocaleString('en-PH', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// Load items on start
function loadItems() {
    renderItems();
}

// Search & Filter
function setupSearchFilter() {
    const searchInput = document.getElementById('searchInput');
    const filterStatus = document.getElementById('filterStatus');

    const filter = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const statusVal = filterStatus.value;
        let items = getItems();

        items = items.filter(item => {
            const matchSearch = 
                item.itemName.toLowerCase().includes(searchTerm) ||
                item.location.toLowerCase().includes(searchTerm) ||
                item.id.toLowerCase().includes(searchTerm);
            const matchStatus = statusVal === 'All' || item.status === statusVal;
            return matchSearch && matchStatus;
        });

        renderItems(items);
    };

    searchInput.addEventListener('input', filter);
    filterStatus.addEventListener('change', filter);
}

// Edit actions — load data to form, status locked
function attachActionListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const items = getItems();
            const item = items.find(i => i.id === btn.dataset.id);
            if (!item) return;

            // Fill form for editing
            document.getElementById('dateTime').value = item.dateTime;
            document.getElementById('itemId').value = item.id;
            document.getElementById('itemName').value = item.itemName;
            document.getElementById('location').value = item.location;
            document.getElementById('contact').value = item.contact === '-' ? '' : item.contact;

            // Status dropdown DISABLED when editing
            const statusSelect = document.getElementById('status');
            statusSelect.value = item.status === 'Claimed' ? 'Found' : item.status;
            statusSelect.disabled = true; // LOCKED — hindi mababago

            document.getElementById('itemForm').scrollIntoView({ behavior: 'smooth' });
            showNotification('Editing — Status is locked 🔒');
        });
    });
}

// Export to CSV
document.getElementById('exportBtn').addEventListener('click', () => {
    const items = getItems();
    if (items.length === 0) {
        alert('No records to export!');
        return;
    }

    const headers = ['Date & Time', 'Item ID', 'Item Name', 'Location Found', 'Status', 'Contact (Reporter)', 'Claimer Name', 'Claimer Contact', 'Date Claimed'];
    const rows = items.map(i => [
        i.dateTime, i.id, i.itemName, i.location, i.status, i.contact,
        i.claimerName, i.claimerContact, i.dateClaimed
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LostAndFound_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('CSV file downloaded! 📂');
});

// Simple notification
function showNotification(msg) {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: #1f2937; color: white;
        padding: 12px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000; animation: slideIn 0.3s ease;
    `;
    notif.textContent = msg;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

// Add animation style
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);