package com.warehouse.ibm.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "stock_level")
public class StockLevel {

    @EmbeddedId
    private StockLevelId id;

    private Integer quantity;

    @Column(name = "low_stock_quantity")
    private Integer lowStockQuantity;

    @Column(name = "out_of_stock_quantity")
    private Integer outOfStockQuantity;

    @Column(name = "stock_status")
    private String stockStatus;

    @ManyToOne
    @MapsId("itemId")
    @JoinColumn(name = "item_id")
    private Item item;

    @ManyToOne
    @MapsId("binId")
    @JoinColumn(name = "bin_id")
    private Bin bin;
}
