package com.warehouse.auth.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "owners")
public class Owner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "owner_id")
    private Long ownerId;

    @Column(name = "username", nullable = false, unique = true)
    private String username;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "warehouse_name")
    private String warehouseName;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "display_name")
    private String displayName;

    // ─── Constructors ─────────────────────────────────────────────────────────────

    public Owner() {}

    public Owner(Long ownerId, String username, String password,
                 String warehouseName, String companyName, String displayName) {
        this.ownerId = ownerId;
        this.username = username;
        this.password = password;
        this.warehouseName = warehouseName;
        this.companyName = companyName;
        this.displayName = displayName;
    }

    // ─── Getters & Setters ────────────────────────────────────────────────────────

    public Long getOwnerId()                 { return ownerId; }
    public void setOwnerId(Long ownerId)     { this.ownerId = ownerId; }

    public String getUsername()              { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword()              { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getWarehouseName()                   { return warehouseName; }
    public void setWarehouseName(String warehouseName) { this.warehouseName = warehouseName; }

    public String getCompanyName()                   { return companyName; }
    public void setCompanyName(String companyName)   { this.companyName = companyName; }

    public String getDisplayName()                   { return displayName; }
    public void setDisplayName(String displayName)   { this.displayName = displayName; }
}
