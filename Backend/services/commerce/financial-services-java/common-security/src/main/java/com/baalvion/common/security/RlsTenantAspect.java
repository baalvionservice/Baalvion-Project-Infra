package com.baalvion.common.security;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;

/**
 * RLS RUNTIME ENFORCEMENT — trigger for {@link RlsTenantSession} (Tenant Isolation layer 3,
 * see {@code docs/TENANT_ISOLATION.md}).
 *
 * <p>This aspect wraps every Spring {@code @Transactional} method and, after entering it, asks
 * {@link RlsTenantSession} to push the request's tenant into the Postgres session GUC
 * {@code app.current_tenant_id} so the Row-Level-Security policies enforce.</p>
 *
 * <h2>INERT WITHOUT A NON-SUPERUSER DATASOURCE</h2>
 * Like {@link RlsTenantSession}, this is a security no-op unless the runtime datasource connects
 * as a non-superuser role (e.g. {@code baalvion_app}); Postgres bypasses RLS for superusers/owner.
 *
 * <h2>Ordering safety</h2>
 * The pointcut targets {@code @Transactional} so this advice is associated with Spring's
 * transaction advisor. We give it {@link Ordered#LOWEST_PRECEDENCE} so it tends to run
 * <em>inside</em> the transaction interceptor (lower precedence = more inner). Crucially, correct
 * behaviour does NOT rely on that ordering: {@link RlsTenantSession#applyToCurrentTransaction()}
 * hard-checks {@code isActualTransactionActive()} and no-ops if the transaction is not yet bound.
 * So even under adversarial advisor ordering this never sets the GUC on the wrong connection — at
 * worst the GUC is not set and the fail-closed RLS policy denies the query (which surfaces loudly
 * rather than leaking another tenant's data).
 *
 * <p>Matching {@code @Transactional} at both the method and the type level covers the common Spring
 * conventions (annotation on the service method or on the class).</p>
 */
@Aspect
@Order(Ordered.LOWEST_PRECEDENCE)
public class RlsTenantAspect {

  private final RlsTenantSession tenantSession;

  public RlsTenantAspect(RlsTenantSession tenantSession) {
    this.tenantSession = tenantSession;
  }

  // Matches methods annotated with @Transactional OR methods of a class annotated @Transactional.
  // REVIEW NOTE (AspectJ pointcut): both Spring and Jakarta @Transactional are covered.
  @Around(
      "@annotation(org.springframework.transaction.annotation.Transactional) "
          + "|| @within(org.springframework.transaction.annotation.Transactional) "
          + "|| @annotation(jakarta.transaction.Transactional) "
          + "|| @within(jakarta.transaction.Transactional)")
  public Object applyTenantInsideTransaction(ProceedingJoinPoint pjp) throws Throwable {
    // Apply the GUC now. If the transaction interceptor has already started the transaction
    // (the expected case for inner advice), this sets the tenant on its connection; otherwise it
    // safely no-ops (see RlsTenantSession).
    tenantSession.applyToCurrentTransaction();
    return pjp.proceed();
  }
}
