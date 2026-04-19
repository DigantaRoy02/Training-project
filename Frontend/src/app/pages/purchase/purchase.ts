import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { InventoryService, InventoryItem } from '../../services/inventory.service';
import { ReorderService } from '../../services/reorder.service';
import { DashboardService } from '../../services/dashboard.service';

interface CartItem {
  item: InventoryItem;
  quantity: number;
}

interface PurchaseRecord {
  itemName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: string;
  autoReordered: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-purchase',
  imports: [FormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Purchase</h2>
      <p class="text-sm text-gray-400 mt-1">Create purchase/sale transactions — stock is deducted automatically</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- ═══ Left: Item Selector + Cart ═══ -->
      <div class="lg:col-span-2 space-y-6">

        <!-- Search & Select Item -->
        <div class="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-bold text-gray-900">Select Items</h3>
                <p class="text-xs text-gray-400">Search and add items to the cart</p>
              </div>
            </div>
          </div>

          <div class="p-4 space-y-3">
            <!-- Search bar -->
            <div class="relative">
              <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input type="text" placeholder="Search items by name, SKU, or category..."
                class="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" />
            </div>

            <!-- Items grid -->
            <div class="max-h-[320px] overflow-y-auto space-y-2">
              @for (item of filteredItems(); track item.id) {
                <div class="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer"
                     (click)="selectItem(item)">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                         [class.bg-emerald-100]="item.status === 'In Stock'"
                         [class.text-emerald-700]="item.status === 'In Stock'"
                         [class.bg-amber-100]="item.status === 'Low Stock'"
                         [class.text-amber-700]="item.status === 'Low Stock'"
                         [class.bg-red-100]="item.status === 'Out of Stock'"
                         [class.text-red-700]="item.status === 'Out of Stock'">
                      {{ item.quantity }}
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">{{ item.name }}</p>
                      <p class="text-[10px] text-gray-400">{{ item.sku }} · {{ item.category }} · {{ item.binCode }}</p>
                    </div>
                  </div>
                  <div class="text-right flex-shrink-0 ml-3">
                    <p class="text-sm font-bold text-gray-900">\${{ item.unitPrice.toFixed(2) }}</p>
                    <span class="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          [class.bg-emerald-100]="item.status === 'In Stock'"
                          [class.text-emerald-700]="item.status === 'In Stock'"
                          [class.bg-amber-100]="item.status === 'Low Stock'"
                          [class.text-amber-700]="item.status === 'Low Stock'"
                          [class.bg-red-100]="item.status === 'Out of Stock'"
                          [class.text-red-700]="item.status === 'Out of Stock'">{{ item.status }}</span>
                  </div>
                </div>
              } @empty {
                <p class="text-center text-gray-400 text-xs py-6">No items found</p>
              }
            </div>
          </div>
        </div>

        <!-- Cart -->
        <div class="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-bold text-gray-900">Cart</h3>
                <p class="text-xs text-gray-400">{{ cart().length }} item(s)</p>
              </div>
            </div>
            @if (cart().length > 0) {
              <button (click)="clearCart()"
                class="text-xs font-medium text-red-500 hover:text-red-700 transition-colors">Clear All</button>
            }
          </div>

          <div class="p-4">
            @if (cart().length === 0) {
              <div class="py-8 text-center">
                <p class="text-gray-400 text-sm">Cart is empty — click an item above to add it</p>
              </div>
            } @else {
              <div class="space-y-3">
                @for (ci of cart(); track ci.item.id) {
                  <div class="flex items-center gap-4 px-4 py-3 rounded-lg border border-gray-100 bg-gray-50/50">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">{{ ci.item.name }}</p>
                      <p class="text-[10px] text-gray-400">{{ ci.item.sku }} · Avail: {{ ci.item.quantity }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <button (click)="decrementQty(ci.item.id)"
                        class="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-sm font-bold">−</button>
                      <input type="number" min="1" [max]="ci.item.quantity"
                        class="w-14 text-center text-sm border border-gray-200 rounded-md py-1
                               focus:outline-none focus:ring-2 focus:ring-blue-500
                               [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        [ngModel]="ci.quantity" (ngModelChange)="setQty(ci.item.id, $event)" />
                      <button (click)="incrementQty(ci.item.id)"
                        class="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-sm font-bold">+</button>
                    </div>
                    <p class="text-sm font-bold text-gray-900 w-20 text-right">\${{ (ci.quantity * ci.item.unitPrice).toFixed(2) }}</p>
                    <button (click)="removeFromCart(ci.item.id)"
                      class="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                }
              </div>

              <!-- Cart total + Checkout -->
              <div class="mt-4 pt-4 border-t border-gray-200">
                <div class="flex items-center justify-between mb-4">
                  <span class="text-sm font-medium text-gray-500">Total ({{ cartTotalQty() }} items)</span>
                  <span class="text-lg font-bold text-gray-900">\${{ cartTotal().toFixed(2) }}</span>
                </div>
                <button (click)="checkout()"
                  [disabled]="processing()"
                  class="w-full px-4 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-lg
                         hover:bg-emerald-700 transition-colors shadow-sm
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  @if (processing()) {
                    <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Processing...</span>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>Complete Purchase</span>
                  }
                </button>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- ═══ Right: Recent Transactions ═══ -->
      <div class="lg:col-span-1">
        <div class="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden sticky top-6">
          <div class="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-bold text-gray-900">Recent Transactions</h3>
                <p class="text-xs text-gray-400">This session</p>
              </div>
            </div>
          </div>

          <div class="p-4 max-h-[600px] overflow-y-auto">
            @if (history().length === 0) {
              <div class="py-10 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto w-10 h-10 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <p class="text-gray-400 text-xs">No transactions yet</p>
              </div>
            } @else {
              <div class="space-y-3">
                @for (rec of history(); track rec.timestamp.getTime()) {
                  <div class="p-3 rounded-lg border border-gray-100 space-y-2">
                    <div class="flex items-center justify-between">
                      <p class="text-sm font-medium text-gray-900 truncate">{{ rec.itemName }}</p>
                      <span class="text-[10px] font-mono text-gray-400">{{ rec.sku }}</span>
                    </div>
                    <div class="flex items-center justify-between text-xs">
                      <span class="text-gray-500">{{ rec.quantity }} × \${{ rec.unitPrice.toFixed(2) }}</span>
                      <span class="font-bold text-gray-900">\${{ rec.total.toFixed(2) }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] text-gray-400">{{ rec.timestamp | date:'shortTime' }}</span>
                      <div class="flex items-center gap-1.5">
                        @if (rec.autoReordered) {
                          <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">Auto Reorder</span>
                        }
                        <span class="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                              [class.bg-emerald-100]="rec.status === 'HEALTHY'"
                              [class.text-emerald-700]="rec.status === 'HEALTHY'"
                              [class.bg-amber-100]="rec.status === 'LOW_STOCK'"
                              [class.text-amber-700]="rec.status === 'LOW_STOCK'"
                              [class.bg-red-100]="rec.status === 'OUT_OF_STOCK'"
                              [class.text-red-700]="rec.status === 'OUT_OF_STOCK'">{{ rec.status }}</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>

    <!-- Toast notification -->
    @if (toastVisible()) {
      <div class="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-slide-down">
        <div class="flex items-start gap-3 px-6 py-4 rounded-2xl shadow-2xl border min-w-[380px] max-w-lg"
             [class.bg-white]="toastType() === 'success'" [class.border-emerald-200]="toastType() === 'success'"
             [class.bg-red-50]="toastType() === 'error'" [class.border-red-200]="toastType() === 'error'">
          <div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
               [class.bg-emerald-100]="toastType() === 'success'"
               [class.bg-red-100]="toastType() === 'error'">
            @if (toastType() === 'success') {
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            }
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-gray-900">{{ toastTitle() }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ toastMessage() }}</p>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes slide-down {
      from { opacity: 0; transform: translate(-50%, -30px); }
      to   { opacity: 1; transform: translate(-50%, 0); }
    }
    .animate-slide-down { animation: slide-down 0.35s ease-out; }
  `],
})
export class Purchase implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly reorderService = inject(ReorderService);
  private readonly dashboardService = inject(DashboardService);

  readonly searchQuery = signal('');
  readonly cart = signal<CartItem[]>([]);
  readonly history = signal<PurchaseRecord[]>([]);
  readonly processing = signal(false);

  // Toast
  readonly toastVisible = signal(false);
  readonly toastTitle = signal('');
  readonly toastMessage = signal('');
  readonly toastType = signal<'success' | 'error'>('success');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  readonly filteredItems = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const items = this.inventoryService.items().filter(i => i.quantity > 0);
    if (!q) return items;
    return items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.sku.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q) ||
      i.binCode.toLowerCase().includes(q)
    );
  });

  readonly cartTotal = computed(() =>
    this.cart().reduce((sum, ci) => sum + ci.quantity * ci.item.unitPrice, 0)
  );

  readonly cartTotalQty = computed(() =>
    this.cart().reduce((sum, ci) => sum + ci.quantity, 0)
  );

  ngOnInit(): void {
    this.inventoryService.load();
  }

  selectItem(item: InventoryItem) {
    if (item.quantity <= 0) return;
    this.cart.update(c => {
      const existing = c.find(ci => ci.item.id === item.id);
      if (existing) {
        if (existing.quantity < item.quantity) {
          return c.map(ci => ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci);
        }
        return c;
      }
      return [...c, { item, quantity: 1 }];
    });
  }

  setQty(itemId: string, qty: number) {
    this.cart.update(c => c.map(ci => {
      if (ci.item.id !== itemId) return ci;
      const clamped = Math.max(1, Math.min(qty, ci.item.quantity));
      return { ...ci, quantity: clamped };
    }));
  }

  incrementQty(itemId: string) {
    this.cart.update(c => c.map(ci => {
      if (ci.item.id !== itemId || ci.quantity >= ci.item.quantity) return ci;
      return { ...ci, quantity: ci.quantity + 1 };
    }));
  }

  decrementQty(itemId: string) {
    this.cart.update(c => c.map(ci => {
      if (ci.item.id !== itemId || ci.quantity <= 1) return ci;
      return { ...ci, quantity: ci.quantity - 1 };
    }));
  }

  removeFromCart(itemId: string) {
    this.cart.update(c => c.filter(ci => ci.item.id !== itemId));
  }

  clearCart() {
    this.cart.set([]);
  }

  async checkout() {
    const items = this.cart();
    if (items.length === 0) return;
    this.processing.set(true);

    let anyAutoReorder = false;
    let allSuccess = true;

    for (const ci of items) {
      const res = await this.inventoryService.purchaseItem(ci.item.itemId, ci.item.binId, ci.quantity);
      const record: PurchaseRecord = {
        itemName: ci.item.name,
        sku: ci.item.sku,
        quantity: ci.quantity,
        unitPrice: ci.item.unitPrice,
        total: ci.quantity * ci.item.unitPrice,
        status: res.newStatus ?? 'UNKNOWN',
        autoReordered: res.autoReordered ?? false,
        timestamp: new Date(),
      };
      this.history.update(h => [record, ...h]);

      if (!res.success) {
        allSuccess = false;
        this.showToast('error', 'Purchase Failed', res.error ?? 'Failed for ' + ci.item.name);
      }
      if (res.autoReordered) anyAutoReorder = true;
    }

    this.reorderService.load();
    this.dashboardService.load();

    this.cart.set([]);
    this.processing.set(false);

    if (allSuccess) {
      const msg = anyAutoReorder
        ? items.length + ' item(s) purchased — auto reorder triggered for out-of-stock items'
        : items.length + ' item(s) purchased successfully';
      this.showToast('success', 'Purchase Complete', msg);
    }
  }

  private showToast(type: 'success' | 'error', title: string, message: string) {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastType.set(type);
    this.toastTitle.set(title);
    this.toastMessage.set(message);
    this.toastVisible.set(true);
    this.toastTimer = setTimeout(() => this.toastVisible.set(false), 4000);
  }
}
