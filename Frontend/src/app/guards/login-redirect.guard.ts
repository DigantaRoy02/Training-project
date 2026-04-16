import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Prevents logged-in users from seeing the login page.
 * If already authenticated, redirect to dashboard.
 */
export const loginRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn() || auth.getToken()) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
