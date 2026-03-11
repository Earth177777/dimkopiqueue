import React, { useState } from 'react';
import { useEvent } from '../context/EventContext';
import { Order, OrderStatus } from '../types';
import { Check, Clock, Printer, CheckCircle2, AlertCircle, Image, ShoppingBasket, Scissors, Camera, MousePointer2, ArrowRight, UtensilsCrossed, Download } from 'lucide-react';

export const KitchenPanel: React.FC = () => {
  const { orders, updateOrderStatus, isConnected } = useEvent();
  const [showCompleted, setShowCompleted] = useState(false);
  const [labMode, setLabMode] = useState<'photobooth' | 'food'>('photobooth');

  const filteredOrders = orders.filter(o => o.masterCategory === labMode || (!o.masterCategory && labMode === 'photobooth'));

  const activeOrders = filteredOrders.filter(o =>
    o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED
  ).sort((a, b) => a.timestamp - b.timestamp);

  const completedOrders = filteredOrders.filter(o => o.status === OrderStatus.COMPLETED);
  const completedCount = completedOrders.length;

  const handleStatusClick = (orderId: string, currentStatus: OrderStatus) => {
    let nextStatus = currentStatus;

    if (labMode === 'food') {
      switch (currentStatus) {
        case OrderStatus.QUEUED: nextStatus = OrderStatus.COOKING; break;
        case OrderStatus.COOKING: nextStatus = OrderStatus.READY; break;
        case OrderStatus.READY: nextStatus = OrderStatus.COMPLETED; break;
        default: break;
      }
    } else {
      switch (currentStatus) {
        case OrderStatus.QUEUED: nextStatus = OrderStatus.ON_AIR; break;
        case OrderStatus.ON_AIR: nextStatus = OrderStatus.CHOOSING; break;
        case OrderStatus.CHOOSING: nextStatus = OrderStatus.PRINTING; break;
        case OrderStatus.PRINTING: nextStatus = OrderStatus.READY; break;
        case OrderStatus.READY: nextStatus = OrderStatus.COMPLETED; break;
        default: break;
      }
    }
    updateOrderStatus(orderId, nextStatus);
  };

  const handleExportCSV = () => {
    // Prepare CSV Header
    const headers = ['Order ID', 'Guest Name', 'Class', 'Date', 'Type', 'Status', 'Total', 'Items\n'];

    // Prepare rows mapping over filtered orders
    const rows = filteredOrders.map(order => {
      const dateStr = new Date(order.timestamp).toLocaleString().replace(/,/g, '');
      const typeStr = order.isPreorder ? 'Booking' : 'Walk-in';
      const itemsStr = order.items.map(i => `${i.quantity}x ${i.name}`).join(' | ');
      return `${order.id},"${order.customerName}","${order.customerClass || ''}",${dateStr},${typeStr},${order.status},${order.total},"${itemsStr}"\n`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + rows.join('');
    const encodedUri = encodeURI(csvContent);

    // Create an invisible link element to trigger the download
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    // Name includes currently viewed tab
    link.setAttribute("download", `dim_kopi_${labMode}_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (ms: number) => {
    return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.QUEUED: return 'bg-white border-kopitiam-dark/20'; // White
      case OrderStatus.ON_AIR: return 'bg-red-50 border-red-300'; // Red tint
      case OrderStatus.CHOOSING: return 'bg-blue-50 border-blue-300'; // Blue tint
      case OrderStatus.COOKING: return 'bg-amber-50 border-amber-300'; // Amber tint
      case OrderStatus.PRINTING: return 'bg-orange-50 border-orange-300'; // Orange tint
      case OrderStatus.READY: return 'bg-kopitiam-jade/20 border-kopitiam-jade'; // Green tint
      default: return 'bg-white';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.QUEUED: return 'Wait Queue';
      case OrderStatus.ON_AIR: return 'On Air';
      case OrderStatus.CHOOSING: return 'Choosing';
      case OrderStatus.COOKING: return 'Cooking';
      case OrderStatus.PRINTING: return 'Printing';
      case OrderStatus.READY: return 'Ready';
      default: return '';
    }
  };

  const getActionButton = (status: OrderStatus) => {
    if (labMode === 'food') {
      switch (status) {
        case OrderStatus.QUEUED: return <><Clock size={18} /> Start Cooking</>;
        case OrderStatus.COOKING: return <><Check size={18} /> Ready to Serve</>;
        case OrderStatus.READY: return <><CheckCircle2 size={18} /> Hand Over</>;
        default: return null;
      }
    }
    switch (status) {
      case OrderStatus.QUEUED:
        return <><Camera size={18} /> Start Session</>;
      case OrderStatus.ON_AIR:
        return <><MousePointer2 size={18} /> Finish Shoot</>;
      case OrderStatus.CHOOSING:
        return <><Printer size={18} /> Print Photos</>;
      case OrderStatus.PRINTING:
        return <><CheckCircle2 size={18} /> Cut & Done</>;
      case OrderStatus.READY:
        return <><Check size={18} /> Hand Over</>;
      default: return null;
    }
  }

  const getButtonColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.QUEUED: return 'bg-kopitiam-red hover:bg-red-800';
      case OrderStatus.ON_AIR: return 'bg-blue-600 hover:bg-blue-800';
      case OrderStatus.CHOOSING: return 'bg-orange-500 hover:bg-orange-700';
      case OrderStatus.COOKING: return 'bg-amber-600 hover:bg-amber-800';
      case OrderStatus.PRINTING: return 'bg-kopitiam-jade hover:bg-green-800';
      case OrderStatus.READY: return 'bg-kopitiam-dark hover:bg-black';
      default: return 'bg-gray-500';
    }
  }

  return (
    <div className="min-h-screen bg-kopitiam-dark flex flex-col bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]">
      <header className="bg-kopitiam-cream text-kopitiam-dark px-4 py-4 md:px-8 flex flex-col md:flex-row justify-between items-start md:items-center shadow-lg z-10 border-b-4 border-kopitiam-salmon gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-kopitiam-dark p-2 rounded">
            {labMode === 'photobooth' ? <Printer className="text-white" size={24} /> : <UtensilsCrossed className="text-white" size={24} />}
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-serif font-black tracking-tight text-kopitiam-dark uppercase leading-none">
              {labMode === 'photobooth' ? 'Dim Kopi Lab' : 'Dim Kopi Kitchen'}
            </h1>
            <p className="text-[10px] md:text-xs font-bold text-kopitiam-salmon tracking-[0.2em] mt-1">XII-R1 STATION</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-4 w-full md:w-auto">
          <div className="flex bg-kopitiam-dark/5 p-1 rounded-xl border border-kopitiam-dark/10 w-full sm:w-auto">
            <button
              onClick={() => setLabMode('photobooth')}
              className={`flex-1 sm:flex-none px-3 py-2 md:px-4 md:py-2 rounded-lg font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${labMode === 'photobooth' ? 'bg-kopitiam-red text-white shadow-lg' : 'text-kopitiam-dark/40 hover:text-kopitiam-dark/70'}`}
            >
              <Camera size={14} /> Booth
            </button>
            <button
              onClick={() => setLabMode('food')}
              className={`flex-1 sm:flex-none px-3 py-2 md:px-4 md:py-2 rounded-lg font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${labMode === 'food' ? 'bg-kopitiam-jade text-white shadow-lg' : 'text-kopitiam-dark/40 hover:text-kopitiam-dark/70'}`}
            >
              <UtensilsCrossed size={14} /> Kitchen
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 px-2 py-1 md:px-3 md:py-1.5 bg-white rounded border border-kopitiam-dark/10">
            <span className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${isConnected ? 'bg-kopitiam-jade animate-pulse' : 'bg-red-500'}`}></span>
            <span className="text-kopitiam-dark font-bold text-[10px] md:text-sm tracking-wide">
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-1.5 bg-kopitiam-dark text-white rounded font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-colors shadow-sm"
          >
            <Download size={14} /> <span className="hidden sm:inline">Download CSV</span><span className="sm:hidden">CSV</span>
          </button>
          <button
            onClick={() => setShowCompleted(prev => !prev)}
            className={`font-serif font-bold italic text-xs md:text-base px-3 py-1.5 md:px-5 md:py-2 rounded-lg border-2 transition-all flex items-center gap-2 shadow-sm ${showCompleted
              ? 'bg-kopitiam-red border-kopitiam-red text-white'
              : 'bg-white border-kopitiam-jade text-kopitiam-jade hover:bg-kopitiam-jade hover:text-white'
              }`}
          >
            {showCompleted ? <CheckCircle2 size={16} className="md:size-18" /> : <Clock size={16} className="md:size-18" />}
            {showCompleted ? 'Live Queue' : `History: ${completedCount}`}
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Section Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-serif font-black text-kopitiam-cream uppercase tracking-tight">
              {showCompleted ? 'Order History' : 'Live Queue'}
            </h2>
            <div className="flex items-center gap-2 text-kopitiam-cream/50 text-xs font-bold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-kopitiam-salmon"></span>
              {(showCompleted ? completedOrders : activeOrders).length} {(showCompleted ? completedOrders : activeOrders).length === 1 ? 'Order' : 'Orders'}
            </div>
          </div>

          {(showCompleted ? completedOrders : activeOrders).length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-kopitiam-cream/30 border-4 border-dashed border-white/5 rounded-3xl">
              <div className="p-8 bg-white/5 rounded-full mb-6">
                {showCompleted ? <CheckCircle2 size={64} className="opacity-20" /> : <Image size={64} className="opacity-20" />}
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-kopitiam-cream/50">
                {showCompleted ? 'No history yet' : 'Queue is empty...'}
              </h2>
              <p className="text-kopitiam-cream/30 mt-2">
                {showCompleted ? 'Complete some orders to see them here.' : 'Time for a coffee break?'}
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto pt-8 pb-4 custom-scrollbar">
              <div className="flex gap-6 h-full items-start">
                {(showCompleted ? completedOrders : activeOrders).map(order => (
                  <div
                    key={order.id}
                    className={`w-64 md:w-80 shrink-0 flex flex-col rounded-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] border-2 transition-all duration-300 relative ${order.status === OrderStatus.COMPLETED ? 'bg-kopitiam-jade/10 border-kopitiam-jade/30' : getStatusColor(order.status)}`}
                  >
                    {/* Tape/Pin Graphic */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-kopitiam-red border-2 border-kopitiam-maroon shadow-sm z-20"></div>

                    {/* Preorder Badge */}
                    {order.isPreorder && (
                      <div className="absolute -top-3 -right-3 z-30 bg-indigo-600 text-white px-3 py-1 font-bold text-xs uppercase tracking-wider rounded shadow-md transform rotate-6 border-2 border-indigo-800 flex items-center gap-1">
                        <ShoppingBasket size={12} /> Booking
                      </div>
                    )}

                    {/* Card Header */}
                    <div className="p-3 md:p-5 border-b-2 border-dashed border-kopitiam-dark/20 flex justify-between items-start bg-white/40">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-[10px] font-black bg-kopitiam-dark text-white px-1.5 py-0.5 rounded-sm">ID</span>
                          <h3 className="text-xl md:text-3xl font-serif font-black text-kopitiam-dark leading-none">
                            #{order.id.split('#')[1] || order.id}
                          </h3>
                        </div>
                        <p className="text-[10px] md:text-sm font-bold text-kopitiam-dark/70 uppercase tracking-wide truncate max-w-[120px] md:max-w-[150px]">
                          {order.customerName || 'Guest'} {order.customerClass && <span className="text-[8px] md:text-[10px] opacity-60">({order.customerClass})</span>}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1 text-[8px] md:text-[10px] font-bold text-kopitiam-dark/60 mb-2">
                          <Clock size={10} /> {formatTime(order.timestamp)}
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] md:text-xs font-bold uppercase tracking-widest border shadow-sm ${order.status === OrderStatus.COMPLETED
                          ? 'bg-kopitiam-jade text-white border-kopitiam-jade'
                          : 'bg-white border-kopitiam-dark/30 text-kopitiam-dark'
                          }`}>
                          {order.status === OrderStatus.COMPLETED ? 'Done' : getStatusLabel(order.status)}
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="p-3 md:p-5 flex-1 bg-white/60 space-y-2 md:space-y-4 overflow-y-auto min-h-[100px] md:min-h-[120px]">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start border-l-2 border-kopitiam-dark/10 pl-2 md:pl-3">
                          <div className="flex-1">
                            <span className="font-serif font-bold text-sm md:text-lg leading-tight text-kopitiam-dark">{item.name}</span>
                          </div>
                          <span className="font-black text-base md:text-xl w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-kopitiam-dark flex items-center justify-center text-kopitiam-dark ml-2 md:ml-3 shrink-0 bg-white shadow-sm">
                            {item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="p-3 bg-white/40 border-t-2 border-kopitiam-dark/10">
                      {order.status === OrderStatus.COMPLETED ? (
                        <div className="w-full py-2 flex items-center justify-center gap-2 text-kopitiam-jade font-black uppercase tracking-widest text-sm">
                          <CheckCircle2 size={18} /> Collected
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStatusClick(order.id, order.status)}
                          className={`w-full py-2 md:py-3 rounded font-bold text-base md:text-lg uppercase tracking-wider shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 border-2 border-black/20 text-white ${getButtonColor(order.status)}`}
                        >
                          {getActionButton(order.status)}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};