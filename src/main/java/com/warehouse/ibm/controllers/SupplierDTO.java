package com.warehouse.ibm.controllers;

import java.util.List;

public class SupplierDTO {
    public Integer supplierId;
    public String supplierName;
    public String contactPerson;
    public String contactEmail;
    public String contactPhone;
    public String supplierCode;
    public String city;
    public String state;
    public String country;
    public String address;
    public String categoryName;
    public List<String> itemsSupplied;

    public SupplierDTO(Integer supplierId, String supplierName, String contactPerson,
                       String contactEmail, String contactPhone, String supplierCode,
                       String city, String state, String country, String address,
                       String categoryName, List<String> itemsSupplied) {
        this.supplierId = supplierId;
        this.supplierName = supplierName;
        this.contactPerson = contactPerson;
        this.contactEmail = contactEmail;
        this.contactPhone = contactPhone;
        this.supplierCode = supplierCode;
        this.city = city;
        this.state = state;
        this.country = country;
        this.address = address;
        this.categoryName = categoryName;
        this.itemsSupplied = itemsSupplied;
    }
}
