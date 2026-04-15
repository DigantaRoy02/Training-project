package com.warehouse.ibm.config;

/**
 * Holds the active warehouse (database) name for the current request thread.
 */
public class WarehouseContext {

    private static final ThreadLocal<String> CONTEXT = new ThreadLocal<>();

    public static void set(String warehouseName) {
        CONTEXT.set(warehouseName);
    }

    public static String get() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }
}
