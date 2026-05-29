package com.baalvion.reporting.service;

import com.baalvion.reporting.domain.ReportJob;
import com.baalvion.reporting.domain.ReportJob.ReportFormat;
import com.baalvion.reporting.domain.ReportJob.ReportStatus;
import com.baalvion.reporting.repository.ReportJobRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Renders report jobs off the request thread. Kept in a separate bean so the
 * {@code @Async} proxy is honoured (self-invocation would run synchronously).
 */
@Slf4j
@Service
public class ReportGenerator {

  private final ReportJobRepository repository;
  private final ObjectMapper objectMapper;

  public ReportGenerator(ReportJobRepository repository, ObjectMapper objectMapper) {
    this.repository = repository;
    this.objectMapper = objectMapper;
  }

  @Async
  @Transactional
  public void generateAsync(UUID jobId, UUID tenantId, List<String> columns, List<Map<String, Object>> rows, ReportFormat format) {
    var job = repository.findByIdAndTenant(jobId, tenantId).orElse(null);
    if (job == null) {
      log.error("Report job vanished before generation: {}", jobId);
      return;
    }
    try {
      job.setStatus(ReportStatus.PROCESSING);
      repository.save(job);

      switch (format) {
        case CSV -> {
          job.setContent(renderCsv(columns, rows));
          job.setBinaryContent(false);
          job.setContentType("text/csv");
          job.setFileName(job.getReportRef() + ".csv");
        }
        case JSON -> {
          job.setContent(objectMapper.writeValueAsString(rows));
          job.setBinaryContent(false);
          job.setContentType("application/json");
          job.setFileName(job.getReportRef() + ".json");
        }
        case XLSX -> {
          job.setContent(renderXlsxBase64(job.getReportType(), columns, rows));
          job.setBinaryContent(true);
          job.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
          job.setFileName(job.getReportRef() + ".xlsx");
        }
      }

      job.setRowCount(rows.size());
      job.setStatus(ReportStatus.COMPLETED);
      job.setCompletedAt(LocalDateTime.now());
      repository.save(job);
      log.info("Report generated: id={}, tenant={}, format={}, rows={}", jobId, tenantId, format, rows.size());
    } catch (Exception e) {
      log.error("Report generation failed: id={}, tenant={}: {}", jobId, tenantId, e.getMessage());
      job.setStatus(ReportStatus.FAILED);
      job.setFailureReason(e.getMessage());
      job.setCompletedAt(LocalDateTime.now());
      repository.save(job);
    }
  }

  private String renderCsv(List<String> columns, List<Map<String, Object>> rows) {
    StringBuilder sb = new StringBuilder();
    sb.append(String.join(",", columns.stream().map(this::csvEscape).toList())).append("\r\n");
    for (Map<String, Object> row : rows) {
      for (int c = 0; c < columns.size(); c++) {
        if (c > 0) {
          sb.append(',');
        }
        Object value = row.get(columns.get(c));
        sb.append(csvEscape(value == null ? "" : value.toString()));
      }
      sb.append("\r\n");
    }
    return sb.toString();
  }

  private String csvEscape(String value) {
    if (value == null) {
      return "";
    }
    if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
      return "\"" + value.replace("\"", "\"\"") + "\"";
    }
    return value;
  }

  private String renderXlsxBase64(String sheetName, List<String> columns, List<Map<String, Object>> rows) throws Exception {
    try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
      Sheet sheet = workbook.createSheet(sheetName != null ? sheetName : "Report");

      Row header = sheet.createRow(0);
      for (int c = 0; c < columns.size(); c++) {
        header.createCell(c).setCellValue(columns.get(c));
      }

      int r = 1;
      for (Map<String, Object> row : rows) {
        Row sheetRow = sheet.createRow(r++);
        for (int c = 0; c < columns.size(); c++) {
          Object value = row.get(columns.get(c));
          sheetRow.createCell(c).setCellValue(value == null ? "" : value.toString());
        }
      }

      workbook.write(bos);
      return Base64.getEncoder().encodeToString(bos.toByteArray());
    }
  }
}
