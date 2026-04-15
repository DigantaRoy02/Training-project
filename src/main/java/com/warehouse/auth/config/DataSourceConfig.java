package com.warehouse.auth.config;

import com.warehouse.ibm.config.WarehouseRoutingDataSource;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

@Configuration
public class DataSourceConfig {

    // ─── Credentials DataSource (auth / JPA) ─────────────────────────────────────

    @Value("${spring.datasource.credentials.url}")
    private String credentialsUrl;

    @Value("${spring.datasource.credentials.username}")
    private String credentialsUser;

    @Value("${spring.datasource.credentials.password}")
    private String credentialsPassword;

    @Value("${spring.datasource.credentials.driver-class-name}")
    private String credentialsDriver;

    // ─── Default warehouse DB (used as fallback by routing datasource) ────────────

    @Value("${warehouse.default-db:inventorybinmanagement}")
    private String defaultWarehouse;

    /**
     * Primary datasource used by JPA/Hibernate (credentials DB).
     * The Owner entity is mapped to this datasource.
     */
    @Primary
    @Bean(name = "credentialsDataSource")
    public DataSource credentialsDataSource() {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(credentialsUrl);
        ds.setUsername(credentialsUser);
        ds.setPassword(credentialsPassword);
        ds.setDriverClassName(credentialsDriver);
        ds.setPoolName("CredentialsPool");
        return ds;
    }

    /**
     * Dynamic routing datasource for inventory (IBM) entities.
     * Routes each request to the correct warehouse DB via the X-Warehouse header.
     */
    @Bean(name = "warehouseRoutingDataSource")
    public DataSource warehouseRoutingDataSource() {
        return new WarehouseRoutingDataSource(defaultWarehouse);
    }
}
