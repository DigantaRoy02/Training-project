import { ChangeDetectionStrategy, Component, inject, input, output, ViewEncapsulation } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: `
    app-sidebar { display: block; }

    /* Sidebar panel — fixed left, slides in/out */
    .sb-panel {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: 40;
      width: 16rem;
      background: #fff;
      border-right: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      transform: translateX(-100%);
      transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    .sb-panel.sb-open {
      transform: translateX(0);
    }

    .sb-logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.5rem 0.75rem;
      margin-top: 0.625rem;
      border-radius: 0.5rem;
      background: transparent;
      border: 1px solid #fecaca;
      color: #ef4444;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 150ms, color 150ms;
    }
    .sb-logout-btn:hover {
      background: #fef2f2;
    }

    /* ── Dark mode ── */
    :host-context(.dark) .sb-panel,
    .dark .sb-panel {
      background: #1e293b;
      border-right-color: #334155;
    }
    :host-context(.dark) .sb-logout-btn,
    .dark .sb-logout-btn {
      border-color: #7f1d1d;
      color: #f87171;
    }
    :host-context(.dark) .sb-logout-btn:hover,
    .dark .sb-logout-btn:hover {
      background: rgba(239, 68, 68, 0.1);
    }
  `,
  template: `
    <!-- Sidebar panel -->
    <aside
      class="sb-panel"
      [class.sb-open]="isOpen()"
    >
      <!-- Header -->
      <div class="flex items-center px-5 py-4 border-b border-gray-200">
        <!-- Logo + App name -->
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span class="text-lg font-bold text-gray-900 tracking-tight">{{ auth.currentUser()?.displayName ?? 'Warehouse' }}</span>
        </div>
      </div>

      <!-- Navigation links -->
      <nav class="flex-1 px-4 py-5 overflow-y-auto" aria-label="Main navigation">
        <ul class="space-y-1">
          @for (item of navItems; track item.route) {
            <li>
              <a
                [routerLink]="item.route"
                routerLinkActive="bg-blue-50 text-blue-600 font-semibold"
                [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                       text-gray-500 hover:bg-gray-50 hover:text-gray-900
                       transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  @switch (item.icon) {
                    @case ('dashboard') {
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    }
                    @case ('inventory') {
                      <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    }
                    @case ('reorders') {
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M20.016 4.656v4.992" />
                    }
                    @case ('management') {
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    }
                    @case ('purchase') {
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121 0 2.09-.773 2.34-1.865l1.918-8.397a1.077 1.077 0 00-1.05-1.313H5.653M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                    }
                  }
                </svg>
                <span>{{ item.label }}</span>
              </a>
            </li>
          }
        </ul>
      </nav>

      <!-- Footer: user info + logout -->
      <div class="px-5 py-4 border-t border-gray-200">
        <div class="flex items-center gap-3 mb-1">
          <div class="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            {{ (auth.currentUser()?.companyName ?? 'W')[0].toUpperCase() }}
          </div>
          <div class="text-sm overflow-hidden">
            <p class="font-semibold text-gray-900 truncate">{{ auth.currentUser()?.companyName ?? '—' }}</p>
            <p class="text-xs text-gray-400 truncate">{{ auth.currentUser()?.username ?? '' }}</p>
          </div>
        </div>
        <button class="sb-logout-btn" (click)="onLogout()">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  `,
})
export class Sidebar {
  isOpen = input.required<boolean>();
  closed = output<void>();

  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  onLogout(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Inventory', icon: 'inventory', route: '/inventory' },
    { label: 'Reorders', icon: 'reorders', route: '/reorders' },
    { label: 'Management', icon: 'management', route: '/management' },
    { label: 'Purchase', icon: 'purchase', route: '/purchase' },
  ];
}
