import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Attaches:
 * 1. Authorization: Bearer <token> header to ALL requests (if token exists).
 * 2. X-Warehouse header to /warehouse/* requests for DB routing.
 */
export const warehouseInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const headers: Record<string, string> = {};

  // Attach JWT token to every request
  const token = auth.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Attach X-Warehouse header for warehouse endpoints
  if (req.url.startsWith('/warehouse')) {
    const warehouseName = auth.currentUser()?.warehouseName;
    if (warehouseName) {
      headers['X-Warehouse'] = warehouseName;
    }
  }

  if (Object.keys(headers).length > 0) {
    req = req.clone({ setHeaders: headers });
  }

  return next(req);
};
