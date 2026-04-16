import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Already known to be logged in (signal restored from localStorage or prior nav)
  if (auth.isLoggedIn()) {
    return true;
  }

  // If there's a stored token, validate it with the backend
  if (auth.getToken()) {
    return auth.checkSession().pipe(
      map((res) => {
        if (res.success) {
          return true;
        }
        return router.createUrlTree(['/login']);
      }),
      catchError(() => of(router.createUrlTree(['/login'])))
    );
  }

  // No token at all — redirect to login
  return router.createUrlTree(['/login']);
};
