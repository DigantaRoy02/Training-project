package com.warehouse.ibm.model;

import com.warehouse.ibm.enums.OrderStatus;
import com.warehouse.ibm.enums.TriggerType;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Data
@Entity
@Table(name = "reorder")
public class Reorder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reorder_id")
    private Integer reorderId;

    @Column(name = "reorder_quantity")
    private Integer reorderQuantity;

    @Column(name = "reorder_date")
    private LocalDate reorderDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type")
    private TriggerType triggerType;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    @ManyToOne
    @JoinColumn(name = "item_id")
    private Item item;

    @ManyToOne
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;
}
