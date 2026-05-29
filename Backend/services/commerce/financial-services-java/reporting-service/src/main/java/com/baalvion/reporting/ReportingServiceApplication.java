package com.baalvion.reporting;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Reporting Service: Async report generation for Global Trade Infrastructure
 *
 * Accepts a dataset (columns + rows) and renders it to CSV, JSON or XLSX (Apache POI)
 * on a background thread. Each request becomes a report job that moves
 * PENDING -> PROCESSING -> COMPLETED/FAILED; the finished artifact is downloadable.
 * Tenant-isolated via PostgreSQL Row-Level Security.
 */
@SpringBootApplication
@EnableAsync
public class ReportingServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(ReportingServiceApplication.class, args);
  }

}
