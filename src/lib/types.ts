export type OrderType = 'delivery' | 'pickup' | 'dine-in';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'picked_up'
  | 'served'
  | 'completed'
  | 'cancelled';
export type PaymentStatus = 'unpaid' | 'pending_verification' | 'approved' | 'rejected' | 'cash_due' | 'cash_collected';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  size?: string;
  notes?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  phone?: string;
  type: OrderType;
  status: OrderStatus;
  paymentMethod: 'online' | 'cod' | 'cash';
  paymentStatus: PaymentStatus;
  paymentBank?: string;
  paymentScreenshotUrl?: string;
  address?: string;
  tableNumber?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  imagePath?: string;
  /** Size variants, e.g. [{label:'S',price:650},{label:'M',price:950},{label:'L',price:1150}] */
  sizes?: { label: string; price: number }[];
  available?: boolean;
  featured?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
  active?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  imagePath?: string;
  active?: boolean;
  sortOrder?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface RestaurantSettings {
  name: string;
  phone: string;
  address: string;
  deliveryFee: number;
  minOrder: number;
  openingTime: string;
  closingTime: string;
  accountTitle: string;
  accountNumber: string;
  paymentNote: string;
  announcements?: string;
}

export interface FeedbackItem {
  id: string;
  customerId?: string;
  customerName?: string;
  orderId?: string;
  rating: number;
  comment?: string;
  createdAt: any;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  orderId?: string;
  customerId?: string;
  createdAt: any;
}

export interface Customer {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  createdAt?: any;
}

export const statusLabel: Record<OrderStatus, string> = {
  pending: 'New Order',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  picked_up: 'Picked Up',
  served: 'Served',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const typeLabel: Record<OrderType, string> = {
  delivery: 'Delivery',
  pickup: 'Pickup',
  'dine-in': 'Dine-in',
};

export const paymentLabel: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  pending_verification: 'Review',
  approved: 'Paid',
  rejected: 'Rejected',
  cash_due: 'Cash due',
  cash_collected: 'Cash collected',
};

/** Ordered pipeline of statuses for each order type, used for timelines and funnels. */
export function pipelineFor(type: OrderType): OrderStatus[] {
  if (type === 'delivery') return ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed'];
  if (type === 'pickup') return ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'completed'];
  return ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed'];
}

/** The single next status an order should move to, or null if terminal. */
export function nextStatus(o: Order): OrderStatus | null {
  const pipe = pipelineFor(o.type);
  const idx = pipe.indexOf(o.status);
  if (idx === -1 || idx === pipe.length - 1) return null;
  return pipe[idx + 1];
}
