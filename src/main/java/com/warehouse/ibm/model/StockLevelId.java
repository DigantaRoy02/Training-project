package com.warehouse.ibm.model;

import jakarta.persistence.Embeddable;
import lombok.Data;

import java.io.Serializable;

@Data
@Embeddable
public class StockLevelId implements Serializable {
    private Integer itemId;
    private Integer binId;
}
