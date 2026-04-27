// src/firebase.js
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCgn8JU-SSgphIji26qj_KWzrVWD8qzYxk",
  authDomain: "sevaknet-wb.firebaseapp.com",
  projectId: "sevaknet-wb",
  storageBucket: "sevaknet-wb.firebasestorage.app",
  messagingSenderId: "503421639431",
  appId: "1:503421639431:web:c5cd6cccb4eb50f58543a2"
};

const app = initializeApp(firebaseConfig);

export { app };
