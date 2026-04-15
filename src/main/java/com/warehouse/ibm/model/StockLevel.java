package com.warehouse.ibm.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Data
@Entity
@Table(name = "stock_level")
public class StockLevel {

    @EmbeddedId
    private StockLevelId id;

    private Integer quantity;

    @Column(name = "min_quantity")
    private Integer minQuantity;

    @Column(name = "below_min_date")
    private LocalDate belowMinDate;

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
