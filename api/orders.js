import app from '../services/order-service/src/index.js';
import { parse } from 'url';

export default async (req, res) => {
  const { pathname } = parse(req.url, true);
  const parts = pathname.split('/');
  const id = parts[parts.length - 1];

  // Handle /api/orders/USER_ID and /api/admin/orders/ORDER_ID
  if (id && id !== 'orders' && id !== 'admin' && id !== 'cart' && id !== 'cleanup-orders') {
    req.params = { ...req.params, id };
    
    // For /api/admin/orders/ID, we might need the ID in a different param
    if (pathname.includes('/admin/orders/')) {
      req.params.id = id;
    }
  }

  return app(req, res);
};