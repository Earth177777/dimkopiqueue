# DIM KOPI — Photo Queue System

> **Apek ama XII-R1** · R1 Art Exhibition · Dim Kopi Moments

A real-time photo booth queue & booking system built with React + Vite (frontend) and Express + Socket.IO + MongoDB (backend).

---

## Event Info

| | |
|---|---|
| 📅 Date | Senin, 16 Maret 2026 |
| 🕘 Time | 09.00 – 14.00 WIB |
| 📍 Location | XII-R1 (R.310), Gedung B / SMA Maitreyawira |
| 🌐 Website | [r1photobooth.maitreyawira.com](https://r1photobooth.maitreyawira.com) |

---

## Stack

- **Frontend** — React + TypeScript + Vite + TailwindCSS
- **Backend** — Node.js + Express + Socket.IO
- **Database** — MongoDB (Mongoose)

---

## Run Locally

**Prerequisites:** Node.js, MongoDB running locally

### 1. Install all dependencies
```bash
# From the root DIMKOPIQUEUE directory
npm run install:all
```

### 2. Configure environment
Create `apps/backend/.env`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/dimkoiqueue
PORT=5001
```

### 3. Start both servers
```bash
npm run dev
```

- **Frontend** → http://localhost:5173/
- **Backend** → http://localhost:5001/

---

## Panels

| Route | Panel | Description |
|---|---|---|
| `/` | Order Panel | Customer-facing menu & booking |
| `/display` | Display Panel | Live queue board (for the TV/screen) |
| `/admin` | Admin Panel | Staff order management |

---

## Admin Access

On the Order Panel, click the logo **10 times** to open the staff PIN login.
