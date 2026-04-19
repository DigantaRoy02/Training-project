package com.warehouse.ibm.services;

import com.warehouse.ibm.enums.OrderStatus;
import com.warehouse.ibm.enums.TriggerType;
import com.warehouse.ibm.model.*;
import com.warehouse.ibm.repositories.ReorderRepository;
import com.warehouse.ibm.repositories.SupplierItemRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.*;
import java.time.LocalDate;
import java.util.*;

@Service
public class ReorderService {

    private final ReorderRepository repo;
    private final SupplierItemRepository supplierItemRepository;
    private final DataSource warehouseDS;

    public ReorderService(ReorderRepository repo,
                          SupplierItemRepository supplierItemRepository,
                          @Qualifier("warehouseRoutingDataSource") DataSource warehouseDS) {
        this.repo = repo;
        this.supplierItemRepository = supplierItemRepository;
        this.warehouseDS = warehouseDS;
    }

    public List<Reorder> getAll() {
        return repo.findAll();
    }

    /**
     * Fetch all reorders using direct JDBC on the routing datasource.
     */
    public List<Map<String, Object>> getAllDTO() {
        String warehouseKey = com.warehouse.ibm.config.WarehouseContext.get();
        System.out.println("[ReorderService] getAllDTO - WarehouseContext=" + warehouseKey);

        String sql = """
            SELECT r.reorder_id, r.reorder_quantity, r.reorder_date,
                   r.trigger_type, r.status,
                   i.item_id, i.item_name, i.sku, i.unit_price,
                   c.category_id, c.category_name,
                   s.supplier_id, s.supplier_name,
                   si.supplier_price, si.lead_time_days
            FROM reorder r
            LEFT JOIN items i ON r.item_id = i.item_id
            LEFT JOIN categories c ON i.category_id = c.category_id
            LEFT JOIN suppliers s ON r.supplier_id = s.supplier_id
            LEFT JOIN supplier_items si ON si.item_id = r.item_id AND si.supplier_id = r.supplier_id
            ORDER BY r.reorder_date DESC, r.reorder_id DESC
            """;

        List<Map<String, Object>> result = new ArrayList<>();
        try (Connection conn = warehouseDS.getConnection()) {
            System.out.println("[ReorderService] getAllDTO - connected to catalog: " + conn.getCatalog());
            try (PreparedStatement ps = conn.prepareStatement(sql);
                 ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                result.add(buildDTOFromResultSet(rs));
            }
            }
        } catch (SQLException e) {
            System.err.println("[ReorderService] getAllDTO error: " + e.getMessage());
            e.printStackTrace();
        }
        return result;
    }

    public void checkAutoReorder(StockLevel stockLevel) {
        String status = stockLevel.getStockStatus();
        if (status == null) return;
        // Auto reorder only when OUT_OF_STOCK
        if ("OUT_OF_STOCK".equals(status)) {
            createAutoReorder(stockLevel);
        }
    }

    public Reorder createAutoReorder(StockLevel stock) {
        List<OrderStatus> activeStatuses = List.of(OrderStatus.PENDING, OrderStatus.APPROVED, OrderStatus.SHIPPED);
        if (repo.existsByItemAndStatusIn(stock.getItem(), activeStatuses)) {
            return null;
        }

        Reorder reorder = new Reorder();
        reorder.setItem(stock.getItem());

        supplierItemRepository
                .findByItem(stock.getItem())
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No supplier found"));

        reorder.setTriggerType(TriggerType.AUTO);
        reorder.setStatus(OrderStatus.PENDING);
        reorder.setReorderDate(LocalDate.now());
        // Auto reorder qty = 75% of bin capacity (rounded), minimum 1
        int binCapacity = stock.getBin() != null && stock.getBin().getCapacity() != null
                ? stock.getBin().getCapacity() : 100;
        int reorderQty = (int) Math.round(binCapacity * 0.75);
        reorder.setReorderQuantity(Math.max(1, reorderQty));

        return repo.save(reorder);
    }

    public void createManualReorder(Reorder reorder) {
        Integer itemId = reorder.getItem().getItemId();
        int qty = reorder.getReorderQuantity() != null ? reorder.getReorderQuantity() : 0;

        String warehouseKey = com.warehouse.ibm.config.WarehouseContext.get();
        System.out.println("[ReorderService] createManualReorder - WarehouseContext=" + warehouseKey
                + " itemId=" + itemId + " qty=" + qty);

        try (Connection conn = warehouseDS.getConnection()) {
            System.out.println("[ReorderService] createManualReorder - connected to catalog: " + conn.getCatalog());

            // Check for existing active reorder for this item
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT COUNT(*) FROM reorder WHERE item_id = ? AND status IN ('PENDING','APPROVED','SHIPPED')")) {
                ps.setInt(1, itemId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next() && rs.getInt(1) > 0) {
                        throw new RuntimeException("An active reorder already exists for this item");
                    }
                }
            }

            // Find a supplier for this item
            Integer supplierId = null;
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT supplier_id FROM supplier_items WHERE item_id = ? LIMIT 1")) {
                ps.setInt(1, itemId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        supplierId = rs.getInt("supplier_id");
                    }
                }
            }

            // Insert the reorder
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO reorder (reorder_id, item_id, supplier_id, reorder_quantity, reorder_date, trigger_type, status) " +
                    "VALUES ((SELECT COALESCE(MAX(r.reorder_id),0)+1 FROM reorder r), ?, ?, ?, ?, 'MANUAL', 'APPROVED')")) {
                ps.setInt(1, itemId);
                if (supplierId != null) {
                    ps.setInt(2, supplierId);
                } else {
                    ps.setNull(2, java.sql.Types.INTEGER);
                }
                ps.setInt(3, qty);
                ps.setDate(4, java.sql.Date.valueOf(LocalDate.now()));
                int rows = ps.executeUpdate();
                System.out.println("[ReorderService] Manual reorder INSERT rows=" + rows);
            }
        } catch (SQLException e) {
            System.err.println("[ReorderService] createManualReorder SQL error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create manual reorder: " + e.getMessage(), e);
        }
    }

    /**
     * Update reorder status using direct JDBC on the routing datasource.
     * This guarantees the UPDATE commits on the correct warehouse database.
     * When status becomes RECEIVED, also update stock_level and insert stock_transaction.
     */
    public void updateStatusDTO(Integer reorderId, OrderStatus status) {
        String warehouseKey = com.warehouse.ibm.config.WarehouseContext.get();
        System.out.println("[ReorderService] updateStatusDTO - WarehouseContext=" + warehouseKey
                + " reorderId=" + reorderId + " newStatus=" + status.name());

        // STEP 1: Always update the reorder status first — committed immediately
        try (Connection conn = warehouseDS.getConnection()) {
            System.out.println("[ReorderService] updateStatusDTO - connected to catalog: " + conn.getCatalog());
            try (PreparedStatement ps = conn.prepareStatement(
                    "UPDATE reorder SET status = ? WHERE reorder_id = ?")) {
                ps.setString(1, status.name());
                ps.setInt(2, reorderId);
                int updated = ps.executeUpdate();
                System.out.println("[ReorderService] UPDATE reorder status=" + status.name()
                        + " id=" + reorderId + " rows=" + updated);
                if (updated == 0) {
                    throw new RuntimeException("Reorder not found: " + reorderId);
                }
            }
            System.out.println("[ReorderService] Status COMMITTED for reorder " + reorderId);
        } catch (SQLException e) {
            System.err.println("[ReorderService] Status update error: " + e.getMessage());
            throw new RuntimeException("Failed to update reorder status: " + e.getMessage(), e);
        }

        // STEP 2: If RECEIVED, update stock_level quantity
        if (status == OrderStatus.RECEIVED) {
            try (Connection conn = warehouseDS.getConnection()) {
                // First get item_id and reorder_quantity
                int itemId = 0;
                int qty = 0;
                try (PreparedStatement ps = conn.prepareStatement(
                        "SELECT item_id, reorder_quantity FROM reorder WHERE reorder_id = ?")) {
                    ps.setInt(1, reorderId);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) {
                            itemId = rs.getInt("item_id");
                            qty = rs.getInt("reorder_quantity");
                        }
                    }
                }
                System.out.println("[ReorderService] RECEIVED -> item_id=" + itemId + " qty=" + qty);

                if (itemId > 0 && qty > 0) {
                    // Update quantity and recalculate stock_status
                    try (PreparedStatement ps = conn.prepareStatement(
                            "UPDATE stock_level SET quantity = quantity + ?, " +
                            "stock_status = CASE " +
                            "  WHEN quantity + ? <= out_of_stock_quantity THEN 'OUT_OF_STOCK' " +
                            "  WHEN quantity + ? <= low_stock_quantity THEN 'LOW_STOCK' " +
                            "  ELSE 'HEALTHY' END " +
                            "WHERE item_id = ?")) {
                        ps.setInt(1, qty);
                        ps.setInt(2, qty);
                        ps.setInt(3, qty);
                        ps.setInt(4, itemId);
                        int rows = ps.executeUpdate();
                        System.out.println("[ReorderService] stock_level updated rows=" + rows);
                    }
                }
            } catch (Exception e) {
                System.err.println("[ReorderService] stock_level update failed: " + e.getMessage());
                e.printStackTrace();
            }
        }
    }

    /**
     * Shared helper: convert a JDBC ResultSet row into the DTO map.
     * Columns: reorder_id, reorder_quantity, reorder_date, trigger_type, status,
     *   item_id, item_name, sku, unit_price, category_id, category_name,
     *   supplier_id, supplier_name, supplier_price, lead_time_days
     */
    private Map<String, Object> buildDTOFromResultSet(ResultSet rs) throws SQLException {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("reorderId", rs.getObject("reorder_id"));
        dto.put("reorderQuantity", rs.getObject("reorder_quantity"));

        Object reorderDate = rs.getObject("reorder_date");
        dto.put("reorderDate", reorderDate != null ? reorderDate.toString() : null);

        Object triggerType = rs.getObject("trigger_type");
        dto.put("triggerType", triggerType != null ? triggerType.toString() : null);

        Object statusVal = rs.getObject("status");
        dto.put("status", statusVal != null ? statusVal.toString() : null);

        // supplier_price from supplier_items
        dto.put("supplierPrice", rs.getObject("supplier_price"));
        // lead_time_days from supplier_items
        Object leadDays = rs.getObject("lead_time_days");
        dto.put("leadTimeDays", leadDays);

        // Calculate expected delivery = reorder_date + lead_time_days
        if (reorderDate != null && leadDays != null) {
            try {
                LocalDate rd = LocalDate.parse(reorderDate.toString());
                int ld = ((Number) leadDays).intValue();
                dto.put("expectedDelivery", rd.plusDays(ld).toString());
            } catch (Exception e) {
                dto.put("expectedDelivery", null);
            }
        } else {
            dto.put("expectedDelivery", null);
        }

        Map<String, Object> item = new LinkedHashMap<>();
        item.put("itemId", rs.getObject("item_id"));
        item.put("itemName", rs.getObject("item_name"));
        item.put("sku", rs.getObject("sku"));
        item.put("unitPrice", rs.getObject("unit_price"));

        Map<String, Object> category = new LinkedHashMap<>();
        category.put("categoryId", rs.getObject("category_id"));
        category.put("categoryName", rs.getObject("category_name"));
        item.put("category", category);

        dto.put("item", item);

        Object supplierId = rs.getObject("supplier_id");
        if (supplierId != null) {
            Map<String, Object> supplier = new LinkedHashMap<>();
            supplier.put("supplierId", supplierId);
            supplier.put("supplierName", rs.getObject("supplier_name"));
            dto.put("supplier", supplier);
        } else {
            dto.put("supplier", null);
        }

        return dto;
    }
}
