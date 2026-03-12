import React, { useState, useMemo } from 'react';
import { useEvent } from '../context/EventContext';
import { MenuItem, OrderStatus, PHOTOBOOTH_CATEGORIES, FOOD_CATEGORIES } from '../types';
import { Trash2, Plus, Sparkles, AlertTriangle, RefreshCw, LayoutDashboard, Pencil, Camera, ClipboardList, Ban, CheckCircle2, Store, ShoppingBasket, TrendingUp, DollarSign, PieChart, BarChart3, Printer, Download, UtensilsCrossed } from 'lucide-react';

export const AdminPanel: React.FC = () => {
    const {
        menu, orders, isStoreOpen, isPreorderMode, settings,
        addMenuItem, updateMenuItem, deleteMenuItem, toggleItemAvailability,
        resetSystem, deleteOrder, updateOrderStatus, toggleStoreOpen, togglePreorderMode, updateSetting, isConnected
    } = useEvent();

    // View State
    const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'finance' | 'settings'>('menu');
    const [orderFilter, setOrderFilter] = useState<'all' | 'photobooth' | 'food'>('all');

    // Menu Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newItemCategory, setNewItemCategory] = useState('');
    const [newItemMasterCategory, setNewItemMasterCategory] = useState<MenuItem['masterCategory']>('photobooth');
    const [newItemDescription, setNewItemDescription] = useState('');
    const [newItemImage, setNewItemImage] = useState(`https://picsum.photos/400/300?random=${Math.floor(Math.random() * 1000)}`);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    // Confirmation Modal State
    const [confirmAction, setConfirmAction] = useState<{ type: 'store' | 'preorder' | 'deleteService', action: () => void, metadata?: any } | null>(null);

    // Reset System Modal State
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetPin, setResetPin] = useState('');
    const [resetError, setResetError] = useState(false);

    const categoryOptions = useMemo(() => {
        const baseCats = newItemMasterCategory === 'food' ? FOOD_CATEGORIES : PHOTOBOOTH_CATEGORIES;
        const menuCats = menu.filter(i => i.masterCategory === newItemMasterCategory).map(i => i.category).filter(Boolean);
        const cats = new Set([...baseCats, ...menuCats]);
        return Array.from(cats).filter(c => c !== 'All');
    }, [menu, newItemMasterCategory]);

    // Finance Calculations
    const financeData = useMemo(() => {
        const validOrders = orders.filter(o => o.status !== OrderStatus.CANCELLED);
        const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
        const totalOrders = validOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Item Sales
        const itemSales: Record<string, { name: string, qty: number, revenue: number, category: string }> = {};

        validOrders.forEach(order => {
            order.items.forEach(item => {
                if (!itemSales[item.id]) {
                    itemSales[item.id] = { name: item.name, qty: 0, revenue: 0, category: item.category };
                }
                itemSales[item.id].qty += item.quantity;
                itemSales[item.id].revenue += (item.price * item.quantity);
            });
        });

        const topItems = Object.values(itemSales).sort((a, b) => b.qty - a.qty);

        // Category Sales
        const categorySales: Record<string, number> = {};
        const masterSales: Record<string, number> = { 'photobooth': 0, 'food': 0 };

        validOrders.forEach(order => {
            const mCat = order.masterCategory || 'photobooth';
            masterSales[mCat] = (masterSales[mCat] || 0) + order.total;
        });

        Object.values(itemSales).forEach(item => {
            categorySales[item.category] = (categorySales[item.category] || 0) + item.revenue;
        });

        return { totalRevenue, totalOrders, avgOrderValue, topItems, categorySales, masterSales };
    }, [orders]);

    const resetForm = () => {
        setNewItemName('');
        setNewItemPrice('');
        setNewItemCategory('');
        setNewItemMasterCategory('photobooth');
        setNewItemDescription('');
        setNewItemImage(`https://picsum.photos/400/300?random=${Math.floor(Math.random() * 1000)}`);
        setEditingId(null);
        setIsFormOpen(false);
    };

    const handleStartEdit = (item: MenuItem) => {
        setEditingId(item.id);
        setNewItemName(item.name);
        setNewItemPrice(item.price.toString());
        setNewItemCategory(item.category);
        setNewItemMasterCategory(item.masterCategory || 'photobooth');
        setNewItemDescription(item.description);
        setNewItemImage(item.image);
        setIsFormOpen(true);

        // Scroll container to top
        const container = document.getElementById('admin-panel-container');
        container?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingImage(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            // Using a relative path so Vite proxy routes it to the backend server
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');
            const data = await response.json();

            // Use the relative path returned by the server
            // Browser or Nginx will correctly handle mapping /api to the correct domain or proxy
            setNewItemImage(data.url);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image.');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleSaveItem = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingId) {
            // Update existing
            const existingItem = menu.find(i => i.id === editingId);
            const updatedItem: MenuItem = {
                id: editingId,
                name: newItemName,
                price: parseFloat(newItemPrice.replace(/\./g, '')) || 0,
                category: newItemCategory,
                masterCategory: newItemMasterCategory,
                description: newItemDescription,
                image: newItemImage,
                available: existingItem ? existingItem.available : true
            };
            updateMenuItem(updatedItem);
        } else {
            // Add new
            const item: MenuItem = {
                id: Date.now().toString(),
                name: newItemName,
                price: parseFloat(newItemPrice.replace(/\./g, '')) || 0,
                category: newItemCategory,
                masterCategory: newItemMasterCategory,
                description: newItemDescription,
                image: newItemImage,
                available: true
            };
            addMenuItem(item);
        }

        resetForm();
    };

    const formatTime = (ms: number) => {
        return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.QUEUED: return 'bg-white border-gray-300 text-gray-700';
            case OrderStatus.ON_AIR: return 'bg-red-50 border-red-200 text-red-800';
            case OrderStatus.CHOOSING: return 'bg-blue-50 border-blue-200 text-blue-800';
            case OrderStatus.PRINTING: return 'bg-orange-50 border-orange-200 text-orange-800';
            case OrderStatus.READY: return 'bg-green-50 border-green-200 text-green-800';
            case OrderStatus.COMPLETED: return 'bg-gray-100 border-gray-300 text-gray-500';
            case OrderStatus.CANCELLED: return 'bg-red-100 border-red-300 text-red-900 line-through';
            default: return '';
        }
    }

    const requestStoreToggle = () => {
        setConfirmAction({
            type: 'store',
            action: toggleStoreOpen
        });
    };

    const requestPreorderToggle = () => {
        setConfirmAction({
            type: 'preorder',
            action: togglePreorderMode
        });
    };

    const handleExportData = () => {
        // Collect all data into a single JSON object for backup
        const backupData = {
            orders,
            menu,
            settings: {
                isStoreOpen,
                isPreorderMode
            },
            exportDate: new Date().toISOString()
        };

        const jsonContent = JSON.stringify(backupData, null, 2);

        // Create an invisible link element to trigger the download
        const blob = new Blob([jsonContent], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.setAttribute("href", url);
        link.setAttribute("download", `dim_kopi_queue_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportCSV = () => {
        // Prepare CSV Header
        const headers = ['Order ID', 'Category', 'Customer Name', 'Class', 'Date', 'Type', 'Total', 'Status', 'Items\n'];

        // Prepare rows mapping over all orders
        const rows = orders.map(order => {
            const dateStr = new Date(order.timestamp).toLocaleString().replace(/,/g, ''); // Remove commas to prevent CSV issues
            const typeStr = order.isPreorder ? 'Booking' : 'Walk-in';
            const catStr = order.masterCategory === 'food' ? 'Kitchen' : 'Booth';
            const itemsStr = order.items.map(i => `${i.quantity}x ${i.name}`).join(' | ');
            return `${order.id},${catStr},"${order.customerName}","${order.customerClass || ''}",${dateStr},${typeStr},${order.total},${order.status},"${itemsStr}"\n`;
        });

        const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers.join(',') + rows.join(''));
        const encodedUri = csvContent;

        // Create an invisible link element to trigger the download
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `dim_kopi_queue_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleConfirmReset = () => {
        // Use the context 'login' function to verify if the PIN is the admin PIN (8888)
        // Since we are already in the admin panel, we can just check if login returns true.
        // Wait, the context 'login' sets isAuthenticated. It actually just checks pin === '8888'. 
        // We can just check it directly here or call login. 
        if (resetPin === '8888') {
            // Auto-export all data before wiping it
            handleExportData();
            setTimeout(() => {
                handleExportCSV();
                setTimeout(() => {
                    resetSystem();
                    setShowResetModal(false);
                    setResetPin('');
                    setResetError(false);
                }, 500);
            }, 500);
        } else {
            setResetError(true);
            setResetPin('');
        }
    };

    return (
        <div id="admin-panel-container" className="h-full overflow-y-auto bg-kopitiam-cream p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto pb-24 md:pb-20">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 pb-6 border-b-2 border-kopitiam-dark/10 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-kopitiam-dark p-3 rounded-lg text-white">
                            <LayoutDashboard size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-serif font-bold text-kopitiam-dark">Boss Dashboard</h1>
                            <p className="text-sm md:text-base text-kopitiam-dark/60 font-medium">Manage photo booth & finances</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 md:gap-4 w-full md:w-auto">
                        {/* Connection Status */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border-2 border-kopitiam-dark/10">
                            <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-kopitiam-jade animate-pulse' : 'bg-red-500'}`}></span>
                            <span className="text-[10px] font-bold uppercase tracking-wide text-kopitiam-dark">
                                {isConnected ? 'ONLINE' : 'OFFLINE'}
                            </span>
                        </div>

                        {/* Shop Controls */}
                        <div className="flex bg-white rounded-lg shadow-sm border-2 border-kopitiam-dark/10 overflow-hidden divide-x-2 divide-kopitiam-dark/10">
                            <button
                                onClick={requestStoreToggle}
                                className={`px-4 py-2 flex flex-col items-center justify-center min-w-[80px] transition-colors ${isStoreOpen ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-700 hover:bg-red-100'
                                    }`}
                                title="Toggle Booth Open/Closed"
                            >
                                <Store size={20} className="mb-1" />
                                <span className="text-[10px] font-bold uppercase tracking-wide">{isStoreOpen ? 'OPEN' : 'CLOSED'}</span>
                            </button>
                            <button
                                onClick={requestPreorderToggle}
                                className={`px-4 py-2 flex flex-col items-center justify-center min-w-[100px] transition-colors ${isPreorderMode ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                    }`}
                                title="Toggle Preorder Mode"
                            >
                                <ShoppingBasket size={20} className="mb-1" />
                                <span className="text-[10px] font-bold uppercase tracking-wide">{isPreorderMode ? 'BOOKING' : 'NORMAL'}</span>
                            </button>
                        </div>

                        <div className="w-full md:w-auto flex-1 md:flex-none bg-white px-4 md:px-6 py-3 rounded-lg shadow-sm border-2 border-kopitiam-jade/30">
                            <span className="block text-[10px] md:text-xs text-kopitiam-jade uppercase font-bold tracking-wider">Total Revenue</span>
                            <span className="text-xl md:text-3xl font-serif font-black text-kopitiam-dark">Rp {financeData.totalRevenue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</span>
                        </div>
                        <button
                            onClick={() => setShowResetModal(true)}
                            className="w-full md:w-auto flex-1 md:flex-none flex justify-center items-center gap-2 px-4 md:px-6 py-3 bg-kopitiam-red text-white rounded-lg font-bold hover:bg-kopitiam-maroon shadow-sm transition-colors text-sm md:text-base"
                        >
                            <RefreshCw size={18} /> <span className="whitespace-nowrap">New Session</span>
                        </button>
                    </div>
                </header>

                {/* Tab Navigation */}
                <div className="flex gap-1 md:gap-4 mb-6 border-b-2 border-kopitiam-dark/10 overflow-x-auto no-scrollbar pb-1">
                    <button
                        onClick={() => setActiveTab('menu')}
                        className={`flex items-center gap-2 pb-3 px-3 md:px-6 font-bold uppercase tracking-wide border-b-4 transition-colors whitespace-nowrap text-xs md:text-sm ${activeTab === 'menu'
                            ? 'border-kopitiam-jade text-kopitiam-dark bg-kopitiam-jade/5'
                            : 'border-transparent text-gray-400 hover:text-kopitiam-jade/70'
                            }`}
                    >
                        <Camera size={16} className="md:size-18" /> Services
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`flex items-center gap-2 pb-3 px-3 md:px-6 font-bold uppercase tracking-wide border-b-4 transition-colors whitespace-nowrap text-xs md:text-sm ${activeTab === 'orders'
                            ? 'border-kopitiam-jade text-kopitiam-dark bg-kopitiam-jade/5'
                            : 'border-transparent text-gray-400 hover:text-kopitiam-jade/70'
                            }`}
                    >
                        <ClipboardList size={16} className="md:size-18" /> Orders
                    </button>
                    <button
                        onClick={() => setActiveTab('finance')}
                        className={`flex items-center gap-2 px-3 md:px-6 py-3 font-serif font-black uppercase tracking-widest transition-all border-b-4 text-xs md:text-sm whitespace-nowrap ${activeTab === 'finance' ? 'border-kopitiam-red text-kopitiam-red bg-kopitiam-paper' : 'border-transparent text-kopitiam-dark/40 hover:text-kopitiam-dark hover:bg-black/5'}`}
                    >
                        <TrendingUp size={16} className="md:size-18" /> Finance
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex items-center gap-2 px-3 md:px-6 py-3 font-serif font-black uppercase tracking-widest transition-all border-b-4 text-xs md:text-sm whitespace-nowrap ${activeTab === 'settings' ? 'border-kopitiam-red text-kopitiam-red bg-kopitiam-paper' : 'border-transparent text-kopitiam-dark/40 hover:text-kopitiam-dark hover:bg-black/5'}`}
                    >
                        <Store size={16} className="md:size-18" /> System
                    </button>
                </div>

                {activeTab === 'menu' && (
                    /* Menu Management Section */
                    <section className="bg-white rounded-xl shadow-md border-2 border-kopitiam-dark/10 overflow-hidden animate-fade-in">
                        <div className="p-4 md:p-6 border-b-2 border-kopitiam-dark/5 flex justify-between items-center bg-kopitiam-paper">
                            <h2 className="text-xl md:text-2xl font-serif font-bold text-kopitiam-dark">Services</h2>
                            {!isFormOpen && (
                                <button
                                    onClick={() => { resetForm(); setIsFormOpen(true); }}
                                    className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-kopitiam-dark text-white rounded font-bold hover:bg-black transition-colors text-sm md:text-base"
                                >
                                    <Plus size={18} /> Add Service
                                </button>
                            )}
                        </div>

                        {isFormOpen && (
                            <div className="p-4 md:p-8 bg-kopitiam-cream border-b-2 border-kopitiam-dark/10 animate-fade-in">
                                <h3 className="font-serif font-bold text-xl mb-6 text-kopitiam-dark">
                                    {editingId ? 'Edit Service' : 'New Service'}
                                </h3>
                                <form onSubmit={handleSaveItem} className="space-y-6 max-w-3xl">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-kopitiam-dark mb-2 uppercase tracking-wide">Service Name</label>
                                            <input required type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full px-4 py-3 border-2 border-kopitiam-dark/20 rounded bg-white focus:border-kopitiam-jade focus:outline-none" placeholder="e.g. Classic Strip" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-kopitiam-dark mb-2 uppercase tracking-wide">Price (Rp)</label>
                                            <input required type="number" step="0.01" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} className="w-full px-4 py-3 border-2 border-kopitiam-dark/20 rounded bg-white focus:border-kopitiam-jade focus:outline-none" placeholder="0.00" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-kopitiam-dark mb-2 uppercase tracking-wide">Category</label>
                                            <input required type="text" list="category-options" value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)} className="w-full px-4 py-3 border-2 border-kopitiam-dark/20 rounded bg-white focus:border-kopitiam-jade focus:outline-none" placeholder="Select or type new..." />
                                            <datalist id="category-options">
                                                {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                            </datalist>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-kopitiam-dark mb-2 uppercase tracking-wide">Master Category</label>
                                            <select
                                                value={newItemMasterCategory}
                                                onChange={e => setNewItemMasterCategory(e.target.value as any)}
                                                className="w-full px-4 py-3 border-2 border-kopitiam-dark/20 rounded bg-white focus:border-kopitiam-jade focus:outline-none font-bold"
                                            >
                                                <option value="photobooth">Photo Booth</option>
                                                <option value="food">Food & Coffee</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-kopitiam-dark mb-2 uppercase tracking-wide">Image Upload</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    disabled={isUploadingImage}
                                                    className="w-full px-4 py-2 border-2 border-kopitiam-dark/20 rounded bg-white focus:border-kopitiam-jade focus:outline-none text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-kopitiam-jade file:text-white hover:file:bg-kopitiam-dark"
                                                />
                                            </div>
                                            {isUploadingImage && <p className="text-xs text-kopitiam-jade mt-1 font-bold animate-pulse">Uploading...</p>}
                                            {newItemImage && !isUploadingImage && (
                                                <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                                                    <img src={newItemImage} alt="Preview" className="w-8 h-8 object-cover rounded border border-gray-300" />
                                                    <span className="truncate">Ready</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-sm font-bold text-kopitiam-dark uppercase tracking-wide">Description</label>
                                        </div>
                                        <textarea
                                            required
                                            rows={3}
                                            value={newItemDescription}
                                            onChange={e => setNewItemDescription(e.target.value)}
                                            className="w-full px-4 py-3 border-2 border-kopitiam-dark/20 rounded bg-white focus:border-kopitiam-jade focus:outline-none"
                                            placeholder="Service description will appear here..."
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-4 flex-col md:flex-row">
                                        <button type="submit" className="w-full md:w-auto px-8 py-3 bg-kopitiam-jade text-white rounded font-bold hover:bg-kopitiam-dark uppercase tracking-wide text-center">
                                            {editingId ? 'Update Service' : 'Save Service'}
                                        </button>
                                        <button type="button" onClick={resetForm} className="w-full md:w-auto px-8 py-3 bg-white border-2 border-kopitiam-dark/20 text-kopitiam-dark rounded font-bold hover:bg-kopitiam-paper uppercase tracking-wide text-center">Cancel</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead className="bg-kopitiam-dark text-kopitiam-cream uppercase text-[10px] md:text-xs font-bold tracking-wider">
                                    <tr>
                                        <th className="px-4 py-4 md:px-6 md:py-5">Preview</th>
                                        <th className="px-4 py-4 md:px-6 md:py-5">Name</th>
                                        <th className="hidden md:table-cell px-6 py-5">Master</th>
                                        <th className="hidden sm:table-cell px-6 py-5">Category</th>
                                        <th className="px-4 py-4 md:px-6 md:py-5">Price</th>
                                        <th className="px-4 py-4 md:px-6 md:py-5">Status</th>
                                        <th className="px-4 py-4 md:px-6 md:py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-kopitiam-dark/10">
                                    {menu.map(item => (
                                        <tr key={item.id} className="hover:bg-kopitiam-jade/5 transition-colors">
                                            <td className="px-4 py-3 md:px-6 md:py-4">
                                                <img src={item.image} alt="" className="w-10 h-10 md:w-14 md:h-14 rounded border border-kopitiam-dark/20 object-cover" />
                                            </td>
                                            <td className="px-4 py-3 md:px-6 md:py-4">
                                                <div className="font-serif font-bold text-kopitiam-dark text-sm md:text-lg">{item.name}</div>
                                                <div className="hidden md:block text-xs text-kopitiam-dark/60 truncate max-w-xs">{item.description}</div>
                                                <div className="md:hidden text-[10px] text-kopitiam-dark/60 font-bold uppercase mt-0.5">{item.category}</div>
                                            </td>
                                            <td className="hidden md:table-cell px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${item.masterCategory === 'food' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                                                    {item.masterCategory || 'booth'}
                                                </span>
                                            </td>
                                            <td className="hidden sm:table-cell px-6 py-4">
                                                <span className="px-3 py-1 bg-kopitiam-cream rounded-full text-xs font-bold text-kopitiam-dark border border-kopitiam-dark/20 uppercase tracking-wide">{item.category}</span>
                                            </td>
                                            <td className="px-4 py-3 md:px-6 md:py-4 font-bold text-kopitiam-dark font-serif text-sm md:text-base">Rp {item.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</td>
                                            <td className="px-4 py-3 md:px-6 md:py-4">
                                                <button
                                                    onClick={() => toggleItemAvailability(item.id)}
                                                    className={`px-2 py-1 md:px-3 md:py-1 rounded text-[10px] md:text-xs font-bold uppercase tracking-wide transition-colors border ${item.available
                                                        ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                                                        : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                                                        }`}
                                                >
                                                    {item.available ? 'Active' : 'Offline'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleStartEdit(item)}
                                                        className="p-2 text-kopitiam-dark/60 hover:text-kopitiam-jade transition-colors bg-kopitiam-cream border border-kopitiam-dark/10 rounded"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setConfirmAction({
                                                                type: 'deleteService',
                                                                action: () => deleteMenuItem(item.id),
                                                                metadata: { name: item.name }
                                                            });
                                                        }}
                                                        className="p-2 text-kopitiam-dark/60 hover:text-kopitiam-red transition-colors bg-kopitiam-cream border border-kopitiam-dark/10 rounded"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {menu.length === 0 && (
                            <div className="p-12 text-center text-kopitiam-dark/40">
                                <AlertTriangle size={48} className="mx-auto mb-4 opacity-30" />
                                <p className="font-serif italic text-lg">Services list is empty.</p>
                            </div>
                        )}
                    </section>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Photobooth Terms */}
                            <div className="bg-white p-6 rounded-2xl border-4 border-kopitiam-dark shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-kopitiam-red rounded-xl text-white">
                                        <Camera size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-serif font-black text-kopitiam-dark uppercase">Photobooth Rules</h3>
                                        <p className="text-xs font-bold text-kopitiam-dark/40 uppercase tracking-widest">Customer Terms & Conditions</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-sm font-black text-kopitiam-dark uppercase tracking-wider mb-2">Each line is one rule bullet point:</label>
                                    <textarea
                                        className="w-full h-64 p-4 bg-kopitiam-paper border-2 border-kopitiam-dark rounded-xl font-serif text-sm focus:ring-4 focus:ring-kopitiam-red/20 transition-all outline-none resize-none shadow-inner"
                                        value={settings.terms_photobooth.join('\n')}
                                        onChange={(e) => updateSetting('terms_photobooth', e.target.value.split('\n'))}
                                        placeholder="Enter one rule per line..."
                                    />
                                    <p className="text-[10px] text-kopitiam-dark/60 font-medium italic">Changes are saved and broadcasted to all panels instantly.</p>
                                </div>
                            </div>

                            {/* Food Terms */}
                            <div className="bg-white p-6 rounded-2xl border-4 border-kopitiam-dark shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-kopitiam-jade rounded-xl text-white">
                                        <ShoppingBasket size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-serif font-black text-kopitiam-dark uppercase">Kitchen Code</h3>
                                        <p className="text-xs font-bold text-kopitiam-dark/40 uppercase tracking-widest">Customer Terms & Conditions</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-sm font-black text-kopitiam-dark uppercase tracking-wider mb-2">Each line is one rule bullet point:</label>
                                    <textarea
                                        className="w-full h-64 p-4 bg-kopitiam-paper border-2 border-kopitiam-dark rounded-xl font-serif text-sm focus:ring-4 focus:ring-kopitiam-jade/20 transition-all outline-none resize-none shadow-inner"
                                        value={settings.terms_food.join('\n')}
                                        onChange={(e) => updateSetting('terms_food', e.target.value.split('\n'))}
                                        placeholder="Enter one rule per line..."
                                    />
                                    <p className="text-[10px] text-kopitiam-dark/60 font-medium italic">Changes are saved and broadcasted to all panels instantly.</p>
                                </div>
                            </div>
                        </div>

                        {/* System Status Controls */}
                        <div className="bg-kopitiam-dark p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                                <div>
                                    <h3 className="text-2xl font-serif font-black mb-2 uppercase tracking-tight italic">System Controls</h3>
                                    <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Global Shop State & Pre-orders</p>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <button
                                        onClick={() => setConfirmAction({
                                            type: 'store',
                                            action: toggleStoreOpen
                                        })}
                                        className={`flex items-center justify-between gap-4 px-6 py-4 rounded-2xl font-serif font-black uppercase tracking-widest transition-all border-4 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] active:translate-x-1 active:translate-y-1 active:shadow-none ${isStoreOpen ? 'bg-kopitiam-jade border-white text-white' : 'bg-red-500 border-white text-white'}`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <Store size={22} /> {isStoreOpen ? 'Open Shop' : 'Store Closed'}
                                        </span>
                                        <div className={`w-12 h-6 rounded-full bg-black/20 relative transition-all`}>
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isStoreOpen ? 'left-7' : 'left-1'}`} />
                                        </div>
                                    </button>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <button
                                        onClick={() => setConfirmAction({
                                            type: 'preorder',
                                            action: togglePreorderMode
                                        })}
                                        className={`flex items-center justify-between gap-4 px-6 py-4 rounded-2xl font-serif font-black uppercase tracking-widest transition-all border-4 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] active:translate-x-1 active:translate-y-1 active:shadow-none ${isPreorderMode ? 'bg-indigo-600 border-white text-white' : 'bg-white/10 border-white/20 text-white/40'}`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <RefreshCw size={22} className={isPreorderMode ? 'animate-spin-slow' : ''} /> Mode: {isPreorderMode ? 'Pre-Order' : 'Instant'}
                                        </span>
                                        <div className={`w-12 h-6 rounded-full bg-black/20 relative transition-all`}>
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isPreorderMode ? 'left-7' : 'left-1'}`} />
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Dangerous Zone */}
                        <div className="bg-red-50 p-6 rounded-2xl border-4 border-dashed border-red-200">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-serif font-black text-red-600 uppercase tracking-tight">Emergency Reset</h4>
                                        <p className="text-xs font-bold text-red-600/60 uppercase tracking-widest leading-none">This will clear all orders and reset menu</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowResetModal(true)}
                                    className="px-6 py-3 bg-red-600 text-white font-serif font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all shadow-[4px_4px_0px_0px_rgba(153,27,27,0.3)] active:scale-95"
                                >
                                    Reset System
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    /* Order Management Section */
                    <section className="bg-white rounded-xl shadow-md border-2 border-kopitiam-dark/10 overflow-hidden animate-fade-in">
                        <div className="p-4 md:p-6 border-b-2 border-kopitiam-dark/5 bg-kopitiam-paper flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-xl md:text-2xl font-serif font-bold text-kopitiam-dark">Lab History</h2>
                                <p className="text-sm text-kopitiam-dark/60 mt-1">Track prints and bookings.</p>
                            </div>
                            <div className="flex bg-white p-1 rounded-lg border border-kopitiam-dark/10 shadow-sm self-stretch md:self-auto">
                                <button onClick={() => setOrderFilter('all')} className={`flex-1 px-4 py-1.5 rounded font-bold text-xs uppercase tracking-widest transition-all ${orderFilter === 'all' ? 'bg-kopitiam-dark text-white' : 'text-gray-400 hover:bg-gray-50'}`}>All</button>
                                <button onClick={() => setOrderFilter('photobooth')} className={`flex-1 px-4 py-1.5 rounded font-bold text-xs uppercase tracking-widest transition-all ${orderFilter === 'photobooth' ? 'bg-kopitiam-red text-white' : 'text-gray-400 hover:bg-gray-50'}`}>Booth</button>
                                <button onClick={() => setOrderFilter('food')} className={`flex-1 px-4 py-1.5 rounded font-bold text-xs uppercase tracking-widest transition-all ${orderFilter === 'food' ? 'bg-kopitiam-jade text-white' : 'text-gray-400 hover:bg-gray-50'}`}>Kitchen</button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead className="bg-kopitiam-dark text-kopitiam-cream uppercase text-xs font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Order ID & Cat</th>
                                        <th className="px-6 py-4">Guest</th>
                                        <th className="px-6 py-4">Services</th>
                                        <th className="px-6 py-4">Total</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-kopitiam-dark/10">
                                    {orders
                                        .filter(o => orderFilter === 'all' || o.masterCategory === orderFilter)
                                        .sort((a, b) => b.timestamp - a.timestamp)
                                        .map(order => (
                                            <tr key={order.id} className={`transition-colors ${order.status === OrderStatus.CANCELLED ? 'bg-red-50 opacity-70' : 'hover:bg-kopitiam-jade/5'}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${order.masterCategory === 'food' ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-blue-100 border-blue-300 text-blue-800'}`}>
                                                            {order.masterCategory === 'food' ? 'F' : 'P'}
                                                        </div>
                                                        <div>
                                                            <div className="font-serif font-bold text-lg text-kopitiam-dark">{order.id}</div>
                                                            <div className="text-xs text-kopitiam-dark/60 font-mono">{formatTime(order.timestamp)}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-kopitiam-dark">{order.customerName}</div>
                                                    <div className="text-xs text-maroon-600/60 font-medium">Class: {order.customerClass}</div>
                                                    {order.isPreorder ? (
                                                        <span className="inline-block px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase tracking-wide border border-indigo-200 mt-1">
                                                            Booking
                                                        </span>
                                                    ) : (
                                                        <span className="inline-block px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-bold uppercase tracking-wide border border-orange-200 mt-1">
                                                            Walk-in
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-kopitiam-dark/80">
                                                    <ul className="list-disc list-inside">
                                                        {order.items.map((item, i) => (
                                                            <li key={i} className="truncate max-w-[200px]">{item.quantity}x {item.name}</li>
                                                        ))}
                                                    </ul>
                                                </td>
                                                <td className="px-6 py-4 font-serif font-bold text-kopitiam-dark">
                                                    Rp {order.total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                                                        className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide border-2 focus:outline-none cursor-pointer ${getStatusColor(order.status)}`}
                                                    >
                                                        <option value={OrderStatus.QUEUED}>WAIT QUEUE</option>
                                                        {order.masterCategory === 'food' ? (
                                                            <option value={OrderStatus.COOKING}>COOKING</option>
                                                        ) : (
                                                            <>
                                                                <option value={OrderStatus.ON_AIR}>ON AIR</option>
                                                                <option value={OrderStatus.CHOOSING}>CHOOSING</option>
                                                                <option value={OrderStatus.PRINTING}>PRINTING</option>
                                                            </>
                                                        )}
                                                        <option value={OrderStatus.READY}>READY</option>
                                                        <option value={OrderStatus.COMPLETED}>COLLECTED</option>
                                                        <option value={OrderStatus.CANCELLED}>CANCELLED</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => { if (confirm(`Delete Order ${order.id} permanently?`)) deleteOrder(order.id); }}
                                                        className="inline-flex items-center gap-1 px-3 py-2 bg-white border-2 border-red-100 text-red-600 rounded hover:bg-red-50 hover:border-red-200 transition-colors font-bold text-xs uppercase tracking-wide"
                                                        title="Delete Order Permanently"
                                                    >
                                                        <Trash2 size={14} /> Erase
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    {orders.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-kopitiam-dark/40 italic font-serif">
                                                No orders found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {activeTab === 'finance' && (
                    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            <div className="bg-white p-5 md:p-6 rounded-xl border-2 border-kopitiam-dark/10 shadow-sm">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><ClipboardList size={20} /></div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Orders</span>
                                </div>
                                <div className="text-2xl md:text-3xl font-serif font-black text-kopitiam-dark">{financeData.totalOrders}</div>
                            </div>
                            <div className="bg-white p-5 md:p-6 rounded-xl border-2 border-kopitiam-dark/10 shadow-sm">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-2 bg-kopitiam-jade/10 text-kopitiam-jade rounded-lg"><DollarSign size={20} /></div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avg Order</span>
                                </div>
                                <div className="text-2xl md:text-3xl font-serif font-black text-kopitiam-dark">Rp {Math.round(financeData.avgOrderValue).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</div>
                            </div>
                            <div className="bg-white p-5 md:p-6 rounded-xl border-2 border-kopitiam-dark/10 shadow-sm">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><PieChart size={20} /></div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Photo Share</span>
                                </div>
                                <div className="text-2xl md:text-3xl font-serif font-black text-kopitiam-dark">
                                    {Math.round((financeData.masterSales['photobooth'] / (financeData.totalRevenue || 1)) * 100)}%
                                </div>
                            </div>
                            <div className="bg-white p-5 md:p-6 rounded-xl border-2 border-kopitiam-dark/10 shadow-sm">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><UtensilsCrossed size={20} /></div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Food Share</span>
                                </div>
                                <div className="text-2xl md:text-3xl font-serif font-black text-kopitiam-dark">
                                    {Math.round((financeData.masterSales['food'] / (financeData.totalRevenue || 1)) * 100)}%
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                            {/* Top Selling Items */}
                            <div className="bg-white rounded-xl shadow-md border-2 border-kopitiam-dark/10 overflow-hidden">
                                <div className="p-5 border-b-2 border-kopitiam-dark/5 bg-kopitiam-paper flex justify-between items-center">
                                    <h3 className="font-serif font-bold text-lg text-kopitiam-dark flex items-center gap-2">
                                        <TrendingUp size={18} className="text-kopitiam-jade" /> Popular Packages
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-kopitiam-cream text-xs uppercase font-bold text-kopitiam-dark/60">
                                            <tr>
                                                <th className="px-5 py-3">Package</th>
                                                <th className="px-5 py-3 text-right">Sold</th>
                                                <th className="px-5 py-3 text-right">Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-kopitiam-dark/5">
                                            {financeData.topItems.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-kopitiam-cream/50">
                                                    <td className="px-5 py-3 font-medium text-sm text-kopitiam-dark">{item.name}</td>
                                                    <td className="px-5 py-3 text-right font-mono text-sm">{item.qty}</td>
                                                    <td className="px-5 py-3 text-right font-mono text-sm">Rp {item.revenue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</td>
                                                </tr>
                                            ))}
                                            {financeData.topItems.length === 0 && (
                                                <tr><td colSpan={3} className="p-6 text-center text-gray-400 text-sm italic">No sales yet</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Category Breakdown */}
                            <div className="bg-white rounded-xl shadow-md border-2 border-kopitiam-dark/10 overflow-hidden h-fit">
                                <div className="p-5 border-b-2 border-kopitiam-dark/5 bg-kopitiam-paper flex justify-between items-center">
                                    <h3 className="font-serif font-bold text-lg text-kopitiam-dark flex items-center gap-2">
                                        <PieChart size={18} className="text-kopitiam-orange" /> Revenue by Category
                                    </h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    {Object.entries(financeData.categorySales).map(([cat, amount]) => (
                                        <div key={cat}>
                                            <div className="flex justify-between text-sm font-bold text-kopitiam-dark mb-1">
                                                <span>{cat}</span>
                                                <span>Rp {Number((amount as number)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</span>
                                            </div>
                                            <div className="w-full bg-kopitiam-cream rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className="bg-kopitiam-jade h-2.5 rounded-full"
                                                    style={{ width: `${((amount as number) / financeData.totalRevenue) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                    {Object.keys(financeData.categorySales).length === 0 && (
                                        <p className="text-center text-gray-400 text-sm italic">No data available</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl border-4 border-kopitiam-dark max-w-sm w-full overflow-hidden animate-in zoom-in duration-300">
                        <div className={`p-6 text-white flex flex-col items-center justify-center ${confirmAction.type === 'store' ? (isStoreOpen ? 'bg-red-600' : 'bg-green-600') : confirmAction.type === 'deleteService' ? 'bg-red-600' : (isPreorderMode ? 'bg-blue-600' : 'bg-indigo-600')}`}>
                            {confirmAction.type === 'store' ? <Store size={48} className="mb-2" /> : confirmAction.type === 'deleteService' ? <Trash2 size={48} className="mb-2" /> : <ShoppingBasket size={48} className="mb-2" />}
                            <h2 className="text-2xl font-serif font-black text-center">
                                {confirmAction.type === 'store'
                                    ? `Turn store ${isStoreOpen ? 'OFFLINE' : 'ONLINE'}?`
                                    : confirmAction.type === 'deleteService'
                                        ? `Delete Service?`
                                        : `Switch to ${isPreorderMode ? 'NORMAL' : 'BOOKING'} mode?`
                                }
                            </h2>
                        </div>
                        <div className="p-6 bg-kopitiam-cream">
                            <p className="text-kopitiam-dark text-center font-medium mb-6">
                                {confirmAction.type === 'store'
                                    ? (isStoreOpen ? "Customers won't be able to access the booth page anymore." : "The booth page will be accessible to everyone again.")
                                    : confirmAction.type === 'deleteService'
                                        ? `Are you sure you want to permanently delete "${confirmAction.metadata?.name}"?`
                                        : (isPreorderMode ? "Walk-ins will be accepted again normally." : "Customers will only be able to book for a later collection time.")
                                }
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setConfirmAction(null)}
                                    className="flex-1 py-3 bg-white border-2 border-kopitiam-dark/20 text-kopitiam-dark rounded font-bold uppercase tracking-wide hover:bg-kopitiam-paper transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        confirmAction.action();
                                        setConfirmAction(null);
                                    }}
                                    className={`flex-1 py-3 text-white rounded font-bold uppercase tracking-wide shadow-md transition-all active:scale-95 ${confirmAction.type === 'store' ? (isStoreOpen ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700') : confirmAction.type === 'deleteService' ? 'bg-red-600 hover:bg-red-700' : (isPreorderMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700')}`}
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset System Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-kopitiam-cream rounded-xl shadow-2xl border-4 border-kopitiam-red max-w-sm w-full overflow-hidden animate-in zoom-in duration-300">
                        <div className="bg-kopitiam-red p-6 text-white flex flex-col items-center justify-center">
                            <AlertTriangle size={48} className="mb-2" />
                            <h2 className="text-2xl font-serif font-black text-center">Start New Session?</h2>
                        </div>
                        <div className="p-6">
                            <p className="text-kopitiam-dark text-center font-bold mb-4">
                                This will permanently delete ALL orders and finances for the day!
                            </p>

                            <div className="flex flex-col gap-2 mb-6">
                                <button
                                    onClick={handleExportData}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-kopitiam-jade text-kopitiam-jade rounded font-bold uppercase tracking-wide hover:bg-kopitiam-jade/10 transition-colors shadow-sm"
                                >
                                    <Download size={20} /> Backup All Data (.JSON)
                                </button>
                                <button
                                    onClick={handleExportCSV}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-kopitiam-blue text-kopitiam-dark rounded font-bold uppercase tracking-wide hover:bg-black/5 transition-colors shadow-sm"
                                >
                                    <Download size={20} /> Export Orders (.CSV)
                                </button>
                            </div>

                            <div className="mb-6">
                                <label className="block text-center text-xs font-bold text-kopitiam-dark uppercase tracking-widest mb-2">Admin PIN Required to Reset</label>
                                <div className="flex justify-center gap-2 mb-2">
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={i} className={`w-3 h-3 rounded-full transition-colors border border-kopitiam-dark/20 ${i < resetPin.length ? 'bg-kopitiam-red' : 'bg-transparent'}`}></div>
                                    ))}
                                </div>
                                {resetError && <div className="text-red-500 text-xs font-bold text-center mb-2 animate-bounce">Wrong PIN!</div>}

                                <div className="grid grid-cols-3 gap-2 mt-4 px-4">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                        <button
                                            key={num}
                                            onClick={() => {
                                                if (resetPin.length < 4) setResetPin(prev => prev + num.toString());
                                                setResetError(false);
                                            }}
                                            className="h-10 rounded bg-white border-2 border-kopitiam-dark/10 font-bold hover:bg-kopitiam-paper transition-colors"
                                        >
                                            {num}
                                        </button>
                                    ))}
                                    <button onClick={() => setResetPin('')} className="h-10 rounded bg-kopitiam-dark/5 text-kopitiam-dark/60 font-bold text-xs hover:bg-kopitiam-dark/20 uppercase transition-colors col-start-2">CLR</button>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        setShowResetModal(false);
                                        setResetPin('');
                                        setResetError(false);
                                    }}
                                    className="flex-1 py-3 bg-white border-2 border-kopitiam-dark/20 text-kopitiam-dark rounded font-bold uppercase tracking-wide hover:bg-kopitiam-paper transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmReset}
                                    disabled={resetPin.length < 4}
                                    className={`flex-1 py-3 text-white rounded font-bold uppercase tracking-wide shadow-md transition-all ${resetPin.length === 4 ? 'bg-kopitiam-red hover:bg-maroon-700 active:scale-95' : 'bg-kopitiam-dark/30 cursor-not-allowed'}`}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};