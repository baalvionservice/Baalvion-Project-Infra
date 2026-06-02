package com.baalvion.fx.controller;

import com.baalvion.fx.dto.QuoteResponse;
import com.baalvion.fx.dto.RateResponse;
import com.baalvion.fx.service.FxRateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/** Public rate discovery + indicative quotes. */
@Slf4j
@RestController
@RequestMapping("/api/v1/fx/rates")
@RequiredArgsConstructor
public class FxRateController {

  private final FxRateService rateService;

  /** All supported pairs against {@code base} (default USD). */
  @GetMapping
  public ResponseEntity<List<RateResponse>> list(@RequestParam(defaultValue = "USD") String base) {
    return ResponseEntity.ok(rateService.listRates(base));
  }

  @GetMapping("/{base}/{quote}")
  public ResponseEntity<RateResponse> get(@PathVariable String base, @PathVariable String quote) {
    return ResponseEntity.ok(rateService.getRate(base, quote));
  }

  /** Indicative conversion quote (non-binding). For a firm price, create a rate-lock. */
  @GetMapping("/quote")
  public ResponseEntity<QuoteResponse> quote(
    @RequestParam String sell,
    @RequestParam String buy,
    @RequestParam BigDecimal amount
  ) {
    return ResponseEntity.ok(rateService.quote(sell, buy, amount));
  }
}
