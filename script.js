// ============================================
// STATE MANAGEMENT
// ============================================
let expenses = [];

// ============================================
// DOM ELEMENT REFERENCES
// ============================================
const amountInput = document.getElementById('amount');
const descriptionInput = document.getElementById('description');
const categorySelect = document.getElementById('category');
const dateInput = document.getElementById('date');
const addBtn = document.getElementById('addBtn');
const exportBtn = document.getElementById('exportBtn');
const generateQRBtn = document.getElementById('generateQRBtn');
const importQRBtn = document.getElementById('importQRBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const expenseList = document.getElementById('expenseList');
const filterCategory = document.getElementById('filterCategory');
const errorMessage = document.getElementById('errorMessage');
const totalAmount = document.getElementById('totalAmount');
const totalCount = document.getElementById('totalCount');
const highestCategory = document.getElementById('highestCategory');

// Modal elements
const qrModal = document.getElementById('qrModal');
const importModal = document.getElementById('importModal');
const closeModal = document.getElementById('closeModal');
const closeImportModal = document.getElementById('closeImportModal');
const qrCodeContainer = document.getElementById('qrCodeContainer');
const downloadQRBtn = document.getElementById('downloadQRBtn');
const qrFileInput = document.getElementById('qrFileInput');
const importStatus = document.getElementById('importStatus');

// Form overlay elements (mobile)
const fabBtn = document.getElementById('fabBtn');
const formOverlay = document.getElementById('formOverlay');
const closeForm = document.getElementById('closeForm');
const addExpenseForm = document.querySelector('.add-expense');

// ============================================
// INITIALIZATION
// ============================================
// Set today's date as default when page loads
dateInput.valueAsDate = new Date();

// ============================================
// LOCALSTORAGE FUNCTIONS
// ============================================

/**
 * Load expenses from LocalStorage
 * Called when page loads to restore previous data
 */
function loadExpenses() {
    const stored = localStorage.getItem('expenses');
    if (stored) {
        try {
            expenses = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading expenses:', error);
            expenses = [];
        }
    }
    renderExpenses();
    updateSummary();
}

/**
 * Save current expenses array to LocalStorage
 * Called whenever expenses array is modified
 */
function saveExpenses() {
    try {
        localStorage.setItem('expenses', JSON.stringify(expenses));
    } catch (error) {
        console.error('Error saving expenses:', error);
        showError('Failed to save data. Storage might be full.');
    }
}

// ============================================
// UI HELPER FUNCTIONS
// ============================================

/**
 * Display error message to user
 * @param {string} message - Error message to display
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // Auto-hide error message after 3 seconds
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 3000);
}

/**
 * Format date string to readable format
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date like "26 Jan 2025"
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    });
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate user input before adding expense
 * @returns {boolean} True if all inputs are valid
 */
function validateInput() {
    const amount = parseFloat(amountInput.value);
    const description = descriptionInput.value.trim();

    // Check if amount is valid and positive
    if (!amount || amount <= 0) {
        showError('Please enter a valid amount greater than 0');
        return false;
    }

    // Check if description is provided
    if (!description) {
        showError('Please enter a description');
        return false;
    }

    // Check if date is selected
    if (!dateInput.value) {
        showError('Please select a date');
        return false;
    }

    return true;
}

// ============================================
// CORE EXPENSE FUNCTIONS
// ============================================

/**
 * Add new expense to the list
 * Validates input, creates expense object, and updates UI
 */
function addExpense() {
    // Validate all inputs first
    if (!validateInput()) return;

    // Create expense object
    const expense = {
        id: Date.now(), // Unique ID based on timestamp
        amount: parseFloat(amountInput.value),
        description: descriptionInput.value.trim(),
        category: categorySelect.value,
        date: dateInput.value
    };

    // Add to beginning of array (newest first)
    expenses.unshift(expense);
    
    // Save to LocalStorage
    saveExpenses();
    
    // Update UI
    renderExpenses();
    updateSummary();
    clearForm();
    
    // Close form on mobile after adding
    closeAddForm();
}

/**
 * Delete expense by ID
 * @param {number} id - Unique identifier of expense to delete
 */
function deleteExpense(id) {
    // Confirm before deleting
    if (confirm('Are you sure you want to delete this expense?')) {
        // Filter out the expense with matching ID
        expenses = expenses.filter(expense => expense.id !== id);
        
        // Save updated list
        saveExpenses();
        
        // Update UI
        renderExpenses();
        updateSummary();
    }
}

/**
 * Clear the input form after successful addition
 */
function clearForm() {
    amountInput.value = '';
    descriptionInput.value = '';
    categorySelect.value = 'food';
    dateInput.valueAsDate = new Date();
    amountInput.focus(); // Focus back to amount field
}

/**
 * Open add expense form (mobile)
 */
function openAddForm() {
    addExpenseForm.classList.add('active');
    formOverlay.classList.add('active');
    document.body.classList.add('modal-open');
    amountInput.focus();
}

/**
 * Close add expense form (mobile)
 */
function closeAddForm() {
    addExpenseForm.classList.remove('active');
    formOverlay.classList.remove('active');
    document.body.classList.remove('modal-open');
}

/**
 * Clear all expenses from the list
 */
function clearAllExpenses() {
    // Check if there are expenses to clear
    if (expenses.length === 0) {
        showError('No expenses to clear');
        return;
    }

    // Confirm before clearing all data
    if (confirm('Are you sure you want to delete ALL expenses? This cannot be undone.')) {
        expenses = [];
        saveExpenses();
        renderExpenses();
        updateSummary();
    }
}

/**
 * Export expenses to Excel (.xlsx) file
 * Pure JavaScript implementation without external libraries
 */
function exportToExcel() {
    console.log('Export button clicked!'); // Debug log
    
    // Check if there are expenses to export
    if (expenses.length === 0) {
        showError('No expenses to export');
        return;
    }

    console.log('Exporting', expenses.length, 'expenses'); // Debug log

    // Prepare data rows
    const rows = [];
    
    // Add header row
    rows.push(['Date', 'Description', 'Category', 'Amount (₹)']);
    
    // Add expense data
    expenses.forEach(expense => {
        const categoryName = categorySelect.querySelector(`option[value="${expense.category}"]`).textContent;
        rows.push([
            formatDate(expense.date),
            expense.description,
            categoryName,
            expense.amount.toFixed(2)
        ]);
    });
    
    // Add summary row
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    rows.push([]);
    rows.push(['TOTAL', '', '', total.toFixed(2)]);

    // Convert to Excel XML format
    let xml = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
    xml += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
    xml += '<Worksheet ss:Name="Expenses"><Table>';
    
    rows.forEach((row, rowIndex) => {
        xml += '<Row>';
        row.forEach((cell, cellIndex) => {
            // Header row styling
            if (rowIndex === 0) {
                xml += '<Cell><Data ss:Type="String"><b>' + cell + '</b></Data></Cell>';
            }
            // Total row styling
            else if (rowIndex === rows.length - 1) {
                xml += '<Cell><Data ss:Type="' + (cellIndex === 3 ? 'Number' : 'String') + '"><b>' + cell + '</b></Data></Cell>';
            }
            // Regular data
            else {
                const type = cellIndex === 3 ? 'Number' : 'String';
                xml += '<Cell><Data ss:Type="' + type + '">' + cell + '</Data></Cell>';
            }
        });
        xml += '</Row>';
    });
    
    xml += '</Table></Worksheet></Workbook>';

    // Create blob and download
    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    
    // Generate filename with current date
    const today = new Date();
    const filename = `Expenses_${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2,'0')}-${today.getDate().toString().padStart(2,'0')}.xls`;
    
    // Try multiple download methods for better compatibility
    if (window.navigator.msSaveOrOpenBlob) {
        // For IE/Edge
        window.navigator.msSaveOrOpenBlob(blob, filename);
    } else {
        // For modern browsers
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);
    }
    
    console.log('Export completed!'); // Debug log
}

