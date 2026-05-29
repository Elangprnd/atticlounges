import app from '../services/user-service/src/index.js';
import { parse } from 'url';

export default async (req, res) => {
  const { pathname } = parse(req.url, true);
  const parts = pathname.split('/');
  const lastPart = parts[parts.length - 1];

  // If request is for a specific user ID, inject it into params
  if (lastPart && lastPart !== 'auth' && lastPart !== 'users' && lastPart !== 'login' && lastPart !== 'register' && lastPart !== 'me') {
    req.params = { ...req.params, id: lastPart };
  }

  return app(req, res);
};