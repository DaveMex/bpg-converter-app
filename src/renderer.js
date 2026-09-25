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
const selectOutputFolderBtn = document.getElementById('select-output-folder-btn');
const resetOutputFolderBtn = document.getElementById('reset-output-folder-btn');
const outputFolderDisplay = document.getElementById('output-folder-display');
const reverseFormatInput = document.getElementById('reverse-format');

let lastConvertedPath = null;
let customOutputDir = null;

// Output Folder Selection
if (selectOutputFolderBtn) {
    selectOutputFolderBtn.addEventListener('click', async () => {
        const folder = await window.api.selectFolder();
        if (folder) {
            customOutputDir = folder;
            if (outputFolderDisplay) {
                outputFolderDisplay.innerText = folder;
                outputFolderDisplay.title = folder;
            }
            if (resetOutputFolderBtn) resetOutputFolderBtn.classList.remove('hidden');
            log(`Output folder set to: ${folder}`, 'info');
        }
    });
}

if (resetOutputFolderBtn) {
    resetOutputFolderBtn.addEventListener('click', () => {
        customOutputDir = null;
        if (outputFolderDisplay) {
            outputFolderDisplay.innerText = 'Same as source';
            outputFolderDisplay.title = 'Same as input image';
        }
        resetOutputFolderBtn.classList.add('hidden');
        log('Output folder reset to source location', 'info');
    });
}

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
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.bpg'];

    // Filter for valid images and BPG files
    const validFiles = files.filter(f => {
        const ext = f.name.toLowerCase();
        return validExtensions.some(validExt => ext.endsWith(validExt));
    });

    if (validFiles.length === 0) {
        log('No valid image (PNG/JPG/WebP) or BPG files found.', 'error');
        return;
    }

    // Clear preview area at start of batch
    previewArea.innerHTML = '';

    log(`Batch started: ${validFiles.length} file(s) found.`, 'info');

    for (let i = 0; i < validFiles.length; i++) {
        log(`Processing ${i + 1} of ${validFiles.length}: ${validFiles[i].name}...`, 'info');
        await processFile(validFiles[i]);
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
            fileName = filePath.split(/[/\\]/).pop();
        } else {
            filePath = window.api.getFilePath(fileOrPath);
            fileName = fileOrPath.name;
        }

        const isBpg = fileName.toLowerCase().endsWith('.bpg');

        if (isBpg) {
            // Conversión inversa: BPG -> PNG o JPEG
            log(`Decoding BPG file: ${fileName}...`, 'info');
            if (typeof BPGDecoder === 'undefined') {
                log('Error: BPGDecoder is not defined. Script might not be loaded.', 'error');
                return;
            }

            const canvas = document.createElement('canvas');
            previewArea.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not get 2D context from canvas");

            const decoder = new BPGDecoder(ctx);

            await new Promise((resolve, reject) => {
                decoder.onload = async function () {
                    try {
                        if (this.imageData) {
                            canvas.width = this.imageData.width;
                            canvas.height = this.imageData.height;
                            ctx.putImageData(this.imageData, 0, 0);

                            const reverseFormat = reverseFormatInput ? reverseFormatInput.value : 'png';
                            const mimeType = reverseFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
                            const dataUrl = canvas.toDataURL(mimeType, 0.95);

                            const savedPath = await window.api.saveDecodedImage({
                                base64Data: dataUrl,
                                originalPath: filePath,
                                outputFormat: reverseFormat,
                                customOutputDir
                            });

                            lastConvertedPath = savedPath;
                            log(`Converted BPG ➔ ${reverseFormat.toUpperCase()}: ${savedPath}`, 'success');
                        }
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                };

                const fileUrl = 'file:///' + filePath.replace(/\\/g, '/');
                decoder.load(fileUrl);
            });

        } else {
            // Conversión normal: Imagen -> BPG
            const outputPath = await window.api.convertImage({
                filePath,
                quality,
                compression,
                encoder,
                customOutputDir
            });

            lastConvertedPath = outputPath;
            log(`Converted Image ➔ BPG: ${outputPath}`, 'success');

            if (typeof BPGDecoder !== 'undefined') {
                try {
                    const canvas = document.createElement('canvas');
                    previewArea.appendChild(canvas);

                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        const img = new BPGDecoder(ctx);
                        await new Promise((resolve) => {
                            img.onload = function () {
                                log('BPG Image decoded preview ready.', 'success');
                                if (this.imageData) {
                                    canvas.width = this.imageData.width;
                                    canvas.height = this.imageData.height;
                                    ctx.putImageData(this.imageData, 0, 0);
                                }
                                resolve();
                            };
                            const fileUrl = 'file:///' + outputPath.replace(/\\/g, '/');
                            img.load(fileUrl);
                        });
                    }
                } catch (decoderError) {
                    log(`Decoder Preview Error: ${decoderError.message}`, 'error');
                }
            }
        }

    } catch (error) {
        log(`Error processing file: ${error}`, 'error');
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
