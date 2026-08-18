# World Cup 2026 Album Tracker

A React app for tracking your Panini World Cup 2026 sticker album: manage your collection, find duplicates, sort stickers, and trade with others. Packaged as an Android app with Capacitor.

## Compiling the .apk

**Prerequisites:**
- [Node.js](https://nodejs.org/) (v18+)
- [Android Studio](https://developer.android.com/studio) (includes the Android SDK)
- A JDK (bundled with Android Studio)

**Steps:**

1. Install JS dependencies:
   ```
   npm install
   ```
2. Build the web app:
   ```
   npm run build
   ```
   This produces the `dist/` folder that gets packaged into the Android app.
3. Sync the web build into the Android project:
   ```
   npx cap sync android
   ```
4. Build the APK. Either:
   - **Using Android Studio (recommended):**
     1. Open the `android/` folder as a project in Android Studio.
     2. Let Gradle finish syncing (it will prompt you to install any missing SDK components — accept these).
     3. Go to `Build > Build App Bundle(s) / APK(s) > Build APK(s)`.
     4. Once finished, click the "locate" link in the notification, or find the file at `android/app/build/outputs/apk/debug/app-debug.apk`.
   - **Using the command line:**
     ```
     cd android
     ./gradlew assembleDebug
     ```
     (On Windows, use `gradlew.bat assembleDebug`.)
     The APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`.
5. Transfer the `.apk` to an Android device and install it (you may need to allow installing apps from unknown sources).

> Note: this produces a debug build, which is fine for personal use/testing. A release build requires signing with your own keystore.
