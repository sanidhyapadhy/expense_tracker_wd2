// ============================================
// STATE MANAGEMENT
// ============================================
let expenses = [];
let cameraStream = null;
let scanningInterval = null;

// ============================================
// DOM ELEMENT REFERENCES
// ============================================
const amountInput = document.getElementById('amount');
const descriptionInput = document.getElementById('description');
const categorySelect = document.getElementById('category');
const dateInput = document.getElementById('date');
const addBtn = document.getElementById('addBtn');
const exportBtn = document.getElementById('exportBtn');
const exportExcelBtn = document.getElementById('exportExcelBtn');
const importBtn = document.getElementById('importBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const expenseList = document.getElementById('expenseList');
const filterCategory = document.getElementById('filterCategory');
const errorMessage = document.getElementById('errorMessage');
const totalAmount = document.getElementById('totalAmount');
const totalCount = document.getElementById('totalCount');
const highestCategory = document.getElementById('highestCategory');

// Export modal elements
const exportModal = document.getElementById('exportModal');
const closeExportModal = document.getElementById('closeExportModal');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const exportQRBtn = document.getElementById('exportQRBtn');

// Import modal elements
const importModal = document.getElementById('importModal');
const closeImportModal = document.getElementById('closeImportModal');
const importFileBtn = document.getElementById('importFileBtn');
const importQRBtn = document.getElementById('importQRBtn');
const jsonFileInput = document.getElementById('jsonFileInput');
const importJsonStatus = document.getElementById('importJsonStatus');

// Share QR modal elements
const shareQRModal = document.getElementById('shareQRModal');
const closeShareQRModal = document.getElementById('closeShareQRModal');
const qrLoadingContainer = document.getElementById('qrLoadingContainer');
const qrResultContainer = document.getElementById('qrResultContainer');
const qrModalTitle = document.getElementById('qrModalTitle');
const qrModalDesc = document.getElementById('qrModalDesc');
const qrCodeDisplay = document.getElementById('qrCodeDisplay');
// QR Scanner modal elements
const qrScannerModal = document.getElementById('qrScannerModal');
const closeQRScannerModal = document.getElementById('closeQRScannerModal');
const stopScanBtn = document.getElementById('stopScanBtn');
const qrScanStatus = document.getElementById('qrScanStatus');
const qrVideo = document.getElementById('qrVideo');
const qrCanvas = document.getElementById('qrCanvas');

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
        const categoryOption = categorySelect.querySelector(`option[value="${expense.category}"]`);
        const categoryName = categoryOption ? categoryOption.textContent : '📦 Other';
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
// JSON EXPORT/IMPORT FUNCTIONS
// ============================================

/**
 * Export expenses as JSON file
 */
function exportToJSON() {
    console.log('Export JSON clicked!');
    
    if (expenses.length === 0) {
        showError('No expenses to export');
        return;
    }

    // Create JSON data with metadata
    const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        totalExpenses: expenses.length,
        expenses: expenses
    };

    // Convert to JSON string with pretty formatting
    const jsonString = JSON.stringify(exportData, null, 2);

    // Create blob
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Generate filename
    const today = new Date();
    const filename = `Expenses_${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2,'0')}-${today.getDate().toString().padStart(2,'0')}.json`;
    
    // Create download link
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
    
    console.log(`✅ Exported ${expenses.length} expenses to ${filename}`);
}

/**
 * Open import JSON modal
 */
function openImportJsonModal() {
    importModal.style.display = 'block';
    document.body.classList.add('modal-open');
    importJsonStatus.style.display = 'none';
    jsonFileInput.value = '';
}

/**
 * Process imported JSON file
 */
