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

// Camera elements
const scanCameraBtn = document.getElementById('scanCameraBtn');
const uploadImageBtn = document.getElementById('uploadImageBtn');
const stopCameraBtn = document.getElementById('stopCameraBtn');
const cameraPreview = document.getElementById('cameraPreview');
const qrVideo = document.getElementById('qrVideo');
const qrCanvas = document.getElementById('qrCanvas');

// Camera stream
let cameraStream = null;
let scanningInterval = null;

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
 * Splits into multiple QR codes if needed
 */
function generateQRCode() {
    console.log('Generate QR clicked!');
    
    if (expenses.length === 0) {
        showError('No expenses to export via QR code');
        return;
    }

    // Clear previous QR code
    qrCodeContainer.innerHTML = '';

    const categoryMap = { food: 'f', transport: 't', entertainment: 'e', shopping: 's', bills: 'b', salon: 'h', other: 'o' };
    
    // Compress all expenses
    const compressedData = expenses.map((e, idx) => [
        idx,
        e.amount,
        e.description.substring(0, 12),
        categoryMap[e.category] || 'o',
        e.date.substring(2).replace(/-/g, '')
    ]);

    const idMapping = expenses.map(e => e.id);
    
    // Calculate how many expenses fit per QR
    const samplePayload = JSON.stringify([[compressedData[0]], idMapping.slice(0, 1)]);
    const charsPerExpense = samplePayload.length;
    const QR_LIMIT = 2850; // Safe limit with some buffer
    const expensesPerQR = Math.floor(QR_LIMIT / charsPerExpense);
    
    console.log('Chars per expense:', charsPerExpense);
    console.log('Expenses per QR:', expensesPerQR);
    
    // Split into chunks
    const totalQRs = Math.ceil(expenses.length / expensesPerQR);
    const qrPages = [];
    
    for (let i = 0; i < totalQRs; i++) {
        const start = i * expensesPerQR;
        const end = Math.min((i + 1) * expensesPerQR, expenses.length);
        
        const chunkData = compressedData.slice(start, end);
        const chunkIds = idMapping.slice(start, end);
        
        // Add metadata: [pageNum, totalPages, data, ids]
        const payload = {
            p: i + 1,        // Current page
            t: totalQRs,     // Total pages
            d: chunkData,    // Data
            i: chunkIds      // IDs
        };
        
        qrPages.push(JSON.stringify(payload));
    }
    
    console.log(`Generated ${totalQRs} QR codes for ${expenses.length} expenses`);
    
    // Store all QR pages
    window.currentQRPages = qrPages;
    window.currentQRIndex = 0;
    
    // Show first QR
    showQRPage(0);
    
    // Show modal
    qrModal.style.display = 'block';
    document.body.classList.add('modal-open');
}

/**
 * Display specific QR page
 */
function showQRPage(index) {
    const qrPages = window.currentQRPages;
    const totalPages = qrPages.length;
    
    if (index < 0 || index >= totalPages) return;
    
    window.currentQRIndex = index;
    
    // Clear container
    qrCodeContainer.innerHTML = '';
    
    // Generate QR code
    new QRCode(qrCodeContainer, {
        text: qrPages[index],
        width: 300,
        height: 300,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.L
    });
    
    // Update progress indicator
    updateQRProgress(index, totalPages);
    
    console.log(`Showing QR ${index + 1} of ${totalPages}`);
}

/**
 * Update QR progress indicator
 */
function updateQRProgress(currentIndex, totalPages) {
    const progressContainer = document.getElementById('qrProgress');
    if (!progressContainer) return;
    
    if (totalPages === 1) {
        progressContainer.style.display = 'none';
        return;
    }
    
    progressContainer.style.display = 'flex';
    progressContainer.innerHTML = '';
    
    for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement('div');
        dot.className = 'progress-dot';
        if (i === currentIndex) {
            dot.classList.add('active');
        }
        dot.textContent = i + 1;
        dot.onclick = () => showQRPage(i);
        progressContainer.appendChild(dot);
        
        // Add arrow between dots
        if (i < totalPages - 1) {
            const arrow = document.createElement('div');
            arrow.className = 'progress-arrow';
            arrow.textContent = '→';
            progressContainer.appendChild(arrow);
        }
    }
}

/**
 * Navigate to next QR page
 */
