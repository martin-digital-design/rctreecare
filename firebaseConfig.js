// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: 'AIzaSyBFvNA1RNnICrRbI9iuhHKxyhvJ_ocuwUQ',
    authDomain: 'rc-tree-care-a6d8e.firebaseapp.com',
    projectId: 'rc-tree-care-a6d8e',
    storageBucket: 'rc-tree-care-a6d8e.firebasestorage.app',
    messagingSenderId: '1094337910470',
    appId: '1:1094337910470:web:7be929e35bcd8740b4a9c7',
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { app, storage };