function processJsonFile(file) {
    console.log('=== JSON Import Started ===');
    console.log('File:', file);
    
    if (!file) {
        showJsonImportError('No file selected');
        return;
    }
    
    if (!file.name.endsWith('.json')) {
        showJsonImportError('Please select a valid JSON file');
        return;
    }

    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const jsonData = JSON.parse(e.target.result);
            
            console.log('JSON parsed successfully');
            console.log('Data:', jsonData);
            
            // Validate structure
            let importedExpenses;
            
            if (jsonData.version && jsonData.expenses) {
                // New format with metadata
                importedExpenses = jsonData.expenses;
                console.log(`Import file v${jsonData.version}, exported on ${jsonData.exportDate}`);
            } else if (Array.isArray(jsonData)) {
                // Old format - direct array
                importedExpenses = jsonData;
            } else {
                throw new Error('Invalid JSON structure');
            }
            
            // Validate expenses array
            if (!Array.isArray(importedExpenses) || importedExpenses.length === 0) {
                throw new Error('No expenses found in file');
            }
            
            console.log(`Found ${importedExpenses.length} expenses`);
            
            // Confirm import
            const confirmMsg = `Found ${importedExpenses.length} expenses.\n\nImport and merge with existing data?`;
            if (confirm(confirmMsg)) {
                // Merge with existing (avoid duplicates by ID)
                const existingIds = new Set(expenses.map(e => e.id));
                const newExpenses = importedExpenses.filter(e => !existingIds.has(e.id));
                
                expenses = [...expenses, ...newExpenses];
                saveExpenses();
                renderExpenses();
                updateSummary();
                
                showJsonImportSuccess(`✅ Successfully imported ${newExpenses.length} new expenses!`);
                
                setTimeout(() => {
                    importModal.style.display = 'none';
                    document.body.classList.remove('modal-open');
                }, 2000);
            }
            
        } catch (error) {
            console.error('JSON parse error:', error);
            showJsonImportError(`Invalid JSON file: ${error.message}`);
        }
    };
    
    reader.onerror = function() {
        console.error('File read error');
        showJsonImportError('Failed to read file. Please try again.');
    };
    
    reader.readAsText(file);
}

/**
 * Show JSON import success message
 */
function showJsonImportSuccess(message) {
    importJsonStatus.textContent = message;
    importJsonStatus.style.display = 'block';
    importJsonStatus.style.background = '#d4edda';
    importJsonStatus.style.color = '#155724';
    importJsonStatus.style.border = '1px solid #c3e6cb';
    importJsonStatus.style.padding = '15px';
    importJsonStatus.style.borderRadius = '8px';
    importJsonStatus.style.marginTop = '15px';
}

// ============================================
// QR SCANNER FUNCTIONS
// ============================================

/**
 * Start QR scanner with camera
 */
async function startQRScanner() {
    // Check if running in Android WebView with native scanner
    if (typeof AndroidQR !== 'undefined') {
        console.log('Using native Android QR scanner');
        AndroidQR.scanQR();
        return;
    }
    
    // Otherwise use web-based camera scanner
    console.log('Using web camera scanner');
    
    try {
        // Show scanner modal
        qrScannerModal.style.display = 'block';
        document.body.classList.add('modal-open');
        qrScanStatus.style.display = 'none';
        
        // Request camera access
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        
        qrVideo.srcObject = cameraStream;
        
        // Start scanning
        scanningInterval = setInterval(scanQRFromVideo, 300);
        
        console.log('✅ Web QR Scanner started');
    } catch (error) {
        console.error('Camera error:', error);
        showQRScanError('Camera access denied. Please allow camera permission.');
    }
}

/**
 * Handle QR result from native Android scanner
 */
function handleNativeQRResult(qrData) {
    console.log('✅ Native QR result:', qrData);

    if (qrData.startsWith('EXPENSE_PEER:')) {
        const peerId = qrData.replace('EXPENSE_PEER:', '');
        stopQRScanner();
        connectToPeerAndReceive(peerId);
    } else if (qrData.includes('jsonblob.com') || qrData.includes('tmpfiles.org')) {
        downloadAndImportFromURL(qrData);
    } else {
        alert('❌ Invalid QR code. Please scan a QR code generated by this app.');
    }
}

/**
 * Stop QR scanner
 */
function stopQRScanner() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    
    if (scanningInterval) {
        clearInterval(scanningInterval);
        scanningInterval = null;
    }
    
    qrVideo.srcObject = null;
    qrScannerModal.style.display = 'none';
    document.body.classList.remove('modal-open');
    
    console.log('QR Scanner stopped');
}

/**
 * Scan QR code from video feed
 */
