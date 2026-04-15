package com.warehouse.ibm.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Data
@Entity
@Table(name = "bin")
public class Bin {

    @Id
    @Column(name = "bin_id")
    private Integer binId;

    @Column(name = "bin_code", unique = true)
    private String binCode;

    private String zone;
    private Integer capacity;
    private String aisle;
    private String rack;
    private String level;

    @OneToMany(mappedBy = "bin")
    @JsonIgnore
    private List<StockLevel> stockLevels;

    @OneToMany(mappedBy = "bin")
    @JsonIgnore
    private List<StockTransaction> transactions;
}
