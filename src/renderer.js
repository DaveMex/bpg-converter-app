// Intercept console logs to display in UI
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
console.error = (...args) => {
    log(`[Console Error]: ${args.join(' ')}`, 'error');
    originalConsoleError.apply(console, args);
};
console.log = (...args) => {
    // Filter out some noisy logs if needed, but for now keep all
    log(`[Console Log]: ${args.join(' ')}`, 'info');
    originalConsoleLog.apply(console, args);
};

const dropZone = document.getElementById('drop-zone');
const qualityInput = document.getElementById('quality');
const qualityVal = document.getElementById('quality-val');
const compressionInput = document.getElementById('compression');
const compressionVal = document.getElementById('compression-val');
const formatInput = document.getElementById('format');
const logArea = document.getElementById('log-area');
const previewArea = document.getElementById('preview-area');
const statusPill = document.getElementById('status-pill');

// Console Drawer Elements
const consoleDrawer = document.getElementById('console-drawer');
const toggleLogsBtn = document.getElementById('toggle-logs-btn');
const closeConsoleBtn = document.getElementById('close-console-btn');
const clearLogsBtn = document.getElementById('clear-logs-btn');
const saveLogsBtn = document.getElementById('save-logs-btn');
const openFolderBtn = document.getElementById('open-folder-btn');

let lastConvertedPath = null;

// Update UI values
qualityInput.addEventListener('input', (e) => {
    qualityVal.innerText = e.target.value;
});

// ... (existing code)

// Open Folder Handler
if (openFolderBtn) {
    openFolderBtn.addEventListener('click', () => {
        if (lastConvertedPath) {
            window.api.showItemInFolder(lastConvertedPath);
            log(`Opening folder for: ${lastConvertedPath}`, 'info');
        }
    });
}

compressionInput.addEventListener('input', (e) => {
    compressionVal.innerText = e.target.value;
});

// Drag & Drop
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files);

    // Filter for images
    const images = files.filter(f => {
        const ext = f.name.toLowerCase();
        return ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg');
    });

    if (images.length === 0) {
        log('No valid JPG/PNG files found.', 'error');
        return;
    }

    // Clear preview area at start of batch
    previewArea.innerHTML = '';

    log(`Batch started: ${images.length} file(s) found.`, 'info');

    for (let i = 0; i < images.length; i++) {
        log(`Processing ${i + 1} of ${images.length}: ${images[i].name}...`, 'info');
        await processFile(images[i]);
    }

    log('Batch conversion complete.', 'success');
});

// Click to select
dropZone.addEventListener('click', async () => {
    const filePaths = await window.api.selectFile();
    if (filePaths && filePaths.length > 0) {
        // Clear preview area at start of batch
        previewArea.innerHTML = '';
        log(`Batch started: ${filePaths.length} file(s) selected via dialog.`, 'info');

        for (let i = 0; i < filePaths.length; i++) {
            const fileName = filePaths[i].split(/[/\\]/).pop();
            log(`Processing ${i + 1} of ${filePaths.length}: ${fileName}...`, 'info');
            await processFile(filePaths[i]);
        }
        log('Batch conversion complete.', 'success');
    }
});

function updateStatus(message, type = 'ready') {
    if (!statusPill) return;

    // reset classes
    statusPill.className = 'status-pill';
    statusPill.classList.add(type);

    // Hide folder button by default, show only when ready/success
    if (openFolderBtn) openFolderBtn.classList.add('hidden');

    if (type === 'ready') {
        statusPill.innerText = '✅ Completed';
        if (openFolderBtn && lastConvertedPath) {
            openFolderBtn.classList.remove('hidden');
        }
    } else if (type === 'processing') {
        statusPill.innerText = '🟡 Processing...';
        statusPill.classList.remove('hidden');
    } else if (type === 'error') {
        statusPill.innerText = '🔴 Error';
        statusPill.classList.remove('hidden');
    } else if (type === 'hidden') {
        statusPill.classList.add('hidden');
    } else {
        statusPill.innerText = message;
        statusPill.classList.remove('hidden');
    }
}

function log(message, type = 'info') {
    // 1. Update Status Pill for high-level events
    if (message.includes('Batch started') || message.includes('Processing')) {
        updateStatus(message, 'processing');
    } else if (message.includes('conversion complete') || message.includes('Success')) {
        updateStatus('Ready', 'ready');
    } else if (type === 'error') {
        updateStatus('Error', 'error');
    }

    // 2. Append to Console Drawer
    const div = document.createElement('div');
    div.className = `log-item ${type}`;

    const time = new Date().toLocaleTimeString();
    div.innerHTML = `<span class="log-item timestamp">[${time}]</span>${message}`;

    if (logArea) {
        logArea.appendChild(div);
        logArea.scrollTop = logArea.scrollHeight;
    }
}

// Console Drawer Logic
function toggleConsole() {
    consoleDrawer.classList.toggle('closed');
}