// ============================================
// QR CODE SYNC FUNCTIONS
// ============================================

/**
 * Generate QR Code with all expense data
 */
function generateQRCode() {
    console.log('Generate QR clicked!'); // Debug log
    
    if (expenses.length === 0) {
        showError('No expenses to export via QR code');
        return;
    }

    // Clear previous QR code
    qrCodeContainer.innerHTML = '';

    // Compress data for QR code - use minimal format
    const compressedData = expenses.map(e => [
        e.id,
        e.amount,
        e.description,
        e.category,
        e.date
    ]);

    // Convert to compact JSON string
    const dataString = JSON.stringify(compressedData);

    console.log('Original expenses:', expenses.length);
    console.log('Data size:', dataString.length, 'characters');

    // QR Code capacity with Low error correction: ~2953 chars
    // With Medium: ~2331 chars
    // We'll use Low for maximum capacity
    if (dataString.length > 2900) {
        const estimatedCapacity = Math.floor((2900 / dataString.length) * expenses.length);
        showError(`Too much data for QR code (${expenses.length} expenses). Maximum ~${estimatedCapacity} expenses supported. Try exporting by date range or use Excel export.`);
        return;
    }

    // Generate QR code with Low error correction for maximum data
    const qr = new QRCode(qrCodeContainer, {
        text: dataString,
        width: 300,
        height: 300,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.L // Low = maximum data capacity
    });

    console.log('QR code generated successfully!');

    // Show modal
    qrModal.style.display = 'block';
    document.body.classList.add('modal-open');
}

