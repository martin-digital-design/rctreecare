import { handleUpload } from './functions.js';

const FORM = document.getElementById('email-form');
const FILE_INPUT = document.getElementById('file-upload');
const PHOTOS_INPUT = document.getElementById('photo-urls');
const SUBMIT_BTN = document.getElementById('submit-form-btn');
const PREVIEW = document.querySelector('.preview');

const MAX_FILES = 8;
const MAX_BYTES = 10 * 1024 * 1024;

let uploading = false;
let previewObjectUrls = [];

function clearPreview() {
    // cleanup old object URLs to avoid memory leaks
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
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.gap = '6px';

        // Image thumbnail
        const img = document.createElement('img');
        img.style.width = '100%';
        img.style.height = '90px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';

        const url = URL.createObjectURL(file);
        previewObjectUrls.push(url);
        img.src = url;

        item.appendChild(img);
        list.appendChild(item);
    });

    PREVIEW.appendChild(list);
}

// --- Validation ---
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

// --- UI state ---
function setUploadingState(isUploading) {
    uploading = isUploading;
    if (SUBMIT_BTN) SUBMIT_BTN.disabled = isUploading;

    // Optional: change button label
    if (SUBMIT_BTN) {
        SUBMIT_BTN.value = isUploading
            ? 'Uploading photos...'
            : 'Submit message';
    }
}

// --- Main change handler ---
async function onFilesSelected() {
    const files = Array.from(FILE_INPUT?.files || []);
    PHOTOS_INPUT.value = ''; // reset URLs each time user changes selection

    clearPreview();

    if (!files.length) return;

    if (!validateFiles(files)) {
        FILE_INPUT.value = '';
        return;
    }

    // show previews immediately
    renderPreview(files);

    // upload in background (but block submit)
    setUploadingState(true);

    try {
        const urls = await handleUpload(files); // your function returns urls OR you can modify it to do so
        PHOTOS_INPUT.value = urls.join('\n');
    } catch (e) {
        console.error(e);
        alert('Photo upload failed. Please try again.');
        FILE_INPUT.value = '';
        PHOTOS_INPUT.value = '';
        clearPreview();
    } finally {
        setUploadingState(false);
    }
}

FILE_INPUT?.addEventListener('change', onFilesSelected);

// Prevent form submit while uploading
FORM?.addEventListener('submit', e => {
    if (uploading) {
        e.preventDefault();
        alert('Photos are still uploading—please wait a moment.');
    }
});
