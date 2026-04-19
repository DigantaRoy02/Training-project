package com.warehouse.ibm.services;

import com.warehouse.ibm.enums.TransactionType;
import com.warehouse.ibm.model.*;
import com.warehouse.ibm.repositories.BinRepository;
import com.warehouse.ibm.repositories.ItemRepository;
import com.warehouse.ibm.repositories.StockLevelRepository;
import com.warehouse.ibm.repositories.StockTransactionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class StockTransactionService {

    private final StockTransactionRepository repo;
    private final StockLevelRepository stockRepo;
    private final ItemRepository itemRepo;
    private final BinRepository binRepo;

    public StockTransactionService(StockTransactionRepository repo,
                                   StockLevelRepository stockRepo,
                                   ItemRepository itemRepo,
                                   BinRepository binRepo) {
        this.repo = repo;
        this.stockRepo = stockRepo;
        this.itemRepo = itemRepo;
        this.binRepo = binRepo;
    }

    public StockTransaction create(StockTransaction tx) {
        tx.setTransactionDate(LocalDate.now());
        Integer itemId = tx.getItem().getItemId();
        Integer binId = tx.getBin().getBinId();

        Item item = itemRepo.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        Bin bin = binRepo.findById(binId)
                .orElseThrow(() -> new RuntimeException("Bin not found"));

        tx.setItem(item);
        tx.setBin(bin);

        StockLevelId id = new StockLevelId();
        id.setItemId(itemId);
        id.setBinId(binId);

        StockLevel stockLevel = stockRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Stock not found"));

        if (tx.getTransactionType() == TransactionType.IN) {
            stockLevel.setQuantity(stockLevel.getQuantity() + tx.getQuantity());
        } else {
            stockLevel.setQuantity(stockLevel.getQuantity() - tx.getQuantity());
        }

        int qty = stockLevel.getQuantity();
        int outQty = stockLevel.getOutOfStockQuantity() != null ? stockLevel.getOutOfStockQuantity() : 0;
        int lowQty = stockLevel.getLowStockQuantity() != null ? stockLevel.getLowStockQuantity() : 0;

        if (qty <= outQty) {
            stockLevel.setStockStatus("OUT_OF_STOCK");
        } else if (qty <= lowQty) {
            stockLevel.setStockStatus("LOW_STOCK");
        } else {
            stockLevel.setStockStatus("HEALTHY");
        }

        stockRepo.save(stockLevel);
        return repo.save(tx);
    }
}
