import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MenuItem, Order, OrderStatus, PHOTOBOOTH_CATEGORIES, FOOD_CATEGORIES } from '../types';
import { io, Socket } from 'socket.io-client';

export interface OrderConfirmation {
  displayId: string;
  total: number;
  customerName: string;
  customerClass?: string;
  isPreorder: boolean;
  masterCategory: 'photobooth' | 'food';
  items: any[];
}

interface EventContextType {
  menu: MenuItem[];
  orders: Order[];
  isStoreOpen: boolean;
  isPreorderMode: boolean;
  isAuthenticated: boolean;
  addOrder: (items: any[], total: number, customerName: string, customerClass: string, isPreorder?: boolean, masterCategory?: 'photobooth' | 'food') => Promise<OrderConfirmation>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  deleteOrder: (orderId: string) => void;
  addMenuItem: (item: MenuItem) => void;
  updateMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (id: string) => void;
  toggleItemAvailability: (id: string) => void;
  resetSystem: () => void;
  toggleStoreOpen: () => void;
  togglePreorderMode: () => void;
  updateSetting: (key: string, value: any) => void;
  settings: {
    terms_photobooth: string[];
    terms_food: string[];
  };
  login: (pin: string) => boolean;
  logout: () => void;
  isConnected: boolean;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isStoreOpen, setIsStoreOpen] = useState<boolean>(true);
  const [isPreorderMode, setIsPreorderMode] = useState<boolean>(false);
  const [settings, setSettings] = useState({
    terms_photobooth: [] as string[],
    terms_food: [] as string[]
  });

  // Keep Auth in localStorage so admins don't get logged out on refresh
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('event_auth');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('event_auth', String(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    // Connect to the Socket.IO server (proxy handles the /socket.io path)
    const newSocket = io();

    newSocket.on('connect', () => {
      console.log('Connected to backend:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from backend');
      setIsConnected(false);
    });

    newSocket.on('init_data', (data) => {
      if (data.menu) setMenu(data.menu);
      if (data.orders) setOrders(data.orders);
      if (data.settings) {
        setIsStoreOpen(data.settings.isStoreOpen);
        setIsPreorderMode(data.settings.isPreorderMode);
        setSettings({
          terms_photobooth: data.settings.terms_photobooth || [],
          terms_food: data.settings.terms_food || []
        });
      }
    });

    newSocket.on('state_update', (data) => {
      if (data.menu) setMenu(data.menu);
      if (data.orders) setOrders(data.orders);
      if (data.settings) {
        setIsStoreOpen(data.settings.isStoreOpen);
        setIsPreorderMode(data.settings.isPreorderMode);
        setSettings({
          terms_photobooth: data.settings.terms_photobooth || [],
          terms_food: data.settings.terms_food || []
        });
      }
    });

    setSocket(newSocket);
    return () => { newSocket.close(); };
  }, []);

  const addOrder = (cartItems: any[], total: number, customerName: string, customerClass: string, isPreorder: boolean = false, masterCategory: 'photobooth' | 'food' = 'photobooth'): Promise<OrderConfirmation> => {
    return new Promise((resolve) => {
      if (socket) {
        socket.once('order_confirmed', (confirmation: OrderConfirmation) => {
          resolve(confirmation);
        });
        socket.emit('create_order', { items: cartItems, total, customerName, customerClass, isPreorder, masterCategory });
      }
    });
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    if (socket) {
      socket.emit('update_order_status', { orderId, status });
    }
  };

  const deleteOrder = (orderId: string) => {
    if (socket) {
      socket.emit('delete_order', orderId);
    }
  };

  const addMenuItem = (item: MenuItem) => {
    if (socket) {
      socket.emit('add_menu_item', item);
    }
  };

  const updateMenuItem = (updatedItem: MenuItem) => {
    if (socket) {
      socket.emit('update_menu_item', updatedItem);
    }
  };

  const deleteMenuItem = (id: string) => {
    if (socket) {
      socket.emit('delete_menu_item', id);
    }
  };

  const toggleItemAvailability = (id: string) => {
    if (socket) {
      socket.emit('toggle_item_availability', id);
    }
  };

  const resetSystem = () => {
    if (socket) {
      socket.emit('reset_system');
    }
  };

  const toggleStoreOpen = () => {
    if (socket) socket.emit('toggle_store_open');
  };

  const togglePreorderMode = () => {
    if (socket) socket.emit('toggle_preorder_mode');
  };

  const updateSetting = (key: string, value: any) => {
    if (socket) socket.emit('update_setting', { key, value });
  };

  const login = (pin: string) => {
    // Hardcoded PIN for demo purposes: 8888 (Lucky number!)
    if (pin === '8888') {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <EventContext.Provider value={{
      menu,
      orders,
      isStoreOpen,
      isPreorderMode,
      isAuthenticated,
      addOrder,
      updateOrderStatus,
      deleteOrder,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      toggleItemAvailability,
      resetSystem,
      toggleStoreOpen,
      togglePreorderMode,
      updateSetting,
      settings,
      login,
      logout,
      isConnected
    }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) throw new Error("useEvent must be used within an EventProvider");
  return context;
};