package com.warehouse.ibm.controllers;

import com.warehouse.ibm.enums.OrderStatus;
import com.warehouse.ibm.model.Reorder;
import com.warehouse.ibm.services.ReorderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reorders")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class ReorderController {

    private final ReorderService service;

    public ReorderController(ReorderService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        try {
            return ResponseEntity.ok(service.getAllDTO());
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    @PostMapping("/manual")
    public ResponseEntity<?> manual(@RequestBody Reorder reorder) {
        try {
            return ResponseEntity.ok(service.createManualReorder(reorder));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Integer id,
                                          @RequestParam OrderStatus status) {
        try {
            service.updateStatusDTO(id, status);
            // Return the full refreshed list so the frontend can replace in one shot
            return ResponseEntity.ok(service.getAllDTO());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }
    }
}
