package com.warehouse.ibm.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "supplier_items")
public class SupplierItem {

    @EmbeddedId
    private SupplierItemId id;

    @Column(name = "supplier_price")
    private BigDecimal supplierPrice;

    @Column(name = "lead_time_days")
    private Integer leadTimeDays;

    @ManyToOne
    @MapsId("supplierId")
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @ManyToOne
    @MapsId("itemId")
    @JoinColumn(name = "item_id")
    private Item item;
}
