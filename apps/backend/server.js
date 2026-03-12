import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import MenuItem from './models/MenuItem.js';
import Order from './models/Order.js';
import Settings from './models/Settings.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Set up directory variables since we are using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from the uploads directory (using /api/uploads so Nginx proxies it)
app.use('/api/uploads', express.static(uploadsDir));

// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, 'img-' + uniqueSuffix + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*" } // Note: For production, set this strictly to the frontend domain
});

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dimkoiqueue';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        // Ensure default settings exist on boot
        const openSetting = await Settings.findOne({ key: 'isStoreOpen' });
        if (!openSetting) await Settings.create({ key: 'isStoreOpen', value: true });

        const preorderSetting = await Settings.findOne({ key: 'isPreorderMode' });
        if (!preorderSetting) await Settings.create({ key: 'isPreorderMode', value: false });

        const photoboothTerms = [
            "Exact Cash Only — No change provided.",
            "Patience is Key — Wait for your ID.",
            "Final Sale — No refunds.",
            "Smile! — We might share cool shots."
        ];
        const foodTerms = [
            "Exact Cash Only — No change provided.",
            "Freshly Made — Good food needs patience!",
            "Final Sale — No refunds.",
            "Allergen Notice — Inform staff of allergies."
        ];

        if (!await Settings.findOne({ key: 'terms_photobooth' })) {
            await Settings.create({ key: 'terms_photobooth', value: photoboothTerms });
        }
        if (!await Settings.findOne({ key: 'terms_food' })) {
            await Settings.create({ key: 'terms_food', value: foodTerms });
        }

        // Migration: Update existing menu items with old image urls
        // from `/uploads/` to `/api/uploads/` so they resolve correctly
        const menuItemsToMigrate = await MenuItem.find({ image: { $regex: '/uploads/' } });
        for (let item of menuItemsToMigrate) {
            item.image = item.image.replace('/uploads/', '/api/uploads/');
            await item.save();
        }
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Helper to broadcast state updates
const broadcastState = async () => {
    try {
        const orders = await Order.find().sort({ timestamp: -1 });
        const menu = await MenuItem.find();

        const storeStatusDb = await Settings.findOne({ key: 'isStoreOpen' });
        const preorderModeDb = await Settings.findOne({ key: 'isPreorderMode' });
        const termsPhoto = await Settings.findOne({ key: 'terms_photobooth' });
        const termsFood = await Settings.findOne({ key: 'terms_food' });

        io.emit('state_update', {
            orders,
            menu,
            settings: {
                isStoreOpen: storeStatusDb ? storeStatusDb.value : true,
                isPreorderMode: preorderModeDb ? preorderModeDb.value : false,
                terms_photobooth: termsPhoto ? termsPhoto.value : [],
                terms_food: termsFood ? termsFood.value : []
            }
        });
    } catch (err) {
        console.error('Error broadcasting state:', err);
    }
};

// Routes
app.get('/', (req, res) => {
    res.send('Dim Kopi Queue API Running');
});

// Image Upload Route
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
    }
    // Return the URL where the image can be accessed
    // Using /api/uploads to hit the proxy bypass for nginx
    const imageUrl = `/api/uploads/${req.file.filename}`;
    res.json({ url: imageUrl });
});

// Routes (Optional API access)
app.get('/api/state', async (req, res) => {
    try {
        const orders = await Order.find().sort({ timestamp: -1 });
        const menu = await MenuItem.find();
        const settingsList = await Settings.find();

        const settings = settingsList.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        res.json({ orders, menu, settings });
    } catch (err) {
        res.status(500).json({ error: 'Server error parsing state' });
    }
});