function nextQRPage() {
    const totalPages = window.currentQRPages?.length || 0;
    const currentIndex = window.currentQRIndex || 0;
    
    if (currentIndex < totalPages - 1) {
        showQRPage(currentIndex + 1);
    }
}

/**
 * Navigate to previous QR page
 */
function prevQRPage() {
    const currentIndex = window.currentQRIndex || 0;
    
    if (currentIndex > 0) {
        showQRPage(currentIndex - 1);
    }
}

/**
 * Download QR code as image
 */
function downloadQRCode() {
    const canvas = qrCodeContainer.querySelector('canvas');
    if (!canvas) return;

    const currentIndex = window.currentQRIndex || 0;
    const totalPages = window.currentQRPages?.length || 1;
    
    const link = document.createElement('a');
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2,'0')}-${today.getDate().toString().padStart(2,'0')}`;
    
    let filename;
    if (totalPages > 1) {
        filename = `ExpenseQR_${dateStr}_Part${currentIndex + 1}of${totalPages}.png`;
    } else {
        filename = `ExpenseQR_${dateStr}.png`;
    }
    
    link.download = filename;
    link.href = canvas.toDataURL();
    link.click();
    
    console.log(`Downloaded QR ${currentIndex + 1}/${totalPages}`);
}

/**
 * Open import QR modal
 */
function openImportModal() {
    importModal.style.display = 'block';
    document.body.classList.add('modal-open');
    importStatus.style.display = 'none';
    qrFileInput.value = '';
    
    // Reset multi-QR import state
    window.qrImportPages = window.qrImportPages || {};
    
    // Hide camera preview
    stopCamera();
}

/**
 * Start camera for QR scanning
 */
async function startCamera() {
    try {
        // Request camera access
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } // Use back camera on mobile
        });
        
        qrVideo.srcObject = cameraStream;
        cameraPreview.style.display = 'block';
        
        // Start scanning
        scanningInterval = setInterval(scanQRFromCamera, 300);
        
        console.log('Camera started');
    } catch (error) {
        console.error('Camera error:', error);
        showImportError('Camera access denied. Please allow camera permission or use "Upload Image".');
    }
}

/**
 * Stop camera
 */
function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    
    if (scanningInterval) {
        clearInterval(scanningInterval);
        scanningInterval = null;
    }
    
    cameraPreview.style.display = 'none';
    qrVideo.srcObject = null;
    
    console.log('Camera stopped');
}

/**
 * Scan QR code from camera feed
 */
function scanQRFromCamera() {
    if (qrVideo.readyState === qrVideo.HAVE_ENOUGH_DATA) {
        const canvas = qrCanvas;
        const ctx = canvas.getContext('2d');
        
        canvas.width = qrVideo.videoWidth;
        canvas.height = qrVideo.videoHeight;
        
        ctx.drawImage(qrVideo, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
            console.log('QR code detected from camera!');
            
            // Stop camera
            stopCamera();
            
            // Process QR data
            try {
                const importedData = JSON.parse(code.data);
                const categoryReverseMap = { f: 'food', t: 'transport', e: 'entertainment', s: 'shopping', b: 'bills', h: 'salon', o: 'other' };
                
                // Check if multi-page QR
                if (importedData.p !== undefined && importedData.t !== undefined) {
                    handleMultiPageQR(importedData, categoryReverseMap);
                } else {
                    handleSingleQR(importedData, categoryReverseMap);
                }
            } catch (error) {
                console.error('QR parse error:', error);
                showImportError('Invalid QR code. Use QR from this app only.');
            }
        }
    }
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
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                try {
                    const importedData = JSON.parse(code.data);
                    
                    console.log('=== QR Import Debug ===');
                    console.log('Imported data:', importedData);
                    
                    const categoryReverseMap = { f: 'food', t: 'transport', e: 'entertainment', s: 'shopping', b: 'bills', h: 'salon', o: 'other' };
                    
                    // Check if this is a multi-page QR
                    if (importedData.p !== undefined && importedData.t !== undefined) {
                        handleMultiPageQR(importedData, categoryReverseMap);
                    } else {
                        // Single QR or old format
                        handleSingleQR(importedData, categoryReverseMap);
                    }
                    
                } catch (error) {
                    console.error('QR error:', error);
                    showImportError('Invalid QR code. Use QR from this app only.');
                }
            } else {
                showImportError('No QR code found. Try again.');
            }
        };
        
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

/**
 * Handle multi-page QR import
 */
function handleMultiPageQR(qrData, categoryMap) {
    const currentPage = qrData.p;
    const totalPages = qrData.t;
    
    // Store this page
    window.qrImportPages = window.qrImportPages || {};
    window.qrImportPages[currentPage] = {
        data: qrData.d,
        ids: qrData.i
    };
    
    const receivedPages = Object.keys(window.qrImportPages).length;
    
    console.log(`Received QR ${currentPage}/${totalPages} (${receivedPages} total)`);
    
    if (receivedPages < totalPages) {
        // Need more pages
        showImportSuccess(`QR ${currentPage}/${totalPages} scanned! Please scan ${totalPages - receivedPages} more QR code(s).`);
        
        // Don't close modal, wait for more QRs
        qrFileInput.value = ''; // Reset input to allow same file again
    } else {
        // All pages received!
        console.log('All QR pages received! Merging...');
        
        // Merge all pages in order
        let allData = [];
        let allIds = [];
        
        for (let i = 1; i <= totalPages; i++) {
            const page = window.qrImportPages[i];
            if (page) {
                allData = allData.concat(page.data);
                allIds = allIds.concat(page.ids);
            }
        }
        
        // Reconstruct expenses
        const importedExpenses = allData.map((e, idx) => ({
            id: allIds[idx],
            amount: e[1],
            description: e[2],
            category: categoryMap[e[3]] || 'other',
            date: '20' + e[4].substring(0,2) + '-' + e[4].substring(2,4) + '-' + e[4].substring(4,6)
        }));
        
        console.log(`Reconstructed ${importedExpenses.length} expenses from ${totalPages} QR codes`);
        
        // Confirm import
        const confirmMsg = `All ${totalPages} QR codes scanned!\n\nFound ${importedExpenses.length} expenses. Import and merge?\n\n⚠️ Descriptions may be truncated to 12 chars.`;
        if (confirm(confirmMsg)) {
            const existingIds = new Set(expenses.map(e => e.id));
            const newExpenses = importedExpenses.filter(e => !existingIds.has(e.id));
            
            expenses = [...expenses, ...newExpenses];
            saveExpenses();
            renderExpenses();
            updateSummary();
            
            showImportSuccess(`Successfully imported ${newExpenses.length} expenses from ${totalPages} QR codes!`);
            
            // Reset multi-QR state
            window.qrImportPages = {};
            
            setTimeout(() => {
                importModal.style.display = 'none';
                document.body.classList.remove('modal-open');
            }, 3000);
        } else {
            // User cancelled, reset state
            window.qrImportPages = {};
        }
    }
}

/**
 * Handle single QR or old format
 */
function handleSingleQR(importedData, categoryMap) {
    let importedExpenses;
    
    // Old format with ID mapping: [[data], [ids]]
    if (Array.isArray(importedData) && importedData.length === 2 && Array.isArray(importedData[1])) {
        console.log('Format: Old compressed with ID mapping');
        const [dataArray, idArray] = importedData;
        
        importedExpenses = dataArray.map((e, idx) => ({
            id: idArray[idx],
            amount: e[1],
            description: e[2],
            category: categoryMap[e[3]] || 'other',
            date: '20' + e[4].substring(0,2) + '-' + e[4].substring(2,4) + '-' + e[4].substring(4,6)
        }));
    }
    // Original format
    else if (Array.isArray(importedData) && importedData[0]?.id !== undefined) {
        console.log('Format: Original');
        importedExpenses = importedData;
    }
    else {
        throw new Error('Unrecognized format');
    }
    
    console.log('Imported:', importedExpenses.length, 'expenses');

    const confirmMsg = `Found ${importedExpenses.length} expenses. Import and merge?\n\n⚠️ Descriptions may be truncated to 12 chars.`;
    if (confirm(confirmMsg)) {
        const existingIds = new Set(expenses.map(e => e.id));
        const newExpenses = importedExpenses.filter(e => !existingIds.has(e.id));
        
        expenses = [...expenses, ...newExpenses];
        saveExpenses();
        renderExpenses();
        updateSummary();
        
        showImportSuccess(`Imported ${newExpenses.length} new expenses!`);
        
        setTimeout(() => {
            importModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }, 2000);
    }
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

// Camera scan buttons
scanCameraBtn.addEventListener('click', startCamera);
uploadImageBtn.addEventListener('click', () => {
    qrFileInput.click();
});
stopCameraBtn.addEventListener('click', stopCamera);

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
