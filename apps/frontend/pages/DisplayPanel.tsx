import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvent } from '../context/EventContext';
import { OrderStatus } from '../types';
import { ShoppingBasket, Camera, Image, X, Printer, User, MousePointer2, Ticket, Eye, EyeOff, CheckCircle2, UtensilsCrossed, Scissors } from 'lucide-react';

export const DisplayPanel: React.FC = () => {
    const { orders } = useEvent();
    const [time, setTime] = useState(new Date());
    const [showCompleted, setShowCompleted] = useState(false);
    const [queueMode, setQueueMode] = useState<'photobooth' | 'food'>('photobooth');
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const filteredOrders = orders.filter(o => o.masterCategory === queueMode || (!o.masterCategory && queueMode === 'photobooth'));

    const readyOrders = filteredOrders.filter(o => o.status === OrderStatus.READY);
    const printingOrders = filteredOrders.filter(o => o.status === OrderStatus.PRINTING);
    const studioOrders = filteredOrders.filter(o => o.status === OrderStatus.ON_AIR || o.status === OrderStatus.CHOOSING || o.status === OrderStatus.COOKING);
    const completedOrders = filteredOrders.filter(o => o.status === OrderStatus.COMPLETED);

    // Split Queued Orders
    const queuedWalkIns = filteredOrders.filter(o => o.status === OrderStatus.QUEUED && !o.isPreorder);
    const queuedBookings = filteredOrders.filter(o => o.status === OrderStatus.QUEUED && o.isPreorder);

    return (
        <div className="h-screen bg-kopitiam-dark text-white flex flex-col overflow-hidden font-sans relative">
            {/* Small Exit Button */}
            <button
                onClick={() => navigate('/admin')}
                className="absolute top-2 left-2 z-50 p-1.5 text-white/20 hover:text-white/80 hover:bg-white/10 rounded-full transition-all border border-white/10 backdrop-blur-sm"
                title="Exit Queue"
            >
                <X size={14} strokeWidth={2.5} />
            </button>

            {/* Header */}
            <header className="px-6 py-4 md:px-10 md:py-6 border-b-4 border-kopitiam-salmon flex flex-col md:flex-row justify-between items-center bg-kopitiam-dark shadow-xl z-20 gap-4">
                <div className="flex flex-col text-center md:text-left">
                    <h1 className="text-2xl md:text-4xl font-serif font-black tracking-widest text-kopitiam-cream uppercase drop-shadow-md">
                        {queueMode === 'photobooth' ? 'Photo Status' : 'Order Status'}
                    </h1>
                    <span className="text-kopitiam-salmon tracking-[0.3em] md:tracking-[0.5em] text-xs md:text-sm font-bold uppercase mt-1">Dim Kopi &bull; {queueMode === 'photobooth' ? 'Booth Queue' : 'Kitchen Queue'}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-sm mr-2">
                        <button
                            onClick={() => setQueueMode('photobooth')}
                            className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${queueMode === 'photobooth' ? 'bg-kopitiam-red text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}
                        >
                            <Camera size={14} /> Booth
                        </button>
                        <button
                            onClick={() => setQueueMode('food')}
                            className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${queueMode === 'food' ? 'bg-kopitiam-jade text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}
                        >
                            <UtensilsCrossed size={14} /> Kitchen
                        </button>
                    </div>
                    <button
                        onClick={() => setShowCompleted(prev => !prev)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-bold text-sm uppercase tracking-wider transition-all ${showCompleted
                            ? 'bg-kopitiam-jade border-kopitiam-jade text-white shadow-lg shadow-kopitiam-jade/30'
                            : 'bg-white/5 border-white/20 text-white/70 hover:border-kopitiam-jade/60 hover:text-white'
                            }`}
                    >
                        {showCompleted ? <EyeOff size={16} /> : <Eye size={16} />}
                        {showCompleted ? 'Hide Done' : 'Show Done'}
                        {completedOrders.length > 0 && (
                            <span className={`text-xs font-black px-1.5 py-0.5 rounded-full ${showCompleted ? 'bg-white/20 text-white' : 'bg-kopitiam-jade text-white'
                                }`}>
                                {completedOrders.length}
                            </span>
                        )}
                    </button>
                    <div className="text-3xl md:text-4xl font-mono text-kopitiam-jade font-bold bg-black/30 px-4 py-2 md:px-6 rounded border border-kopitiam-jade/30">
                        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 flex flex-col md:flex-row overflow-hidden">

                {/* Left Side: READY TO TAKE (Main Focus) */}
                <div className="flex-[2] bg-kopitiam-jade flex flex-col relative overflow-hidden border-b-4 md:border-b-0 md:border-r-4 border-kopitiam-dark">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10"></div>
                    <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-[0.2em] text-center py-6 border-b-4 border-white/20 bg-black/10 backdrop-blur-sm z-10 flex items-center justify-center gap-4">
                        <CheckCircleIcon /> {queueMode === 'photobooth' ? 'Ready to Take' : 'Ready to Serve'}
                    </h2>
                    <div className="flex-1 p-6 overflow-y-auto content-start flex flex-wrap gap-4 align-content-start z-10 justify-center">
                        {readyOrders.length === 0 ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white/40">
                                <Image size={64} className="mb-4 opacity-50" />
                                <div className="text-2xl font-serif italic">Photos Developing...</div>
                            </div>
                        ) : (
                            readyOrders.map(order => (
                                <div key={order.id} className="w-48 md:w-64 animate-bounce-in">
                                    <div className="bg-kopitiam-cream text-kopitiam-dark rounded-sm p-4 text-center shadow-[8px_8px_0_rgba(0,0,0,0.2)] border-4 border-kopitiam-dark transform transition-transform hover:scale-105">
                                        <div className="text-5xl font-serif font-black mb-2 text-kopitiam-red">{order.id}</div>
                                        <div className="text-lg font-bold uppercase tracking-wide opacity-90 truncate border-t-2 border-kopitiam-dark/10 pt-2">
                                            {order.customerName} <span className="text-sm opacity-50">({order.customerClass})</span>
                                        </div>
                                        {order.isPreorder && <div className="mt-1 text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded inline-block font-bold">BOOKING</div>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Side: LIVE PIPELINE (Queued -> Studio -> Printing) */}
                <div className="flex-1 bg-kopitiam-cream flex flex-col h-full overflow-hidden">

                    {/* Stage 3: Printing */}
                    <div className="flex-1 border-b-2 border-kopitiam-dark/10 p-4 bg-orange-50 relative overflow-hidden">
                        <div className="absolute top-2 right-2 text-orange-200">{queueMode === 'photobooth' ? <Printer size={64} /> : <Scissors size={64} />}</div>
                        <h3 className="text-xl font-black text-orange-800 uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                            <span className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></span> {queueMode === 'photobooth' ? 'Printing' : 'Finishing'}
                        </h3>
                        <div className="flex flex-wrap gap-2 relative z-10">
                            {printingOrders.map(o => (
                                <div key={o.id} className="bg-white border-2 border-orange-200 text-orange-900 px-3 py-1 rounded font-bold shadow-sm">
                                    {o.id} <span className="text-xs opacity-70 ml-1">{o.customerName} ({o.customerClass})</span>
                                </div>
                            ))}
                            {printingOrders.length === 0 && <span className="text-orange-800/40 text-sm italic">Printer idle</span>}
                        </div>
                    </div>

                    {/* Stage 2: In Studio (On Air / Choosing) */}
                    <div className="flex-1 border-b-2 border-kopitiam-dark/10 p-4 bg-blue-50 relative overflow-hidden">
                        <div className="absolute top-2 right-2 text-blue-200">{queueMode === 'photobooth' ? <Camera size={64} /> : <UtensilsCrossed size={64} />}</div>
                        <h3 className="text-xl font-black text-blue-800 uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                            <span className="w-3 h-3 bg-blue-600 rounded-full"></span> {queueMode === 'photobooth' ? 'On Air / Choosing' : 'Being Prepared'}
                        </h3>
                        <div className="space-y-2 relative z-10 overflow-y-auto max-h-[20vh]">
                            {studioOrders.map(o => (
                                <div key={o.id} className="flex justify-between items-center bg-white p-2 rounded border border-blue-200 shadow-sm">
                                    <span className="font-bold text-blue-900 text-lg">{o.id}</span>
                                    <span className="text-sm text-blue-700 truncate max-w-[120px]">{o.customerName} ({o.customerClass})</span>
                                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                                        {o.status === OrderStatus.ON_AIR ? 'SHOOTING' : o.status === OrderStatus.CHOOSING ? 'CHOOSING' : 'COOKING'}
                                    </span>
                                </div>
                            ))}
                            {studioOrders.length === 0 && <span className="text-blue-800/40 text-sm italic">Studio empty</span>}
                        </div>
                    </div>

                    {/* Stage 1: Waiting Queues (Split) */}
                    <div className="flex-[2] flex flex-col bg-kopitiam-paper relative overflow-hidden">
                        <div className="absolute top-2 right-2 text-gray-200"><User size={64} /></div>

                        <h3 className="text-xl font-black text-kopitiam-dark uppercase tracking-widest p-4 pb-2 flex items-center gap-2 relative z-10 border-b border-kopitiam-dark/5 shadow-sm">
                            <span className="w-3 h-3 bg-gray-400 rounded-full"></span> Waiting Queue
                        </h3>

                        <div className="flex-1 flex relative z-10 overflow-hidden">
                            {/* Walk-ins Column */}
                            <div className="flex-1 border-r border-kopitiam-dark/10 flex flex-col bg-white/50">
                                <div className="bg-gray-100/80 p-1.5 text-center text-[10px] font-bold uppercase text-gray-500 tracking-wider flex items-center justify-center gap-1">
                                    <User size={12} /> Walk-ins
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                    {queuedWalkIns.map(o => (
                                        <div key={o.id} className="bg-white border border-gray-200 p-2 rounded text-center opacity-80 shadow-[2px_2px_0_rgba(0,0,0,0.05)]">
                                            <div className="font-bold text-gray-700">{o.id}</div>
                                            <div className="text-xs text-gray-500 truncate">{o.customerName} ({o.customerClass})</div>
                                        </div>
                                    ))}
                                    {queuedWalkIns.length === 0 && <div className="text-center text-gray-300 text-xs italic mt-4">Empty</div>}
                                </div>
                            </div>

                            {/* Bookings Column */}
                            <div className="flex-1 flex flex-col bg-indigo-50/40">
                                <div className="bg-indigo-100/80 p-1.5 text-center text-[10px] font-bold uppercase text-indigo-600 tracking-wider flex items-center justify-center gap-1">
                                    <Ticket size={12} /> Bookings
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                    {queuedBookings.map(o => (
                                        <div key={o.id} className="bg-white border-l-4 border-l-indigo-500 border-y border-r border-indigo-100 p-2 rounded text-center shadow-sm">
                                            <div className="font-bold text-indigo-900">{o.id}</div>
                                            <div className="text-xs text-indigo-600 truncate">{o.customerName} ({o.customerClass})</div>
                                        </div>
                                    ))}
                                    {queuedBookings.length === 0 && <div className="text-center text-indigo-200 text-xs italic mt-4">Empty</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Completed Orders Overlay */}
            {showCompleted && (
                <div className="absolute inset-0 z-30 bg-kopitiam-dark/95 backdrop-blur-sm flex flex-col animate-in slide-in-from-bottom duration-300">
                    {/* Overlay Header */}
                    <div className="flex items-center justify-between px-8 py-5 border-b-4 border-kopitiam-jade bg-kopitiam-dark">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-kopitiam-jade flex items-center justify-center">
                                <CheckCircle2 size={22} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-serif font-black text-kopitiam-cream uppercase tracking-widest">Completed Orders</h2>
                                <p className="text-kopitiam-jade text-xs font-bold uppercase tracking-widest">{completedOrders.length} order{completedOrders.length !== 1 ? 's' : ''} done</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCompleted(false)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-bold text-sm uppercase tracking-wider transition-all"
                        >
                            <EyeOff size={16} /> Hide
                        </button>
                    </div>

                    {/* Completed Grid */}
                    <div className="flex-1 overflow-y-auto p-8">
                        {completedOrders.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-white/30">
                                <CheckCircle2 size={80} className="mb-4 opacity-30" />
                                <p className="text-2xl font-serif italic">No completed orders yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {completedOrders.map(order => (
                                    <div key={order.id} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 transition-colors">
                                        <div className="w-8 h-8 bg-kopitiam-jade/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <CheckCircle2 size={16} className="text-kopitiam-jade" />
                                        </div>
                                        <div className="text-2xl font-serif font-black text-kopitiam-jade mb-1">{order.id}</div>
                                        <div className="text-xs text-white/70 font-bold truncate">{order.customerName} ({order.customerClass})</div>
                                        <div className="text-xs text-white/40 mt-1">${order.total?.toFixed(2)}</div>
                                        {order.isPreorder && (
                                            <div className="mt-1.5 text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full inline-block font-bold">BOOKING</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <footer className="bg-kopitiam-dark border-t-4 border-kopitiam-salmon py-2 md:py-4 text-center text-kopitiam-salmon/80 text-xs md:text-lg uppercase tracking-[0.3em] font-bold">
                Wait for your number to be called
            </footer>
        </div>
    );
};

const CheckCircleIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);