# 📁 SecureLink

**SecureLink** is a secure digital document management platform that allows Indian citizens to store, manage, and share important documents such as mark sheets, PAN cards, passports, and more. It leverages Aadhaar-based identification and email verification to ensure data security, authenticity, and easy access across multiple government and private services.

## 🔐 Features

* **User Registration & Login**
  Register with email and password. Email verification ensures account authenticity.

* **Document Upload**
  Upload important documents like mark sheets, Aadhaar, PAN, certificates, etc., in a secure digital format.

* **Update/Delete Documents**
  Easily manage your documents with update and delete functionality.

* **Document Sharing**
  Securely share your documents online via a unique link. Reduces the need for physical copies.

* **My Profile**
  View and manage your personal details and linked Aadhaar information.

* **Email Verification**
  Users must verify their email before accessing document services to prevent unauthorized access.

## 🧩 Technology Stack

* **Frontend**: React.js
* **Backend**: Firebase Authentication & Firestore
* **Authentication**: Firebase Email/Password + Email Verification
* **Storage**: Firebase Storage for file uploads
* **Design**: SCSS

## 🔧 Setup Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/securelink.git
   cd securelink
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Firebase Configuration**

   * Create a Firebase project from [Firebase Console](https://console.firebase.google.com/)
   * Enable **Email/Password Authentication**
   * Set up **Cloud Firestore** and **Firebase Storage**
   * Replace Firebase config in `/db/firebase.js` with your project's credentials

4. **Run the app locally**

   ```bash
   npm run dev
   ```

## 🔐 Security & Privacy

* User data is securely stored using **Firebase Authentication**, **Firestore**, and **Storage**.
* Documents are accessible only to authenticated and verified users.
* Aadhaar integration (if used) is handled in accordance with Indian data privacy guidelines.

## 📌 Future Enhancements

* Aadhaar-based OTP login
* Offline backup support
* AI-based document classification
* Government API integrations (Passport, Railways, etc.)

## 📄 License

MIT License

---
