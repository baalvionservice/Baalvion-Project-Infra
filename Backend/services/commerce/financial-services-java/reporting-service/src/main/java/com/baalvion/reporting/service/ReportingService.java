package com.baalvion.reporting.service;

import com.baalvion.reporting.domain.ReportJob;
import com.baalvion.reporting.domain.ReportJob.ReportFormat;
import com.baalvion.reporting.domain.ReportJob.ReportStatus;
import com.baalvion.reporting.dto.CreateReportRequest;
import com.baalvion.reporting.dto.ReportResponse;
import com.baalvion.reporting.repository.ReportJobRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@Transactional
public class ReportingService {

  private final ReportJobRepository repository;
  private final ReportGenerator reportGenerator;
  private final ObjectMapper objectMapper;

  public ReportingService(ReportJobRepository repository, ReportGenerator reportGenerator, ObjectMapper objectMapper) {
    this.repository = repository;
    this.reportGenerator = reportGenerator;
    this.objectMapper = objectMapper;
  }

  public record DownloadPayload(byte[] content, String contentType, String fileName) {}

  public ReportResponse submit(UUID tenantId, CreateReportRequest request) {
    var existing = repository.findByTenantAndRef(tenantId, request.getReportRef());
    if (existing.isPresent()) {
      log.info("Idempotent request: reportRef={} already exists for tenant={}", sanitizeForLog(request.getReportRef()), sanitizeForLog(String.valueOf(tenantId)));
      return mapToResponse(existing.get());
    }

    ReportFormat format = ReportFormat.valueOf(request.getFormat().toUpperCase());

    var job = ReportJob.builder()
      .tenantId(tenantId)
      .reportRef(request.getReportRef())
      .reportType(request.getReportType())
      .format(format)
      .status(ReportStatus.PENDING)
      .parameters(serializeParameters(request.getParameters()))
      .rowCount(0)
      .binaryContent(false)
      .requestedBy(request.getRequestedBy())
      .build();

    var saved = repository.save(job);
    log.info("Report job queued: id={}, tenant={}, ref={}, format={}", saved.getId(), sanitizeForLog(String.valueOf(tenantId)), sanitizeForLog(saved.getReportRef()), format);

    // Kick off generation only once the PENDING row is durably committed, so the
    // async worker is guaranteed to see it.
    final UUID jobId = saved.getId();
    final List<String> columns = request.getColumns();
    final List<Map<String, Object>> rows = request.getRows();
    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
      @Override
      public void afterCommit() {
        reportGenerator.generateAsync(jobId, tenantId, columns, rows, format);
      }
    });

    return mapToResponse(saved);
  }

  @Transactional(readOnly = true)
  public ReportResponse getReport(UUID tenantId, UUID id) {
    return mapToResponse(loadJob(tenantId, id));
  }

  @Transactional(readOnly = true)
  public Page<ReportResponse> listReports(UUID tenantId, String status, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<ReportJob> jobs = status != null
      ? repository.findByTenantAndStatus(tenantId, ReportStatus.valueOf(status), pageable)
      : repository.findByTenant(tenantId, pageable);
    return jobs.map(this::mapToResponse);
  }

  @Transactional(readOnly = true)
  public DownloadPayload download(UUID tenantId, UUID id) {
    var job = loadJob(tenantId, id);
    if (job.getStatus() != ReportStatus.COMPLETED || job.getContent() == null) {
      throw new IllegalStateException("Report not ready for download; status=" + job.getStatus());
    }
    byte[] bytes = job.isBinaryContent()
      ? Base64.getDecoder().decode(job.getContent())
      : job.getContent().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    return new DownloadPayload(bytes, job.getContentType(), job.getFileName());
  }

  private ReportJob loadJob(UUID tenantId, UUID id) {
    return repository.findByIdAndTenant(id, tenantId)
      .orElseThrow(() -> new IllegalArgumentException("Report job not found: " + id));
  }

  private String sanitizeForLog(String value) {
    if (value == null) {
      return null;
    }
    return value.replaceAll("[\r\n\t]", "_");
  }

  private String serializeParameters(Map<String, Object> parameters) {
    if (parameters == null || parameters.isEmpty()) {
      return "{}";
    }
    try {
      return objectMapper.writeValueAsString(parameters);
    } catch (Exception e) {
      return "{}";
    }
  }

  private ReportResponse mapToResponse(ReportJob j) {
    return ReportResponse.builder()
      .id(j.getId())
      .tenantId(j.getTenantId())
      .reportRef(j.getReportRef())
      .reportType(j.getReportType())
      .format(j.getFormat().name())
      .status(j.getStatus().name())
      .rowCount(j.getRowCount())
      .contentType(j.getContentType())
      .fileName(j.getFileName())
      .failureReason(j.getFailureReason())
      .requestedBy(j.getRequestedBy())
      .createdAt(j.getCreatedAt())
      .updatedAt(j.getUpdatedAt())
      .completedAt(j.getCompletedAt())
      .build();
  }
}
