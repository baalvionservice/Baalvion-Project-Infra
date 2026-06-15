package com.baalvion.payment.gateway.service;

import com.baalvion.payment.gateway.repository.GatewayPaymentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tenant-isolation (cross-tenant IDOR) guard for the gateway-checkout vertical.
 *
 * <p>get/capture/refund must resolve a charge SCOPED to the caller's site
 * ({@code findByIdAndWebsiteSlug}) — never the inherited {@code findById}, which would let a caller
 * for site A read/capture/refund a charge owned by site B.
 */
@ExtendWith(MockitoExtension.class)
class GatewayServiceTest {

  @Mock private GatewayRegistry registry;
  @Mock private GatewayPaymentRepository repository;
  @Mock private PspConfigResolver resolver;

  private static final UUID ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

  private GatewayService newService() {
    return new GatewayService(registry, repository, resolver, new ObjectMapper());
  }

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
}