function scanQRFromVideo() {
    if (qrVideo.readyState === qrVideo.HAVE_ENOUGH_DATA) {
        const ctx = qrCanvas.getContext('2d', { willReadFrequently: true });
        
        qrCanvas.width = qrVideo.videoWidth;
        qrCanvas.height = qrVideo.videoHeight;
        
        ctx.drawImage(qrVideo, 0, 0, qrCanvas.width, qrCanvas.height);
        
        const imageData = ctx.getImageData(0, 0, qrCanvas.width, qrCanvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
            console.log('✅ QR code detected:', code.data);
            
            stopQRScanner();
            
            if (code.data.startsWith('EXPENSE_PEER:')) {
                const peerId = code.data.replace('EXPENSE_PEER:', '');
                stopQRScanner();
                connectToPeerAndReceive(peerId);
            } else if (code.data.includes('jsonblob.com') || code.data.includes('tmpfiles.org')) {
                stopQRScanner();
                downloadAndImportFromURL(code.data);
            } else {
                showQRScanError('Invalid QR code. Please scan a QR code generated by this app.');
            }
        }
    }
}

/**
 * Download and import JSON from URL
 */
async function downloadAndImportFromURL(url) {
    try {
        console.log('=== Download from URL ===');
        console.log('URL:', url);
        
        // Show loading
        showQRScanSuccess('Downloading data...');
        
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
        });
        
        console.log('Response status:', response.status);
        console.log('Response OK:', response.ok);
        
        if (!response.ok) {
            throw new Error(`Download failed: ${response.status} ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);
        
        const jsonData = await response.json();
        console.log('Data received:', jsonData);
        
        // Process imported data
        let importedExpenses;
        if (jsonData.version && jsonData.expenses) {
            importedExpenses = jsonData.expenses;
        } else if (Array.isArray(jsonData)) {
            importedExpenses = jsonData;
        } else {
            throw new Error('Invalid data format');
        }
        
        console.log(`✅ Found ${importedExpenses.length} expenses`);
        
        const confirmMsg = `Found ${importedExpenses.length} expenses from shared link.\n\nImport and merge?`;
        if (confirm(confirmMsg)) {
            const existingIds = new Set(expenses.map(e => e.id));
            const newExpenses = importedExpenses.filter(e => !existingIds.has(e.id));
            
            expenses = [...expenses, ...newExpenses];
            saveExpenses();
            renderExpenses();
            updateSummary();
            
            alert(`✅ Successfully imported ${newExpenses.length} expenses!`);
        }
        
    } catch (error) {
        console.error('❌ Download error:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        
        let errorMsg = 'Failed to import from QR code.\n\n';
        
        if (error.message.includes('Failed to fetch')) {
            errorMsg += 'The link may have expired or the file was already downloaded.\n\n';
            errorMsg += 'Please generate a new QR code and try again.';
        } else {
            errorMsg += `Error: ${error.message}`;
        }
        
        alert(`❌ ${errorMsg}`);
    }
}

/**
 * Show QR scan error
 */
function showQRScanError(message) {
    qrScanStatus.textContent = message;
    qrScanStatus.className = 'error';
}

/**
 * Show QR scan success
 */
function showQRScanSuccess(message) {
    qrScanStatus.textContent = message;
    qrScanStatus.className = 'success';
}

// ============================================
// SHARE VIA QR CODE (FILE.IO)
// ============================================

/**
 * Generate shareable QR code with temporary link
 */
// ============================================
// WEBRTC SHARE — PeerJS
// ============================================
let senderPeer = null;   // PeerJS instance on export side
let receiverPeer = null; // PeerJS instance on import side

/**
 * Generate a human-friendly 6-digit numeric code from a PeerJS ID
 */
function peerIdToCode(peerId) {
    // Take last 6 chars of the UUID and convert to digits only
    const hex = peerId.replace(/-/g, '').slice(-8);
    const num = parseInt(hex, 16) % 1000000;
    return String(num).padStart(6, '0');
}

/**
 * Destroy sender peer cleanly
 */
function destroySenderPeer() {
    if (senderPeer) {
        senderPeer.destroy();
        senderPeer = null;
    }
}

/**
 * Export side — create peer, show QR + code, wait for receiver
 */
async function shareViaQR() {
    console.log('Share via QR (WebRTC) clicked');

    if (expenses.length === 0) {
        showError('No expenses to share');
        return;
    }

    // Show modal in loading state
    shareQRModal.style.display = 'block';
    document.body.classList.add('modal-open');
    qrLoadingContainer.style.display = 'block';
    qrResultContainer.style.display = 'none';
    qrModalTitle.textContent = 'Setting up connection...';
    qrModalDesc.textContent = 'Connecting to relay server';

    destroySenderPeer();

    try {
        // Generate a random 6-digit code and use it as the peer ID
        // This way the code entry on the receiver side maps directly to the peer ID
        const code = String(Math.floor(100000 + Math.random() * 900000));
        const customPeerId = 'expense-share-' + code;

        senderPeer = new Peer(customPeerId, { debug: 0 });

        senderPeer.on('open', (id) => {
            console.log('Sender peer ID:', id);

            // Show QR + code
            qrLoadingContainer.style.display = 'none';
            qrResultContainer.style.display = 'block';
            qrModalTitle.textContent = 'Ready to Share!';
            qrModalDesc.textContent = 'Scan the QR or enter the code on the other device';

            // QR encodes the full peer ID so receiver can connect directly
            qrCodeDisplay.innerHTML = '';
            new QRCode(qrCodeDisplay, {
                text: 'EXPENSE_PEER:' + id,
                width: 220,
                height: 220,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });

            document.getElementById('peerCodeDisplay').textContent = code;

            const statusBox = document.getElementById('shareStatusBox');
            statusBox.style.background = '#fff3cd';
            statusBox.style.borderColor = '#ffc107';
            statusBox.textContent = '⏳ Waiting for other device to connect...';
        });

        senderPeer.on('connection', (conn) => {
            console.log('Receiver connected!');
            const statusBox = document.getElementById('shareStatusBox');
            statusBox.style.background = '#d4edda';
            statusBox.style.borderColor = '#28a745';
            statusBox.textContent = '✅ Device connected! Sending data...';

            conn.on('open', () => {
                const exportData = {
                    version: '1.0',
                    exportDate: new Date().toISOString(),
                    totalExpenses: expenses.length,
                    expenses: expenses
                };
                conn.send(JSON.stringify(exportData));
                console.log('Data sent!');
                statusBox.textContent = '✅ ' + expenses.length + ' expenses sent successfully!';

                // Close modal after 2s
                setTimeout(() => {
                    destroySenderPeer();
                    shareQRModal.style.display = 'none';
                    document.body.classList.remove('modal-open');
                }, 2000);
            });

            conn.on('error', (err) => {
                console.error('Connection error:', err);
                statusBox.style.background = '#f8d7da';
                statusBox.style.borderColor = '#dc3545';
                statusBox.textContent = '❌ Transfer failed. Please try again.';
            });
        });

        senderPeer.on('error', (err) => {
            console.error('Peer error:', err);
            qrLoadingContainer.style.display = 'none';
            qrResultContainer.style.display = 'none';
            qrModalTitle.textContent = '❌ Connection Failed';
            qrModalDesc.innerHTML = '<p style="color:#721c24">Could not connect to relay server. Check your internet connection and try again.</p>';
        });

    } catch (err) {
        console.error('shareViaQR error:', err);
        qrLoadingContainer.style.display = 'none';
        qrModalTitle.textContent = '❌ Error';
        qrModalDesc.innerHTML = '<p style="color:#721c24">' + err.message + '</p>';
    }
}

/**
 * Import side — connect to sender peer using full peer ID or 6-digit code
 * @param {string} peerId — full PeerJS UUID OR 6-digit code
 */
async function connectToPeerAndReceive(peerId) {
    const importStatus = document.getElementById('importJsonStatus');

    // Show connecting status
    importStatus.style.display = 'block';
    importStatus.style.background = '#fff3cd';
    importStatus.style.color = '#856404';
    importStatus.style.border = '1px solid #ffc107';
    importStatus.style.padding = '15px';
    importStatus.style.borderRadius = '8px';
    importStatus.style.marginTop = '15px';
    importStatus.textContent = '🔄 Connecting to sender...';

    if (receiverPeer) {
        receiverPeer.destroy();
        receiverPeer = null;
    }

    receiverPeer = new Peer({ debug: 0 });

    receiverPeer.on('open', () => {
        console.log('Receiver peer open, connecting to:', peerId);
        const conn = receiverPeer.connect(peerId, { reliable: true });

        conn.on('open', () => {
            importStatus.textContent = '✅ Connected! Waiting for data...';
        });

        conn.on('data', (rawData) => {
            console.log('Data received from sender');
            try {
                const jsonData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

                let importedExpenses;
                if (jsonData.version && jsonData.expenses) {
                    importedExpenses = jsonData.expenses;
                } else if (Array.isArray(jsonData)) {
                    importedExpenses = jsonData;
                } else {
                    throw new Error('Invalid data format received');
                }

                const existingIds = new Set(expenses.map(e => e.id));
                const newExpenses = importedExpenses.filter(e => !existingIds.has(e.id));

                expenses = [...expenses, ...newExpenses];
                saveExpenses();
                renderExpenses();
                updateSummary();

                importStatus.style.background = '#d4edda';
                importStatus.style.color = '#155724';
                importStatus.style.border = '1px solid #c3e6cb';
                importStatus.textContent = '✅ Imported ' + newExpenses.length + ' new expenses!';

                receiverPeer.destroy();
                receiverPeer = null;

                setTimeout(() => {
                    importModal.style.display = 'none';
                    document.body.classList.remove('modal-open');
                }, 2000);

            } catch (err) {
                console.error('Data parse error:', err);
                importStatus.style.background = '#f8d7da';
                importStatus.style.color = '#721c24';
                importStatus.style.border = '1px solid #f5c6cb';
                importStatus.textContent = '❌ Failed to read data: ' + err.message;
            }
        });

        conn.on('error', (err) => {
            console.error('Conn error:', err);
            importStatus.style.background = '#f8d7da';
            importStatus.style.color = '#721c24';
            importStatus.style.border = '1px solid #f5c6cb';
            importStatus.textContent = '❌ Connection failed. Make sure the sender is ready.';
        });
    });

    receiverPeer.on('error', (err) => {
        console.error('Receiver peer error:', err);
        importStatus.style.background = '#f8d7da';
        importStatus.style.color = '#721c24';
        importStatus.style.border = '1px solid #f5c6cb';
        importStatus.textContent = '❌ Could not connect. Check internet and try again.';
    });
}


/**
 * Auto-import from URL (when QR is scanned)
 */
async function checkForAutoImport() {
    // Check if URL has file.io link in query params
    const urlParams = new URLSearchParams(window.location.search);
    const importUrl = urlParams.get('import');
    
    if (importUrl && importUrl.includes('jsonblob.com') || importUrl.includes('file.io') || importUrl.includes('tmpfiles.org')) {
        console.log('Auto-import detected:', importUrl);
        
        try {
            const response = await fetch(importUrl);
            if (!response.ok) {
                throw new Error('Failed to download file');
            }
            
            const jsonData = await response.json();
            
            // Process the imported data
            let importedExpenses;
            if (jsonData.version && jsonData.expenses) {
                importedExpenses = jsonData.expenses;
            } else if (Array.isArray(jsonData)) {
                importedExpenses = jsonData;
            } else {
                throw new Error('Invalid data format');
            }
            
            const confirmMsg = `Found ${importedExpenses.length} expenses from shared link.\n\nImport and merge?`;
            if (confirm(confirmMsg)) {
                const existingIds = new Set(expenses.map(e => e.id));
                const newExpenses = importedExpenses.filter(e => !existingIds.has(e.id));
                
                expenses = [...expenses, ...newExpenses];
                saveExpenses();
                renderExpenses();
                updateSummary();
                
                alert(`✅ Successfully imported ${newExpenses.length} expenses!`);
            }
            
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
        } catch (error) {
            console.error('Auto-import error:', error);
            alert('❌ Failed to import from link. The link may have expired or been used already.');
        }
    }
}

/**
 * Show JSON import error message
 */
function showJsonImportError(message) {
    importJsonStatus.textContent = message;
    importJsonStatus.style.display = 'block';
    importJsonStatus.style.background = '#f8d7da';
    importJsonStatus.style.color = '#721c24';
    importJsonStatus.style.border = '1px solid #f5c6cb';
    importJsonStatus.style.padding = '15px';
    importJsonStatus.style.borderRadius = '8px';
    importJsonStatus.style.marginTop = '15px';
}

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
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
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
        // Safely get category display name — fallback if category is unrecognised
        const categoryOption = categorySelect.querySelector(`option[value="${expense.category}"]`);
        const categoryName = categoryOption ? categoryOption.textContent : '📦 Other';

        return `
            <div class="expense-item">
                <div class="expense-details">
                    <div class="expense-amount">₹${expense.amount.toFixed(2)}</div>
                    <div class="expense-description">${expense.description}</div>
                    <div class="expense-meta">
                        <span class="category-badge category-${expense.category || 'other'}">
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
        const categoryOption = categorySelect.querySelector(`option[value="${highest[0]}"]`);
        const categoryName = categoryOption ? categoryOption.textContent : '📦 Other';
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
exportExcelBtn.addEventListener('click', exportToExcel);

// Export button - open export modal
exportBtn.addEventListener('click', () => {
    exportModal.style.display = 'block';
    document.body.classList.add('modal-open');
});

// Export JSON option
exportJsonBtn.addEventListener('click', () => {
    exportModal.style.display = 'none';
    document.body.classList.remove('modal-open');
    exportToJSON();
});

// Export QR option
exportQRBtn.addEventListener('click', () => {
    exportModal.style.display = 'none';
    document.body.classList.remove('modal-open');
    shareViaQR();
});

// Import button - open import modal
importBtn.addEventListener('click', () => {
    importModal.style.display = 'block';
    document.body.classList.add('modal-open');
    importJsonStatus.style.display = 'none';
    jsonFileInput.value = '';
});

// Import file option — trigger hidden file input
importFileBtn.addEventListener('click', () => {
    jsonFileInput.click();
});

// Import QR option — open scanner
importQRBtn.addEventListener('click', () => {
    importModal.style.display = 'none';
    document.body.classList.remove('modal-open');
    startQRScanner();
});

// Close modals via × buttons
closeExportModal.addEventListener('click', () => {
    exportModal.style.display = 'none';
    document.body.classList.remove('modal-open');
});

closeImportModal.addEventListener('click', () => {
    importModal.style.display = 'none';
    document.body.classList.remove('modal-open');
});

// Close share modal — also tears down sender peer
closeShareQRModal.addEventListener('click', () => {
    destroySenderPeer();
    shareQRModal.style.display = 'none';
    document.body.classList.remove('modal-open');
});

// Cancel share button
document.getElementById('cancelShareBtn').addEventListener('click', () => {
    destroySenderPeer();
    shareQRModal.style.display = 'none';
    document.body.classList.remove('modal-open');
});

closeQRScannerModal.addEventListener('click', stopQRScanner);
stopScanBtn.addEventListener('click', stopQRScanner);

// Show code entry panel
document.getElementById('importCodeBtn').addEventListener('click', () => {
    document.getElementById('codeEntryPanel').style.display = 'block';
    document.getElementById('peerCodeInput').focus();
});

// Connect with typed code — code is 6 digits, map back to peer ID via lookup
// Since we can't reverse the hash, we store the full peer ID in the QR text
// For code entry, sender must show the full peer ID as well — but we simplify:
// the 6-digit code IS the peer ID directly (we'll use a short custom peer ID)
document.getElementById('connectWithCodeBtn').addEventListener('click', () => {
    const code = document.getElementById('peerCodeInput').value.trim();
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
        document.getElementById('importJsonStatus').style.display = 'block';
        document.getElementById('importJsonStatus').style.background = '#f8d7da';
        document.getElementById('importJsonStatus').style.color = '#721c24';
        document.getElementById('importJsonStatus').style.border = '1px solid #f5c6cb';
        document.getElementById('importJsonStatus').style.padding = '15px';
        document.getElementById('importJsonStatus').style.borderRadius = '8px';
        document.getElementById('importJsonStatus').style.marginTop = '15px';
        document.getElementById('importJsonStatus').textContent = '❌ Please enter a valid 6-digit code.';
        return;
    }
    connectToPeerAndReceive('expense-share-' + code);
});

// JSON file input change
jsonFileInput.addEventListener('change', (e) => {
    console.log('JSON file selected');
    if (e.target.files && e.target.files[0]) {
        processJsonFile(e.target.files[0]);
    }
});

// Close modals when clicking the backdrop
window.addEventListener('click', (e) => {
    if (e.target === exportModal) {
        exportModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
    if (e.target === importModal) {
        importModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
    if (e.target === shareQRModal) {
        shareQRModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
    if (e.target === qrScannerModal) {
        stopQRScanner();
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

// Check for auto-import from shared link
checkForAutoImport();