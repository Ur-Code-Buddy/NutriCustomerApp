# Nutri Tiffin - Fresh Home-Cooked Meals Delivered 🍱

> **A React Native mobile application connecting food lovers with authentic home kitchens.**

![Expo](https://img.shields.io/badge/Expo-Go-000020?style=for-the-badge&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

## 📖 About the Project

**Nutri Tiffin** solves the daily dilemma of finding healthy, affordable, and homely food. The app acts as a bridge between busy individuals and passionate home chefs ("Kitchens"). Users can browse kitchens, explore diverse menus, manage their orders, and enjoy seamless food delivery.

Built with **Expo** and **TypeScript**, this project demonstrates modern React Native development practices, including file-based routing with **Expo Router**, secure authentication flows, and persistent local state management.

---

## ✨ Key Features

- **🏠 Kitchen Discovery**: Browse a list of verified home kitchens offering distinct menus. Be it North Indian, South Indian, or Continental - find it all.
- **🛒 Smart Cart Management**:
    - Add/remove items with intuitive quantity controls.
    - **Context-Aware Cart**: Ensures orders are placed from a single kitchen to simplify logistics (prompts user before clearing cart if switching kitchens).
    - **Persistence**: Cart state is saved locally using `expo-secure-store`, so users never lose their selection even if they restart the app.
- **🔐 Secure Authentication**: 
    - Full Login/Register flow.
    - JWT-based authentication with `Axios` interceptors.
    - Token storage in secure hardware-backed storage.
- **📦 Order Tracking**: Create orders seamlessly and track order history in the "My Orders" tab.
- **👤 User Profile**: Manage personal details and account settings.

---

## 🛠️ Technical Architecture & Stack

This project is structured for scalability and maintainability.

### **Core Stack**
- **Framework**: [Expo SDK 54](https://expo.dev/) (Managed Workflow; payments use a **development build** — see below)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict typing for robustness)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing v3)
- **Networking**: [Axios](https://axios-http.com/) (Centralized API service with interceptors)

### **State Management**
- **React Context API**: Used for global state to avoid prop drilling, specifically for:
    - `AuthContext`: Manages user session, login/logout, and token hydration.
    - `CartContext`: Handles detailed cart logic (add/remove items, total calculation, kitchen validation).

### **Data Persistence**
- **Expo Secure Store**: Used over AsyncStorage for sensitive data (Auth Tokens) and critical user state (Cart contents) to ensure security and reliability.

### **UI/UX**
- **Icons**: `lucide-react-native` for modern, clean iconography.
- **Styling**: `StyleSheet` with a centralized `Colors` constant for theming consistency (Dark/Light mode ready setup).

---

## 📂 Project Structure

```bash
nutri_customerApp/
├── app/                  # Expo Router pages (screens)
│   ├── (auth)/           # Authentication stack (Login/Register)
│   ├── (tabs)/           # Main App Tabs (Kitchens, Orders, Profile)
│   ├── kitchen/[id].tsx  # Dynamic route for Kitchen Details
│   ├── cart.tsx          # Cart Modal Screen
│   └── _layout.tsx       # Root Layout & Providers
├── components/           # Reusable UI components
├── context/              # Global State (Auth, Cart)
├── services/             # API integration (Axios instance, endpoints)
├── constants/            # App-wide constants (Colors, config)
└── assets/               # Images and Fonts
```

---

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites
- **Node.js** (v18 or higher)
- **Expo Go** app installed on your physical device (Android/iOS) or an Emulator.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/nutri-customer-app.git
   cd nutri_customerApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   - Optional: set `EXPO_PUBLIC_API_BASE_URL` (e.g. in a root `.env` file). If unset, the app uses production: `https://backend.v1.nutritiffin.com`.
   - Never put Razorpay **key secret** in the client; checkout uses the **public key** returned by `POST /payments/initiate`.

4. **Run the app**
   ```bash
   npx expo start
   ```

5. **Scan & Go**
   - Scan the QR code with your phone's camera (iOS) or the Expo Go app (Android).

---

## Payments (Razorpay + NutriTiffin backend)

Checkout uses the official [`react-native-razorpay`](https://github.com/razorpay/react-native-razorpay) native module. **Expo Go does not include it** — use a dev or production native build:

```bash
npx expo prebuild
npx expo run:android
# or: npx expo run:ios
```

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_BASE_URL` | No | API origin (default: `https://backend.v1.nutritiffin.com`). No secrets. |

### API call sequence (authenticated `CLIENT` JWT)

All requests send `Authorization: Bearer <access_token>` (handled in `services/api.ts`).

1. **`POST /payments/initiate`** — Body matches a place-order payload: `kitchen_id`, `scheduled_for` (`YYYY-MM-DD`, 1–3 days ahead in the cart UI), `items: [{ food_item_id, quantity }]`.  
   **Response:** `razorpayOrderId`, `publicKey` (Razorpay Key ID). Optional `amount` (paise) if the backend returns it; otherwise the app falls back to the same rupee total shown on the cart (subtotal + platform + delivery), in paise.

2. **Razorpay Standard Checkout** — Native UI with `key`, `order_id`, `amount` (paise), and user prefill from profile.

3. **`POST /payments/confirm`** — Body: `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature` from Razorpay success, plus **`originalDto` identical** to the initiate body. On transient network errors after a successful payment, the app retries confirm a few times (idempotent-friendly).

4. **Orders UI** — Existing `GET /orders` and `GET /orders/:id` after success.

**Legacy:** `POST /orders` remains in `orderService.create` for a non-payment path if you need it; the cart flow uses initiate → Razorpay → confirm.

---

## 🔮 Future Roadmap & Improvements

To demonstrate forward-thinking product development, here are planned enhancements:

- [ ] **Push Notifications**: Integrate Expo Notifications for order status updates.
- [ ] **Real-time Tracking**: utilize Maps API to track delivery partners.
- [x] **Payment gateway**: Razorpay via initiate/confirm + native checkout (dev build).
- [ ] **Review System**: Allow users to rate kitchens and dishes.
- [ ] **Dark Mode Support**: Fully leverage the `Colors` constant for dynamic theme switching.

---

## 🤝 Contributing

Contributions are welcome! If you have suggestions or bug fixes, please fork the repository and create a pull request.

---

Note: This project is part of a larger ecosystem for the Nutri Tiffin service.
