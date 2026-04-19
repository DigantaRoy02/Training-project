import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface InventoryItem {
  id: string;
  itemId: number;
  binId: number;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  unitPrice: number;
  totalValue: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  binLocation: string;
  binCode: string;
  stockStatus: string;
  lastUpdated: string;
}

export interface Supplier {
  id: string;
  numericId: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  supplierCode: string;
  category: string;
  itemsSupplied: string[];
  rating: number;
  status: 'Active' | 'Inactive';
  addedDate: string;
  city: string;
  state: string;
  country: string;
  address: string;
}

interface RawStockLevel {
  id: { itemId: number; binId: number };
  quantity: number;
  lowStockQuantity: number;
  outOfStockQuantity: number;
  stockStatus: string;
  item: {
    itemId: number;
    sku: string;
    itemName: string;
    unitPrice: number;
    category: { categoryId: number; categoryName: string };
  };
  bin: {
    binId: number;
    binCode: string;
    zone: string;
    aisle: string;
    rack: string;
    level: string;
  };
}

interface RawSupplier {
  supplierId: number;
  supplierName: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  supplierCode: string;
  city: string;
  state: string;
  country: string;
  address: string;
  categoryName: string;
  itemsSupplied: string[];
}

@Injectable({ providedIn: 'root' })
export class InventoryService {

  private readonly base = '/warehouse';

  readonly items = signal<InventoryItem[]>([]);
  readonly suppliers = signal<Supplier[]>([]);
  readonly bins = signal<{ binId: number; binCode: string; zone: string; capacity: number }[]>([]);
  readonly loading = signal(true);

  readonly categories = computed(() =>
    [...new Set(this.items().map(i => i.category))].sort()
  );

  constructor(private http: HttpClient) {}

  load(): void {
    this.loading.set(true);
    this.http.get<RawStockLevel[]>(`${this.base}/stock-levels`).subscribe({
      next: (levels) => {
        this.items.set(levels.map(sl => this.mapStockLevel(sl)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.http.get<RawSupplier[]>(`${this.base}/suppliers`).subscribe({
      next: (raw) => this.suppliers.set(raw.map(s => this.mapSupplier(s))),
    });
    this.http.get<{ binId: number; binCode: string; zone: string; capacity: number }[]>(`${this.base}/bins`).subscribe({
      next: (bins) => this.bins.set(bins),
    });
  }

  updateQuantity(itemId: number, binId: number, newQty: number, onComplete?: () => void): void {
    // Optimistic UI update
    const idStr = `ITM-${String(itemId).padStart(3, '0')}`;
    this.items.update(list =>
      list.map(i => {
        if (i.id !== idStr) return i;
        const status: InventoryItem['status'] =
          newQty <= 0 ? 'Out of Stock'
            : newQty <= i.reorderLevel ? 'Low Stock'
            : 'In Stock';
        return { ...i, quantity: newQty, totalValue: newQty * i.unitPrice, status };
      })
    );
    // Persist to database
    this.http.put(`${this.base}/stock-levels/${itemId}/${binId}/quantity?quantity=${newQty}`, {}).subscribe({
      next: () => {
        this.load();
        if (onComplete) onComplete();
      },
      error: (err) => {
        console.error('updateQuantity error', err);
        this.load();
      },
    });
  }

  addItem(payload: {
    itemName: string; sku: string; unitPrice: number; categoryName: string;
    quantity: number; lowStockQuantity: number; outOfStockQuantity: number;
    binCode: string; supplierId: number | null;
  }): Promise<boolean> {
    return new Promise(resolve => {
      this.http.post<{ success: boolean }>(`${this.base}/stock-levels/add-item`, payload).subscribe({
        next: () => { this.load(); resolve(true); },
        error: (err) => { console.error('addItem error', err); resolve(false); },
      });
    });
  }

  purchaseItem(itemId: number, binId: number, quantity: number): Promise<{ success: boolean; newQuantity?: number; newStatus?: string; autoReordered?: boolean; error?: string }> {
    return new Promise(resolve => {
      this.http.post<any>(`${this.base}/stock-levels/purchase`, { itemId, binId, quantity }).subscribe({
        next: (res) => { this.load(); resolve(res); },
        error: (err) => {
          console.error('purchaseItem error', err);
          resolve({ success: false, error: err.error?.error || 'Purchase failed' });
        },
      });
    });
  }

  private mapStockLevel(sl: RawStockLevel): InventoryItem {
    const qty       = sl.quantity ?? 0;
    const lowQty    = sl.lowStockQuantity ?? 0;
    const outQty    = sl.outOfStockQuantity ?? 0;
    const price     = sl.item?.unitPrice ?? 0;
    const aisle     = sl.bin?.aisle ?? '';
    const rack      = sl.bin?.rack ?? '';
    const lvl       = sl.bin?.level ?? '';
    const binCode   = sl.bin?.binCode ?? '';

    const backendStatus = sl.stockStatus ?? '';
    let status: InventoryItem['status'] = 'In Stock';
    if (backendStatus === 'OUT_OF_STOCK' || qty <= outQty) status = 'Out of Stock';
    else if (backendStatus === 'LOW_STOCK' || qty <= lowQty) status = 'Low Stock';

    return {
      id:           `ITM-${String(sl.item?.itemId ?? 0).padStart(3, '0')}`,
      itemId:       sl.item?.itemId ?? 0,
      binId:        sl.id?.binId ?? 0,
      name:         sl.item?.itemName ?? '\u{FFFD}',
      sku:          sl.item?.sku ?? '',
      category:     sl.item?.category?.categoryName ?? '\u{FFFD}',
      quantity:     qty,
      reorderLevel: lowQty,
      unitPrice:    price,
      totalValue:   qty * price,
      status,
      binLocation:  `${aisle}${rack}-${lvl}`.replace(/^-|-$/g, '') || binCode,
      binCode,
      stockStatus:  sl.stockStatus ?? '',
      lastUpdated:  '',
    };
  }

  private mapSupplier(s: RawSupplier): Supplier {
    return {
      id:            `SUP-${String(s.supplierId).padStart(3, '0')}`,
      numericId:     s.supplierId,
      name:          s.supplierName ?? '',
      contactPerson: s.contactPerson ?? '',
      email:         s.contactEmail ?? '',
      phone:         s.contactPhone ?? '',
      supplierCode:  s.supplierCode ?? '',
      category:      s.categoryName ?? '',
      itemsSupplied: s.itemsSupplied ?? [],
      rating:        4,
      status:        'Active',
      addedDate:     '',
      city:          s.city ?? '',
      state:         s.state ?? '',
      country:       s.country ?? '',
      address:       s.address ?? '',
    };
  }
}
