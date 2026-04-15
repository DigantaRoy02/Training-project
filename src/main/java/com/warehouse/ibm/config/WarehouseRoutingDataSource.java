package com.warehouse.ibm.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Routes each request to the correct MySQL database based on the
 * warehouse name stored in {@link WarehouseContext}.
 *
 * New databases are created on first use and cached for subsequent requests.
 */
public class WarehouseRoutingDataSource extends AbstractRoutingDataSource {

    private static final String JDBC_TEMPLATE =
            "jdbc:mysql://localhost:3306/%s?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true";

    /** Cache: warehouseName -> DataSource */
    private final ConcurrentHashMap<String, DataSource> cache = new ConcurrentHashMap<>();

    /** Default warehouse used as the Spring "default" target */
    private final String defaultWarehouse;

    public WarehouseRoutingDataSource(String defaultWarehouse) {
        this.defaultWarehouse = defaultWarehouse;

        // Must give AbstractRoutingDataSource at least one target at construction time
        DataSource defaultDs = buildDataSource(defaultWarehouse);
        cache.put(defaultWarehouse, defaultDs);

        Map<Object, Object> targets = new HashMap<>();
        targets.put(defaultWarehouse, defaultDs);
        setTargetDataSources(targets);
        setDefaultTargetDataSource(defaultDs);
        afterPropertiesSet();
    }

    @Override
    protected Object determineCurrentLookupKey() {
        return WarehouseContext.get() != null ? WarehouseContext.get() : defaultWarehouse;
    }

    /**
     * Override to return a lazily-created datasource when the key isn't
     * already in the static map supplied at construction.
     */
    @Override
    protected DataSource resolveSpecifiedDataSource(Object dataSource) {
        if (dataSource instanceof DataSource ds) return ds;
        return super.resolveSpecifiedDataSource(dataSource);
    }

    @Override
    protected DataSource determineTargetDataSource() {
        String key = (String) determineCurrentLookupKey();
        System.out.println("[WarehouseRoutingDS] Routing to database: " + key);
        return cache.computeIfAbsent(key, this::buildDataSource);
    }

    private DataSource buildDataSource(String dbName) {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(String.format(JDBC_TEMPLATE, dbName));
        ds.setUsername("root");
        ds.setPassword("root");
        ds.setDriverClassName("com.mysql.cj.jdbc.Driver");
        ds.setPoolName("pool-" + dbName);
        ds.setMaximumPoolSize(5);
        return ds;
    }
}
