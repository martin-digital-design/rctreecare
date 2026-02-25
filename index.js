import { handleUpload } from './functions.js';

const FORM = document.getElementById('email-form');
const FILE_INPUT = document.getElementById('file-upload');
const SUBMIT_BTN = document.getElementById('submit-form-btn');
const PREVIEW = document.querySelector('.preview');

const MAX_FILES = 8;
const MAX_BYTES = 10 * 1024 * 1024;

let previewObjectUrls = [];
let isSubmitting = false;
let allowSubmit = false;

function getPhotosField() {
    // ✅ target what Webflow serializes
    return (
        FORM?.querySelector('[data-name="Photos"]') ||
        FORM?.querySelector('[name="Photos"]')
    );
}

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

    if (SUBMIT_BTN) {
        if ('value' in SUBMIT_BTN)
            SUBMIT_BTN.value = on ? 'Uploading photos...' : 'Submit message';
        if ('textContent' in SUBMIT_BTN)
            SUBMIT_BTN.textContent = on
                ? 'Uploading photos...'
                : 'Submit message';
    }
}

// On change: preview only (no upload)
FILE_INPUT?.addEventListener('change', () => {
    const files = Array.from(FILE_INPUT.files || []);
    const photosField = getPhotosField();
    if (photosField) photosField.value = '';

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

// On submit: upload, set hidden URLs, then resubmit normally
FORM?.addEventListener('submit', async e => {
    if (allowSubmit) {
        allowSubmit = false;
        return;
    }

    if (isSubmitting) {
        e.preventDefault();
        return;
    }

    const files = Array.from(FILE_INPUT?.files || []);
    if (!files.length) return; // no files -> normal Webflow submit

    e.preventDefault();

    if (!validateFiles(files)) {
        FILE_INPUT.value = '';
        clearPreview();
        return;
    }

    setSubmittingState(true);

    try {
        const urls = await handleUpload(files);

        const photosField = getPhotosField();
        if (!photosField) {
            console.error('Photos field not found inside the submitted form.');
            alert(
                'Photos field not found. Check the field is inside the form and named "Photos".',
            );
            return;
        }

        photosField.value = urls.join('\n');

        // ✅ force Webflow to notice the update
        photosField.dispatchEvent(new Event('input', { bubbles: true }));
        photosField.dispatchEvent(new Event('change', { bubbles: true }));

        // optional: prove it in console right before submit
        console.log('Submitting Photos value:', photosField.value);

        FILE_INPUT.value = '';

        allowSubmit = true;
        if (typeof FORM.requestSubmit === 'function') {
            FORM.requestSubmit(SUBMIT_BTN || undefined);
        } else {
            SUBMIT_BTN?.click();
        }
    } catch (err) {
        console.error(err);
        alert('Photo upload failed. Please try again.');
    } finally {
        setSubmittingState(false);
    }
});
