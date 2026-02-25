import { handleUpload } from './functions.js';

const FORM = document.getElementById('email-form');
const FILE_INPUT = document.getElementById('file-upload');
const PHOTOS_INPUT = document.getElementById('photo-urls');
const SUBMIT_BTN = document.getElementById('submit-form-btn');
const PREVIEW = document.querySelector('.preview');

const MAX_FILES = 8;
const MAX_BYTES = 10 * 1024 * 1024;

let previewObjectUrls = [];
let isUploading = false;
let allowNativeSubmit = false;

if (!FORM) console.warn('[Upload] Form not found (#email-form).');
if (!FILE_INPUT) console.warn('[Upload] File input not found (#file-upload).');
if (!PHOTOS_INPUT)
    console.warn('[Upload] Photos input not found (#photo-urls).');
if (!SUBMIT_BTN)
    console.warn('[Upload] Submit button not found (#submit-form-btn).');

function clearPreview() {
    previewObjectUrls.forEach(u => URL.revokeObjectURL(u));
    previewObjectUrls = [];
    if (PREVIEW) PREVIEW.innerHTML = '';
}

function renderPreview(files) {
    clearPreview();
    if (!PREVIEW) return;

    const list = document.createElement('div');
    list.style.display = 'grid';
    list.style.gridTemplateColumns = 'repeat(auto-fill, minmax(90px, 1fr))';
    list.style.gap = '16px';

    files.forEach(file => {
        const img = document.createElement('img');
        img.style.width = '100%';
        img.style.height = '90px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';

        const url = URL.createObjectURL(file);
        previewObjectUrls.push(url);
        img.src = url;

        list.appendChild(img);
    });

    PREVIEW.appendChild(list);
}

function validateFiles(files) {
    if (files.length > MAX_FILES) {
        alert(`Please upload up to ${MAX_FILES} photos.`);
        return false;
    }
    for (const f of files) {
        if (!f.type?.startsWith('image/')) {
            alert('Please upload images only (JPG/PNG/HEIC).');
            return false;
        }
        if (f.size > MAX_BYTES) {
            alert(
                'One or more photos exceed 10MB. Please choose smaller files.',
            );
            return false;
        }
    }
    return true;
}

function setUploadingState(on) {
    isUploading = on;
    if (SUBMIT_BTN) SUBMIT_BTN.disabled = on;

    if (SUBMIT_BTN) {
        const label = on ? 'Uploading photos...' : 'Submit message';
        if ('value' in SUBMIT_BTN) SUBMIT_BTN.value = label;
        SUBMIT_BTN.textContent = label;
    }
}

function setPhotosValue(value) {
    if (!PHOTOS_INPUT) return;
    PHOTOS_INPUT.value = value;

    // Help any listeners (including Webflow's) observe the change
    PHOTOS_INPUT.dispatchEvent(new Event('input', { bubbles: true }));
    PHOTOS_INPUT.dispatchEvent(new Event('change', { bubbles: true }));
}

// 1) On file change: preview only (no upload)
FILE_INPUT?.addEventListener('change', () => {
    const files = Array.from(FILE_INPUT.files || []);
    setPhotosValue(''); // clear URLs when files change

    if (!files.length) {
        clearPreview();
        return;
    }

    if (!validateFiles(files)) {
        FILE_INPUT.value = '';
        clearPreview();
        return;
    }

    renderPreview(files);
});

// 2) On submit: intercept BEFORE Webflow (capture), upload, set hidden URLs, then allow ONE native submit
FORM?.addEventListener(
    'submit',
    async e => {
        // Second pass: allow Webflow/native handler to proceed exactly once
        if (allowNativeSubmit) {
            allowNativeSubmit = false;
            return;
        }

        const files = Array.from(FILE_INPUT?.files || []);

        // No files selected: let Webflow submit normally
        if (!files.length) return;

        // First pass: block Webflow from submitting until uploads are done
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (isUploading) return;

        if (!validateFiles(files)) {
            FILE_INPUT.value = '';
            clearPreview();
            return;
        }

        setUploadingState(true);

        try {
            const urls = await handleUpload(files);

            // Put URLs into the Webflow field
            setPhotosValue(urls.join('\n\n'));

            // Clear ONLY the file input (avoid Webflow trying to handle the files)
            FILE_INPUT.value = '';

            // Trigger a single "real" submit (this time we let it through)
            allowNativeSubmit = true;

            if (typeof FORM.requestSubmit === 'function') {
                FORM.requestSubmit(SUBMIT_BTN || undefined);
            } else if (SUBMIT_BTN) {
                // Fallback: clicking is better than FORM.submit() because it goes through Webflow handler
                SUBMIT_BTN.click();
            } else {
                // Last resort (may bypass Webflow handlers in some setups)
                FORM.submit();
            }
        } catch (err) {
            console.error(err);
            alert('Photo upload failed. Please try again.');
        } finally {
            setUploadingState(false);
        }
    },
    true, // ✅ capture phase so we run before Webflow's submit handler
);
