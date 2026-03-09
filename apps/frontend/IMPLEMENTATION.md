# Dim Kopi Photo Booth System - Full Stack Implementation Guide

This document outlines the architectural changes required to migrate the current frontend-only (LocalStorage) application to a robust, real-time Full Stack application suitable for a live event environment.

## 1. System Architecture

**Current State:** Client-side state management using `React Context` + `localStorage`.  
**Target State:** Centralized Server Authority with Real-time WebSockets.

```mermaid
graph TD
    Client_Order[Order Panel (iPad/Phone)] -- WebSocket --> Server[Node.js Server]
    Client_Kitchen[Kitchen Panel (Laptop)] -- WebSocket --> Server
    Client_Display[Display Panel (TV)] -- WebSocket --> Server
    Client_Admin[Admin Panel (Laptop)] -- WebSocket --> Server
    
    Server -- Prisma ORM --> DB[(SQLite / PostgreSQL)]
```

### Technology Stack
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Real-time Engine:** Socket.io (v4)
*   **Database:** SQLite (easiest for local events) or PostgreSQL.
*   **ORM:** Prisma
*   **Frontend:** React + Vite (Existing)

---

## 2. Backend Setup

### A. Folder Structure
Create a `server/` directory alongside your existing frontend.

```text
/my-app
  /server
    package.json
    index.ts        # Entry point
    prisma/
      schema.prisma # Database definition
  /src              # Existing Frontend
```

### B. Database Schema (Prisma)
Create `server/prisma/schema.prisma`.

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model MenuItem {
  id          String   @id @default(uuid())
  name        String
  description String
  price       Float
  category    String
  image       String
  available   Boolean  @default(true)
  orderItems  OrderItem[]
}

model Order {
  id           String      @id // Human readable ID like #001
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  status       String      // Enum: QUEUED, ON_AIR, etc.
  total        Float
  customerName String
  isPreorder   Boolean     @default(false)
  items        OrderItem[]
}

model OrderItem {
  id        String   @id @default(uuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  menuItemId String
  menuItem  MenuItem @relation(fields: [menuItemId], references: [id])
  name      String   // Snapshot of name at time of order
  price     Float    // Snapshot of price at time of order
  quantity  Int
}

model Settings {
  key   String @id
  value String // Store booleans/strings here (isStoreOpen, isPreorderMode)
}
```

---

## 3. WebSocket Event Design

Instead of REST API calls for everything, we will use WebSockets for high-frequency updates.

### Server -> Client Events (Broadcasting)

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `init_state` | `{ orders, menu, settings }` | Sent to a client immediately upon connection. |
| `order_updated` | `Order` object | Broadcast when status changes or order is added. |
| `order_deleted` | `orderId` string | Broadcast when an order is removed. |
| `menu_updated` | `MenuItem[]` | Broadcast when admin changes menu. |
| `system_settings` | `{ isStoreOpen, isPreorderMode }` | Broadcast when store status changes. |

### Client -> Server Events (Actions)

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `create_order` | `{ items, customerName, isPreorder }` | Order Panel submits an order. |
| `update_status` | `{ orderId, status }` | Kitchen/Admin updates order flow. |
| `delete_order` | `{ orderId }` | Admin deletes an order. |
| `toggle_setting` | `{ key }` | Admin toggles store open/preorder mode. |

---

## 4. Implementation Steps

### Step 1: Server Implementation Code (`server/index.ts`)

```typescript
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" } // Allow all origins for local event LAN
});
const prisma = new PrismaClient();

// Helper to broadcast full state (Or optimized delta updates)
const broadcastOrders = async () => {
  const orders = await prisma.order.findMany({ 
    include: { items: true }, 
    orderBy: { createdAt: 'desc' } 
  });
  io.emit('orders_sync', orders);
};

io.on('connection', async (socket) => {
  console.log('Client connected:', socket.id);

  // 1. Send Initial State
  const menu = await prisma.menuItem.findMany();
  const orders = await prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } });
  // Get settings logic here...
  
  socket.emit('init_data', { menu, orders });

  // 2. Handle Order Creation
  socket.on('create_order', async (data) => {
    const count = await prisma.order.count();
    const displayId = `#${(count + 1).toString().padStart(3, '0')}`;
    
    await prisma.order.create({
      data: {
        id: displayId,
        customerName: data.customerName,
        total: data.total,
        status: 'QUEUED',
        isPreorder: data.isPreorder,
        items: {
          create: data.items.map((item: any) => ({
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          }))
        }
      }
    });
    
    await broadcastOrders(); // Notify everyone including Kitchen/Display
  });

  // 3. Handle Status Updates
  socket.on('update_status', async ({ orderId, status }) => {
    await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });
    await broadcastOrders();
  });
  
  // 4. Handle Menu Updates (Admin)
  // ... similar logic for menu CRUD
});

httpServer.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
```

### Step 2: Frontend Integration (`EventContext.tsx`)

You need to modify `EventContext.tsx` to stop using `localStorage` and start using `socket.io-client`.

1.  **Install Client:** `npm install socket.io-client`
2.  **Modify Context:**

```typescript
import { io, Socket } from 'socket.io-client';

// ... inside EventProvider ...

const [socket, setSocket] = useState<Socket | null>(null);

useEffect(() => {
  // Connect to backend URL
  const newSocket = io('http://localhost:3001'); // Or your LAN IP e.g., http://192.168.1.50:3001
  setSocket(newSocket);

  newSocket.on('connect', () => console.log('Connected to WebSocket'));

  newSocket.on('init_data', (data) => {
    setMenu(data.menu);
    setOrders(data.orders);
  });

  newSocket.on('orders_sync', (updatedOrders) => {
    setOrders(updatedOrders);
  });

  return () => { newSocket.close(); };
}, []);

// Replace addOrder logic
const addOrder = async (items, total, customerName, isPreorder) => {
  if (socket) {
    socket.emit('create_order', { items, total, customerName, isPreorder });
  }
};

// Replace updateOrderStatus logic
const updateOrderStatus = (orderId, status) => {
  if (socket) {
    socket.emit('update_status', { orderId, status });
  }
};
```

---

## 5. Deployment for Events (LAN Setup)

At an event venue, you usually don't have reliable public internet. You should run this on a **Local Area Network (LAN)**.

1.  **Hardware:** One "Server" Laptop (runs Node.js + Frontend host).
2.  **Network:** A decent WiFi router. Connect the Server Laptop via Ethernet for stability.
3.  **Static IP:** Find the local IP of the Server Laptop (e.g., `192.168.1.100`).
4.  **Running:**
    *   Run Backend: `npm run start:server` (Port 3001)
    *   Run Frontend: `npm run dev -- --host` (Port 5173)
5.  **Connecting Clients:**
    *   Kitchen iPad: Open browser to `http://192.168.1.100:5173`
    *   Order iPad: Open browser to `http://192.168.1.100:5173`
    *   Display TV: Open browser to `http://192.168.1.100:5173/#/display`

**Crucial:** Ensure your `socket.io-client` connection string in `EventContext.tsx` points to `http://192.168.1.100:3001` (the Server IP), not `localhost`, so other devices can find the WebSocket server.

## 6. Security Note

For this specific implementation:
*   **Authentication:** The PIN logic is currently client-side. Move the PIN validation to a socket event (`socket.emit('login', pin)`) which returns a session token or boolean to secure the Admin/Kitchen panels properly.
*   **Validation:** Ensure the backend validates that `items` exist and `prices` match the database before creating orders to prevent client-side tampering.
