import {
    ref,
    uploadBytes,
    getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js';

import { storage } from './firebaseConfig.js';

function safeName(name) {
    return String(name || 'photo').replace(/[^\w.-]+/g, '_');
}

//upload file (File API instance inherits Blob properties)
async function uploadFile(file) {
    try {
        const filename = safeName(file.name);
        const id = Math.random().toString(16).slice(2);
        const path = `quote-uploads/${Date.now()}-${id}-${filename}`;

        const storageRef = ref(storage, path);

        const metaData = {
            size: file.size,
            contentType: file.type,
        };

        const uploadResult = await uploadBytes(storageRef, file, metaData); //returns uploadResult -> uploadResult.FullMetaData.fullPath

        const photoURL = await getDownloadURL(uploadResult.ref);

        return photoURL;
    } catch (e) {
        console.error('Upload failed', e);

        throw e;
    }
}

async function handleUpload(files) {
    try {
        const urls = [];

        for (const file of files) {
            const url = await uploadFile(file);

            urls.push(url);
        }

        return urls;
    } catch (e) {
        throw e;
    }
}

export { handleUpload };
