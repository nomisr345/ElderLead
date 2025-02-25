// Initialize Firebase (replace with your config)
// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBwGs7j5jMdLNPdhroJLvg6w-FTYagKy7w",
  authDomain: "elderlead-5b34e.firebaseapp.com",
  projectId: "elderlead-5b34e",
  storageBucket: "elderlead-5b34e.firebasestorage.app",
  messagingSenderId: "730495752924",
  appId: "1:730495752924:web:d8ab72c6dacecaa3993219"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Your Firebase code (e.g., Firestore queries) goes here
const db = firebase.firestore(); 

// Fetch image URLs from Firestore
db.collection("images").get().then((querySnapshot) => {
  querySnapshot.forEach((doc) => {
    const imageUrl = doc.data().url; // Assuming your image URL is in a "url" field
    const img = document.createElement("img");
    img.src = imageUrl;
    document.getElementById("image-container").appendChild(img);
  });
});