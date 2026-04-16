import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-purchase',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-black">Purchase</h2>
      <p class="text-sm text-black/50 mt-1">Create and track purchase orders</p>
    </div>
    <!-- TODO: Build purchase order table — data from GET /api/purchase -->
    <div class="border border-black/15 rounded-lg p-10 text-center">
      <p class="text-black/40 text-sm">Purchase page — coming soon</p>
    </div>
  `,
})
export class Purchase {}
