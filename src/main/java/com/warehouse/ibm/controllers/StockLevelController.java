package com.warehouse.ibm.controllers;

import com.warehouse.ibm.model.StockLevel;
import com.warehouse.ibm.services.StockLevelService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.sql.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/stock-levels")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class StockLevelController {

    private final StockLevelService service;
    private final DataSource warehouseDS;

    public StockLevelController(StockLevelService service,
                                @Qualifier("warehouseRoutingDataSource") DataSource warehouseDS) {
        this.service = service;
        this.warehouseDS = warehouseDS;
    }

    @GetMapping
    public List<StockLevel> getAll() {
        return service.getAll();
    }

    @PostMapping
    public StockLevel create(@RequestBody StockLevel stockLevel) {
        return service.create(stockLevel);
    }

    /** PUT /stock-levels/{itemId}/{binId}/quantity?quantity=X — update quantity, recalculate status */
    @PutMapping("/{itemId}/{binId}/quantity")
    public ResponseEntity<?> updateQuantity(@PathVariable int itemId,
                                            @PathVariable int binId,
                                            @RequestParam int quantity) {
        try (Connection conn = warehouseDS.getConnection()) {
            try (PreparedStatement ps = conn.prepareStatement(
                    "UPDATE stock_level SET quantity = ?, " +
                    "stock_status = CASE " +
                    "  WHEN ? <= out_of_stock_quantity THEN 'OUT_OF_STOCK' " +
                    "  WHEN ? <= low_stock_quantity THEN 'LOW_STOCK' " +
                    "  ELSE 'HEALTHY' END " +
                    "WHERE item_id = ? AND bin_id = ?")) {
                ps.setInt(1, quantity);
                ps.setInt(2, quantity);
                ps.setInt(3, quantity);
                ps.setInt(4, itemId);
                ps.setInt(5, binId);
                int rows = ps.executeUpdate();
                if (rows == 0) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Stock level not found"));
                }
            }
            // Check if new status is OUT_OF_STOCK and trigger auto reorder via JDBC
            String newStatus = null;
            int binCapacity = 100;
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT sl.stock_status, b.capacity FROM stock_level sl " +
                    "JOIN bin b ON sl.bin_id = b.bin_id " +
                    "WHERE sl.item_id = ? AND sl.bin_id = ?")) {
                ps.setInt(1, itemId);
                ps.setInt(2, binId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        newStatus = rs.getString("stock_status");
                        binCapacity = rs.getInt("capacity");
                    }
                }
            }

            if ("OUT_OF_STOCK".equals(newStatus) || "LOW_STOCK".equals(newStatus)) {
                // Delete old RECEIVED reorders for this item so a fresh reorder cycle can begin
                try (PreparedStatement ps = conn.prepareStatement(
                        "DELETE FROM reorder WHERE item_id = ? AND status = 'RECEIVED'")) {
                    ps.setInt(1, itemId);
                    int deleted = ps.executeUpdate();
                    if (deleted > 0) {
                        System.out.println("[StockLevelController] Deleted " + deleted + " RECEIVED reorder(s) for itemId=" + itemId);
                    }
                }
            }

            if ("OUT_OF_STOCK".equals(newStatus)) {
                // Check no active reorder exists
                boolean activeExists = false;
                try (PreparedStatement ps = conn.prepareStatement(
                        "SELECT COUNT(*) FROM reorder WHERE item_id = ? AND status IN ('PENDING','APPROVED','SHIPPED')")) {
                    ps.setInt(1, itemId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) activeExists = rs.getInt(1) > 0;
                    }
                }

                if (!activeExists) {
                    // Find supplier
                    Integer supplierId = null;
                    try (PreparedStatement ps = conn.prepareStatement(
                            "SELECT supplier_id FROM supplier_items WHERE item_id = ? LIMIT 1")) {
                        ps.setInt(1, itemId);
                        try (ResultSet rs = ps.executeQuery()) {
                            if (rs.next()) supplierId = rs.getInt("supplier_id");
                        }
                    }

                    // Insert auto reorder with 75% of bin capacity
                    int reorderQty = (int) Math.round(binCapacity * 0.75);
                    try (PreparedStatement ps = conn.prepareStatement(
                            "INSERT INTO reorder (reorder_id, item_id, supplier_id, reorder_quantity, reorder_date, trigger_type, status) " +
                            "VALUES ((SELECT COALESCE(MAX(r.reorder_id),0)+1 FROM reorder r), ?, ?, ?, ?, 'AUTO', 'PENDING')")) {
                        ps.setInt(1, itemId);
                        if (supplierId != null) {
                            ps.setInt(2, supplierId);
                        } else {
                            ps.setNull(2, java.sql.Types.INTEGER);
                        }
                        ps.setInt(3, Math.max(1, reorderQty));
                        ps.setDate(4, java.sql.Date.valueOf(LocalDate.now()));
                        ps.executeUpdate();
                        System.out.println("[StockLevelController] Auto reorder created for itemId=" + itemId + " qty=" + reorderQty);
                    }
                }
            }

            return ResponseEntity.ok(Map.of("success", true, "autoReorder", "OUT_OF_STOCK".equals(newStatus)));
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /stock-levels/add-item — composite: creates item + stock_level + supplier_items in one go.
     * Expects JSON: { itemName, sku, unitPrice, categoryName, quantity, lowStockQuantity, outOfStockQuantity, binCode, supplierId (optional) }
     */
    @PostMapping("/add-item")
    public ResponseEntity<?> addItem(@RequestBody Map<String, Object> body) {
        String itemName        = (String) body.get("itemName");
        String sku             = (String) body.get("sku");
        double unitPrice       = ((Number) body.get("unitPrice")).doubleValue();
        String categoryName    = (String) body.get("categoryName");
        int quantity           = ((Number) body.get("quantity")).intValue();
        int lowStockQty        = ((Number) body.get("lowStockQuantity")).intValue();
        int outOfStockQty      = ((Number) body.get("outOfStockQuantity")).intValue();
        String binCode         = (String) body.get("binCode");
        Integer supplierId     = body.get("supplierId") != null ? ((Number) body.get("supplierId")).intValue() : null;

        try (Connection conn = warehouseDS.getConnection()) {
            conn.setAutoCommit(false);
            try {
                // 1. Lookup or create category
                int categoryId;
                try (PreparedStatement ps = conn.prepareStatement(
                        "SELECT category_id FROM categories WHERE category_name = ?")) {
                    ps.setString(1, categoryName);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) {
                            categoryId = rs.getInt("category_id");
                        } else {
                            // Create category
                            try (PreparedStatement ins = conn.prepareStatement(
                                    "INSERT INTO categories (category_id, category_name) VALUES ((SELECT COALESCE(MAX(c.category_id),0)+1 FROM categories c), ?)")) {
                                ins.setString(1, categoryName);
                                ins.executeUpdate();
                            }
                            try (PreparedStatement sel = conn.prepareStatement(
                                    "SELECT category_id FROM categories WHERE category_name = ?")) {
                                sel.setString(1, categoryName);
                                try (ResultSet rs2 = sel.executeQuery()) {
                                    rs2.next();
                                    categoryId = rs2.getInt("category_id");
                                }
                            }
                        }
                    }
                }

                // 2. Generate next item_id and insert item
                int newItemId;
                try (PreparedStatement ps = conn.prepareStatement(
                        "SELECT COALESCE(MAX(item_id),0)+1 AS next_id FROM items")) {
                    try (ResultSet rs = ps.executeQuery()) {
                        rs.next();
                        newItemId = rs.getInt("next_id");
                    }
                }
                try (PreparedStatement ps = conn.prepareStatement(
                        "INSERT INTO items (item_id, sku, item_name, unit_price, category_id) VALUES (?, ?, ?, ?, ?)")) {
                    ps.setInt(1, newItemId);
                    ps.setString(2, sku);
                    ps.setString(3, itemName);
                    ps.setDouble(4, unitPrice);
                    ps.setInt(5, categoryId);
                    ps.executeUpdate();
                }

                // 3. Lookup bin by bin_code
                int binId;
                try (PreparedStatement ps = conn.prepareStatement(
                        "SELECT bin_id FROM bin WHERE bin_code = ?")) {
                    ps.setString(1, binCode);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (!rs.next()) {
                            conn.rollback();
                            return ResponseEntity.badRequest().body(Map.of("error", "Bin not found: " + binCode));
                        }
                        binId = rs.getInt("bin_id");
                    }
                }

                // 4. Determine stock status
                String stockStatus = "HEALTHY";
                if (quantity <= outOfStockQty) stockStatus = "OUT_OF_STOCK";
                else if (quantity <= lowStockQty) stockStatus = "LOW_STOCK";

                // 5. Insert stock_level
                try (PreparedStatement ps = conn.prepareStatement(
                        "INSERT INTO stock_level (item_id, bin_id, quantity, low_stock_quantity, out_of_stock_quantity, stock_status) " +
                        "VALUES (?, ?, ?, ?, ?, ?)")) {
                    ps.setInt(1, newItemId);
                    ps.setInt(2, binId);
                    ps.setInt(3, quantity);
                    ps.setInt(4, lowStockQty);
                    ps.setInt(5, outOfStockQty);
                    ps.setString(6, stockStatus);
                    ps.executeUpdate();
                }

                // 6. Link supplier if provided
                if (supplierId != null) {
                    try (PreparedStatement ps = conn.prepareStatement(
                            "INSERT INTO supplier_items (supplier_id, item_id, supplier_price, lead_time_days) VALUES (?, ?, ?, ?)")) {
                        ps.setInt(1, supplierId);
                        ps.setInt(2, newItemId);
                        ps.setDouble(3, unitPrice);   // default supplier_price = unit_price
                        ps.setInt(4, 7);              // default lead time 7 days
                        ps.executeUpdate();
                    }
                }

                conn.commit();
                System.out.println("[StockLevelController] New item added: id=" + newItemId + " name=" + itemName + " bin=" + binCode);
                return ResponseEntity.ok(Map.of("success", true, "itemId", newItemId));

            } catch (Exception ex) {
                conn.rollback();
                throw ex;
            }
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /stock-levels/purchase — purchase (OUT transaction): reduces quantity, updates status,
     * triggers auto-reorder if OUT_OF_STOCK, deletes RECEIVED reorders if below low stock.
     * Expects JSON: { itemId, binId, quantity }
     */
    @PostMapping("/purchase")
    public ResponseEntity<?> purchase(@RequestBody Map<String, Object> body) {
        int itemId   = ((Number) body.get("itemId")).intValue();
        int binId    = ((Number) body.get("binId")).intValue();
        int qty      = ((Number) body.get("quantity")).intValue();

        try (Connection conn = warehouseDS.getConnection()) {
            conn.setAutoCommit(false);
            try {
                // 1. Get current quantity
                int currentQty = 0;
                try (PreparedStatement ps = conn.prepareStatement(
                        "SELECT quantity FROM stock_level WHERE item_id = ? AND bin_id = ?")) {
                    ps.setInt(1, itemId);
                    ps.setInt(2, binId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (!rs.next()) {
                            conn.rollback();
                            return ResponseEntity.badRequest().body(Map.of("error", "Stock level not found"));
                        }
                        currentQty = rs.getInt("quantity");
                    }
                }

                if (qty > currentQty) {
                    conn.rollback();
                    return ResponseEntity.badRequest().body(Map.of("error",
                            "Insufficient stock. Available: " + currentQty + ", requested: " + qty));
                }

                int newQty = currentQty - qty;

                // 2. Update stock_level quantity + status
                try (PreparedStatement ps = conn.prepareStatement(
                        "UPDATE stock_level SET quantity = ?, " +
                        "stock_status = CASE " +
                        "  WHEN ? <= out_of_stock_quantity THEN 'OUT_OF_STOCK' " +
                        "  WHEN ? <= low_stock_quantity THEN 'LOW_STOCK' " +
                        "  ELSE 'HEALTHY' END " +
                        "WHERE item_id = ? AND bin_id = ?")) {
                    ps.setInt(1, newQty);
                    ps.setInt(2, newQty);
                    ps.setInt(3, newQty);
                    ps.setInt(4, itemId);
                    ps.setInt(5, binId);
                    ps.executeUpdate();
                }

                // 3. Insert OUT stock_transaction
                try (PreparedStatement ps = conn.prepareStatement(
                        "INSERT INTO stock_transaction (transaction_id, transaction_type, quantity, transaction_date, item_id, bin_id) " +
                        "VALUES ((SELECT COALESCE(MAX(t.transaction_id),0)+1 FROM stock_transaction t), 'OUT', ?, ?, ?, ?)")) {
                    ps.setInt(1, qty);
                    ps.setDate(2, java.sql.Date.valueOf(LocalDate.now()));
                    ps.setInt(3, itemId);
                    ps.setInt(4, binId);
                    ps.executeUpdate();
                }

                // 4. Read back new status + bin capacity
                String newStatus = null;
                int binCapacity = 100;
                try (PreparedStatement ps = conn.prepareStatement(
                        "SELECT sl.stock_status, b.capacity FROM stock_level sl " +
                        "JOIN bin b ON sl.bin_id = b.bin_id " +
                        "WHERE sl.item_id = ? AND sl.bin_id = ?")) {
                    ps.setInt(1, itemId);
                    ps.setInt(2, binId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) {
                            newStatus = rs.getString("stock_status");
                            binCapacity = rs.getInt("capacity");
                        }
                    }
                }

                // 5. Delete RECEIVED reorders if now below low stock
                if ("OUT_OF_STOCK".equals(newStatus) || "LOW_STOCK".equals(newStatus)) {
                    try (PreparedStatement ps = conn.prepareStatement(
                            "DELETE FROM reorder WHERE item_id = ? AND status = 'RECEIVED'")) {
                        ps.setInt(1, itemId);
                        ps.executeUpdate();
                    }
                }

                // 6. Auto reorder if OUT_OF_STOCK
                boolean autoReordered = false;
                if ("OUT_OF_STOCK".equals(newStatus)) {
                    boolean activeExists = false;
                    try (PreparedStatement ps = conn.prepareStatement(
                            "SELECT COUNT(*) FROM reorder WHERE item_id = ? AND status IN ('PENDING','APPROVED','SHIPPED')")) {
                        ps.setInt(1, itemId);
                        try (ResultSet rs = ps.executeQuery()) {
                            if (rs.next()) activeExists = rs.getInt(1) > 0;
                        }
                    }
                    if (!activeExists) {
                        Integer supplierId = null;
                        try (PreparedStatement ps = conn.prepareStatement(
                                "SELECT supplier_id FROM supplier_items WHERE item_id = ? LIMIT 1")) {
                            ps.setInt(1, itemId);
                            try (ResultSet rs = ps.executeQuery()) {
                                if (rs.next()) supplierId = rs.getInt("supplier_id");
                            }
                        }
                        int reorderQty = (int) Math.round(binCapacity * 0.75);
                        try (PreparedStatement ps = conn.prepareStatement(
                                "INSERT INTO reorder (reorder_id, item_id, supplier_id, reorder_quantity, reorder_date, trigger_type, status) " +
                                "VALUES ((SELECT COALESCE(MAX(r.reorder_id),0)+1 FROM reorder r), ?, ?, ?, ?, 'AUTO', 'PENDING')")) {
                            ps.setInt(1, itemId);
                            if (supplierId != null) ps.setInt(2, supplierId);
                            else ps.setNull(2, java.sql.Types.INTEGER);
                            ps.setInt(3, Math.max(1, reorderQty));
                            ps.setDate(4, java.sql.Date.valueOf(LocalDate.now()));
                            ps.executeUpdate();
                            autoReordered = true;
                            System.out.println("[Purchase] Auto reorder created for itemId=" + itemId + " qty=" + reorderQty);
                        }
                    }
                }

                conn.commit();
                System.out.println("[Purchase] item_id=" + itemId + " qty_sold=" + qty + " new_qty=" + newQty + " status=" + newStatus);
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "newQuantity", newQty,
                        "newStatus", String.valueOf(newStatus),
                        "autoReordered", autoReordered
                ));
            } catch (Exception ex) {
                conn.rollback();
                throw ex;
            }
        } catch (SQLException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
