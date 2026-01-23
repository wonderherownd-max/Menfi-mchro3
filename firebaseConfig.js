// firebaseConfig.js
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCuZwYapa7LBRg4OOzcHLWFBpfSrjEVQ0U",
  authDomain: "vip-mining.firebaseapp.com",
  projectId: "vip-mining",
  storageBucket: "vip-mining.appspot.com",
  messagingSenderId: "205041694428",
  appId: "1:205041694428:web:5b90ab2cc31b118d8be619",
  databaseURL: "https://vip-mining.firebaseio.com"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
