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

    // No files? let Webflow submit normally
    if (!files.length) return;

    e.preventDefault();

    if (!validateFiles(files)) return;

    setSubmittingState(true);

    const wrap = document.getElementById('file-upload-wrap');
    const placeholder = document.createComment('file input removed');

    try {
        const urls = await handleUpload(files);
        PHOTOS_INPUT.value = urls.join('\n');

        // ---- critical: remove file input from the form before submitting ----
        if (wrap && wrap.parentNode) {
            wrap.parentNode.insertBefore(placeholder, wrap);
            wrap.remove();
        } else {
            // fallback: disable + remove name so Webflow can't serialize it
            FILE_INPUT.disabled = true;
            FILE_INPUT.removeAttribute('name');
        }

        console.log(PHOTOS_INPUT.value);
        console.log(FILE_INPUT.value);
        // submit to Webflow (no file field present)
        FORM.submit();
    } catch (err) {
        console.error(err);
        alert('Photo upload failed. Please try again.');
    } finally {
        setSubmittingState(false);

        // put the file input back so user can try again without refresh
        if (placeholder.parentNode && wrap) {
            placeholder.parentNode.insertBefore(wrap, placeholder);
            placeholder.remove();
        } else if (FILE_INPUT) {
            FILE_INPUT.disabled = false;
        }
    }
});
