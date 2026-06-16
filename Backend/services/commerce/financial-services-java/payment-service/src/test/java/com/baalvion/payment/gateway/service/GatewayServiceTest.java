package com.baalvion.payment.gateway.service;

import com.baalvion.payment.gateway.domain.GatewayPayment;
import com.baalvion.payment.gateway.exception.WebhookAmountMismatchException;
import com.baalvion.payment.gateway.repository.GatewayPaymentRepository;
import com.baalvion.payment.gateway.repository.GatewayWebhookEventRepository;
import com.baalvion.payment.gateway.spi.GatewayStatus;
import com.baalvion.payment.gateway.spi.PaymentGateway;
import com.baalvion.payment.gateway.spi.ProviderConfig;
import com.baalvion.payment.gateway.spi.WebhookResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Guards for the gateway-checkout vertical:
 * <ul>
 *   <li>Tenant isolation (cross-tenant IDOR): get/capture/refund resolve a charge SCOPED to the
 *       caller's site ({@code findByIdAndWebsiteSlug}), never the inherited {@code findById}.</li>
 *   <li>Webhook hardening: persistent event dedup + strict amount validation before a
 *       money-positive status transition.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class GatewayServiceTest {

  @Mock private GatewayRegistry registry;
  @Mock private GatewayPaymentRepository repository;
  @Mock private GatewayWebhookEventRepository webhookEventRepository;
  @Mock private PspConfigResolver resolver;
  @Mock private PaymentGateway gateway;
  @Mock private ProviderConfig providerConfig;

  private static final UUID ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

  private GatewayService newService() {
    return new GatewayService(registry, repository, webhookEventRepository, resolver, new ObjectMapper(), true);
  }

  private static WebhookResult capturedEvent(String amountMinor) {
    return new WebhookResult("razorpay", "order_x", "evt_1", "payment.captured",
      GatewayStatus.CAPTURED, new BigDecimal(amountMinor), Map.of());
  }

  private static GatewayPayment charge(String amountMinor) {
    return GatewayPayment.builder()
      .id(ID).websiteSlug("site-a").provider("razorpay").providerRef("order_x")
      .status(GatewayStatus.CREATED).amount(new BigDecimal(amountMinor)).currency("INR")
      .idempotencyKey("idem-1").build();
  }

  // ---- Tenant isolation (cross-tenant IDOR) -------------------------------------------------

  @Test
  void getById_crossSite_throwsNotFound_andNeverUsesBareFindById() {
    GatewayService service = newService();
    when(repository.findByIdAndWebsiteSlug(ID, "site-b")).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.getById("site-b", ID))
      .isInstanceOf(IllegalArgumentException.class)
      .hasMessageContaining(ID.toString());

    verify(repository).findByIdAndWebsiteSlug(ID, "site-b");
    verify(repository, never()).findById(any());
  }

  @Test
  void getById_nullSite_resolvesToGlobalSlug() {
    GatewayService service = newService();
    when(repository.findByIdAndWebsiteSlug(ID, "__global__")).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.getById(null, ID)).isInstanceOf(IllegalArgumentException.class);

    verify(repository).findByIdAndWebsiteSlug(ID, "__global__");
  }

  @Test
  void capture_crossSite_throwsBeforeTouchingProvider() {
    GatewayService service = newService();
    when(repository.findByIdAndWebsiteSlug(ID, "site-b")).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.capture("site-b", ID)).isInstanceOf(IllegalArgumentException.class);

    verify(registry, never()).resolve(anyString());
    verify(repository, never()).findById(any());
  }

  @Test
  void refund_crossSite_throwsBeforeTouchingProvider() {
    GatewayService service = newService();
    when(repository.findByIdAndWebsiteSlug(ID, "site-b")).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.refund("site-b", ID, null)).isInstanceOf(IllegalArgumentException.class);

    verify(registry, never()).resolve(anyString());
    verify(repository, never()).findById(any());
  }

  // ---- Webhook dedup + amount validation ----------------------------------------------------

  @Test
  void applyWebhook_duplicateEvent_isIgnored_andNeverReappliesStatus() {
    GatewayService service = newService();
    when(registry.resolve("razorpay")).thenReturn(gateway);
    when(resolver.resolve("site-a", "razorpay")).thenReturn(providerConfig);
    when(gateway.verifyAndParseWebhook(any(), any(), any())).thenReturn(capturedEvent("100.0000"));
    when(webhookEventRepository.existsByWebsiteSlugAndProviderAndProviderEventId("site-a", "razorpay", "evt_1"))
      .thenReturn(true);

    service.applyWebhook("razorpay", new byte[0], Map.of(), "site-a");

    // Already processed: the charge is never re-resolved, re-applied, or re-recorded.
    verify(repository, never()).findByWebsiteSlugAndProviderAndProviderRef(anyString(), anyString(), anyString());
    verify(repository, never()).save(any());
    verify(webhookEventRepository, never()).save(any());
  }

  @Test
  void applyWebhook_capturedAmountMismatch_refusesTransition() {
    GatewayService service = newService();
    when(registry.resolve("razorpay")).thenReturn(gateway);
    when(resolver.resolve("site-a", "razorpay")).thenReturn(providerConfig);
    when(gateway.verifyAndParseWebhook(any(), any(), any())).thenReturn(capturedEvent("50.0000")); // event says 50
    when(webhookEventRepository.existsByWebsiteSlugAndProviderAndProviderEventId("site-a", "razorpay", "evt_1"))
      .thenReturn(false);
    when(repository.findByWebsiteSlugAndProviderAndProviderRef("site-a", "razorpay", "order_x"))
      .thenReturn(Optional.of(charge("100.0000"))); // charge is 100

    assertThatThrownBy(() -> service.applyWebhook("razorpay", new byte[0], Map.of(), "site-a"))
      .isInstanceOf(WebhookAmountMismatchException.class);

    // Refused: the charge is NOT marked paid and no event is recorded (tx would roll back).
    verify(repository, never()).save(any());
    verify(webhookEventRepository, never()).save(any());
  }

  @Test
  void applyWebhook_capturedAmountMatches_appliesAndRecordsEvent() {
    GatewayService service = newService();
    GatewayPayment payment = charge("100.0000");
    when(registry.resolve("razorpay")).thenReturn(gateway);
    when(resolver.resolve("site-a", "razorpay")).thenReturn(providerConfig);
    when(gateway.verifyAndParseWebhook(any(), any(), any())).thenReturn(capturedEvent("100.0000"));
    when(webhookEventRepository.existsByWebsiteSlugAndProviderAndProviderEventId("site-a", "razorpay", "evt_1"))
      .thenReturn(false);
    when(repository.findByWebsiteSlugAndProviderAndProviderRef("site-a", "razorpay", "order_x"))
      .thenReturn(Optional.of(payment));

    service.applyWebhook("razorpay", new byte[0], Map.of(), "site-a");

    verify(repository).save(eq(payment));
    verify(webhookEventRepository).save(any());
    org.assertj.core.api.Assertions.assertThat(payment.getStatus()).isEqualTo(GatewayStatus.CAPTURED);
  }
}