if (toggleLogsBtn) toggleLogsBtn.addEventListener('click', toggleConsole);
if (closeConsoleBtn) closeConsoleBtn.addEventListener('click', () => consoleDrawer.classList.add('closed'));

if (clearLogsBtn) {
    clearLogsBtn.addEventListener('click', () => {
        if (logArea) logArea.innerHTML = '';
        log('Logs cleared.', 'info');
    });
}

if (saveLogsBtn) {
    saveLogsBtn.addEventListener('click', () => {
        if (!logArea) return;
        const textToSave = logArea.innerText;
        const blob = new Blob([textToSave], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bpg-converter-log-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        log('Log file saved.', 'success');
    });
}

async function processFile(fileOrPath) {
    const quality = parseInt(qualityInput.value);
    const compression = parseInt(compressionInput.value);
    const encoder = formatInput.value;

    try {
        let filePath;
        let fileName;

        if (typeof fileOrPath === 'string') {
            filePath = fileOrPath;
            // Extract filename from path for logging
            fileName = filePath.split(/[/\\]/).pop();
        } else {
            filePath = window.api.getFilePath(fileOrPath);
            fileName = fileOrPath.name;
        }

        const outputPath = await window.api.convertImage({
            filePath,
            quality,
            compression,
            encoder
        });

        lastConvertedPath = outputPath; // Store for "Open Folder"
        log(`Success! Saved to ${outputPath}`, 'success');

        if (typeof BPGDecoder === 'undefined') {
            log('Error: BPGDecoder is not defined. Script might not be loaded.', 'error');
            return;
        }

        try {
            // Create canvas and context explicitly
            const canvas = document.createElement('canvas');
            if (!canvas) throw new Error("Failed to create canvas element");

            // Append first to ensure it's in DOM (defensive)
            previewArea.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                log('FATAL: canvas.getContext("2d") returned null', 'error');
                throw new Error("Could not get 2D context from canvas");
            }

            // Test context
            try {
                const testData = ctx.createImageData(1, 1);
                log('Context validation: createImageData works', 'success');
            } catch (e) {
                log(`Context validation failed: ${e.message}`, 'error');
            }

            log(`Creating BPGDecoder with context: ${!!ctx}`, 'info');
            const img = new BPGDecoder(ctx);

            // Handle loading
            img.onload = function () {
                log('BPG Image decoded successfully.', 'success');
                // Resize canvas to match image dimensions
                if (this.imageData) {
                    canvas.width = this.imageData.width;
                    canvas.height = this.imageData.height;
                    ctx.putImageData(this.imageData, 0, 0);
                }
            };

            const fileUrl = 'file:///' + outputPath.replace(/\\/g, '/');
            log(`Loading BPG from: ${fileUrl}`, 'info');

            img.load(fileUrl);

        } catch (decoderError) {
            log(`Decoder Error: ${decoderError.message}`, 'error');
        }

    } catch (error) {
        // file.name is not accessible here if we change the scope, let's fix it or just log generic error
        log(`Error converting image: ${error}`, 'error');
    }
}


// Donation and About Handlers
const donateBtn = document.getElementById('donate-btn');
const aboutBtn = document.getElementById('about-btn');
const aboutModal = document.getElementById('about-modal');
const modalCloseBtn = document.querySelector('.close-btn');
const modalDonateBtn = document.getElementById('modal-donate-btn');

function openDonation() {
    // TODO: Replace with your actual Buy Me a Coffee URL
    const donationUrl = 'https://buymeacoffee.com/davemx';
    window.api.openExternal(donationUrl);
}

function openWebsite(e) {
    e.preventDefault();
    const websiteUrl = 'https://bpgconverter.com'; // TODO: Replace with actual website
    window.api.openExternal(websiteUrl);
}

const websiteLink = document.getElementById('website-link');
if (websiteLink) {
    websiteLink.addEventListener('click', openWebsite);
}

const socialLink = document.getElementById('social-link');
if (socialLink) {
    socialLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.api.openExternal('https://linktr.ee/davemx');
    });
}

if (donateBtn) {
    donateBtn.addEventListener('click', openDonation);
}

if (modalDonateBtn) {
    modalDonateBtn.addEventListener('click', openDonation);
}

if (aboutBtn && aboutModal) {
    aboutBtn.addEventListener('click', () => {
        aboutModal.classList.remove('hidden');
    });
}

if (modalCloseBtn && aboutModal) {
    modalCloseBtn.addEventListener('click', () => {
        aboutModal.classList.add('hidden');
    });
}

// Close when clicking outside content
if (aboutModal) {
    aboutModal.addEventListener('click', (e) => {
        if (e.target === aboutModal) {
            aboutModal.classList.add('hidden');
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !aboutModal.classList.contains('hidden')) {
            aboutModal.classList.add('hidden');
        }
    });
}

// Init
updateStatus('', 'hidden');
