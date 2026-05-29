import app from '../services/product-service/src/index.js';
import { parse } from 'url';

export default async (req, res) => {
  const { pathname } = parse(req.url, true);
  const parts = pathname.split('/');
  const id = parts[parts.length - 1];
  
  // Cleanly route specific product IDs and special actions
  if (id && id !== 'products' && id !== 'all' && id !== 'categories' && id !== 'test') {
    // If it's a sub-path like /api/products/ID/sold, handle the ID
    if (parts[parts.length - 2] === 'products') {
      req.params = { ...req.params, id };
    } else if (parts[parts.length - 3] === 'products') {
      // For /api/products/ID/sold
      req.params = { ...req.params, id: parts[parts.length - 2] };
    }
  }
  
  return app(req, res);
};