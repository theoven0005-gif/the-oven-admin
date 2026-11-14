/* Replace these values with the same Firebase web config used by the admin app. */
importScripts('https://www.gstatic.com/firebasejs/12.2.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging-compat.js');
firebase.initializeApp({apiKey:'AIzaSyCQMlQV5vkyIfEqKBwWf2yHd5i1mU11FQY',authDomain:'the-oven-7d3ec.firebaseapp.com',projectId:'the-oven-7d3ec',storageBucket:'the-oven-7d3ec.firebasestorage.app',messagingSenderId:'973819527939',appId:'1:973819527939:web:6f92f708638a654470df36'});
const messaging=firebase.messaging();
messaging.onBackgroundMessage(payload=>{const n=payload.notification||{}; self.registration.showNotification(n.title||'The Oven', {body:n.body||'You have a new update.',icon:'/icon-192.png',data:payload.data||{}});});
