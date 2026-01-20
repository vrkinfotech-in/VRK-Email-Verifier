# Lifetime Free Email Verifier

A professional, "lifetime free" bulk email verification tool built with React and Firebase Cloud Functions.

![Email Verifier](https://your-screenshot-url-here.com)

## Features 🚀

- **Bulk Verification**: Verify lists of emails (comma or newline separated).
- **Real-Time Streaming**: Results appear instantly as they are processed.
- **Deep Verification**:
  - Syntax Check (Regex)
  - MX Record Lookup (DNS)
  - SMTP Handshake (Ports 25, 587, 2525)
- **Export to CSV**: Download your verification results with one click.
- **Premium UI**: Modern Glassmorphism design with Tailwind CSS.
- **PWA Support**: Installable as a progressive web app.

## Tech Stack 🛠️

- **Frontend**: React (Vite), Tailwind CSS, Framer Motion (Ready)
- **Backend**: Firebase Cloud Functions (Node.js)
- **Services**: Firebase Hosting

## Getting Started

### Prerequisites

- Node.js (v18+)
- Firebase CLI (`npm install -g firebase-tools`)

### Installation

1.  Clone the repo:
    ```bash
    git clone https://github.com/vrkinfotech-in/VRK-Email-Verifier.git
    cd VRK-Email-Verifier
    ```
2.  Install dependencies:
    ```bash
    npm install
    cd functions && npm install && cd ..
    ```

### Running Locally (Emulators)

To test the full backend logic locally:

```bash
npm run build
npx firebase emulators:start
```

Access the app at `http://localhost:5002`.

### Development via Vite

To run the React dev server (with proxy to emulators):

```bash
# Terminal 1: Start Emulators
npx firebase emulators:start

# Terminal 2: Start Vite
npm run dev
```

## Deployment 🌍

Deploy to Firebase (Blaze Plan required for SMTP checks):

```bash
npx firebase login
npx firebase deploy
```

## Setup Notes

- **Port 25 Blocking**: Local ISPs often block port 25. The app attempts fallback ports (587, 2525), but for 100% accuracy, deploy to Firebase Cloud Functions.
# VRK-Email-Verifier
