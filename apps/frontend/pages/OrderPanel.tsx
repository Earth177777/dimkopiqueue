import React, { useState, useRef, useEffect } from 'react';
import { useEvent } from '../context/EventContext';
import { OrderConfirmation } from '../context/EventContext';
import { MenuItem, CartItem, OrderStatus, MasterCategory, PHOTOBOOTH_CATEGORIES, FOOD_CATEGORIES } from '../types';
import { Plus, Minus, ShoppingBag, Sparkles, X, MessageSquare, Camera, ShoppingBasket, Check, ChevronRight, AlertCircle, Clock, Receipt, Ticket, Lock, KeyRound, LogOut, Image, Printer, CheckCircle, MapPin, CalendarDays, Banknote, UtensilsCrossed, ArrowLeft, Volume2, VolumeX, ShieldAlert, XCircle } from 'lucide-react';

export const OrderPanel: React.FC = () => {
  const { menu, addOrder, isStoreOpen, isPreorderMode, settings, login, isAuthenticated, logout, isConnected } = useEvent();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerClass, setCustomerClass] = useState('');
  const [nameError, setNameError] = useState(false); // Validation state
  const [classError, setClassError] = useState(false); // Validation state
  const [isPreorder, setIsPreorder] = useState(isPreorderMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audio] = useState(new Audio('/filelagu.MP3'));
  const [isMuted, setIsMuted] = useState(false);

  // Master Category mode selector (null = show landing screen)
  const [masterCategory, setMasterCategory] = useState<MasterCategory | null>(null);

  useEffect(() => {
    audio.loop = true;

    if (masterCategory === null) {
      audio.pause();
      return;
    }

    const handleInitialPlay = () => {
      if (!isMuted) {
        audio.play().catch(e => console.log("Autoplay blocked:", e));
      }
      window.removeEventListener('click', handleInitialPlay, true);
    };

    if (!isMuted) {
      audio.play().catch(() => {
        window.addEventListener('click', handleInitialPlay, true);
      });
    } else {
      audio.pause();
    }

    return () => {
      audio.pause();
      window.removeEventListener('click', handleInitialPlay, true);
    };
  }, [isMuted, audio, masterCategory]);

  const nameInputRef = useRef<HTMLInputElement>(null);



  // Notification State
  const [lastAddedItem, setLastAddedItem] = useState<string | null>(null);

  // Login/Secret State
  const [logoClicks, setLogoClicks] = useState(0);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [showAdminUnlockPopup, setShowAdminUnlockPopup] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderConfirmation | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const dynamicCategories = React.useMemo(() => {
    if (!masterCategory) return ['All'];
    const baseCats = masterCategory === 'photobooth' ? PHOTOBOOTH_CATEGORIES : FOOD_CATEGORIES;
    const menuCats = new Set(menu.filter(i => i.masterCategory === masterCategory).map(i => i.category).filter(Boolean));
    return baseCats.filter(c => c === 'All' || menuCats.has(c));
  }, [menu, masterCategory]);

  // Sync Preorder state when global setting changes
  useEffect(() => {
    if (isPreorderMode) {
      setIsPreorder(true);
    } else {
      setIsPreorder(false);
    }
  }, [isPreorderMode]);

  // Reset Logo click counter if idle
  useEffect(() => {
    const timer = setTimeout(() => setLogoClicks(0), 3000);
    return () => clearTimeout(timer);
  }, [logoClicks]);

  const handleLogoClick = () => {
    const newCount = logoClicks + 1;
    setLogoClicks(newCount);
    if (newCount >= 10) {
      setLogoClicks(0);
      setIsLoginModalOpen(true);
    }
  };

  const handleLogin = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (login(pin)) {
      setPin('');
      setIsLoginModalOpen(false);
      setLoginError(false);
      setShowAdminUnlockPopup(true);
      setTimeout(() => setShowAdminUnlockPopup(false), 3000);
    } else {
      setLoginError(true);
      setPin('');
    }
  };

  const handlePinDigit = (digit: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
      setLoginError(false);
    }
  };

  const TermsModal = () => {
    const isPhotobooth = masterCategory === 'photobooth';
    const terms = isPhotobooth ? settings.terms_photobooth : settings.terms_food;

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="bg-kopitiam-cream w-full max-w-sm rounded-2xl shadow-2xl border-4 border-kopitiam-dark overflow-hidden animate-in zoom-in duration-300">
          <div className="bg-kopitiam-dark px-6 py-4 flex items-center gap-3 border-b-2 border-kopitiam-cream/10">
            <ShieldAlert size={24} className="text-kopitiam-salmon" />
            <h3 className="text-xl font-serif font-black text-kopitiam-cream uppercase tracking-tight italic">
              {isPhotobooth ? 'The Booth Rules' : 'The Kitchen Code'}
            </h3>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm font-serif italic text-kopitiam-dark/80 border-b border-kopitiam-dark/10 pb-2">
              Before we {isPhotobooth ? 'snap' : 'brew'} your magic, acknowledge our house rules:
            </p>

            <ul className="space-y-3">
              {terms.map((rule, idx) => (
                <li key={idx} className="flex gap-3 items-start animate-in fade-in slide-in-from-left duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="bg-kopitiam-dark text-white p-1 rounded mt-0.5 shrink-0 shadow-sm">
                    <CheckCircle size={14} />
                  </div>
                  <p className="text-xs font-serif font-bold text-kopitiam-dark leading-snug">
                    {rule}
                  </p>
                </li>
              ))}
            </ul>

            <div className="pt-4 flex flex-col gap-2">
              <button
                onClick={handleSubmitOrder}
                className="w-full py-3 bg-kopitiam-jade text-white rounded-lg font-bold uppercase tracking-widest hover:bg-green-700 transition shadow-md active:scale-95"
              >
                I Agree & Order
              </button>
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-full py-2 text-kopitiam-dark/40 font-bold uppercase tracking-widest text-xs hover:text-kopitiam-red transition"
              >
                Decline / Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const LoginModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-kopitiam-cream p-8 rounded-xl shadow-2xl max-w-xs w-full border-4 border-kopitiam-dark relative animate-in zoom-in duration-300">
        <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-4 right-4 text-kopitiam-dark/50 hover:text-kopitiam-red"><X /></button>
        <div className="text-center mb-6">
          <div className="inline-block p-3 bg-kopitiam-dark rounded-full text-white mb-2"><KeyRound size={24} /></div>
          <h3 className="text-xl font-serif font-bold text-kopitiam-dark">Staff Login</h3>
          <p className="text-xs text-kopitiam-dark/60">Enter PIN to access Admin Panel</p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i < pin.length ? 'bg-kopitiam-red' : 'bg-kopitiam-dark/20'}`}></div>
          ))}
        </div>

        {loginError && <div className="text-red-600 text-xs font-bold text-center mb-4 animate-bounce">Wrong PIN! Try again.</div>}

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} onClick={() => handlePinDigit(num.toString())} className="h-12 rounded bg-white border-2 border-kopitiam-dark/10 font-bold text-lg hover:bg-kopitiam-paper hover:border-kopitiam-jade active:bg-kopitiam-jade active:text-white transition-colors">
              {num}
            </button>
          ))}
          <button onClick={() => setPin('')} className="h-12 rounded bg-kopitiam-red/10 text-kopitiam-red font-bold text-xs uppercase hover:bg-kopitiam-red hover:text-white transition-colors">CLR</button>
          <button onClick={() => handlePinDigit('0')} className="h-12 rounded bg-white border-2 border-kopitiam-dark/10 font-bold text-lg hover:bg-kopitiam-paper hover:border-kopitiam-jade active:bg-kopitiam-jade active:text-white transition-colors">0</button>
          <button onClick={() => handleLogin()} className="h-12 rounded bg-kopitiam-dark text-white font-bold flex items-center justify-center hover:bg-black transition-colors"><Check size={20} /></button>
        </div>
      </div>
    </div>
  );

  if (!isStoreOpen && !isAuthenticated) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-kopitiam-dark text-kopitiam-cream p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-30"></div>
        {/* Secret click area even when closed */}
        <div className="z-20 cursor-pointer" onClick={handleLogoClick}>
          <div className="bg-kopitiam-red w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 border-kopitiam-cream">
            <Camera size={40} />
          </div>
        </div>
        <div className="z-10 text-center animate-in fade-in zoom-in duration-500">
          <h1 className="text-4xl md:text-6xl font-serif font-black mb-4 uppercase tracking-widest text-kopitiam-salmon">Closed</h1>
          <p className="text-xl md:text-2xl font-serif italic text-kopitiam-cream/80 max-w-md mx-auto leading-relaxed">
            "Dim Kopi is currently offline. See you soon!"
          </p>
          {!isConnected && (
            <p className="text-red-400 mt-4 text-sm uppercase tracking-widest font-bold font-sans">
              Connecting to server...
            </p>
          )}
          <div className="mt-8 flex items-center justify-center gap-2 text-kopitiam-jade font-bold uppercase tracking-wider text-sm border border-kopitiam-jade/30 px-4 py-2 rounded-full bg-black/20">
            <Clock size={16} /> Event Offline
          </div>
        </div>

        {isLoginModalOpen && <LoginModal />}

        {/* Admin Unlock Success Popup */}
        {showAdminUnlockPopup && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-xl shadow-2xl border-4 border-kopitiam-jade flex flex-col items-center max-w-sm w-full animate-in zoom-in duration-300 transform">
              <div className="w-16 h-16 bg-kopitiam-jade rounded-full flex items-center justify-center text-white mb-4 animate-[bounce_1s_ease-in-out]">
                <Check size={32} strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-serif font-black text-kopitiam-dark mb-2 text-center">Access Granted</h2>
              <p className="text-sm font-bold text-kopitiam-dark/70 text-center">Admin Mode is now unlocked.</p>
              <button
                onClick={() => setShowAdminUnlockPopup(false)}
                className="mt-6 w-full py-2 bg-kopitiam-jade text-white font-bold rounded hover:bg-green-700 transition"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Order Confirmed Receipt Popup */}
        {confirmedOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="bg-kopitiam-cream w-full max-w-sm rounded-2xl shadow-2xl border-4 border-kopitiam-dark overflow-hidden animate-in zoom-in duration-300">
              {/* Header */}
              <div className="bg-kopitiam-dark px-6 py-5 flex items-center gap-4">
                <div className="w-14 h-14 bg-kopitiam-jade rounded-full flex items-center justify-center shrink-0 shadow-lg">
                  <CheckCircle size={30} strokeWidth={2.5} className="text-white" />
                </div>
                <div>
                  <p className="text-kopitiam-jade text-xs font-bold uppercase tracking-widest">Booking Confirmed!</p>
                  <h2 className="text-kopitiam-cream font-serif font-black text-2xl leading-tight">
                    Hi, {confirmedOrder.customerName.split(' ')[0]}! 👋
                  </h2>
                </div>
              </div>

              {/* Queue Number */}
              <div className="bg-kopitiam-red flex flex-col items-center py-5">
                <p className="text-kopitiam-cream/80 text-xs font-bold uppercase tracking-[0.2em] mb-1">Your Queue Number</p>
                <span className="text-kopitiam-cream font-serif font-black text-6xl tracking-tight drop-shadow-lg">
                  {confirmedOrder.displayId}
                </span>
                <p className="text-kopitiam-cream/70 text-xs mt-1">Show this when called</p>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Items ordered */}
                <div className="bg-white rounded-lg border border-kopitiam-dark/10 divide-y divide-kopitiam-dark/5">
                  {confirmedOrder.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center px-4 py-2 text-sm">
                      <span className="font-serif text-kopitiam-dark font-semibold">{item.name} <span className="text-kopitiam-dark/50">×{item.quantity}</span></span>
                      <span className="font-bold text-kopitiam-dark">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-4 py-3 bg-kopitiam-paper">
                    <span className="font-serif font-black text-kopitiam-dark uppercase tracking-wider text-sm">Total</span>
                    <span className="font-serif font-black text-kopitiam-red text-xl">${confirmedOrder.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Cash Note */}
                <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-300 rounded-lg px-4 py-3">
                  <Banknote size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-amber-800 text-sm font-bold leading-snug">
                    Please bring <span className="text-amber-900 underline underline-offset-2">exact cash</span> of ${confirmedOrder.total.toFixed(2)} — no change provided.
                  </p>
                </div>

                {/* Location / Pickup info based on masterCategory */}
                {(confirmedOrder.masterCategory === 'photobooth' || !confirmedOrder.masterCategory) ? (
                  <>
                    <div className="flex items-start gap-3 bg-white border border-kopitiam-dark/10 rounded-lg px-4 py-3">
                      <MapPin size={20} className="text-kopitiam-red shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-kopitiam-dark/50 uppercase font-bold tracking-wider">Pick Up Location</p>
                        <p className="font-serif font-bold text-kopitiam-dark">XII-R1 (R.310)</p>
                        <p className="text-sm text-kopitiam-dark/70">Gedung B / SMA Maitreyawira</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-white border border-kopitiam-dark/10 rounded-lg px-4 py-3">
                      <CalendarDays size={20} className="text-kopitiam-jade shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-kopitiam-dark/50 uppercase font-bold tracking-wider">Event Date</p>
                        <p className="font-serif font-bold text-kopitiam-dark">Senin, 16 Maret 2026</p>
                        <p className="text-sm text-kopitiam-dark/70">09.00 – 14.00 WIB</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-start gap-3 bg-white border border-kopitiam-dark/10 rounded-lg px-4 py-3">
                    <UtensilsCrossed size={20} className="text-kopitiam-jade shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-kopitiam-dark/50 uppercase font-bold tracking-wider">Pick Up Counter</p>
                      <p className="font-serif font-bold text-kopitiam-dark">Food Counter — XII-R1</p>
                      <p className="text-sm text-kopitiam-dark/70">Wait for your number to be called</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setConfirmedOrder(null)}
                  className="w-full py-3 bg-kopitiam-dark text-kopitiam-cream rounded-lg font-bold uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                >
                  Got it! Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  const filteredMenu = menu.filter(item =>
    (selectedCategory === 'All' || item.category === selectedCategory) &&
    item.available &&
    item.masterCategory === masterCategory
  );

  const getItemQuantity = (itemId: string) => {
    return cart.find(i => i.id === itemId)?.quantity || 0;
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });

    // Show Toast only on initial add
    setLastAddedItem(item.name);
    setTimeout(() => setLastAddedItem(null), 2000);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === itemId) {
        const newQty = Math.max(0, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleInitiateOrder = () => {
    if (cart.length === 0) return;

    // Validate Customer Name & Class
    let hasError = false;
    if (!customerName.trim()) {
      setNameError(true);
      hasError = true;
    }
    if (!customerClass.trim()) {
      setClassError(true);
      hasError = true;
    }

    if (hasError) {
      if (nameError) nameInputRef.current?.focus();
      return;
    }

    setShowTermsModal(true);
  };

  const handleSubmitOrder = async () => {
    setShowTermsModal(false);
    setIsSubmitting(true);

    // Show rich receipt popup
    const confirmation = await addOrder(cart, cartTotal, customerName.trim(), customerClass.trim(), isPreorder, masterCategory ?? 'photobooth');

    // Reset State
    setCart([]);
    setCustomerName('');
    setCustomerClass('');
    setNameError(false);
    setClassError(false);
    if (!isPreorderMode) setIsPreorder(false);

    setIsCartOpen(false);
    setIsSubmitting(false);
    setConfirmedOrder(confirmation);
  };

  // Mode Selector Screen
  if (masterCategory === null) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-kopitiam-cream p-6 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
        <div className="z-10 text-center mb-12 animate-in fade-in slide-in-from-top duration-500">
          <div className="bg-kopitiam-red w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl border-4 border-white transform rotate-3">
            <Sparkles size={36} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-black text-kopitiam-dark uppercase tracking-tighter">
            Dim Kopi <span className="text-kopitiam-red italic">Experience</span>
          </h1>
          <p className="text-kopitiam-dark/60 font-medium tracking-widest uppercase text-xs mt-2">Pick your journey below</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl z-10 animate-in fade-in slide-in-from-bottom duration-700">
          <button
            onClick={() => setMasterCategory('photobooth')}
            className="group relative bg-white border-2 border-kopitiam-dark p-8 rounded-3xl shadow-[8px_8px_0px_0px_rgba(45,34,29,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex flex-col items-center text-center overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-kopitiam-salmon/20 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="w-24 h-24 bg-transparent rounded-full flex items-center justify-center mb-6 transform group-hover:rotate-6 transition-transform overflow-hidden">
              <img src="/logo.svg" alt="Dim Kopi Booth" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-3xl font-serif font-black text-kopitiam-dark mb-2">Photo Booth</h2>
            <p className="text-kopitiam-dark/60 font-medium">Classic photostrips & 16:9 Photo. Retro vibes only.</p>
            <div className="mt-8 flex items-center gap-2 text-kopitiam-red font-black uppercase text-sm group-hover:translate-x-2 transition-transform">
              Enter Studio <ChevronRight size={18} />
            </div>
          </button>

          <button
            onClick={() => setMasterCategory('food')}
            className="group relative bg-white border-2 border-kopitiam-dark p-8 rounded-3xl shadow-[8px_8px_0px_0px_rgba(45,34,29,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex flex-col items-center text-center overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-kopitiam-jade/20 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="w-20 h-20 bg-kopitiam-jade text-white rounded-2xl flex items-center justify-center mb-6 transform group-hover:rotate-6 transition-transform">
              <UtensilsCrossed size={40} />
            </div>
            <h2 className="text-3xl font-serif font-black text-kopitiam-dark mb-2">Food & Coffee</h2>
            <p className="text-kopitiam-dark/60 font-medium">Freshly roti bakar & classic milo specials.</p>
            <div className="mt-8 flex items-center gap-2 text-kopitiam-jade font-black uppercase text-sm group-hover:translate-x-2 transition-transform">
              Order Menu <ChevronRight size={18} />
            </div>
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-16 text-center z-10 opacity-40">
          <p className="text-xs font-bold uppercase tracking-widest text-kopitiam-dark">Location: XII-R1 (R.310)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-kopitiam-cream overflow-hidden relative bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
      {/* Header */}
      <header className="bg-kopitiam-dark text-kopitiam-cream shadow-xl px-4 py-3 flex items-center justify-between z-20 shrink-0 border-b-4 border-kopitiam-red/80 h-16 md:h-20">
        <div className="flex items-center gap-3 select-none">
          <button
            onClick={() => {
              setMasterCategory(null);
              setCart([]);
              setSelectedCategory('All');
            }}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white border border-white/10 active:scale-90"
            title="Back to Mode Selection"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3 cursor-pointer group" onClick={handleLogoClick}>
            <div className={`w-10 h-10 md:w-12 md:h-12 ${masterCategory === 'photobooth' ? 'bg-kopitiam-red' : 'bg-kopitiam-jade'} rounded-full border-2 border-kopitiam-cream flex items-center justify-center shadow-lg transform group-active:scale-95 transition-transform overflow-hidden`}>
              <img src="/logo.svg" alt="Dim Kopi" className="w-full h-full object-cover" />
            </div>
            <div className="leading-tight">
              <h1 className="text-base md:text-xl font-serif font-black tracking-tight text-amber-50 uppercase italic">
                {masterCategory === 'photobooth' ? 'Booth Studio' : 'Kopi Kitchen'}
              </h1>
              <p className="text-[10px] uppercase font-bold text-kopitiam-jade tracking-widest opacity-80">Apek ama XII-R1</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:flex items-center bg-black/20 rounded-full px-3 py-1.5 border border-white/5">
            {isPreorderMode ? (
              <div className="flex items-center gap-2 text-indigo-300 text-[10px] font-black uppercase tracking-widest">
                <Ticket size={12} /> Pre-Book
              </div>
            ) : (
              <div className="flex items-center gap-2 text-kopitiam-jade text-[10px] font-black uppercase tracking-widest">
                <Clock size={12} /> Instant
              </div>
            )}
          </div>
          {isPreorderMode && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-900 rounded text-xs font-bold uppercase tracking-widest border border-indigo-200 shadow-sm">
              <Ticket size={14} className="text-indigo-600" /> Pre-Booking
            </div>
          )}

          {/* Show Logout if authenticated */}
          {isAuthenticated && (
            <button
              onClick={logout}
              className="hidden lg:flex items-center gap-2 px-3 py-2 bg-red-900/50 text-white rounded-lg font-bold border border-white/10 hover:bg-red-900 transition-all text-[10px] uppercase tracking-wider"
            >
              <LogOut size={12} /> Exit
            </button>
          )}

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white text-kopitiam-dark border-2 border-kopitiam-dark rounded-xl hover:bg-kopitiam-paper transition-all active:scale-90 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
          >
            <ShoppingBag size={20} className="md:size-24" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-kopitiam-orange text-white text-[10px] md:text-xs font-bold w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full border border-white shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Menu Area */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* Header Image */}
          <div className="w-full h-32 md:h-48 rounded-xl overflow-hidden shadow-lg border-2 border-kopitiam-dark/20 mb-6 relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-kopitiam-dark/80 to-transparent z-10 flex items-end p-6">
              <div>
                <h2 className="text-white font-serif font-bold text-2xl md:text-3xl drop-shadow-md">Dim Kopi Moments</h2>
                <p className="text-kopitiam-cream/90 text-sm md:text-base font-medium">Organized by Apek ama XII-R1</p>
              </div>
            </div>
            <img
              src="https://images.unsplash.com/photo-1527203561188-dae1bc1a417f?q=80&w=1200&auto=format&fit=crop"
              alt="Photo Booth Vibe"
              className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-105"
            />
          </div>

          {isPreorderMode && (
            <div className="mb-8 border-2 border-dashed border-indigo-300 bg-indigo-50 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-indigo-200 rounded-full blur-xl opacity-50"></div>
              <div className="flex items-center gap-4 z-10">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-600 border border-indigo-100">
                  <Ticket size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-serif font-bold text-indigo-900 text-lg leading-tight">Fast Pass Booking</h3>
                  <p className="text-xs text-indigo-700 font-medium">Book your slot now, shoot later.</p>
                </div>
              </div>
              <div className="bg-white px-4 py-2 rounded-full border border-indigo-200 text-indigo-800 text-xs font-bold uppercase tracking-wider shadow-sm z-10 whitespace-nowrap">
                Collection Later
              </div>
            </div>
          )}

          {/* Categories */}
          <div className="flex gap-2 md:gap-3 mb-6 md:mb-8 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2 md:mx-0 md:px-0">
            {dynamicCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 md:px-6 py-2 md:py-3 rounded-full md:rounded-md whitespace-nowrap font-serif font-bold tracking-wide transition-all border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] ${selectedCategory === cat
                  ? 'bg-kopitiam-red text-white border-kopitiam-dark'
                  : 'bg-white text-kopitiam-dark hover:bg-kopitiam-paper border-kopitiam-jade/30'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
            {filteredMenu.map(item => {
              const quantity = getItemQuantity(item.id);
              return (
                <div key={item.id} className="bg-white rounded-lg border-2 border-kopitiam-dark/10 shadow-lg flex flex-col overflow-hidden hover:border-kopitiam-jade transition-colors group">
                  <div className="h-48 overflow-hidden relative">
                    <div className="absolute inset-0 bg-kopitiam-jade/20 z-10 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 sepia-[0.2]" />
                    <div className="absolute top-3 right-3 bg-kopitiam-cream/90 backdrop-blur-sm px-3 py-1 rounded-md border border-kopitiam-dark font-bold text-kopitiam-dark shadow-sm z-20">
                      ${item.price.toFixed(2)}
                    </div>
                    {quantity > 0 && (
                      <div className="absolute top-3 left-3 bg-kopitiam-orange text-white w-8 h-8 flex items-center justify-center rounded-full font-bold shadow-md z-20 border-2 border-white animate-bounce-in">
                        {quantity}
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-serif font-bold text-xl text-kopitiam-dark mb-2 leading-tight">{item.name}</h3>
                    <div className="w-10 h-1 bg-kopitiam-salmon mb-3"></div>
                    <p className="text-kopitiam-dark/70 text-sm mb-6 flex-1 italic font-serif">{item.description}</p>

                    {quantity === 0 ? (
                      <button
                        onClick={() => addToCart(item)}
                        className={`w-full py-3 ${masterCategory === 'photobooth' ? 'bg-kopitiam-orange hover:bg-kopitiam-red' : 'bg-kopitiam-jade hover:bg-green-700'} text-white rounded-md font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 active:translate-y-1 shadow-[0_4px_0_rgba(0,0,0,0.2)] active:shadow-none mb-1`}
                      >
                        {masterCategory === 'photobooth' ? <Camera size={18} strokeWidth={3} /> : <ShoppingBasket size={18} strokeWidth={3} />}
                        <span>Select Item</span>
                      </button>
                    ) : (
                      <div className="w-full py-3 flex items-center justify-between bg-kopitiam-dark text-white rounded-md px-4 shadow-[0_4px_0_rgba(0,0,0,0.2)] mb-1 border-2 border-kopitiam-dark animate-in fade-in zoom-in duration-200">
                        <button
                          onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}
                          className="w-8 h-8 flex items-center justify-center rounded bg-white/20 hover:bg-kopitiam-red transition-colors active:scale-95 text-white"
                        >
                          <Minus size={16} strokeWidth={4} />
                        </button>
                        <span className="font-serif font-black text-xl tabular-nums">{quantity}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}
                          className="w-8 h-8 flex items-center justify-center rounded bg-white/20 hover:bg-kopitiam-jade transition-colors active:scale-95 text-white"
                        >
                          <Plus size={16} strokeWidth={4} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </main>

        {/* Floating Cart Button (Mobile/Desktop) */}
        <button
          onClick={() => setIsCartOpen(true)}
          className={`fixed z-40 bottom-6 md:bottom-10 right-6 md:right-10 shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-3 bg-kopitiam-dark text-white px-5 py-3 md:px-6 md:py-4 rounded-full border-4 border-kopitiam-cream animate-bounce-in ${cartCount > 0 && !isCartOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-90 pointer-events-none'
            }`}
        >
          <div className="relative">
            <ShoppingBag size={24} className="md:size-26" strokeWidth={2.5} />
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-kopitiam-red rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm">
              {cartCount}
            </span>
          </div>
          <div className="flex flex-col items-start leading-none border-l border-white/20 pl-3 ml-1">
            <span className="text-[10px] uppercase font-bold text-white/60 tracking-widest">Total</span>
            <span className="font-bold font-serif text-base md:text-lg">
              ${cartTotal.toFixed(2)}
            </span>
          </div>
          <ChevronRight size={18} className="ml-1 opacity-60" />
        </button>

        {/* Cart Sidebar (Desktop/Overlay) */}
        <div className={`fixed inset-y-0 right-0 w-full md:w-96 bg-kopitiam-paper border-l-4 border-kopitiam-dark shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-4 md:p-6 bg-kopitiam-dark text-kopitiam-cream flex items-center justify-between border-b-4 border-kopitiam-salmon">
            <h2 className="text-lg md:text-xl font-serif font-bold flex items-center gap-2">
              <ShoppingBasket className="text-kopitiam-salmon" />
              {masterCategory === 'photobooth' ? 'Photo Bag' : 'Food Basket'}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 hover:bg-white/10 rounded-full text-white transition-all"
                title={isMuted ? "Unmute Music" : "Mute Music"}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-white">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-kopitiam-dark/30">
                <Image size={64} className="mb-4 opacity-20" />
                <p className="font-serif italic text-lg">No photos selected...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-4 p-3 bg-white border border-kopitiam-dark/20 rounded-md shadow-sm">
                    <div className="flex-1">
                      <h4 className="font-serif font-bold text-kopitiam-dark line-clamp-1">{item.name}</h4>
                      <p className="text-kopitiam-jade font-bold text-sm mb-2">${(item.price * item.quantity).toFixed(2)}</p>
                      <div className="flex items-center gap-3">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded bg-kopitiam-paper border border-kopitiam-dark/30 flex items-center justify-center hover:bg-kopitiam-salmon hover:text-white transition-colors">
                          <Minus size={14} />
                        </button>
                        <span className="text-lg font-bold w-6 text-center text-kopitiam-dark">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded bg-kopitiam-dark text-white flex items-center justify-center hover:bg-kopitiam-jade transition-colors">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-6 border-t-2 border-kopitiam-dark/10 bg-white">
              <div className="mb-4">
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${nameError ? 'text-red-600' : 'text-kopitiam-dark'}`}>
                  Guest Name <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (e.target.value.trim()) setNameError(false);
                    }}
                    placeholder="Who is this for?"
                    className={`w-full px-4 py-3 rounded border-2 bg-kopitiam-paper focus:outline-none font-serif transition-colors ${nameError
                      ? 'border-red-500 focus:border-red-500 bg-red-50'
                      : 'border-kopitiam-dark/20 focus:border-kopitiam-jade'
                      }`}
                  />
                  {nameError && (
                    <div className="absolute right-3 top-3 text-red-500 animate-pulse">
                      <AlertCircle size={20} />
                    </div>
                  )}
                </div>
                {nameError && <p className="text-red-600 text-xs font-bold mt-1 animate-pulse">Please enter a name.</p>}
              </div>

              <div className="mb-4">
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${classError ? 'text-red-600' : 'text-kopitiam-dark'}`}>
                  Guest Class <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customerClass}
                    onChange={(e) => {
                      setCustomerClass(e.target.value);
                      if (e.target.value.trim()) setClassError(false);
                    }}
                    placeholder="e.g. XII-R1"
                    className={`w-full px-4 py-3 rounded border-2 bg-kopitiam-paper focus:outline-none font-serif transition-colors ${classError
                      ? 'border-red-500 focus:border-red-500 bg-red-50'
                      : 'border-kopitiam-dark/20 focus:border-kopitiam-jade'
                      }`}
                  />
                  {classError && (
                    <div className="absolute right-3 top-3 text-red-500 animate-pulse">
                      <AlertCircle size={20} />
                    </div>
                  )}
                </div>
                {classError && <p className="text-red-600 text-xs font-bold mt-1 animate-pulse">Please enter your class.</p>}
              </div>

              {/* Preorder Checkbox Area */}
              <div
                className={`mb-6 flex items-center p-3 border-2 rounded-lg transition-colors ${isPreorderMode
                  ? 'bg-indigo-50 border-indigo-300 opacity-90 cursor-not-allowed'
                  : 'cursor-pointer hover:bg-indigo-100 bg-indigo-50 border-indigo-200'
                  }`}
                onClick={() => !isPreorderMode && setIsPreorder(!isPreorder)}
              >
                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center mr-3 transition-colors ${isPreorder ? 'bg-indigo-600 border-indigo-600' : 'border-indigo-300 bg-white'}`}>
                  {isPreorder && <CheckCircle size={16} className="text-white" />}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-indigo-900 uppercase text-xs tracking-wider flex items-center gap-2">
                    <ShoppingBasket size={14} />
                    {isPreorderMode ? 'Booking Phase (Active)' : 'Book for Later'}
                  </div>
                  <div className="text-xs text-indigo-700">
                    {isPreorderMode ? 'All orders are currently bookings.' : 'Skip the line, collect later'}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6 text-kopitiam-dark font-serif font-black text-xl">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>

              <button
                onClick={handleInitiateOrder}
                disabled={isSubmitting || !isConnected}
                className="w-full py-4 bg-kopitiam-dark text-kopitiam-cream rounded-lg font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Processing...</span>
                  </>
                ) : !isConnected ? (
                  <>
                    <AlertCircle size={20} className="text-red-500" />
                    <span className="text-red-500">Disconnected</span>
                  </>
                ) : (
                  <>
                    {isPreorder ? <Ticket size={20} /> : <Check size={20} />}
                    <span>{isPreorder ? 'Book Now' : 'Send to Lab'}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {isLoginModalOpen && <LoginModal />}
        {showTermsModal && <TermsModal />}

        {/* Order Confirmed Receipt Popup */}
        {confirmedOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="bg-kopitiam-cream w-full max-w-sm rounded-2xl shadow-2xl border-4 border-kopitiam-dark overflow-hidden animate-in zoom-in duration-300">
              {/* Header */}
              <div className="bg-kopitiam-dark px-6 py-5 flex items-center gap-4">
                <div className="w-14 h-14 bg-kopitiam-jade rounded-full flex items-center justify-center shrink-0 shadow-lg">
                  <CheckCircle size={30} strokeWidth={2.5} className="text-white" />
                </div>
                <div>
                  <p className="text-kopitiam-jade text-xs font-bold uppercase tracking-widest">Booking Confirmed!</p>
                  <h2 className="text-kopitiam-cream font-serif font-black text-2xl leading-tight">
                    Hi, {confirmedOrder.customerName.split(' ')[0]}! 👋
                  </h2>
                  <p className="text-kopitiam-cream/60 text-xs font-bold uppercase tracking-widest">{confirmedOrder.customerClass}</p>
                </div>
              </div>
              {/* Queue Number */}
              <div className="bg-kopitiam-red flex flex-col items-center py-5">
                <p className="text-kopitiam-cream/80 text-xs font-bold uppercase tracking-[0.2em] mb-1">Your Queue Number</p>
                <span className="text-kopitiam-cream font-serif font-black text-6xl tracking-tight drop-shadow-lg">
                  {confirmedOrder.displayId}
                </span>
                <p className="text-kopitiam-cream/70 text-xs mt-1">Show this when called</p>
              </div>
              <div className="px-6 py-5 space-y-4">
                {/* Items ordered */}
                <div className="bg-white rounded-lg border border-kopitiam-dark/10 divide-y divide-kopitiam-dark/5">
                  {confirmedOrder.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center px-4 py-2 text-sm">
                      <span className="font-serif text-kopitiam-dark font-semibold">{item.name} <span className="text-kopitiam-dark/50">×{item.quantity}</span></span>
                      <span className="font-bold text-kopitiam-dark">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-4 py-3 bg-kopitiam-paper">
                    <span className="font-serif font-black text-kopitiam-dark uppercase tracking-wider text-sm">Total</span>
                    <span className="font-serif font-black text-kopitiam-red text-xl">${confirmedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
                {/* Cash Note */}
                <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-300 rounded-lg px-4 py-3">
                  <Banknote size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-amber-800 text-sm font-bold leading-snug">
                    Please bring <span className="text-amber-900 underline underline-offset-2">exact cash</span> of ${confirmedOrder.total.toFixed(2)} — no change provided.
                  </p>
                </div>
                {/* Location */}
                <div className="flex items-start gap-3 bg-white border border-kopitiam-dark/10 rounded-lg px-4 py-3">
                  <MapPin size={20} className="text-kopitiam-red shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-kopitiam-dark/50 uppercase font-bold tracking-wider">Pick Up Location</p>
                    <p className="font-serif font-bold text-kopitiam-dark">XII-R1 (R.310)</p>
                    <p className="text-sm text-kopitiam-dark/70">Gedung B / SMA Maitreyawira</p>
                  </div>
                </div>
                {/* Date/Time */}
                <div className="flex items-start gap-3 bg-white border border-kopitiam-dark/10 rounded-lg px-4 py-3">
                  <CalendarDays size={20} className="text-kopitiam-jade shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-kopitiam-dark/50 uppercase font-bold tracking-wider">Event Date</p>
                    <p className="font-serif font-bold text-kopitiam-dark">Senin, 16 Maret 2026</p>
                    <p className="text-sm text-kopitiam-dark/70">09.00 – 14.00 WIB</p>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmedOrder(null)}
                  className="w-full py-3 bg-kopitiam-dark text-kopitiam-cream rounded-lg font-bold uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                >
                  Got it! Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};