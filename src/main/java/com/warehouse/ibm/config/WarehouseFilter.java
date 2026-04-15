package com.warehouse.ibm.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Reads the "X-Warehouse" request header and stores the value in
 * {@link WarehouseContext} so {@link WarehouseRoutingDataSource} can route
 * to the correct database for this request.
 *
 * The Angular frontend must include this header (set from the logged-in
 * owner's warehouseName) on every API call to this service.
 */
@Component
@Order(1)
public class WarehouseFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        // Let CORS preflight pass through without the header check
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        // Only apply X-Warehouse check to inventory endpoints (not /api/*)
        String path = req.getRequestURI();
        if (!path.startsWith("/api/")) {
            String warehouse = req.getHeader("X-Warehouse");

            if (warehouse == null || warehouse.isBlank()) {
                res.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                res.setContentType("application/json");
                res.getWriter().write("{\"error\":\"X-Warehouse header is required\"}");
                return;
            }

            try {
                WarehouseContext.set(warehouse);
                chain.doFilter(request, response);
            } finally {
                WarehouseContext.clear(); // always clean up the ThreadLocal
            }
        } else {
            chain.doFilter(request, response);
        }
    }
}
