import { handleUpload } from './functions.js';

const FORM = document.getElementById('email-form');
const FILE_INPUT = document.getElementById('file-upload');
const PHOTOS_INPUT = document.getElementById('photo-urls');
const SUBMIT_BTN = document.getElementById('submit-form-btn');
const PREVIEW = document.querySelector('.preview');

const MAX_FILES = 8;
const MAX_BYTES = 10 * 1024 * 1024;

let previewObjectUrls = [];
let isSubmitting = false;

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
        if (!f.type.startsWith('image/')) {
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

function setSubmittingState(on) {
    isSubmitting = on;
    if (SUBMIT_BTN) SUBMIT_BTN.disabled = on;

    // input vs button
    if (SUBMIT_BTN) {
        if ('value' in SUBMIT_BTN)
            SUBMIT_BTN.value = on ? 'Uploading photos...' : 'Submit message';
        if ('textContent' in SUBMIT_BTN)
            SUBMIT_BTN.textContent = on
                ? 'Uploading photos...'
                : 'Submit message';
    }
}

// 1) On change: preview only (no upload)
FILE_INPUT?.addEventListener('change', () => {
    const files = Array.from(FILE_INPUT.files || []);
    PHOTOS_INPUT.value = ''; // clear URLs when files change

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

// 2) On submit: upload, set hidden URLs, then submit to Webflow
FORM?.addEventListener('submit', async e => {
    if (isSubmitting) return;

    const files = Array.from(FILE_INPUT?.files || []);

    // No files? Let Webflow submit as normal
    if (!files.length) return;

    e.preventDefault();

    if (!validateFiles(files)) {
        FILE_INPUT.value = '';
        clearPreview();
        return;
    }

    setSubmittingState(true);

    try {
        const urls = await handleUpload(files);
        PHOTOS_INPUT.value = urls.join('\n');

        // ✅ Clear ONLY the file input so Webflow doesn't try to process it
        FILE_INPUT.value = '';

        // Now submit to Webflow
        FORM.submit();
    } catch (err) {
        console.error(err);
        alert('Photo upload failed. Please try again.');
    } finally {
        setSubmittingState(false);
    }
});
