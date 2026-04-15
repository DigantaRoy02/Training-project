package com.warehouse.ibm.model;

import jakarta.persistence.Embeddable;
import lombok.Data;

import java.io.Serializable;

@Data
@Embeddable
public class SupplierItemId implements Serializable {
    private Integer supplierId;
    private Integer itemId;
}
