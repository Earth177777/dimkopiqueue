import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true, min: 0 },
    category: String,
    masterCategory: { type: String, enum: ['photobooth', 'food'], default: 'photobooth' },
    image: String,
    available: Boolean,
    quantity: { type: Number, required: true, min: 1 }
});

const orderSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    timestamp: {
        type: Number,
        required: true,
        default: () => Date.now()
    },
    items: [orderItemSchema],
    status: {
        type: String,
        enum: ['QUEUED', 'ON_AIR', 'CHOOSING', 'PRINTING', 'COOKING', 'READY', 'COMPLETED', 'CANCELLED'],
        default: 'QUEUED'
    },
    masterCategory: {
        type: String,
        enum: ['photobooth', 'food'],
        default: 'photobooth'
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    customerName: {
        type: String,
        default: ''
    },
    customerClass: {
        type: String,
        default: ''
    },
    isPreorder: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

export default Order;
