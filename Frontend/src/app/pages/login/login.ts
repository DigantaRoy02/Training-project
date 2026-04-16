import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }

    /* ── Page shell ── */
    .login-bg {
      min-height: 100vh;
      display: flex;
      background: #ffffff;
    }

    /* Left branding column */
    .login-brand {
      display: none;
      flex-direction: column;
      justify-content: space-between;
      width: 44%;
      padding: 3rem 3.5rem;
      background: linear-gradient(160deg, #1d4ed8 0%, #1e3a8a 60%, #0f172a 100%);
      color: #fff;
      position: relative;
      overflow: hidden;
    }
    @media (min-width: 900px) { .login-brand { display: flex; } }

    .brand-circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.05);
    }
    .brand-circle-1 { width: 320px; height: 320px; top: -80px; right: -80px; }
    .brand-circle-2 { width: 220px; height: 220px; bottom: 60px; left: -60px; }
    .brand-circle-3 { width: 140px; height: 140px; bottom: 220px; right: 40px; background: rgba(255,255,255,0.07); }

    .brand-logo-wrap {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      position: relative;
      z-index: 1;
    }
    .brand-icon {
      width: 2.75rem;
      height: 2.75rem;
      background: rgba(255,255,255,0.15);
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    }
    .brand-name {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .brand-tagline {
      position: relative;
      z-index: 1;
    }
    .brand-tagline h2 {
      font-size: 2rem;
      font-weight: 800;
      line-height: 1.2;
      letter-spacing: -0.03em;
      margin: 0 0 0.75rem;
    }
    .brand-tagline p {
      font-size: 0.9375rem;
      color: rgba(219,234,254,0.75);
      line-height: 1.6;
      margin: 0;
    }

    .brand-footer {
      font-size: 0.75rem;
      color: rgba(255,255,255,0.35);
      position: relative;
      z-index: 1;
    }

    /* Right form column */
    .login-form-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 1.5rem;
      background: #fff;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
    }

    .wh-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 3rem;
      height: 3rem;
      border-radius: 0.875rem;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      box-shadow: 0 4px 14px rgba(37,99,235,0.35);
      margin-bottom: 1.25rem;
    }
    .wh-badge span {
      color: #fff;
      font-size: 1.125rem;
      font-weight: 900;
      letter-spacing: -0.02em;
    }

    .form-heading {
      font-size: 1.625rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.03em;
      margin: 0 0 0.375rem;
    }
    .form-subheading {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0 0 2rem;
    }

    .field-label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.4rem;
    }

    .input-wrap { position: relative; }
    .input-icon {
      position: absolute;
      left: 0.875rem;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
      width: 1rem;
      height: 1rem;
      pointer-events: none;
    }

    .field-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.625rem;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 0.625rem;
      color: #0f172a;
      font-size: 0.9375rem;
      transition: border-color 180ms, box-shadow 180ms, background 180ms;
      outline: none;
      box-sizing: border-box;
    }
    .field-input::placeholder { color: #cbd5e1; }
    .field-input:focus {
      border-color: #2563eb;
      background: #fff;
      box-shadow: 0 0 0 3.5px rgba(37,99,235,0.12);
    }

    .btn-login {
      width: 100%;
      padding: 0.8125rem 1rem;
      border-radius: 0.625rem;
      font-size: 0.9375rem;
      font-weight: 700;
      color: #fff;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      border: none;
      cursor: pointer;
      transition: box-shadow 180ms, transform 120ms, opacity 180ms;
      box-shadow: 0 4px 14px rgba(37,99,235,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    .btn-login:hover:not(:disabled) {
      box-shadow: 0 6px 20px rgba(37,99,235,0.38);
      transform: translateY(-1px);
    }
    .btn-login:active:not(:disabled) { transform: translateY(0); }
    .btn-login:disabled { opacity: 0.5; cursor: not-allowed; }

    .spin {
      width: 1rem; height: 1rem;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 0.5rem;
      padding: 0.65rem 0.875rem;
      color: #dc2626;
      font-size: 0.8125rem;
      font-weight: 500;
    }

    .field-group { margin-bottom: 1.125rem; }
    .field-group:last-of-type { margin-bottom: 1.5rem; }

    /* ═══════════════════════════════════════════════════════════
       WELCOME OVERLAY — fullscreen post-login animation
       ═══════════════════════════════════════════════════════════ */
    .welcome-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(160deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%);
      opacity: 0;
      animation: overlayIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    .welcome-overlay.fade-out {
      animation: overlayOut 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    @keyframes overlayIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes overlayOut {
      from { opacity: 1; transform: scale(1); }
      to   { opacity: 0; transform: scale(1.05); }
    }

    /* Floating particles */
    .welcome-particle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.06);
      animation: particleFloat 6s ease-in-out infinite;
    }
    .wp-1 { width: 250px; height: 250px; top: -60px;  left: -40px;  animation-delay: 0s; }
    .wp-2 { width: 180px; height: 180px; bottom: -30px; right: -50px; animation-delay: -2s; }
    .wp-3 { width: 120px; height: 120px; top: 30%;   right: 10%;  animation-delay: -4s; background: rgba(255,255,255,0.04); }
    .wp-4 { width: 80px;  height: 80px;  bottom: 25%; left: 15%;   animation-delay: -1s; background: rgba(255,255,255,0.05); }
    @keyframes particleFloat {
      0%, 100% { transform: translateY(0) scale(1); }
      50%      { transform: translateY(-20px) scale(1.05); }
    }

    /* Welcome text */
    .welcome-text {
      text-align: center;
      position: relative;
      z-index: 1;
    }
    .welcome-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: rgba(191, 219, 254, 0.8);
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin: 0 0 0.5rem;
      opacity: 0;
      animation: slideUp 0.5s 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    .welcome-name {
      font-size: 2.5rem;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.03em;
      margin: 0 0 0.625rem;
      opacity: 0;
      animation: slideUp 0.5s 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    @media (min-width: 640px) {
      .welcome-name { font-size: 3rem; }
    }
    .welcome-company {
      font-size: 1rem;
      color: rgba(191, 219, 254, 0.65);
      font-weight: 500;
      margin: 0 0 2rem;
      opacity: 0;
      animation: slideUp 0.4s 0.9s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Progress bar */
    .welcome-progress-track {
      width: 220px;
      height: 4px;
      border-radius: 999px;
      background: rgba(255,255,255,0.12);
      overflow: hidden;
      opacity: 0;
      animation: slideUp 0.3s 1.1s ease forwards;
    }
    .welcome-progress-bar {
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, #60a5fa, #a78bfa, #34d399);
      background-size: 200% 100%;
      animation: progressFill 1.8s 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards,
                 progressShimmer 1.5s ease infinite;
      width: 0%;
    }
    @keyframes progressFill {
      from { width: 0%; }
      to   { width: 100%; }
    }
    @keyframes progressShimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .welcome-redirect {
      font-size: 0.75rem;
      color: rgba(191, 219, 254, 0.45);
      margin-top: 1rem;
      opacity: 0;
      animation: slideUp 0.3s 1.3s ease forwards;
    }

    /* ── Dark mode for login ── */
    .dark .login-bg { background: #0f172a; }
    .dark .login-form-col { background: #1e293b; }
    .dark .form-heading { color: #f1f5f9; }
    .dark .form-subheading { color: #64748b; }
    .dark .field-label { color: #94a3b8; }
    .dark .field-input {
      background: #0f172a;
      border-color: #334155;
      color: #e2e8f0;
    }
    .dark .field-input::placeholder { color: #475569; }
    .dark .field-input:focus {
      background: #0f172a;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3.5px rgba(59, 130, 246, 0.2);
    }
    .dark .error-banner {
      background: rgba(239, 68, 68, 0.1);
      border-color: #7f1d1d;
      color: #f87171;
    }
  `,
  template: `
    <!-- ═══ WELCOME OVERLAY ═══ -->
    @if (showWelcome()) {
      <div class="welcome-overlay" [class.fade-out]="welcomeFadeOut()">
        <!-- Floating particles -->
        <div class="welcome-particle wp-1"></div>
        <div class="welcome-particle wp-2"></div>
        <div class="welcome-particle wp-3"></div>
        <div class="welcome-particle wp-4"></div>

        <!-- Welcome text -->
        <div class="welcome-text">
          <p class="welcome-label">Welcome back</p>
          <h1 class="welcome-name">{{ welcomeName() }}</h1>
          <p class="welcome-company">{{ welcomeCompany() }}</p>
        </div>

        <!-- Progress bar -->
        <div class="welcome-progress-track">
          <div class="welcome-progress-bar"></div>
        </div>
        <p class="welcome-redirect">Preparing your dashboard…</p>
      </div>
    }

    <!-- ═══ LOGIN FORM ═══ -->
    <div class="login-bg">

      <!-- Left branding panel -->
      <div class="login-brand">
        <div class="brand-circle brand-circle-1"></div>
        <div class="brand-circle brand-circle-2"></div>
        <div class="brand-circle brand-circle-3"></div>

        <div class="brand-logo-wrap">
          <div class="brand-icon">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span class="brand-name">WH</span>
        </div>

        <div class="brand-tagline">
          <h2>Smart Warehouse,<br/>Smarter Decisions.</h2>
          <p>Manage inventory, track reorders, and gain real-time insight into every corner of your warehouse — all in one place.</p>
        </div>

        <div class="brand-footer">© 2026 Warehouse Management System</div>
      </div>

      <!-- Right form panel -->
      <div class="login-form-col">
        <div class="login-card">

          <div class="wh-badge"><span>WH</span></div>
          <h1 class="form-heading">Welcome back</h1>
          <p class="form-subheading">Sign in to your warehouse account</p>

          <form (ngSubmit)="onSubmit()" #loginForm="ngForm" novalidate>

            <div class="field-group">
              <label class="field-label" for="username">Username</label>
              <div class="input-wrap">
                <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <input
                  id="username"
                  name="username"
                  type="text"
                  class="field-input"
                  placeholder="Enter your username"
                  [(ngModel)]="username"
                  required
                  autocomplete="username"
                />
              </div>
            </div>

            <div class="field-group">
              <label class="field-label" for="password">Password</label>
              <div class="input-wrap">
                <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <input
                  id="password"
                  name="password"
                  type="password"
                  class="field-input"
                  placeholder="Enter your password"
                  [(ngModel)]="password"
                  required
                  autocomplete="current-password"
                />
              </div>
            </div>

            @if (errorMessage()) {
              <div class="error-banner" style="margin-bottom: 1.25rem;">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                {{ errorMessage() }}
              </div>
            }

            <button
              type="submit"
              class="btn-login"
              [disabled]="loading() || !username || !password"
            >
              @if (loading()) {
                <span class="spin"></span>
                Signing in…
              } @else {
                Sign In
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              }
            </button>

          </form>
        </div>
      </div>

    </div>
  `,
})
export class Login {
  username = '';
  password = '';

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly showWelcome = signal(false);
  readonly welcomeFadeOut = signal(false);
  readonly welcomeName = signal('');
  readonly welcomeCompany = signal('');

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  onSubmit(): void {
    if (!this.username || !this.password) return;

    this.loading.set(true);
    this.errorMessage.set('');

    this.auth.login(this.username, this.password).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          // Show welcome overlay with user info
          this.welcomeName.set(res.displayName ?? this.username);
          this.welcomeCompany.set(res.companyName ?? '');
          this.showWelcome.set(true);

          // Start fade-out after animations finish, then navigate
          setTimeout(() => this.welcomeFadeOut.set(true), 3000);
          setTimeout(() => {
            this.showWelcome.set(false);
            this.router.navigate(['/dashboard']);
          }, 3600);
        } else {
          this.errorMessage.set(res.message ?? 'Login failed. Please try again.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        const msg =
          err?.error?.message ?? 'Invalid username or password.';
        this.errorMessage.set(msg);
      },
    });
  }
}
