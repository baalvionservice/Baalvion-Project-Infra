package com.app.payment.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @GetMapping("/health")
    public Map<String, String> health() {
        return Collections.singletonMap("status", "PAYMENT_SERVICE_OPERATIONAL");
    }

    @PostMapping("/process")
    public Map<String, Object> process(@RequestBody Map<String, Object> payload) {
        Map<String, Object> response = new HashMap<>();
        response.put("transactionId", "TX_" + UUID.randomUUID().toString());
        response.put("status", "SUCCESS");
        response.put("timestamp", System.currentTimeMillis());
        return response;
    }
}