import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export async function logNotification(data: {
  orderId?: string;
  customerId?: string;
  title: string;
  body: string;
  type: string;
}) {
  return addDoc(collection(db, 'notifications'), { ...data, createdAt: serverTimestamp() });
}
