import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InventoryService, Supplier } from '../../services/inventory.service';

@Component({
  selector: 'app-management',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page heading -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Management</h2>
      <p class="text-sm text-gray-400 mt-1">Add new inventory items and view supplier information</p>
    </div>

    <!-- Two-card layout -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">

      <!-- ═══ Left Card: Add New Inventory Item ═══ -->
      <div class="lg:col-span-2">
        <div class="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <!-- Card header -->
          <div class="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-bold text-gray-900">Add New Item</h3>
                <p class="text-xs text-gray-400">Add a new item to the inventory</p>
              </div>
            </div>
          </div>

          <!-- Form -->
          <div class="px-6 py-5 space-y-4">
            <!-- Supplier -->
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Supplier</label>
              <select
                class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                [ngModel]="formSupplier()" (ngModelChange)="onSupplierChange($event)">
                <option value="">Select a supplier</option>
                @for (sup of activeSuppliers(); track sup.id) {
                  <option [value]="sup.id">{{ sup.name }} — {{ sup.category }}</option>
                }
              </select>
            </div>

            <!-- Category (auto-filled from supplier, editable) -->
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
              <select
                class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                [ngModel]="formCategory()" (ngModelChange)="formCategory.set($event)">
                <option value="">Select category</option>
                @for (cat of allCategories(); track cat) {
                  <option [value]="cat">{{ cat }}</option>
                }
              </select>
              @if (formSupplier() && selectedSupplier()) {
                <p class="text-[10px] text-blue-500 mt-1">Auto-filled from {{ selectedSupplier()!.name }}</p>
              }
            </div>

            <!-- Item name -->
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Item Name</label>
              <input type="text" placeholder="e.g. Wireless Headphones"
                class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       placeholder:text-gray-400"
                [ngModel]="formItemName()" (ngModelChange)="formItemName.set($event)" />
            </div>

            <!-- Quantity & Min Quantity row -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Quantity</label>
                <input type="number" placeholder="0" min="0"
                  class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder:text-gray-400
                         [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  [ngModel]="formQuantity()" (ngModelChange)="formQuantity.set($event)" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">SKU</label>
                <input type="text" placeholder="e.g. WH-001"
                  class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder:text-gray-400 font-mono"
                  [ngModel]="formSku()" (ngModelChange)="formSku.set($event)" />
              </div>
            </div>

            <!-- Low Stock & Out of Stock thresholds -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Low Stock Qty</label>
                <input type="number" placeholder="0" min="0"
                  class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder:text-gray-400
                         [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  [ngModel]="formLowStockQty()" (ngModelChange)="formLowStockQty.set($event)" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Out of Stock Qty</label>
                <input type="number" placeholder="0" min="0"
                  class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder:text-gray-400
                         [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  [ngModel]="formOutOfStockQty()" (ngModelChange)="formOutOfStockQty.set($event)" />
              </div>
            </div>

            <!-- Unit Price & Bin Location -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Unit Price ($)</label>
                <input type="number" placeholder="0.00" min="0" step="0.01"
                  class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder:text-gray-400
                         [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  [ngModel]="formUnitPrice()" (ngModelChange)="formUnitPrice.set($event)" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Bin Location</label>
                <select
                  class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                  [ngModel]="formBinCode()" (ngModelChange)="formBinCode.set($event)">
                  <option value="">Select a bin</option>
                  @for (bin of inventoryService.bins(); track bin.binId) {
                    <option [value]="bin.binCode">{{ bin.binCode }} — {{ bin.zone }} (cap: {{ bin.capacity }})</option>
                  }
                </select>
              </div>
            </div>

            <!-- Preview card -->
            @if (formItemName() && formCategory()) {
              <div class="bg-gray-50 rounded-xl border border-gray-200 p-3 space-y-1.5">
                <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Preview</p>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-500">Item</span>
                  <span class="font-medium text-gray-900">{{ formItemName() }}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-500">Category</span>
                  <span class="px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">{{ formCategory() }}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-500">Qty / Low / OOS</span>
                  <span class="font-medium text-gray-900">{{ formQuantity() || 0 }} / {{ formLowStockQty() || 0 }} / {{ formOutOfStockQty() || 0 }}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-500">Total Value</span>
                  <span class="font-bold text-emerald-600">\${{ previewTotal() }}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-500">Status</span>
                  <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium"
                    [class.bg-emerald-100]="previewStatus() === 'In Stock'"
                    [class.text-emerald-700]="previewStatus() === 'In Stock'"
                    [class.bg-amber-100]="previewStatus() === 'Low Stock'"
                    [class.text-amber-700]="previewStatus() === 'Low Stock'"
                    [class.bg-red-100]="previewStatus() === 'Out of Stock'"
                    [class.text-red-700]="previewStatus() === 'Out of Stock'"
                  >{{ previewStatus() }}</span>
                </div>
              </div>
            }

            <!-- Buttons -->
            <div class="flex items-center gap-3 pt-2">
              <button (click)="addItem()"
                [disabled]="!isFormValid()"
                class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg
                       hover:bg-blue-700 transition-colors shadow-sm
                       disabled:opacity-40 disabled:cursor-not-allowed">
                Add to Inventory
              </button>
              <button (click)="resetForm()"
                class="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg
                       hover:bg-gray-200 transition-colors">
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ Right Card: Supplier Directory (read-only) ═══ -->
      <div class="lg:col-span-3">
        <div class="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <!-- Card header -->
          <div class="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-bold text-gray-900">Supplier Directory</h3>
                <p class="text-xs text-gray-400">{{ inventoryService.suppliers().length }} suppliers from database</p>
              </div>
            </div>
            <!-- Search -->
            <div class="relative">
              <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input type="text" placeholder="Search suppliers..."
                class="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg w-48
                       focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                       placeholder:text-gray-400"
                [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" />
            </div>
          </div>

          <!-- Supplier cards grid -->
          <div class="p-4 max-h-[620px] overflow-y-auto">
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
              @for (supplier of filteredSuppliers(); track supplier.id) {
                <div class="relative border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-gray-200 transition-all duration-200 bg-white">
                  <!-- Active status badge -->
                  <div class="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50">
                    <span class="relative flex h-2 w-2">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span class="text-[10px] font-semibold text-emerald-700">Active</span>
                  </div>
                  <!-- Top: Avatar + Name + Code + Category -->
                  <div class="flex items-start gap-3 mb-3">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                         [class.bg-blue-500]="supplier.category === 'Electronics'"
                         [class.bg-amber-500]="supplier.category === 'Furniture'"
                         [class.bg-emerald-500]="supplier.category === 'Tools'"
                         [class.bg-violet-500]="supplier.category === 'Stationery'"
                         [class.bg-red-500]="supplier.category === 'Food'"
                         [class.bg-pink-500]="supplier.category === 'Clothing'"
                         [class.bg-gray-500]="!['Electronics','Furniture','Tools','Stationery','Food','Clothing'].includes(supplier.category)">
                      {{ supplier.name.charAt(0) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <p class="text-sm font-bold text-gray-900 truncate">{{ supplier.name }}</p>
                        <span class="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-blue-50 text-blue-600 flex-shrink-0">
                          {{ supplier.supplierCode || '—' }}
                        </span>
                      </div>
                      <span class="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">
                        {{ supplier.category || 'Uncategorized' }}
                      </span>
                    </div>
                  </div>

                  <!-- Contact details -->
                  <div class="space-y-1.5 mb-3">
                    <div class="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      <span class="text-xs text-gray-700">{{ supplier.contactPerson }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      <span class="text-xs text-gray-500 truncate">{{ supplier.email }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                      <span class="text-xs text-gray-500">{{ supplier.phone }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      <span class="text-xs text-gray-500 truncate">{{ supplier.city }}, {{ supplier.state }}, {{ supplier.country }}</span>
                    </div>
                    @if (supplier.address) {
                      <div class="flex items-start gap-2 pl-5">
                        <span class="text-[10px] text-gray-400 truncate" [title]="supplier.address">{{ supplier.address }}</span>
                      </div>
                    }
                  </div>

                  <!-- Items supplied -->
                  @if (supplier.itemsSupplied && supplier.itemsSupplied.length > 0) {
                    <div class="pt-2.5 border-t border-gray-50">
                      <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Items Supplied</p>
                      <div class="flex flex-wrap gap-1">
                        @for (item of supplier.itemsSupplied; track item) {
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600">
                            {{ item }}
                          </span>
                        }
                      </div>
                    </div>
                  }
                </div>
              } @empty {
                <div class="col-span-full py-10 text-center text-gray-400 text-sm">
                  No suppliers found.
                </div>
              }
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Toast notification -->
    @if (toastVisible()) {
      <div class="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-slide-down">
        <div class="flex items-start gap-3 px-6 py-4 bg-white rounded-2xl shadow-2xl border border-emerald-200 min-w-[380px] max-w-lg">
          <div class="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-gray-900">{{ toastTitle() }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ toastMessage() }}</p>
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
    @keyframes slide-down {
      from { opacity: 0; transform: translate(-50%, -30px); }
      to   { opacity: 1; transform: translate(-50%, 0); }
    }
    .animate-slide-down {
      animation: slide-down 0.35s ease-out;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.3; }
    }
    .animate-blink {
      animation: blink 1.5s ease-in-out infinite;
    }
  `],
})
export class Management implements OnInit {
  readonly inventoryService = inject(InventoryService);

  ngOnInit(): void {
    this.inventoryService.load();
  }

  // ── All categories (from existing items + standard list) ──
  readonly allCategories = computed(() => {
    const fromItems = this.inventoryService.categories();
    const standard = ['Electronics', 'Furniture', 'Tools', 'Stationery', 'Food', 'Clothing', 'Other'];
    return [...new Set([...fromItems, ...standard])].sort();
  });

  // ── Active suppliers only (for the dropdown) ──
  readonly activeSuppliers = computed(() =>
    this.inventoryService.suppliers().filter(s => s.status === 'Active')
  );

  // ── Search for supplier directory ──
  readonly searchQuery = signal('');
  readonly filteredSuppliers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const all = this.inventoryService.suppliers();
    if (!q) return all;
    return all.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.contactPerson.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.supplierCode.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.state.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q) ||
      s.itemsSupplied.some(i => i.toLowerCase().includes(q))
    );
  });

  // ── Form fields ──
  readonly formSupplier = signal('');
  readonly formCategory = signal('');
  readonly formItemName = signal('');
  readonly formSku = signal('');
  readonly formQuantity = signal<number | null>(null);
  readonly formLowStockQty = signal<number | null>(null);
  readonly formOutOfStockQty = signal<number | null>(null);
  readonly formUnitPrice = signal<number | null>(null);
  readonly formBinCode = signal('');

  // ── Selected supplier object ──
  readonly selectedSupplier = computed<Supplier | null>(() => {
    const id = this.formSupplier();
    if (!id) return null;
    return this.inventoryService.suppliers().find(s => s.id === id) ?? null;
  });

  // ── Preview computeds ──
  readonly previewTotal = computed(() => {
    const qty = this.formQuantity() ?? 0;
    const price = this.formUnitPrice() ?? 0;
    return (qty * price).toFixed(2);
  });

  readonly previewStatus = computed(() => {
    const qty = this.formQuantity() ?? 0;
    const low = this.formLowStockQty() ?? 0;
    const oos = this.formOutOfStockQty() ?? 0;
    if (qty <= oos) return 'Out of Stock';
    if (qty <= low) return 'Low Stock';
    return 'In Stock';
  });

  readonly isFormValid = computed(() =>
    this.formItemName().trim().length > 0 &&
    this.formSku().trim().length > 0 &&
    this.formCategory().length > 0 &&
    (this.formQuantity() ?? 0) >= 0 &&
    (this.formLowStockQty() ?? -1) >= 0 &&
    (this.formOutOfStockQty() ?? -1) >= 0 &&
    (this.formUnitPrice() ?? 0) > 0 &&
    this.formBinCode().length > 0
  );

  // ── Toast ──
  readonly toastVisible = signal(false);
  readonly toastTitle = signal('');
  readonly toastMessage = signal('');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // ── When supplier changes, auto-fill category ──
  onSupplierChange(supplierId: string) {
    this.formSupplier.set(supplierId);
    if (supplierId) {
      const sup = this.inventoryService.suppliers().find(s => s.id === supplierId);
      if (sup) {
        this.formCategory.set(sup.category);
      }
    }
  }

  // ── Add item to inventory (persists to database) ──
  async addItem() {
    if (!this.isFormValid()) return;

    const supplierId = this.formSupplier()
      ? this.selectedSupplier()?.numericId ?? null
      : null;

    const success = await this.inventoryService.addItem({
      itemName: this.formItemName().trim(),
      sku: this.formSku().trim(),
      unitPrice: +(this.formUnitPrice() ?? 0),
      categoryName: this.formCategory(),
      quantity: +(this.formQuantity() ?? 0),
      lowStockQuantity: +(this.formLowStockQty() ?? 0),
      outOfStockQuantity: +(this.formOutOfStockQty() ?? 0),
      binCode: this.formBinCode(),
      supplierId,
    });

    if (success) {
      this.showToast(
        'Item Added to Inventory!',
        `${this.formItemName().trim()} — ${this.formQuantity()} units at $${(+(this.formUnitPrice() ?? 0)).toFixed(2)} in bin ${this.formBinCode()}`
      );
      this.resetForm();
    } else {
      this.showToast('Error', 'Failed to add item. Check console for details.');
    }
  }

  resetForm() {
    this.formSupplier.set('');
    this.formCategory.set('');
    this.formItemName.set('');
    this.formSku.set('');
    this.formQuantity.set(null);
    this.formLowStockQty.set(null);
    this.formOutOfStockQty.set(null);
    this.formUnitPrice.set(null);
    this.formBinCode.set('');
  }

  showToast(title: string, message: string) {
    if (this.toastTimer) clearTimeout(this.toastTimer);
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
