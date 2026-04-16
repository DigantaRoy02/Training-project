import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type ReorderStatus = 'PENDING' | 'APPROVED' | 'SHIPPED' | 'RECEIVED';

export interface ReorderRequest {
  orderId: string;
  reorderId: number;
  itemId: string;
  itemName: string;
  category: string;
  quantity: number;
  supplierPrice: number;
  totalCost: number;
  supplier: string;
  status: ReorderStatus;
  requestedDate: string;
  expectedDelivery: string;
  triggerType: string;
}

interface RawReorder {
  reorderId: number;
  reorderQuantity: number;
  reorderDate: string;
  triggerType: string;
  status: ReorderStatus;
  supplierPrice: number | null;
  leadTimeDays: number | null;
  expectedDelivery: string | null;
  item: {
    itemId: number;
    itemName: string;
    unitPrice: number;
    category: { categoryId: number; categoryName: string };
  };
  supplier: {
    supplierId: number;
    supplierName: string;
  } | null;
}

@Injectable({ providedIn: 'root' })
export class ReorderService {

  private readonly base = '/warehouse';

  readonly orders = signal<ReorderRequest[]>([]);
  readonly loading = signal(true);

  readonly pendingCount  = computed(() => this.orders().filter(o => o.status === 'PENDING').length);
  readonly approvedCount = computed(() => this.orders().filter(o => o.status === 'APPROVED').length);
  readonly shippedCount  = computed(() => this.orders().filter(o => o.status === 'SHIPPED').length);
  readonly receivedCount = computed(() => this.orders().filter(o => o.status === 'RECEIVED').length);

  constructor(private http: HttpClient) {}

  load(): void {
    this.loading.set(true);
    this.http.get<RawReorder[]>(`${this.base}/reorders`).subscribe({
      next: (raw) => {
        this.orders.set(raw.map(r => this.mapReorder(r)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  createManual(itemId: number, quantity: number): void {
    this.http.post<RawReorder>(`${this.base}/reorders/manual`, {
      item: { itemId },
      reorderQuantity: quantity,
    }).subscribe({
      next: (created) => {
        this.orders.update(list => [this.mapReorder(created), ...list]);
      },
    });
  }

  updateStatus(reorderId: number, status: ReorderStatus): void {
    // 1. Optimistic UI update — change the status instantly in the signal
    this.orders.update(list =>
      list.map(o => o.reorderId === reorderId ? { ...o, status } : o)
    );

    // 2. Send to backend in background
    this.http.put<RawReorder[]>(
      `${this.base}/reorders/${reorderId}/status?status=${status}`, {}
    ).subscribe({
      next: (list) => {
        // Sync with backend response if available
        if (Array.isArray(list)) {
          this.orders.set(list.map(r => this.mapReorder(r)));
        }
      },
      error: (err) => {
        console.error('updateStatus error — reloading', err);
        this.load();
      },
    });
  }

  private mapReorder(r: RawReorder): ReorderRequest {
    const price = r.supplierPrice ?? r.item?.unitPrice ?? 0;
    const qty   = r.reorderQuantity ?? 0;
    return {
      orderId:          `RO-${String(r.reorderId).padStart(3, '0')}`,
      reorderId:        r.reorderId,
      itemId:           `ITM-${String(r.item?.itemId ?? 0).padStart(3, '0')}`,
      itemName:         r.item?.itemName ?? '-',
      category:         r.item?.category?.categoryName ?? '-',
      quantity:         qty,
      supplierPrice:    price,
      totalCost:        qty * price,
      supplier:         r.supplier?.supplierName ?? '-',
      status:           r.status,
      requestedDate:    r.reorderDate ?? '',
      expectedDelivery: r.expectedDelivery ?? '-',
      triggerType:      r.triggerType ?? '',
    };
  }
}
