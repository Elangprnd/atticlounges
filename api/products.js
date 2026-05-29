import app from '../services/product-service/src/index.js';
import { parse } from 'url';

export default async (req, res) => {
  const { pathname } = parse(req.url, true);
  
  // Extract ID from /api/products/ID
  const parts = pathname.split('/');
  const id = parts[parts.length - 1];
  
  // If it's a detail request (ID is present and not 'products')
  if (id && id !== 'products' && id !== 'all' && id !== 'test') {
    req.params = { ...req.params, id };
  }
  
  return app(req, res);
};