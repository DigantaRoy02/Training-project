import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface InventoryItem {
  id: string;
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
  minQuantity: number;
  belowMinDate: string | null;
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
  }

  updateQuantity(item: InventoryItem, newQty: number): void {
    const newStatus: InventoryItem['status'] =
      newQty === 0 ? 'Out of Stock'
        : newQty <= item.reorderLevel ? 'Low Stock'
        : 'In Stock';
    this.items.update(list =>
      list.map(i => i.id === item.id
        ? { ...i, quantity: newQty, totalValue: newQty * i.unitPrice, status: newStatus }
        : i
      )
    );
  }

  private mapStockLevel(sl: RawStockLevel): InventoryItem {
    const qty    = sl.quantity ?? 0;
    const minQty = sl.minQuantity ?? 0;
    const price  = sl.item?.unitPrice ?? 0;
    const aisle  = sl.bin?.aisle ?? '';
    const rack   = sl.bin?.rack ?? '';
    const lvl    = sl.bin?.level ?? '';
    const binCode = sl.bin?.binCode ?? '';

    let status: InventoryItem['status'] = 'In Stock';
    if (qty === 0) status = 'Out of Stock';
    else if (qty <= minQty) status = 'Low Stock';

    return {
      id:           `ITM-${String(sl.item?.itemId ?? 0).padStart(3, '0')}`,
      name:         sl.item?.itemName ?? '�',
      sku:          sl.item?.sku ?? '',
      category:     sl.item?.category?.categoryName ?? '�',
      quantity:     qty,
      reorderLevel: minQty,
      unitPrice:    price,
      totalValue:   qty * price,
      status,
      binLocation:  `${aisle}${rack}-${lvl}`.replace(/^-|-$/g, '') || binCode,
      binCode,
      stockStatus:  sl.stockStatus ?? '',
      lastUpdated:  sl.belowMinDate ?? '',
    };
  }

  private mapSupplier(s: RawSupplier): Supplier {
    return {
      id:            `SUP-${String(s.supplierId).padStart(3, '0')}`,
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