/**
 * Download QR code as image
 */
function downloadQRCode() {
    const canvas = qrCodeContainer.querySelector('canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    const today = new Date();
    const filename = `ExpenseQR_${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2,'0')}-${today.getDate().toString().padStart(2,'0')}.png`;
    
    link.download = filename;
    link.href = canvas.toDataURL();
    link.click();
}

/**
 * Open import QR modal
 */
function openImportModal() {
    importModal.style.display = 'block';
    document.body.classList.add('modal-open');
    importStatus.style.display = 'none';
    qrFileInput.value = '';
}

/**
 * Process uploaded QR code image
 */
function processQRImage(file) {
    if (!file || !file.type.startsWith('image/')) {
        showImportError('Please select a valid image file');
        return;
    }

    const reader = new FileReader();
    
    reader.onload = function(e) {
        const img = new Image();
        
        img.onload = function() {
            // Create canvas to read image data
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Decode QR code
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                try {
                    // Parse JSON data
                    const importedData = JSON.parse(code.data);
                    
                    // Check if it's compressed format (array of arrays) or old format (array of objects)
                    let importedExpenses;
                    
                    if (Array.isArray(importedData[0])) {
                        // Compressed format - decompress to full expense objects
                        importedExpenses = importedData.map(e => ({
                            id: e[0],
                            amount: e[1],
                            description: e[2],
                            category: e[3],
                            date: e[4]
                        }));
                    } else {
                        // Old format - already objects
                        importedExpenses = importedData;
                    }
                    
                    // Validate data structure
                    if (!Array.isArray(importedExpenses)) {
                        throw new Error('Invalid data format');
                    }

                    // Confirm before importing
                    const confirmMsg = `Found ${importedExpenses.length} expenses. Import and merge with existing data?`;
                    if (confirm(confirmMsg)) {
                        // Merge with existing expenses (avoid duplicates by ID)
                        const existingIds = new Set(expenses.map(e => e.id));
                        const newExpenses = importedExpenses.filter(e => !existingIds.has(e.id));
                        
                        expenses = [...expenses, ...newExpenses];
                        saveExpenses();
                        renderExpenses();
                        updateSummary();
                        
                        showImportSuccess(`Successfully imported ${newExpenses.length} new expenses!`);
                        
                        setTimeout(() => {
                            importModal.style.display = 'none';
                            document.body.classList.remove('modal-open');
                        }, 2000);
                    }
                } catch (error) {
                    console.error('QR decode error:', error);
                    showImportError('Invalid QR code data. Please use a QR code generated by this app.');
                }
            } else {
                showImportError('No QR code found in image. Please try again.');
            }
        };
        
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

/**
 * Show import success message
 */
function showImportSuccess(message) {
    importStatus.textContent = message;
    importStatus.className = 'success';
}

/**
 * Show import error message
 */
function showImportError(message) {
    importStatus.textContent = message;
    importStatus.className = 'error';
}

// ============================================
// RENDERING FUNCTIONS
// ============================================

/**
 * Render expense list to the DOM
 * Applies category filter if selected
 */
function renderExpenses() {
    // Get current filter value
    const filter = filterCategory.value;
    
    // Filter expenses based on selected category
    const filtered = filter === 'all' 
        ? expenses 
        : expenses.filter(e => e.category === filter);

    // Handle empty state
    if (filtered.length === 0) {
        const emptyMessage = filter === 'all' 
            ? 'No expenses yet. Add your first expense!' 
            : 'No expenses in this category';
            
        expenseList.innerHTML = `
            <div class="empty-state">
                <p>📭</p>
                <p>${emptyMessage}</p>
            </div>
        `;
        return;
    }

    // Render each expense as HTML
    expenseList.innerHTML = filtered.map(expense => {
        // Get category display name from select option
        const categoryName = categorySelect.querySelector(`option[value="${expense.category}"]`).textContent;
        
        return `
            <div class="expense-item">
                <div class="expense-details">
                    <div class="expense-amount">₹${expense.amount.toFixed(2)}</div>
                    <div class="expense-description">${expense.description}</div>
                    <div class="expense-meta">
                        <span class="category-badge category-${expense.category}">
                            ${categoryName}
                        </span>
                        <span>📅 ${formatDate(expense.date)}</span>
                    </div>
                </div>
                <button class="delete-btn" onclick="deleteExpense(${expense.id})">Delete</button>
            </div>
        `;
    }).join('');
}

/**
 * Update summary statistics at the top
 * Calculates total amount, count, and highest spending category
 */
function updateSummary() {
    // Calculate total amount using reduce
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    totalAmount.textContent = `₹${total.toFixed(2)}`;

    // Display total count
    totalCount.textContent = expenses.length;

    // Calculate highest spending category
    if (expenses.length === 0) {
        highestCategory.textContent = '-';
        return;
    }

    // Group expenses by category and sum amounts
    const categoryTotals = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {});

    // Find category with highest total
    const highest = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])[0];

    if (highest) {
        const categoryName = categorySelect.querySelector(`option[value="${highest[0]}"]`).textContent;
        // Extract just the emoji from category name
        highestCategory.textContent = categoryName.split(' ')[0];
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

// Add expense button click
addBtn.addEventListener('click', addExpense);

// Export to Excel button click
exportBtn.addEventListener('click', exportToExcel);

// QR Code buttons
generateQRBtn.addEventListener('click', generateQRCode);
importQRBtn.addEventListener('click', openImportModal);
downloadQRBtn.addEventListener('click', downloadQRCode);

// Modal close buttons
closeModal.addEventListener('click', () => {
    qrModal.style.display = 'none';
    document.body.classList.remove('modal-open');
});

closeImportModal.addEventListener('click', () => {
    importModal.style.display = 'none';
    document.body.classList.remove('modal-open');
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === qrModal) {
        qrModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
    if (e.target === importModal) {
        importModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
});

// QR file input change
qrFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        processQRImage(e.target.files[0]);
    }
});

// Form overlay handlers (mobile)
fabBtn.addEventListener('click', openAddForm);
closeForm.addEventListener('click', closeAddForm);
formOverlay.addEventListener('click', closeAddForm);

// Clear all data button click
clearAllBtn.addEventListener('click', clearAllExpenses);

// Category filter change
filterCategory.addEventListener('change', renderExpenses);

// Allow Enter key to submit from input fields
[amountInput, descriptionInput].forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addExpense();
        }
    });
});

// ============================================
// INITIALIZE APPLICATION
// ============================================
// Load expenses from LocalStorage when page loads
loadExpenses();
