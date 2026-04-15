package com.warehouse.ibm;

import com.warehouse.ibm.model.StockLevel;
import com.warehouse.ibm.repositories.StockLevelRepository;
import com.warehouse.ibm.services.ReorderService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ReorderScheduler {

    private final StockLevelRepository stockRepo;
    private final ReorderService reorderService;

    public ReorderScheduler(StockLevelRepository stockRepo,
                            ReorderService reorderService) {
        this.stockRepo = stockRepo;
        this.reorderService = reorderService;
    }

    // Runs every day at midnight
    @Scheduled(cron = "0 0 0 * * *")
    public void checkStockLevels() {
        List<StockLevel> stocks = stockRepo.findAll();
        for (StockLevel stock : stocks) {
            reorderService.checkAutoReorder(stock);
        }
    }
}
