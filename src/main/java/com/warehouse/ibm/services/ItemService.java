package com.warehouse.ibm.services;

import com.warehouse.ibm.model.Category;
import com.warehouse.ibm.model.Item;
import com.warehouse.ibm.repositories.CategoryRepository;
import com.warehouse.ibm.repositories.ItemRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ItemService {

    private final ItemRepository repo;
    private final CategoryRepository categoryRepo;

    public ItemService(ItemRepository repo, CategoryRepository categoryRepo) {
        this.repo = repo;
        this.categoryRepo = categoryRepo;
    }

    public List<Item> getAll() {
        return repo.findAll();
    }

    public Item create(Item item) {
        if (repo.existsById(item.getItemId())) {
            throw new RuntimeException("Item ID already exists");
        }
        Integer categoryId = item.getCategory().getCategoryId();
        Category category = categoryRepo.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        item.setCategory(category);
        return repo.save(item);
    }
}
