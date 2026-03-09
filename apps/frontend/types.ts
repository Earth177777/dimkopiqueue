export type MasterCategory = 'photobooth' | 'food';

export enum OrderStatus {
  QUEUED = 'QUEUED',         // Registered and on queue
  // Photobooth statuses
  ON_AIR = 'ON_AIR',         // On photo / On air
  CHOOSING = 'CHOOSING',     // Choosing photo
  PRINTING = 'PRINTING',     // Printing
  READY = 'READY',           // Ready to take
  // Food statuses
  COOKING = 'COOKING',       // Being prepared
  // Shared
  COMPLETED = 'COMPLETED',   // Archived/Picked up
  CANCELLED = 'CANCELLED'
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  masterCategory: MasterCategory;
  image: string;
  available: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string; // Display ID (e.g., #001)
  timestamp: number;
  items: CartItem[];
  status: OrderStatus;
  total: number;
  customerName?: string;
  customerClass?: string;
  isPreorder?: boolean;
  masterCategory: MasterCategory;
}

export type ViewMode = 'ORDER' | 'KITCHEN' | 'DISPLAY' | 'ADMIN';

export const PHOTOBOOTH_CATEGORIES = ['All', 'Strips', 'Landscape', 'Digital', 'Add-ons'];
export const FOOD_CATEGORIES = ['All', 'Drinks', 'Mains', 'Snacks'];
export const CATEGORIES = [...PHOTOBOOTH_CATEGORIES, ...FOOD_CATEGORIES];