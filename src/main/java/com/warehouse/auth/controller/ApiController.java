package com.warehouse.auth.controller;

import com.warehouse.auth.config.JwtUtil;
import com.warehouse.auth.entity.Owner;
import com.warehouse.auth.service.AuthService;
import io.jsonwebtoken.Claims;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class ApiController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    public ApiController(AuthService authService, JwtUtil jwtUtil) {
        this.authService = authService;
        this.jwtUtil = jwtUtil;
    }

    /**
     * POST /api/login
     * Body: { "username": "...", "password": "..." }
     * Returns 200 with owner info + JWT token, or 401 on failure.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        Optional<Owner> ownerOpt = authService.authenticate(username, password);

        if (ownerOpt.isPresent()) {
            Owner owner = ownerOpt.get();
            String token = jwtUtil.generateToken(
                    owner.getOwnerId(),
                    owner.getUsername(),
                    owner.getDisplayName(),
                    owner.getCompanyName(),
                    owner.getWarehouseName()
            );
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "token", token,
                    "displayName", owner.getDisplayName(),
                    "companyName", owner.getCompanyName(),
                    "warehouseName", owner.getWarehouseName(),
                    "username", owner.getUsername(),
                    "ownerId", owner.getOwnerId()
            ));
        }

        return ResponseEntity.status(401)
                .body(Map.of("success", false, "message", "Invalid username or password"));
    }

    /**
     * GET /api/session
     * Validates the JWT token from Authorization header.
     * Returns user info if valid, 401 if not.
     */
    @GetMapping("/session")
    public ResponseEntity<?> getSession(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401)
                    .body(Map.of("success", false, "message", "Not authenticated"));
        }

        String token = authHeader.substring(7);
        if (!jwtUtil.isValid(token)) {
            return ResponseEntity.status(401)
                    .body(Map.of("success", false, "message", "Token expired or invalid"));
        }

        Claims claims = jwtUtil.parseToken(token);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "displayName", claims.get("displayName", String.class),
                "companyName", claims.get("companyName", String.class),
                "warehouseName", claims.get("warehouseName", String.class),
                "username", claims.getSubject(),
                "ownerId", claims.get("ownerId", Long.class)
        ));
    }

    /**
     * POST /api/logout
     * JWT is stateless — client just discards the token.
     * This endpoint exists for API consistency.
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("success", true, "message", "Logged out"));
    }
}
