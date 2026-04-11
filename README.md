# 🏋️‍♂️ FitForge - Professional Fitness & Nutrition Tracker

**FitForge** is a modern, lightweight, and fully responsive Web Application designed to help users track their workouts, nutrition, and fitness progress. Built as a **Progressive Web App (PWA)**, it offers a seamless native-like experience on both desktop and mobile, with robust offline capabilities and enterprise-grade security.

## 🌟 Key Features

* **⚡ PWA Ready:** Installable on any device (iOS, Android, Desktop) acting just like a native app.
* **🔄 Advanced Offline Support & Sync:** Built with Service Workers for instant UI loading and **Firestore Offline Persistence**. Users can log workouts and meals completely offline. The app automatically syncs data to the cloud seamlessly once the internet connection is restored.
* **🔒 Robust Security:** * Implemented strict **Firebase Security Rules** ensuring complete data privacy (users can only read/write their own specific documents).
  * API keys and Firebase connections are strictly domain-restricted via Google Cloud to prevent unauthorized access and quota abuse.
* **🍏 Nutrition Tracking:** Log meals, track calories, and monitor macros (Protein, Carbs, Fats) with visual progress bars.
* **💪 Workout Planner:** Create and manage workout programs, log exercises, sets, reps, and weights.
* **📊 Progress Analytics & Gamification:** Keep track of daily goals, view historical data, and maintain workout streaks with animated UI feedbacks.
* **🌙 Dynamic Theming:** Dark/Light mode that automatically adapts to system preferences using CSS Custom Properties.
* **☁️ Real-time Cloud Sync:** Securely authenticate and save data using Firebase Authentication and Firestore.

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3 (Advanced custom properties, Flexbox/Grid)
* **Logic:** Vanilla JavaScript (ES6+)
* **PWA:** Web Manifest & Service Workers caching
* **Database & Auth:** Firebase v10 (Firestore & Authentication)
* **Typography:** Google Fonts (DM Sans & Outfit)

## 📱 Installation (PWA)

* **On Mobile (iOS/Android):** Open the site in your browser (Safari/Chrome) and select "Add to Home Screen".
* **On Desktop:** Click the install icon in the browser's address bar.

## 📁 Project Structure

```text
├── index.html       # Main application structure & layout
├── styling.css      # Custom UI components & theme variables
├── scriptt.js       # Core application logic, database config & state management
├── sw.js            # Service Worker for App Shell caching
├── manifest.json    # PWA configuration
└── icons/           # App icons and splash screens