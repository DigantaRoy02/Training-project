package com.warehouse.ibm.controllers;

import com.warehouse.ibm.model.StockLevel;
import com.warehouse.ibm.repositories.StockLevelRepository;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.sql.*;
import java.util.*;

@RestController
@RequestMapping("/dashboard")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class DashboardController {

    private final StockLevelRepository stockLevelRepo;
    private final DataSource warehouseDS;

    public DashboardController(StockLevelRepository stockLevelRepo,
                               @Qualifier("warehouseRoutingDataSource") DataSource warehouseDS) {
        this.stockLevelRepo = stockLevelRepo;
        this.warehouseDS = warehouseDS;
    }

    /** GET /dashboard/stats – four KPI cards (uses direct JDBC for reliable counts) */
    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("lowStock", 0);
        stats.put("pendingReorders", 0);
        stats.put("totalStock", 0);
        stats.put("categories", 0);

        try (Connection conn = warehouseDS.getConnection()) {
            // Low stock: items where quantity < min_quantity
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT COUNT(*) FROM stock_level WHERE quantity < min_quantity")) {
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) stats.put("lowStock", rs.getInt(1));
                }
            }

            // Total reorders (all statuses)
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT COUNT(*) FROM reorder")) {
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) stats.put("pendingReorders", rs.getInt(1));
                }
            }

            // Total stock quantity
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT COALESCE(SUM(quantity), 0) FROM stock_level")) {
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) stats.put("totalStock", rs.getInt(1));
                }
            }

            // Distinct categories
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT COUNT(DISTINCT i.category_id) FROM stock_level sl JOIN items i ON sl.item_id = i.item_id")) {
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) stats.put("categories", rs.getInt(1));
                }
            }
        } catch (SQLException e) {
            System.err.println("[DashboardController] stats error: " + e.getMessage());
        }

        return stats;
    }

    /** GET /dashboard/stock-by-category – number of items per category */
    @GetMapping("/stock-by-category")
    public List<Map<String, Object>> getStockByCategory() {
        List<StockLevel> levels = safeLoadStockLevels();

        Map<String, Long> categoryItemCount = new LinkedHashMap<>();
        for (StockLevel sl : levels) {
            if (sl.getItem() == null || sl.getItem().getCategory() == null) continue;
            String cat = sl.getItem().getCategory().getCategoryName();
            categoryItemCount.merge(cat, 1L, Long::sum);
        }

        return categoryItemCount.entrySet().stream()
                .map(e -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("category", e.getKey());
                    m.put("quantity", e.getValue());
                    return m;
                })
                .toList();
    }

    /** GET /dashboard/reorder-frequency – reorders grouped by month (direct JDBC) */
    @GetMapping("/reorder-frequency")
    public List<Map<String, Object>> getReorderFrequency() {
        String sql = """
            SELECT DATE_FORMAT(reorder_date, '%b') AS month, COUNT(*) AS cnt
            FROM reorder
            WHERE reorder_date IS NOT NULL
            GROUP BY MONTH(reorder_date), DATE_FORMAT(reorder_date, '%b')
            ORDER BY MONTH(reorder_date)
            """;
        List<Map<String, Object>> result = new ArrayList<>();
        try (Connection conn = warehouseDS.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> m = new HashMap<>();
                m.put("month", rs.getString("month"));
                m.put("count", rs.getInt("cnt"));
                result.add(m);
            }
        } catch (SQLException e) {
            System.err.println("[DashboardController] reorder-frequency error: " + e.getMessage());
        }
        return result;
    }

    /** GET /dashboard/items-by-category?category=Electronics – item-level stock for a category */
    @GetMapping("/items-by-category")
    public List<Map<String, Object>> getItemsByCategory(@RequestParam String category) {
        List<StockLevel> levels = safeLoadStockLevels();

        // Collect per-item: total qty, max minQty, bin details
        Map<String, int[]> itemAgg = new LinkedHashMap<>();
        Map<String, List<Map<String, Object>>> itemBins = new LinkedHashMap<>();

        for (StockLevel sl : levels) {
            if (sl.getItem() == null || sl.getItem().getCategory() == null) continue;
            if (!category.equalsIgnoreCase(sl.getItem().getCategory().getCategoryName())) continue;

            String name = sl.getItem().getItemName();
            int qty = sl.getQuantity() != null ? sl.getQuantity() : 0;
            int minQty = sl.getMinQuantity() != null ? sl.getMinQuantity() : 0;

            itemAgg.merge(name, new int[]{qty, minQty}, (old, nw) -> {
                old[0] += nw[0];
                old[1] = Math.max(old[1], nw[1]);
                return old;
            });

            // Collect bin info
            if (sl.getBin() != null) {
                Map<String, Object> binInfo = new LinkedHashMap<>();
                binInfo.put("binCode", sl.getBin().getBinCode());
                binInfo.put("capacity", sl.getBin().getCapacity());
                binInfo.put("zone", sl.getBin().getZone());
                binInfo.put("quantity", qty);
                itemBins.computeIfAbsent(name, k -> new ArrayList<>()).add(binInfo);
            }
        }

        return itemAgg.entrySet().stream()
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("itemName", e.getKey());
                    m.put("quantity", e.getValue()[0]);
                    m.put("minQuantity", e.getValue()[1]);
                    m.put("bins", itemBins.getOrDefault(e.getKey(), List.of()));
                    return m;
                })
                .toList();
    }

    private List<StockLevel> safeLoadStockLevels() {
        try { return stockLevelRepo.findAll(); }
        catch (Exception e) { return List.of(); }
    }
}
