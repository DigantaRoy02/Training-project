import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';

export interface DashboardStat {
  label: string;
  value: string;
  icon: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
}

export interface CategoryStock {
  category: string;
  quantity: number;
}

export interface BinInfo {
  binCode: string;
  capacity: number;
  zone: string;
  quantity: number;
}

export interface CategoryItem {
  itemName: string;
  quantity: number;
  minQuantity: number;
  bins: BinInfo[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly base = '/warehouse';

  readonly stats = signal<DashboardStat[]>([]);
  readonly categoryStock = signal<CategoryStock[]>([]);
  readonly categoryItems = signal<CategoryItem[]>([]);
  readonly selectedCategory = signal<string | null>(null);
  readonly categoryItemsLoading = signal(false);
  readonly loading = signal(true);

  constructor(private http: HttpClient) {}

  load(): void {
    this.loading.set(true);
    forkJoin({
      stats:    this.http.get<any>(`${this.base}/dashboard/stats`),
      category: this.http.get<CategoryStock[]>(`${this.base}/dashboard/stock-by-category`),
    }).subscribe({
      next: ({ stats, category }) => {
        this.stats.set([
          { label: 'Low Stock',        value: String(stats.lowStock),        icon: 'low-stock',   trend: 'From live data', trendDirection: stats.lowStock > 0 ? 'down' : 'neutral' },
          { label: 'Total Reorders',   value: String(stats.pendingReorders), icon: 'reorders',    trend: 'From live data', trendDirection: 'neutral' },
          { label: 'Total Stock',      value: String(stats.totalStock),      icon: 'total-stock', trend: 'From live data', trendDirection: 'up' },
          { label: 'Categories',       value: String(stats.categories),      icon: 'categories',  trend: 'From live data', trendDirection: 'neutral' },
        ]);
        this.categoryStock.set(category);
        this.loading.set(false);

        // Auto-select first category
        if (category.length > 0) {
          this.loadCategoryItems(category[0].category);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  loadCategoryItems(category: string): void {
    this.selectedCategory.set(category);
    this.categoryItemsLoading.set(true);
    this.http
      .get<CategoryItem[]>(`${this.base}/dashboard/items-by-category?category=${encodeURIComponent(category)}`)
      .subscribe({
        next: (items) => {
          this.categoryItems.set(items);
          this.categoryItemsLoading.set(false);
        },
        error: () => {
          this.categoryItems.set([]);
          this.categoryItemsLoading.set(false);
        },
      });
  }
}
