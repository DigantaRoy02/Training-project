import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { NgStyle } from '@angular/common';
import { DashboardService, CategoryItem } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgStyle],
  template: `
    <!-- Page heading -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Dashboard</h2>
      <p class="text-sm text-gray-400 mt-1">Live overview of your inventory bin management system</p>
    </div>

    <!-- ───── Loading skeleton ───── -->
    @if (svc.loading()) {
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        @for (i of [1,2,3,4]; track i) {
          <div class="border border-gray-100 rounded-xl p-5 bg-white shadow-sm animate-pulse">
            <div class="flex items-center justify-between mb-4">
              <div class="h-3 w-24 bg-gray-200 rounded"></div>
              <div class="w-9 h-9 bg-gray-200 rounded-lg"></div>
            </div>
            <div class="h-8 w-16 bg-gray-200 rounded mb-2"></div>
            <div class="h-2 w-20 bg-gray-100 rounded"></div>
          </div>
        }
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        @for (i of [1,2]; track i) {
          <div class="border border-gray-100 rounded-xl p-5 bg-white shadow-sm animate-pulse">
            <div class="h-4 w-36 bg-gray-200 rounded mb-2"></div>
            <div class="h-3 w-48 bg-gray-100 rounded mb-6"></div>
            <div class="h-64 bg-gray-100 rounded-lg"></div>
          </div>
        }
      </div>
    }

    <!-- ───── Live data ───── -->
    @if (!svc.loading()) {

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      @for (stat of svc.stats(); track stat.label; let i = $index) {
        <div class="relative overflow-hidden border border-gray-100 rounded-2xl p-5 bg-white shadow-sm card-hover">
          <!-- Gradient accent bar -->
          <div class="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
            [class.bg-gradient-to-r]="true"
            [class.from-red-400]="i === 0" [class.to-red-600]="i === 0"
            [class.from-amber-400]="i === 1" [class.to-orange-500]="i === 1"
            [class.from-emerald-400]="i === 2" [class.to-teal-500]="i === 2"
            [class.from-violet-400]="i === 3" [class.to-purple-600]="i === 3"
          ></div>

          <div class="flex items-start justify-between mb-4 pt-1">
            <span class="text-xs font-semibold uppercase tracking-wider text-gray-400">{{ stat.label }}</span>
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
              [class.bg-red-50]="i === 0"
              [class.bg-amber-50]="i === 1"
              [class.bg-emerald-50]="i === 2"
              [class.bg-violet-50]="i === 3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                [class.text-red-500]="i === 0"
                [class.text-amber-500]="i === 1"
                [class.text-emerald-500]="i === 2"
                [class.text-violet-500]="i === 3"
              >
                @switch (stat.icon) {
                  @case ('low-stock') {
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  }
                  @case ('reorders') {
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M20.016 4.656v4.992" />
                  }
                  @case ('total-stock') {
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  }
                  @case ('categories') {
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
                  }
                }
              </svg>
            </div>
          </div>

          <p class="text-3xl font-black tracking-tight stat-value"
            [class.text-red-600]="i === 0"
            [class.text-amber-600]="i === 1"
            [class.text-emerald-600]="i === 2"
            [class.text-violet-600]="i === 3"
          >{{ stat.value }}</p>

          <div class="flex items-center gap-1 mt-2">
            @if (stat.trendDirection === 'up') {
              <svg class="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
            } @else if (stat.trendDirection === 'down') {
              <svg class="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
              </svg>
            }
            <p class="text-xs font-medium"
              [class.text-red-400]="stat.trendDirection === 'down'"
              [class.text-emerald-500]="stat.trendDirection === 'up'"
              [class.text-gray-400]="stat.trendDirection === 'neutral'"
            >{{ stat.trend }}</p>
          </div>
        </div>
      }
    </div>

    <!-- ───── Charts Row ───── -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

      <!-- Stock by Category (clickable) -->
      <div class="border border-gray-100 rounded-2xl p-6 bg-white shadow-sm">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-base font-bold text-gray-900">Stock by Category</h3>
            <p class="text-xs text-gray-400 mt-0.5">Click a category to see item quantities</p>
          </div>
          <span class="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">Live</span>
        </div>

        @if (svc.categoryStock().length === 0) {
          <div class="flex items-center justify-center h-64 text-gray-400 text-sm">No data available</div>
        } @else {
          <div class="space-y-3">
            @for (bar of svc.categoryStock(); track bar.category; let i = $index) {
              <div class="group cursor-pointer" (click)="selectCategory(bar.category)">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-semibold"
                    [class.text-blue-700]="svc.selectedCategory() === bar.category"
                    [class.text-gray-700]="svc.selectedCategory() !== bar.category"
                  >
                    {{ bar.category }}
                    @if (svc.selectedCategory() === bar.category) {
                      <span class="ml-1 text-blue-400">&#9664;</span>
                    }
                  </span>
                  <span class="text-xs font-bold tabular-nums"
                    [class.text-blue-600]="i % 6 === 0"
                    [class.text-indigo-600]="i % 6 === 1"
                    [class.text-cyan-600]="i % 6 === 2"
                    [class.text-teal-600]="i % 6 === 3"
                    [class.text-violet-600]="i % 6 === 4"
                    [class.text-sky-600]="i % 6 === 5"
                  >{{ bar.quantity }} items</span>
                </div>
                <div class="w-full h-8 bg-gray-50 rounded-lg overflow-hidden relative transition-all"
                  [class.ring-2]="svc.selectedCategory() === bar.category"
                  [class.ring-blue-400]="svc.selectedCategory() === bar.category"
                >
                  <div class="h-full rounded-lg hbar-animated flex items-center justify-end pr-2 relative overflow-hidden"
                    [class.bar-blue]="i % 6 === 0"
                    [class.bar-indigo]="i % 6 === 1"
                    [class.bar-cyan]="i % 6 === 2"
                    [class.bar-teal]="i % 6 === 3"
                    [class.bar-violet]="i % 6 === 4"
                    [class.bar-sky]="i % 6 === 5"
                    [ngStyle]="{ '--hbar-w': (bar.quantity / maxCategoryQty() * 100) + '%' }"
                  >
                    <div class="absolute inset-0 shimmer-overlay"></div>
                  </div>
                </div>
              </div>
            }
          </div>

          <div class="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Items</span>
            <span class="text-sm font-black text-gray-900">{{ totalCategoryItems() }}</span>
          </div>
        }
      </div>

      <!-- Item Quantities (shown for selected category) -->
      <div class="border border-gray-100 rounded-2xl p-6 bg-white shadow-sm">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-base font-bold text-gray-900">
              @if (svc.selectedCategory()) {
                {{ svc.selectedCategory() }} — Item Stock
              } @else {
                Item Stock Levels
              }
            </h3>
            <p class="text-xs text-gray-400 mt-0.5">Current quantity vs capacity per item</p>
          </div>
          @if (svc.selectedCategory()) {
            <span class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              {{ svc.categoryItems().length }} items
            </span>
          }
        </div>

        @if (svc.categoryItemsLoading()) {
          <div class="space-y-4">
            @for (i of [1,2,3,4]; track i) {
              <div class="animate-pulse">
                <div class="h-3 w-32 bg-gray-200 rounded mb-2"></div>
                <div class="h-7 bg-gray-100 rounded-lg"></div>
              </div>
            }
          </div>
        } @else if (!svc.selectedCategory()) {
          <div class="flex flex-col items-center justify-center h-64 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.591" />
            </svg>
            <p class="text-sm">Click a category to view items</p>
          </div>
        } @else if (svc.categoryItems().length === 0) {
          <div class="flex items-center justify-center h-64 text-gray-400 text-sm">No items found</div>
        } @else {
          <div class="space-y-3 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
            @for (item of svc.categoryItems(); track item.itemName; let i = $index) {
              <div class="group">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-semibold text-gray-700 truncate max-w-[60%]" [title]="item.itemName">
                    {{ item.itemName }}
                  </span>
                  <span class="text-xs font-bold tabular-nums shrink-0 ml-2"
                    [class.text-emerald-600]="item.quantity >= item.minQuantity"
                    [class.text-red-500]="item.quantity < item.minQuantity && item.quantity > 0"
                    [class.text-red-700]="item.quantity === 0"
                  >
                    {{ item.quantity }} / {{ item.minQuantity }}
                  </span>
                </div>
                <div class="w-full h-7 bg-gray-50 rounded-lg overflow-hidden relative">
                  <div class="h-full rounded-lg hbar-animated flex items-center relative overflow-hidden transition-all"
                    [class.bar-emerald]="item.quantity >= item.minQuantity"
                    [class.bar-red]="item.quantity < item.minQuantity && item.quantity > 0"
                    [class.bar-red-dark]="item.quantity === 0"
                    [ngStyle]="{ '--hbar-w': (itemBarPercent(item) + '%') }"
                  >
                    <div class="absolute inset-0 shimmer-overlay"></div>
                  </div>
                  <!-- Min quantity marker line -->
                  @if (maxItemCapacity() > 0) {
                    <div class="absolute top-0 bottom-0 w-0.5 bg-gray-400 opacity-40"
                      [ngStyle]="{ 'left': (item.minQuantity / maxItemCapacity() * 100) + '%' }">
                    </div>
                  }
                </div>
                <!-- Status + Bin info -->
                <div class="flex items-center justify-between mt-0.5">
                  <div class="flex items-center gap-1.5">
                    @if (item.quantity === 0) {
                      <span class="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">OUT OF STOCK</span>
                    } @else if (item.quantity < item.minQuantity) {
                      <span class="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">LOW STOCK</span>
                    } @else {
                      <span class="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">OK</span>
                    }
                  </div>
                  <div class="flex items-center gap-1.5 flex-wrap justify-end">
                    @for (bin of item.bins; track bin.binCode) {
                      <span class="inline-flex items-center gap-0.5 text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded"
                            [title]="'Zone: ' + bin.zone + ' | Qty in bin: ' + bin.quantity + ' | Capacity: ' + bin.capacity">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-2.5 h-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                        {{ bin.binCode }} ({{ bin.capacity }})
                      </span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>

    </div>
    } <!-- end live data -->
  `,
  styles: [`
    /* ── Card hover lift ── */
    .card-hover {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .card-hover:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.08);
    }

    /* ── Stat value pop-in ── */
    .stat-value {
      animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    @keyframes popIn {
      from { opacity: 0; transform: scale(0.7); }
      to   { opacity: 1; transform: scale(1); }
    }

    /* ── Bar grow-from-bottom animation (vertical) ── */
    .bar-animated {
      height: 0;
      animation: growUp 0.8s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
      animation-delay: calc(var(--bar-index, 0) * 80ms);
    }
    @keyframes growUp {
      from { height: 0; }
      to   { height: var(--bar-h, 0%); }
    }

    /* ── Horizontal bar grow animation ── */
    .hbar-animated {
      width: 0;
      animation: growRight 1s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
    }
    @keyframes growRight {
      from { width: 0; }
      to   { width: var(--hbar-w, 0%); }
    }

    /* ── Shimmer sweep ── */
    .shimmer-overlay {
      background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%);
      background-size: 200% 100%;
      animation: shimmer 2.5s infinite;
    }
    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ── Bar colours (gradients) ── */
    .bar-blue   { background: linear-gradient(90deg, #3b82f6, #1d4ed8); }
    .bar-indigo { background: linear-gradient(90deg, #6366f1, #4338ca); }
    .bar-cyan   { background: linear-gradient(90deg, #06b6d4, #0e7490); }
    .bar-teal   { background: linear-gradient(90deg, #14b8a6, #0f766e); }
    .bar-violet { background: linear-gradient(90deg, #8b5cf6, #6d28d9); }
    .bar-sky    { background: linear-gradient(90deg, #38bdf8, #0284c7); }
    .bar-amber  { background: linear-gradient(90deg, #f59e0b, #d97706); }
    .bar-orange { background: linear-gradient(90deg, #f97316, #ea580c); }
    .bar-yellow { background: linear-gradient(90deg, #eab308, #ca8a04); }
    .bar-emerald { background: linear-gradient(90deg, #34d399, #059669); }
    .bar-red     { background: linear-gradient(90deg, #f87171, #dc2626); }
    .bar-red-dark { background: linear-gradient(90deg, #ef4444, #991b1b); }

    /* ── Dark mode: chart bar backgrounds ── */
    :host-context(.dark) .shimmer-overlay,
    .dark .shimmer-overlay {
      background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%);
      background-size: 200% 100%;
    }

    /* ── Custom scrollbar ── */
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }

    /* ── Dark mode custom scrollbar ── */
    .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
    .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }

    /* ── Loading pulse ── */
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }
    .animate-pulse { animation: pulse 1.8s ease-in-out infinite; }
  `],
})
export class Dashboard implements OnInit {
  readonly svc = inject(DashboardService);

  readonly maxCategoryQty = computed(() => {
    const vals = this.svc.categoryStock().map(c => c.quantity);
    return vals.length ? Math.max(...vals) : 1;
  });

  readonly totalCategoryItems = computed(() =>
    this.svc.categoryStock().reduce((sum, c) => sum + c.quantity, 0)
  );

  /** Max capacity across all items in selected category (for bar scaling) */
  readonly maxItemCapacity = computed(() => {
    const items = this.svc.categoryItems();
    if (!items.length) return 1;
    return Math.max(...items.map(i => Math.max(i.quantity, i.minQuantity)));
  });

  /** Calculate bar width % for an item: quantity out of maxItemCapacity */
  itemBarPercent(item: CategoryItem): number {
    const max = this.maxItemCapacity();
    return max > 0 ? (item.quantity / max) * 100 : 0;
  }

  selectCategory(category: string): void {
    this.svc.loadCategoryItems(category);
  }

  ngOnInit(): void {
    this.svc.load();
  }
}
