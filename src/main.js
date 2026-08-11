import { createApp } from "vue";
import App from "./App.vue";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDgJtWfPzpONB0Mx-mIFhhYiRohcDi5u88",
  authDomain: "spotigraph-backend.firebaseapp.com",
  projectId: "spotigraph-backend",
  storageBucket: "spotigraph-backend.appspot.com",
  messagingSenderId: "288873394410",
  appId: "1:288873394410:web:2703e79f9f00e70cef2793",
  measurementId: "G-617SNRXMY9"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const analytics = getAnalytics(firebaseApp);

export { analytics };
import "./assets/main.css";

const app = createApp(App);

app.mount("#app");
