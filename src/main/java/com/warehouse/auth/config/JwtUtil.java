package com.warehouse.auth.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Component
public class JwtUtil {

    // In production, store this in application.properties or env variable
    private static final String SECRET = "warehouse-jwt-secret-key-must-be-at-least-256-bits-long!!";
    private static final long EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

    private final SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    /**
     * Generate a JWT token containing owner details as claims.
     */
    public String generateToken(Long ownerId, String username, String displayName,
                                String companyName, String warehouseName) {
        return Jwts.builder()
                .subject(username)
                .claims(Map.of(
                        "ownerId", ownerId,
                        "displayName", displayName,
                        "companyName", companyName,
                        "warehouseName", warehouseName
                ))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .signWith(key)
                .compact();
    }

    /**
     * Parse and validate the token. Returns claims if valid, throws exception if not.
     */
    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Check if a token is valid (not expired, correctly signed).
     */
    public boolean isValid(String token) {
        try {
            parseToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
