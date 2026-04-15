package com.warehouse.ibm.services;

import com.warehouse.ibm.controllers.SupplierDTO;
import com.warehouse.ibm.model.Category;
import com.warehouse.ibm.model.Supplier;
import com.warehouse.ibm.repositories.CategoryRepository;
import com.warehouse.ibm.repositories.SupplierRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class SupplierService {

    private final SupplierRepository repo;
    private final CategoryRepository categoryRepo;

    @PersistenceContext(unitName = "warehouse")
    private EntityManager em;

    public SupplierService(SupplierRepository repo, CategoryRepository categoryRepo) {
        this.repo = repo;
        this.categoryRepo = categoryRepo;
    }

    @Transactional(value = "warehouseTransactionManager", readOnly = true)
    @SuppressWarnings("unchecked")
    public List<SupplierDTO> getAll() {
        String sql = "SELECT s.supplier_id, s.supplier_name, s.contact_person, " +
                     "s.contact_email, s.contact_phone, s.supplier_code, " +
                     "s.city, s.state, s.country, s.address, " +
                     "COALESCE(c.category_name, '') AS category_name " +
                     "FROM suppliers s " +
                     "LEFT JOIN categories c ON s.primary_category_id = c.category_id";

        Query query = em.createNativeQuery(sql);
        List<Object[]> rows = query.getResultList();

        List<SupplierDTO> result = new ArrayList<>();
        for (Object[] row : rows) {
            result.add(new SupplierDTO(
                    row[0] != null ? ((Number) row[0]).intValue() : null,
                    str(row[1]),
                    str(row[2]),
                    str(row[3]),
                    str(row[4]),
                    str(row[5]),
                    str(row[6]),
                    str(row[7]),
                    str(row[8]),
                    str(row[9]),
                    str(row[10]),
                    List.of()
            ));
        }
        return result;
    }

    private String str(Object o) {
        return o != null ? o.toString() : "";
    }

    public Supplier create(Supplier supplier) {
        if (repo.existsById(supplier.getSupplierId())) {
            throw new RuntimeException("supplier already exists");
        }
        Integer categoryId = supplier.getPrimaryCategory().getCategoryId();
        Category category = categoryRepo.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        supplier.setPrimaryCategory(category);
        return repo.save(supplier);
    }
}