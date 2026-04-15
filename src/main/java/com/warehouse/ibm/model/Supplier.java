package com.warehouse.ibm.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

@Getter
@Setter
@ToString(exclude = {"reorders", "supplierItems"})
@Entity
@Table(name = "suppliers")
public class Supplier {

    @Id
    @Column(name = "supplier_id")
    private Integer supplierId;

    @Column(name = "supplier_name")
    private String supplierName;

    private String contactPhone;

    private String address;

    @Column(name = "supplier_code", unique = true)
    private String supplierCode;

    private String contactPerson;

    private String contactEmail;

    private String city;

    private String state;

    private String country;

    @ManyToOne
    @JoinColumn(name = "primary_category_id")
    private Category primaryCategory;

    @OneToMany(mappedBy = "supplier")
    @JsonIgnore
    private List<Reorder> reorders;

    @OneToMany(mappedBy = "supplier")
    @JsonIgnore
    private List<SupplierItem> supplierItems;
}
