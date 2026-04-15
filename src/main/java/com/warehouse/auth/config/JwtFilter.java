package com.warehouse.auth.config;

import io.jsonwebtoken.Claims;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * JWT authentication filter.
 * Runs before WarehouseFilter (Order 0 vs Order 1).
 * <p>
 * - For /api/login: passes through (no token required).
 * - For /api/session and /api/logout: the controller handles validation itself.
 * - For warehouse endpoints (non-/api/*): if the X-Warehouse header is missing
 *   but a valid JWT token is present, the filter extracts the warehouseName
 *   from the token and adds the header so WarehouseFilter can work.
 */
@Component
@Order(0)
public class JwtFilter implements Filter {

    private final JwtUtil jwtUtil;

    public JwtFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        // Let CORS preflight pass through
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        String path = req.getRequestURI();

        // /api/* endpoints handle their own auth, pass through
        if (path.startsWith("/api/")) {
            chain.doFilter(request, response);
            return;
        }

        // For warehouse endpoints: validate JWT token
        String authHeader = req.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (!jwtUtil.isValid(token)) {
                res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                res.setContentType("application/json");
                res.getWriter().write("{\"error\":\"Invalid or expired token\"}");
                return;
            }

            // If X-Warehouse header is missing, extract from JWT
            String warehouse = req.getHeader("X-Warehouse");
            if (warehouse == null || warehouse.isBlank()) {
                Claims claims = jwtUtil.parseToken(token);
                String warehouseName = claims.get("warehouseName", String.class);
                if (warehouseName != null && !warehouseName.isBlank()) {
                    // Wrap request to inject the X-Warehouse header
                    req = new WarehouseHeaderRequestWrapper(req, warehouseName);
                }
            }
        }

        chain.doFilter(req, response);
    }
}
