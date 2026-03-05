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
const clearAllBtn = document.getElementById('clearAllBtn');
const expenseList = document.getElementById('expenseList');
const filterCategory = document.getElementById('filterCategory');
const errorMessage = document.getElementById('errorMessage');
const totalAmount = document.getElementById('totalAmount');
const totalCount = document.getElementById('totalCount');
const highestCategory = document.getElementById('highestCategory');

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
 * Uses SheetJS library to create proper Excel workbook
 */
function exportToExcel() {
    // Check if there are expenses to export
    if (expenses.length === 0) {
        showError('No expenses to export');
        return;
    }

    // Prepare data for Excel with formatted columns
    const excelData = expenses.map(expense => {
        // Get category display name
        const categoryName = categorySelect.querySelector(`option[value="${expense.category}"]`).textContent;
        
        return {
            'Date': formatDate(expense.date),
            'Description': expense.description,
            'Category': categoryName,
            'Amount (₹)': expense.amount.toFixed(2)
        };
    });

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    ws['!cols'] = [
        { wch: 15 },  // Date column
        { wch: 30 },  // Description column
        { wch: 20 },  // Category column
        { wch: 12 }   // Amount column
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');

    // Generate filename with current date
    const today = new Date();
    const filename = `Expenses_${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2,'0')}-${today.getDate().toString().padStart(2,'0')}.xlsx`;

    // Download the file
    XLSX.writeFile(wb, filename);
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