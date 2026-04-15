package com.warehouse.ibm.services;

import com.warehouse.ibm.model.Bin;
import com.warehouse.ibm.repositories.BinRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BinService {

    private final BinRepository repo;

    public BinService(BinRepository repo) {
        this.repo = repo;
    }

    public List<Bin> getAll() {
        return repo.findAll();
    }

    public Bin create(Bin bin) {
        if (repo.existsById(bin.getBinId())) {
            throw new RuntimeException("Bin already allocated");
        }
        return repo.save(bin);
    }
}
