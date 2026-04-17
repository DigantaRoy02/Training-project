import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InventoryService, InventoryItem } from '../../services/inventory.service';
import { ReorderService } from '../../services/reorder.service';

type SortField = 'id' | 'name' | 'category' | 'quantity' | 'unitPrice' | 'totalValue' | 'status' | 'binLocation';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-inventory',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page heading -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Inventory</h2>
      <p class="text-sm text-gray-400 mt-1">Manage your inventory items and stock levels</p>
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
        <p class="text-sm text-gray-500">Total Items</p>
        <p class="text-2xl font-bold text-blue-600 mt-1">{{ totalItems() }}</p>
      </div>
      <div class="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
        <p class="text-sm text-gray-500">Low Stock</p>
        <p class="text-2xl font-bold text-amber-600 mt-1">{{ lowStockCount() }}</p>
      </div>
      <div class="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
        <p class="text-sm text-gray-500">Out of Stock</p>
        <p class="text-2xl font-bold text-red-600 mt-1">{{ outOfStockCount() }}</p>
      </div>
      <div class="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
        <p class="text-sm text-gray-500">Total Value</p>
        <p class="text-2xl font-bold text-emerald-600 mt-1">{{ totalValue() }}</p>
      </div>
    </div>

    <!-- Filters bar -->
    <div class="border border-gray-200 rounded-xl bg-white shadow-sm mb-6">
      <div class="p-4 flex flex-wrap items-center gap-3">
        <!-- Search -->
        <div class="relative flex-1 min-w-[200px]">
          <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search items by name or ID..."
            class="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   placeholder:text-gray-400"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event); currentPage.set(1)"
          />
        </div>

        <!-- Category filter -->
        <select
          class="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white
                 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          [ngModel]="categoryFilter()"
          (ngModelChange)="categoryFilter.set($event); currentPage.set(1)"
        >
          <option value="">All Categories</option>
          @for (cat of categories(); track cat) {
            <option [value]="cat">{{ cat }}</option>
          }
        </select>

        <!-- Status filter -->
        <select
          class="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white
                 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          [ngModel]="statusFilter()"
          (ngModelChange)="statusFilter.set($event); currentPage.set(1)"
        >
          <option value="">All Status</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>

        <!-- Divider -->
        <div class="h-8 w-px bg-gray-200"></div>

        <!-- Show Low Stock toggle -->
        <button
          (click)="toggleLowStock()"
          class="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all duration-200"
          [class.bg-amber-50]="showLowStockOnly()"
          [class.border-amber-300]="showLowStockOnly()"
          [class.text-amber-700]="showLowStockOnly()"
          [class.bg-white]="!showLowStockOnly()"
          [class.border-gray-200]="!showLowStockOnly()"
          [class.text-gray-500]="!showLowStockOnly()"
          [class.hover:bg-gray-50]="!showLowStockOnly()"
        >
          <!-- Toggle track -->
          <div class="relative w-9 h-5 rounded-full transition-colors duration-200"
               [class.bg-amber-500]="showLowStockOnly()"
               [class.bg-gray-300]="!showLowStockOnly()">
            <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200"
                 [class.translate-x-4]="showLowStockOnly()"></div>
          </div>
          <span class="font-medium whitespace-nowrap">Low Stock Only</span>
          @if (showLowStockOnly()) {
            <span class="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-amber-200 text-amber-800 rounded-full">
              {{ lowStockFilteredCount() }}
            </span>
          }
        </button>

        <!-- Clear filters -->
        @if (searchQuery() || categoryFilter() || statusFilter() || showLowStockOnly()) {
          <button
            (click)="clearFilters()"
            class="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Clear filters
          </button>
        }
      </div>

      <!-- Results count -->
      <div class="px-4 pb-3">
        <p class="text-xs text-gray-400">
          Showing {{ startIndex() + 1 }}–{{ endIndex() }} of {{ filteredItems().length }} items
        </p>
      </div>
    </div>

    <!-- Table -->
    <div class="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50">
              <th class="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none" (click)="toggleSort('id')">
                <div class="flex items-center gap-1">Item ID <span class="text-[10px]">{{ sortIcon('id') }}</span></div>
              </th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none" (click)="toggleSort('name')">
                <div class="flex items-center gap-1">Name <span class="text-[10px]">{{ sortIcon('name') }}</span></div>
              </th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none" (click)="toggleSort('category')">
                <div class="flex items-center gap-1">Category <span class="text-[10px]">{{ sortIcon('category') }}</span></div>
              </th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none" (click)="toggleSort('quantity')">
                <div class="flex items-center gap-1">Qty <span class="text-[10px]">{{ sortIcon('quantity') }}</span></div>
              </th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none" (click)="toggleSort('unitPrice')">
                <div class="flex items-center gap-1">Unit Price <span class="text-[10px]">{{ sortIcon('unitPrice') }}</span></div>
              </th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none" (click)="toggleSort('totalValue')">
                <div class="flex items-center gap-1">Total Value <span class="text-[10px]">{{ sortIcon('totalValue') }}</span></div>
              </th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none" (click)="toggleSort('status')">
                <div class="flex items-center gap-1">Status <span class="text-[10px]">{{ sortIcon('status') }}</span></div>
              </th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none" (click)="toggleSort('binLocation')">
                <div class="flex items-center gap-1">Bin <span class="text-[10px]">{{ sortIcon('binLocation') }}</span></div>
              </th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (item of paginatedItems(); track item.id) {
              <tr class="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                <td class="px-4 py-3 font-semibold text-blue-600">{{ item.id }}</td>
                <td class="px-4 py-3 font-medium text-gray-900">{{ item.name }}</td>
                <td class="px-4 py-3">
                  <span class="inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                    {{ item.category }}
                  </span>
                </td>
                <!-- Quantity cell — inline edit mode when pencil is clicked -->
                <td class="px-4 py-3 font-medium">
                  @if (editingItemId() === item.id) {
                    <div class="flex items-center gap-1">
                      <button (click)="adjustEditQty(-1)" class="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition-colors">−</button>
                      <input
                        type="number"
                        class="w-14 text-center text-sm font-semibold border border-blue-300 rounded-md py-0.5
                               focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 text-blue-700
                               [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        [ngModel]="editQty()"
                        (ngModelChange)="editQty.set($event)"
                        (keydown.enter)="saveQuantity(item)"
                        (keydown.escape)="cancelEdit()"
                      />
                      <button (click)="adjustEditQty(1)" class="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition-colors">+</button>
                      <button (click)="saveQuantity(item)" class="ml-1 w-6 h-6 flex items-center justify-center rounded-md bg-emerald-500 hover:bg-emerald-600 text-white transition-colors" title="Save">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </button>
                      <button (click)="cancelEdit()" class="w-6 h-6 flex items-center justify-center rounded-md bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors" title="Cancel">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  } @else {
                    <span
                      [class.text-red-600]="item.quantity === 0"
                      [class.text-amber-600]="item.quantity > 0 && item.quantity <= item.reorderLevel"
                      [class.text-gray-900]="item.quantity > item.reorderLevel"
                    >{{ item.quantity }}</span>
                  }
                </td>
                <td class="px-4 py-3 text-gray-700">\${{ item.unitPrice.toFixed(2) }}</td>
                <td class="px-4 py-3 font-medium text-gray-900">\${{ item.totalValue.toFixed(2) }}</td>
                <td class="px-4 py-3">
                  <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium"
                    [class.bg-emerald-100]="item.status === 'In Stock'"
                    [class.text-emerald-700]="item.status === 'In Stock'"
                    [class.bg-amber-100]="item.status === 'Low Stock'"
                    [class.text-amber-700]="item.status === 'Low Stock'"
                    [class.bg-red-100]="item.status === 'Out of Stock'"
                    [class.text-red-700]="item.status === 'Out of Stock'"
                  >{{ item.status }}</span>
                </td>
                <td class="px-4 py-3 text-gray-500 font-mono text-xs">{{ item.binLocation }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-1">
                    <!-- Pencil icon — edit quantity inline -->
                    <button
                      (click)="startEditQuantity(item)"
                      class="p-1.5 rounded-md transition-colors"
                      [class.bg-blue-100]="editingItemId() === item.id"
                      [class.text-blue-600]="editingItemId() === item.id"
                      [class.text-gray-400]="editingItemId() !== item.id"
                      [class.hover:bg-blue-50]="editingItemId() !== item.id"
                      [class.hover:text-blue-600]="editingItemId() !== item.id"
                      title="Edit Quantity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <!-- Cube icon — create reorder request (only for Low Stock / Out of Stock) -->
                    @if (item.status !== 'In Stock') {
                    <button
                      (click)="openReorderModal(item)"
                      class="p-1.5 rounded-md transition-colors"
                      [class.bg-violet-100]="reorderItem()?.id === item.id"
                      [class.text-violet-600]="reorderItem()?.id === item.id"
                      [class.text-gray-400]="reorderItem()?.id !== item.id"
                      [class.hover:bg-violet-50]="reorderItem()?.id !== item.id"
                      [class.hover:text-violet-600]="reorderItem()?.id !== item.id"
                      title="Create Reorder"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                      </svg>
                    </button>
                    }
                  </div>
                </td>
              </tr>

            } @empty {
              <tr>
                <td colspan="9" class="px-4 py-10 text-center text-gray-400 text-sm">
                  No items found matching your filters.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      @if (totalPages() > 1) {
        <div class="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <p class="text-xs text-gray-500">
            Page {{ currentPage() }} of {{ totalPages() }}
          </p>
          <div class="flex items-center gap-1">
            <button
              (click)="currentPage.set(currentPage() - 1)"
              [disabled]="currentPage() === 1"
              class="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200
                     hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >Previous</button>

            @for (page of pageNumbers(); track page) {
              <button
                (click)="currentPage.set(page)"
                class="px-3 py-1.5 text-xs font-medium rounded-md border transition-colors"
                [class.bg-blue-600]="page === currentPage()"
                [class.text-white]="page === currentPage()"
                [class.border-blue-600]="page === currentPage()"
                [class.border-gray-200]="page !== currentPage()"
                [class.hover:bg-gray-50]="page !== currentPage()"
              >{{ page }}</button>
            }

            <button
              (click)="currentPage.set(currentPage() + 1)"
              [disabled]="currentPage() === totalPages()"
              class="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200
                     hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >Next</button>
          </div>
        </div>
      }
    </div>

    <!-- ═══ Create Reorder Request Modal ═══ -->
    @if (reorderItem(); as item) {
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" (click)="closeReorderModal()"></div>

        <!-- Modal -->
        <div class="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">

          <!-- Header -->
          <div class="px-6 py-5 border-b border-gray-100">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-gray-900">Create Reorder Request</h3>
                  <p class="text-xs text-gray-500 mt-0.5">{{ item.name }} · {{ item.id }}</p>
                </div>
              </div>
              <button (click)="closeReorderModal()" class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

            <!-- Stock level cards -->
            <div>
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Stock Information</p>
              <div class="grid grid-cols-3 gap-3">
                <div class="rounded-xl border border-red-100 bg-red-50 p-3 text-center">
                  <p class="text-[10px] font-semibold text-red-400 uppercase tracking-wide">Current Stock</p>
                  <p class="text-2xl font-bold text-red-600 mt-1">{{ item.quantity }}</p>
                  <p class="text-[10px] text-red-400 mt-0.5">units</p>
                </div>
                <div class="rounded-xl border border-amber-100 bg-amber-50 p-3 text-center">
                  <p class="text-[10px] font-semibold text-amber-400 uppercase tracking-wide">Min Required</p>
                  <p class="text-2xl font-bold text-amber-600 mt-1">{{ item.reorderLevel }}</p>
                  <p class="text-[10px] text-amber-400 mt-0.5">units</p>
                </div>
                <div class="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-center">
                  <p class="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">Target Stock</p>
                  <p class="text-2xl font-bold text-emerald-600 mt-1">{{ reorderTargetStock() }}</p>
                  <p class="text-[10px] text-emerald-400 mt-0.5">units</p>
                </div>
              </div>
            </div>

            <!-- Reorder quantity -->
            <div>
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Reorder Quantity</p>
              <div class="flex items-center justify-center gap-4 py-2">
                <button (click)="adjustReorderQty(-10)"
                  class="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center
                         text-gray-500 hover:bg-gray-50 hover:border-gray-300 text-xs font-bold transition-colors shadow-sm">-10</button>
                <button (click)="adjustReorderQty(-1)"
                  class="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center
                         text-gray-500 hover:bg-gray-50 hover:border-gray-300 text-lg font-bold transition-colors shadow-sm">−</button>
                <div class="relative">
                  <input
                    type="number"
                    class="w-24 h-12 text-center text-xl font-bold border-2 border-violet-200 rounded-xl
                           bg-violet-50 text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500
                           focus:border-transparent transition-all
                           [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    [ngModel]="reorderQty()"
                    (ngModelChange)="clampReorderQty($event)"
                  />
                </div>
                <button (click)="adjustReorderQty(1)"
                  class="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center
                         text-gray-500 hover:bg-gray-50 hover:border-gray-300 text-lg font-bold transition-colors shadow-sm">+</button>
                <button (click)="adjustReorderQty(10)"
                  class="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center
                         text-gray-500 hover:bg-gray-50 hover:border-gray-300 text-xs font-bold transition-colors shadow-sm">+10</button>
              </div>
            </div>

            <!-- Order summary -->
            <div>
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Order Summary</p>
              <div class="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2.5">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Item</span>
                  <span class="font-medium text-gray-900">{{ item.name }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Unit Price</span>
                  <span class="font-medium text-gray-900">\${{ item.unitPrice.toFixed(2) }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Quantity</span>
                  <span class="font-semibold text-violet-600">× {{ reorderQty() }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">Bin Location</span>
                  <span class="font-mono font-medium text-gray-900">{{ item.binLocation }}</span>
                </div>
                <div class="border-t border-gray-200 pt-2.5 flex justify-between items-center">
                  <span class="font-semibold text-gray-700">Estimated Total</span>
                  <span class="text-xl font-bold text-emerald-600">\${{ reorderTotal() }}</span>
                </div>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
            <button (click)="closeReorderModal()"
              class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300
                     rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button (click)="confirmReorder()"
              class="px-5 py-2.5 text-sm font-medium text-white bg-violet-600
                     rounded-xl hover:bg-violet-700 shadow-sm transition-colors">
              Confirm Reorder
            </button>
          </div>

        </div>
      </div>
    }

    <!-- ═══ Toast Notification ═══ -->
    @if (toastVisible()) {
      <div class="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-slide-down">
        <div class="flex items-start gap-3 px-6 py-4 bg-white rounded-2xl shadow-2xl border border-emerald-200 min-w-[400px] max-w-lg">
          <!-- Green check circle -->
          <div class="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <!-- Text -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-gray-900">{{ toastTitle() }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ toastMessage() }}</p>
          </div>
          <!-- Close -->
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
  `],
})
export class Inventory implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly reorderService = inject(ReorderService);

  ngOnInit(): void {
    this.inventoryService.load();
    this.reorderService.load();
  }

  // ── Raw data (signal-based — reacts to items added from Management page) ──
  private readonly allItems = this.inventoryService.items;
  readonly categories = this.inventoryService.categories;

  // ── Filter / search state ──
  readonly searchQuery = signal('');
  readonly categoryFilter = signal('');
  readonly statusFilter = signal('');
  readonly showLowStockOnly = signal(false);

  // ── Sort state ──
  readonly sortField = signal<SortField>('id');
  readonly sortDir = signal<SortDir>('asc');

  // ── Pagination ──
  readonly currentPage = signal(1);
  readonly pageSize = 8;

  // ── Summary stats (computed from all data, not filtered) ──
  readonly totalItems = computed(() => this.allItems().length);
  readonly lowStockCount = computed(() => this.allItems().filter(i => i.status === 'Low Stock').length);
  readonly outOfStockCount = computed(() => this.allItems().filter(i => i.status === 'Out of Stock').length);
  readonly totalValue = computed(() => {
    const val = this.allItems().reduce((sum, i) => sum + i.totalValue, 0);
    return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  });

  // Count of low stock + out of stock items (shown on toggle badge)
  readonly lowStockFilteredCount = computed(() =>
    this.allItems().filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock').length
  );

  // ── Filtered + sorted items ──
  readonly filteredItems = computed(() => {
    let items = [...this.allItems()];

    // Search
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    const cat = this.categoryFilter();
    if (cat) {
      items = items.filter(i => i.category === cat);
    }

    // Status filter
    const st = this.statusFilter();
    if (st) {
      items = items.filter(i => i.status === st);
    }

    // Low stock toggle — show only Low Stock & Out of Stock
    if (this.showLowStockOnly()) {
      items = items.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock');
    }

    // Sort
    const field = this.sortField();
    const dir = this.sortDir();
    items.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return dir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return items;
  });

  // ── Pagination computed ──
  readonly totalPages = computed(() => Math.ceil(this.filteredItems().length / this.pageSize) || 1);
  readonly startIndex = computed(() => (this.currentPage() - 1) * this.pageSize);
  readonly endIndex = computed(() => Math.min(this.startIndex() + this.pageSize, this.filteredItems().length));
  readonly paginatedItems = computed(() => this.filteredItems().slice(this.startIndex(), this.endIndex()));
  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  // ── Sort helpers ──
  toggleSort(field: SortField) {
    if (this.sortField() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
  }

  sortIcon(field: SortField): string {
    if (this.sortField() !== field) return '⇅';
    return this.sortDir() === 'asc' ? '▲' : '▼';
  }

  // ── Inline quantity edit state ──
  readonly editingItemId = signal<string | null>(null);
  readonly editQty = signal(0);

  // ── Reorder modal state ──
  readonly reorderItem = signal<InventoryItem | null>(null);
  readonly reorderQty = signal(0);

  // Target stock = reorderLevel × 2 (a sensible default; backend can supply this)
  readonly reorderTargetStock = computed(() => {
    const item = this.reorderItem();
    return item ? item.reorderLevel * 2 : 0;
  });

  // Stock bar percentage
  readonly stockPercentage = computed(() => {
    const item = this.reorderItem();
    if (!item) return 0;
    const target = this.reorderTargetStock();
    return target > 0 ? Math.min(100, Math.round((item.quantity / target) * 100)) : 0;
  });

  // Order total
  readonly reorderTotal = computed(() => {
    const item = this.reorderItem();
    if (!item) return '0.00';
    return (this.reorderQty() * item.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  });

  // ── Toggle low stock filter ──
  toggleLowStock() {
    this.showLowStockOnly.update(v => !v);
    this.currentPage.set(1);
  }

  // ── Pencil: start inline quantity edit ──
  startEditQuantity(item: InventoryItem) {
    if (this.editingItemId() === item.id) {
      this.cancelEdit();
      return;
    }
    this.editingItemId.set(item.id);
    this.editQty.set(item.quantity);
  }

  adjustEditQty(delta: number) {
    const next = this.editQty() + delta;
    if (next >= 0) this.editQty.set(next);
  }

  /** Save quantity — persists to database and updates frontend */
  saveQuantity(item: InventoryItem) {
    const newQty = Math.max(0, Math.round(this.editQty()));
    this.inventoryService.updateQuantity(item.itemId, item.binId, newQty, () => {
      // Reload reorders in case auto reorder was triggered
      this.reorderService.load();
    });
    this.editingItemId.set(null);
  }

  cancelEdit() {
    this.editingItemId.set(null);
  }

  // ── Toast state ──
  readonly toastVisible = signal(false);
  readonly toastTitle = signal('');
  readonly toastMessage = signal('');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Cube: open reorder modal ──
  openReorderModal(item: InventoryItem) {
    // Default reorder qty = target - current (fill to target)
    const target = item.reorderLevel * 2;
    const suggestedQty = Math.max(0, target - item.quantity);
    this.reorderQty.set(suggestedQty);
    this.reorderItem.set(item);
  }

  closeReorderModal() {
    this.reorderItem.set(null);
  }

  adjustReorderQty(delta: number) {
    const item = this.reorderItem();
    const maxQty = item ? Math.max(0, this.reorderTargetStock() - item.quantity) : Infinity;
    const next = Math.min(this.reorderQty() + delta, maxQty);
    if (next >= 1) this.reorderQty.set(next);
  }

  clampReorderQty(val: number) {
    const item = this.reorderItem();
    const maxQty = item ? Math.max(1, this.reorderTargetStock() - item.quantity) : Infinity;
    this.reorderQty.set(Math.max(1, Math.min(val, maxQty)));
  }

  /** Confirm reorder — sends to ReorderService, shows toast */
  confirmReorder() {
    const item = this.reorderItem();
    if (!item) return;
    const qty = this.reorderQty();
    const total = this.reorderTotal();
    // POST a manual reorder to the backend
    this.reorderService.createManual(+item.id.replace(/\D/g, ''), qty);
    this.reorderItem.set(null);
    this.showToast(
      'Reorder Request Submitted!',
      `${item.name} × ${qty} units — $${total} has been sent for approval.`
    );
  }

  /** Show a toast notification that auto-dismisses after 4 seconds */
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

  // ── Clear filters ──
  clearFilters() {
    this.searchQuery.set('');
    this.categoryFilter.set('');
    this.statusFilter.set('');
    this.showLowStockOnly.set(false);
    this.currentPage.set(1);
  }
}
