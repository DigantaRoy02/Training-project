package com.warehouse.ibm.services;

import com.warehouse.ibm.model.Bin;
import com.warehouse.ibm.model.Item;
import com.warehouse.ibm.model.StockLevel;
import com.warehouse.ibm.model.StockLevelId;
import com.warehouse.ibm.repositories.BinRepository;
import com.warehouse.ibm.repositories.ItemRepository;
import com.warehouse.ibm.repositories.StockLevelRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StockLevelService {

    private final StockLevelRepository repo;
    private final ItemRepository itemRepo;
    private final BinRepository binRepo;

    public StockLevelService(StockLevelRepository repo,
                             ItemRepository itemRepo,
                             BinRepository binRepo) {
        this.repo = repo;
        this.itemRepo = itemRepo;
        this.binRepo = binRepo;
    }

    public List<StockLevel> getAll() {
        return repo.findAll();
    }

    public StockLevel create(StockLevel stockLevel) {
        Integer itemId = stockLevel.getItem().getItemId();
        Integer binId = stockLevel.getBin().getBinId();

        Item item = itemRepo.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        Bin bin = binRepo.findById(binId)
                .orElseThrow(() -> new RuntimeException("Bin not found"));

        stockLevel.setItem(item);
        stockLevel.setBin(bin);

        StockLevelId id = new StockLevelId();
        id.setBinId(binId);
        id.setItemId(itemId);
        stockLevel.setId(id);

        return repo.save(stockLevel);
    }
}
