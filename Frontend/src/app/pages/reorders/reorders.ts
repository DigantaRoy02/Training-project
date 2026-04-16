import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ReorderService, ReorderRequest, ReorderStatus } from '../../services/reorder.service';

@Component({
  selector: 'app-reorders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page heading -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Reorders</h2>
      <p class="text-sm text-gray-400 mt-1">Track and manage reorder requests</p>
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <div class="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
        <p class="text-sm text-gray-500">Total Orders</p>
        <p class="text-2xl font-bold text-blue-600 mt-1">{{ reorderService.orders().length }}</p>
      </div>
      <div class="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
        <p class="text-sm text-gray-500">Pending</p>
        <p class="text-2xl font-bold text-amber-600 mt-1">{{ reorderService.pendingCount() }}</p>
      </div>
      <div class="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
        <p class="text-sm text-gray-500">Approved</p>
        <p class="text-2xl font-bold text-blue-600 mt-1">{{ reorderService.approvedCount() }}</p>
      </div>
      <div class="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
        <p class="text-sm text-gray-500">Shipped</p>
        <p class="text-2xl font-bold text-violet-600 mt-1">{{ reorderService.shippedCount() }}</p>
      </div>
      <div class="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
        <p class="text-sm text-gray-500">Total Value</p>
        <p class="text-2xl font-bold text-emerald-600 mt-1">\${{ totalValue() }}</p>
      </div>
    </div>

    <!-- Table -->
    <div class="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50">
              <th class="text-left px-4 py-3 font-medium text-gray-500">Order ID</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Item</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Category</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Qty</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Total Cost</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Supplier</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Requested</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Expected Delivery</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (order of reorderService.orders(); track order.orderId) {
              <tr class="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                <td class="px-4 py-3 font-semibold text-violet-600">{{ order.orderId }}</td>
                <td class="px-4 py-3">
                  <div>
                    <p class="font-medium text-gray-900">{{ order.itemName }}</p>
                    <p class="text-xs text-gray-400">{{ order.itemId }}</p>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                    {{ order.category }}
                  </span>
                </td>
                <td class="px-4 py-3 font-medium text-gray-900">{{ order.quantity }}</td>
                <td class="px-4 py-3 font-semibold text-gray-900">\${{ order.totalCost.toFixed(2) }}</td>
                <td class="px-4 py-3 text-gray-600 text-xs">{{ order.supplier }}</td>
                <td class="px-4 py-3 text-gray-500 text-xs">{{ order.requestedDate }}</td>
                <td class="px-4 py-3 text-xs font-medium"
                    [class.text-blue-600]="order.expectedDelivery !== '-'"
                    [class.text-gray-400]="order.expectedDelivery === '-'">
                  {{ order.expectedDelivery }}
                </td>
                <td class="px-4 py-3">
                  <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium"
                    [class.bg-amber-100]="order.status === 'PENDING'"
                    [class.text-amber-700]="order.status === 'PENDING'"
                    [class.bg-blue-100]="order.status === 'APPROVED'"
                    [class.text-blue-700]="order.status === 'APPROVED'"
                    [class.bg-violet-100]="order.status === 'SHIPPED'"
                    [class.text-violet-700]="order.status === 'SHIPPED'"
                    [class.bg-emerald-100]="order.status === 'RECEIVED'"
                    [class.text-emerald-700]="order.status === 'RECEIVED'"
                  >{{ order.status }}</span>
                </td>
                <td class="px-4 py-3">
                  @switch (order.status) {
                    @case ('PENDING') {
                      <button (click)="approve(order)"
                        class="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white
                               hover:bg-blue-700 transition-colors shadow-sm">
                        Approve
                      </button>
                    }
                    @case ('APPROVED') {
                      <button (click)="markShipped(order)"
                        class="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600 text-white
                               hover:bg-violet-700 transition-colors shadow-sm">
                        Mark Shipped
                      </button>
                    }
                    @case ('SHIPPED') {
                      <button (click)="markReceived(order)"
                        class="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white
                               hover:bg-emerald-700 transition-colors shadow-sm">
                        Mark Received
                      </button>
                    }
                    @case ('RECEIVED') {
                      <span class="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Completed
                      </span>
                    }
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="10" class="px-4 py-10 text-center text-gray-400 text-sm">
                  No reorder requests yet. Create one from the Inventory page.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Toast notification -->
    @if (toastVisible()) {
      <div class="fixed top-6 right-6 z-[60] animate-slide-in">
        <div class="flex items-start gap-3 px-5 py-4 bg-white rounded-xl shadow-lg border border-gray-200 min-w-[340px] max-w-md">
          <div class="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5"
               [class.bg-emerald-100]="toastType() === 'success'"
               [class.bg-blue-100]="toastType() === 'info'"
               [class.bg-violet-100]="toastType() === 'shipped'">
            @switch (toastType()) {
              @case ('success') {
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              }
              @case ('info') {
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              }
              @case ('shipped') {
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              }
            }
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-900">{{ toastTitle() }}</p>
            <p class="text-xs text-gray-500 mt-0.5">{{ toastMessage() }}</p>
          </div>
          <button (click)="dismissToast()" class="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes slide-in {
      from { opacity: 0; transform: translateX(100px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .animate-slide-in {
      animation: slide-in 0.3s ease-out;
    }
  `],
})
export class Reorders implements OnInit {
  readonly reorderService = inject(ReorderService);

  ngOnInit(): void {
    this.reorderService.load();
  }

  // ── Computed ──
  readonly totalValue = computed(() => {
    const total = this.reorderService.orders().reduce((sum, o) => sum + o.totalCost, 0);
    return total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  });

  // ── Toast state ──
  readonly toastVisible = signal(false);
  readonly toastTitle = signal('');
  readonly toastMessage = signal('');
  readonly toastType = signal<'success' | 'info' | 'shipped'>('success');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Actions ──
  approve(order: ReorderRequest) {
    this.reorderService.updateStatus(order.reorderId, 'APPROVED');
    this.showToast('info', 'Order Approved', `${order.itemName} (${order.orderId}) has been approved.`);
  }

  markShipped(order: ReorderRequest) {
    this.reorderService.updateStatus(order.reorderId, 'SHIPPED');
    this.showToast('shipped', 'Order Shipped', `${order.itemName} (${order.orderId}) has been marked as shipped.`);
  }

  markReceived(order: ReorderRequest) {
    this.reorderService.updateStatus(order.reorderId, 'RECEIVED');
    this.showToast('success', 'Order Received', `${order.itemName} (${order.orderId}) has been received and completed.`);
  }

  // ── Toast helpers ──
  showToast(type: 'success' | 'info' | 'shipped', title: string, message: string) {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastType.set(type);
    this.toastTitle.set(title);
    this.toastMessage.set(message);
    this.toastVisible.set(true);
    this.toastTimer = setTimeout(() => this.dismissToast(), 4000);
  }

  dismissToast() {
    this.toastVisible.set(false);
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }
}