// Socket.IO Logic
io.on('connection', async (socket) => {
    console.log('Client connected:', socket.id);

    // Send Initial State
    try {
        const orders = await Order.find().sort({ timestamp: -1 });
        const menu = await MenuItem.find();
        const storeStatusDb = await Settings.findOne({ key: 'isStoreOpen' });
        const preorderModeDb = await Settings.findOne({ key: 'isPreorderMode' });
        const termsPhoto = await Settings.findOne({ key: 'terms_photobooth' });
        const termsFood = await Settings.findOne({ key: 'terms_food' });

        socket.emit('init_data', {
            orders,
            menu,
            settings: {
                isStoreOpen: storeStatusDb ? storeStatusDb.value : true,
                isPreorderMode: preorderModeDb ? preorderModeDb.value : false,
                terms_photobooth: termsPhoto ? termsPhoto.value : [],
                terms_food: termsFood ? termsFood.value : []
            }
        });
    } catch (err) {
        console.error("Error sending init_data:", err);
    }

    /* ORDER EVENTS */
    socket.on('create_order', async (data) => {
        try {
            const masterCategory = data.masterCategory || 'photobooth';
            const prefix = masterCategory === 'food' ? 'F' : 'P';
            const orderCount = await Order.countDocuments({ masterCategory });
            const newDisplayId = `${prefix}#${(orderCount + 1).toString().padStart(3, '0')}`;

            const newOrder = new Order({
                id: newDisplayId,
                items: data.items,
                total: data.total,
                customerName: data.customerName,
                customerClass: data.customerClass,
                isPreorder: data.isPreorder,
                masterCategory,
                status: 'QUEUED'
            });
            await newOrder.save();
            // Emit confirmation back to the customer who placed the order
            socket.emit('order_confirmed', {
                displayId: newDisplayId,
                total: data.total,
                customerName: data.customerName,
                customerClass: data.customerClass,
                isPreorder: data.isPreorder,
                masterCategory,
                items: data.items,
            });
            await broadcastState();
        } catch (err) {
            console.error("Create order error:", err);
        }
    });

    socket.on('update_order_status', async ({ orderId, status }) => {
        try {
            await Order.findOneAndUpdate({ id: orderId }, { status });
            await broadcastState();
        } catch (err) {
            console.error("Update status error:", err);
        }
    });

    socket.on('delete_order', async (orderId) => {
        try {
            await Order.findOneAndDelete({ id: orderId });
            await broadcastState();
        } catch (err) {
            console.error("Delete order err:", err);
        }
    });

    /* MENU EVENTS */
    socket.on('add_menu_item', async (item) => {
        try {
            await MenuItem.create(item);
            await broadcastState();
        } catch (err) {
            console.error("Add menu err", err);
        }
    });

    socket.on('update_menu_item', async (item) => {
        try {
            await MenuItem.findOneAndUpdate({ id: item.id }, item);
            await broadcastState();
        } catch (err) {
            console.error("Update menu err", err);
        }
    });

    socket.on('delete_menu_item', async (id) => {
        try {
            await MenuItem.findOneAndDelete({ id });
            await broadcastState();
        } catch (err) {
            console.error("Delete menu err:", err);
        }
    });

    socket.on('toggle_item_availability', async (id) => {
        try {
            const item = await MenuItem.findOne({ id });
            if (item) {
                item.available = !item.available;
                await item.save();
                await broadcastState();
            }
        } catch (err) {
            console.error("Toggle menu err", err);
        }
    });

    /* ADMIN / SYSTEM EVENTS */
    socket.on('toggle_store_open', async () => {
        try {
            const setting = await Settings.findOne({ key: 'isStoreOpen' });
            if (setting) {
                setting.value = !setting.value;
                await setting.save();
                await broadcastState();
            }
        } catch (err) { console.error(err); }
    });

    socket.on('toggle_preorder_mode', async () => {
        try {
            const setting = await Settings.findOne({ key: 'isPreorderMode' });
            if (setting) {
                setting.value = !setting.value;
                await setting.save();
                await broadcastState();
            }
        } catch (err) { console.error(err); }
    });

    socket.on('update_setting', async ({ key, value }) => {
        try {
            await Settings.findOneAndUpdate({ key }, { value }, { upsert: true });
            await broadcastState();
        } catch (err) { console.error("Update setting error:", err); }
    });

    socket.on('reset_system', async () => {
        try {
            // DANGEROUS! Clears DB for demo
            await Order.deleteMany({});
            await MenuItem.deleteMany({});

            // Seed with initial menu (sync with constants.ts)
            const INITIAL_MENU = [
                // PHOTOBOOTH
                { id: '1', name: 'Classic Photostrip (2x6)', description: 'The retro standard.', price: 5, category: 'Strips', masterCategory: 'photobooth', image: 'https://images.unsplash.com/photo-1595078475328-1ab05d0a6a0e?q=80&w=400&auto=format&fit=crop', available: true },
                { id: '2', name: 'Landscape Postcard (4x6)', description: 'Single high-res shot', price: 8, category: 'Landscape', masterCategory: 'photobooth', image: 'https://images.unsplash.com/photo-1554048612-387768052bf7?q=80&w=400&auto=format&fit=crop', available: true },
                { id: '3', name: 'Black & White Moody', description: 'High contrast B&W filter.', price: 6, category: 'Strips', masterCategory: 'photobooth', image: 'https://images.unsplash.com/photo-1517260739337-6799d2df9c97?q=80&w=400&auto=format&fit=crop', available: true },
                { id: '4', name: 'Digital GIF Only', description: '4 fast poses stitched into a boomerang GIF.', price: 3, category: 'Digital', masterCategory: 'photobooth', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=400&auto=format&fit=crop', available: true },
                { id: '5', name: 'Vintage Sepia Portrait', description: 'Old-school warm tone portrait.', price: 7.5, category: 'Landscape', masterCategory: 'photobooth', image: 'https://images.unsplash.com/photo-1533158307587-828f0a76ef93?q=80&w=400&auto=format&fit=crop', available: true },
                { id: '6', name: 'Glitter Frame Add-on', description: 'Physical magnetic glitter frame.', price: 4, category: 'Add-ons', masterCategory: 'photobooth', image: 'https://images.unsplash.com/photo-1602406711708-66258908f9c7?q=80&w=400&auto=format&fit=crop', available: true },

                // FOOD
                { id: 'f1', name: 'Kopi Hitam', description: 'Strong black coffee brewed fresh.', price: 2, category: 'Drinks', masterCategory: 'food', image: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?q=80&w=400&auto=format&fit=crop', available: true },
                { id: 'f2', name: 'Teh Susu Tarik', description: 'Creamy pulled milk tea.', price: 2.5, category: 'Drinks', masterCategory: 'food', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=400&auto=format&fit=crop', available: true },
                { id: 'f3', name: 'Mie Goreng Special', description: 'Stir-fried noodles with egg.', price: 5, category: 'Mains', masterCategory: 'food', image: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?q=80&w=400&auto=format&fit=crop', available: true },
                { id: 'f4', name: 'Nasi Goreng R1', description: 'Signature fried rice.', price: 6, category: 'Mains', masterCategory: 'food', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=400&auto=format&fit=crop', available: true },
                { id: 'f5', name: 'Snack Plate', description: 'Assorted bites.', price: 4, category: 'Snacks', masterCategory: 'food', image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=400&auto=format&fit=crop', available: true },
                { id: 'f6', name: 'Es Kopi Susu', description: 'Iced coffee with sweet milk.', price: 3.5, category: 'Drinks', masterCategory: 'food', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=400&auto=format&fit=crop', available: true }
            ];
            await MenuItem.insertMany(INITIAL_MENU);

            await broadcastState();
        } catch (err) {
            console.error("Reset system err", err);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
