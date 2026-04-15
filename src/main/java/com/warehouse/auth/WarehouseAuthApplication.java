package com.warehouse.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(
        scanBasePackages = {"com.warehouse.auth", "com.warehouse.ibm"},
        excludeName = {"org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration"}
)
@EnableScheduling
public class WarehouseAuthApplication {
    public static void main(String[] args) {
        SpringApplication.run(WarehouseAuthApplication.class, args);
    }
}

