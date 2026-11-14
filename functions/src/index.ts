import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';

initializeApp();
const db = getFirestore();

type Order = {
  customerId?: string;
  customerName?: string;
  type?: string;
  status?: string;
  paymentStatus?: string;
  total?: number;
  paymentMethod?: string;
};

const statusText: Record<string, string> = {
  pending: 'We received your order and are checking it now.',
  confirmed: 'Your order has been confirmed by The Oven.',
  preparing: 'Your order is being freshly prepared in the kitchen.',
  ready: 'Your order is ready. We are getting it to you now.',
  out_for_delivery: 'Your order is out for delivery. Please keep your phone available.',
  delivered: 'Your order has been delivered. Enjoy your meal!',
  picked_up: 'Your order has been picked up. Enjoy your meal!',
  served: 'Your order has been served at your table. Enjoy your meal!',
  completed: 'Your order is complete. We would love your feedback.',
  cancelled: 'Your order has been cancelled. Please contact The Oven if you need help.',
};

const paymentText: Record<string, string> = {
  approved: 'Your payment has been verified by The Oven.',
  rejected: 'We could not verify the submitted payment proof. Please contact the restaurant.',
  cash_collected: 'Cash payment received. Your order is now paid.',
};

async function tokensFor(collectionName: string, ids: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const id of ids) {
    const s = await db.collection(collectionName).doc(id).get();
    const t = s.data()?.fcmToken;
    if (typeof t === 'string' && t) out.push(t);
  }
  return [...new Set(out)];
}

async function send(tokens: string[], title: string, body: string, data: Record<string, string>) {
  if (!tokens.length) return;
  await getMessaging().sendEachForMulticast({ tokens, notification: { title, body }, data });
}

async function log(orderId: string, customerId: string, title: string, body: string, type: string) {
  await db.collection('notifications').add({
    orderId,
    customerId,
    title,
    body,
    type,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export const onNewOrder = onDocumentCreated('orders/{orderId}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  const o = snap.data() as Order;
  const orderId = event.params.orderId;

  const admins = await db.collection('adminDevices').get();
  const adminTokens = admins.docs
    .map((d) => d.data().fcmToken)
    .filter((x): x is string => typeof x === 'string' && x.length > 0);
  const title = `New ${o.type || 'customer'} order`;
  const body = `${o.customerName || 'Customer'} placed order #${orderId.slice(0, 7).toUpperCase()} for Rs. ${Number(o.total || 0).toLocaleString()}.`;
  await send([...new Set(adminTokens)], title, body, { orderId, type: 'new_order' });

  if (o.customerId) {
    const customerTokens = await tokensFor('users', [o.customerId]);
    await send(customerTokens, 'Order received', 'We have received your order and will update you shortly.', {
      orderId,
      type: 'order_received',
    });
    await log(orderId, o.customerId, 'Order received', 'We have received your order and will update you shortly.', 'order_received');
  }
});

export const onOrderUpdated = onDocumentUpdated('orders/{orderId}', async (event) => {
  const before = event.data?.before.data() as Order | undefined;
  const after = event.data?.after.data() as Order | undefined;
  if (!before || !after) return;
  const orderId = event.params.orderId;

  if (after.customerId && before.status !== after.status && after.status) {
    const body = statusText[after.status];
    if (body) {
      const tokens = await tokensFor('users', [after.customerId]);
      await send(
        tokens,
        `Order #${orderId.slice(0, 7).toUpperCase()} · ${after.status.replaceAll('_', ' ')}`,
        body,
        { orderId, type: 'order_status', status: after.status }
      );
      await log(orderId, after.customerId, `Order #${orderId.slice(0, 7).toUpperCase()} updated`, body, 'order_status');
    }
  }

  if (after.customerId && before.paymentStatus !== after.paymentStatus && after.paymentStatus) {
    const body = paymentText[after.paymentStatus];
    if (body) {
      const tokens = await tokensFor('users', [after.customerId]);
      await send(tokens, 'Payment update', body, { orderId, type: 'payment_status', paymentStatus: after.paymentStatus });
      await log(orderId, after.customerId, 'Payment update', body, 'payment_status');
    }
  }
});
