package com.warehouse.ibm.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Entity
@Table(name = "items")
public class Item {

    @Id
    @Column(name = "item_id")
    private Integer itemId;

    private String sku;

    @Column(name = "item_name")
    private String itemName;

    @Column(name = "unit_price")
    private BigDecimal unitPrice;

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @OneToMany(mappedBy = "item")
    @JsonIgnore
    private List<Reorder> reorders;

    @OneToMany(mappedBy = "item")
    @JsonIgnore
    private List<StockTransaction> transactions;

    @OneToMany(mappedBy = "item")
    @JsonIgnore
    private List<SupplierItem> supplierItems;

    @OneToMany(mappedBy = "item")
    @JsonIgnore
    private List<StockLevel> stockLevels;
}
