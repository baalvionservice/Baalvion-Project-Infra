package com.baalvion.common.security;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.UUID;

/**
 * RLS RUNTIME ENFORCEMENT — Tenant Isolation layer 3 (see {@code docs/TENANT_ISOLATION.md}).
 *
 * <p>This component pushes the request's tenant into the Postgres session GUC
 * {@code app.current_tenant_id} so the Row-Level-Security policies created by the Flyway
 * migrations (e.g. {@code USING (tenant_id = current_setting('app.current_tenant_id')::uuid)})
 * actually enforce. The tenant is taken EXCLUSIVELY from the validated JWT via
 * {@link AuthContext#currentTenantId()} (falling back to {@link TenantContext#SYSTEM_TENANT}
 * for unauthenticated dev requests); a client-supplied header is never trusted here.</p>
 *
 * <h2>INERT WITHOUT A NON-SUPERUSER DATASOURCE</h2>
 * This class is a NO-OP from a security standpoint unless the runtime datasource connects as a
 * <strong>non-superuser</strong> role (e.g. {@code baalvion_app}). Postgres bypasses RLS entirely
 * for superusers and for the table owner (unless {@code FORCE ROW LEVEL SECURITY} is set). Setting
 * the GUC alone does nothing until layer 3a (the user split) is also in place. Flyway must keep
 * running as the OWNER while the runtime connects as {@code baalvion_app}. See
 * {@code common-security/src/main/resources/rls/GRANTS_TEMPLATE.sql}.
 *
 * <h2>Why this mechanism avoids the @Transactional ordering footgun</h2>
 * An {@code @Around}/{@code @Order} AOP aspect that issues {@code set_config} can fire EITHER side
 * of Spring's {@code @Transactional} interceptor depending on advisor ordering — if it runs before
 * the transaction (and its connection) is bound, the GUC is set on the wrong/closed connection or
 * a different physical connection than the one the transaction later uses, so RLS sees no tenant.
 * Getting that ordering right is fragile and easy to regress.
 *
 * <p>Instead, the GUC is applied via {@link #applyToCurrentTransaction()}, which runs the
 * {@code set_config} <em>only when a real, synchronization-active transaction is already in
 * progress</em> (it checks {@link TransactionSynchronizationManager}, the same machinery Spring's
 * {@code @Transactional} interceptor uses). This guarantees the statement runs strictly INSIDE the
 * transactional boundary, on the connection that transaction has bound to the current thread —
 * regardless of which interceptor or advice ran first. The trigger is {@code RlsTenantAspect}
 * (registered in {@code BaalvionSecurityAutoConfiguration}): an aspect ordered to run
 * <em>inside</em> {@code @Transactional}. Because the method body above hard-checks
 * {@code isActualTransactionActive()}, it is correct <em>even if the aspect is mis-ordered to run
 * before the transaction starts</em> — in that case it simply no-ops rather than setting the GUC
 * on the wrong connection. The aspect re-invokes this method at every transactional entry point,
 * so the GUC is re-applied for nested/subsequent transactions on the same thread.</p>
 *
 * <p>The {@code true} (transaction-local) flag on {@code set_config} means the value is scoped to
 * the current transaction and is automatically cleared at commit/rollback, so it can never leak
 * across a pooled connection.</p>
 *
 * <p>Bound as a string parameter on purpose: {@code SET LOCAL app.x = $1} is a Postgres SYNTAX
 * ERROR (SET does not accept bind parameters), whereas {@code set_config(text, text, bool)} is a
 * normal function call that does.</p>
 */
public class RlsTenantSession {

  private static final Logger log = LoggerFactory.getLogger(RlsTenantSession.class);

  /** The Postgres session setting the RLS policies read via {@code current_setting(...)}. */
  static final String TENANT_GUC = "app.current_tenant_id";

  // REVIEW NOTE (Spring/JPA API): @PersistenceContext injects a container-managed, transaction-aware
  // proxy EntityManager — native queries issued through it run on the current transaction's
  // connection. This is the standard Jakarta way; an alternative would be constructor-injecting
  // EntityManagerFactory and creating EMs, but that would NOT share the transaction's connection.
  @PersistenceContext
  private EntityManager entityManager;

  /**
   * Idempotently set {@code app.current_tenant_id} on the current transaction's connection.
   *
   * <p>No-op (returns silently) when there is no active, synchronization-capable transaction or
   * when no {@link EntityManager} is available — RLS is only meaningful inside a transaction, and
   * we must never attempt a stray query outside one (it would open/leak a non-transactional
   * connection and the {@code true} transaction-local flag would have nothing to scope to).</p>
   */
  public void applyToCurrentTransaction() {
    if (entityManager == null) {
      return; // no JPA available — nothing to do
    }
    if (!TransactionSynchronizationManager.isSynchronizationActive()
        || !TransactionSynchronizationManager.isActualTransactionActive()) {
      // Not inside a real transaction yet: setting a transaction-local GUC here would be useless
      // (immediately discarded) and could run on a throwaway connection. We only act when the
      // transaction — and therefore its bound connection — already exists.
      return;
    }

    final UUID tenant = AuthContext.currentTenantId().orElse(TenantContext.SYSTEM_TENANT);
    setTenantGuc(tenant);

    // Each transactional entry point re-invokes this method via RlsTenantAspect, so the GUC is
    // re-applied for any further/nested transaction on the same thread — Spring's transaction-local
    // (`true`) scoping clears the previous value at the prior transaction's commit/rollback. No
    // extra TransactionSynchronization is needed to re-arm; the aspect is the single trigger.
  }

  private void setTenantGuc(UUID tenant) {
    try {
      // set_config(setting, value, is_local) — is_local=true => SET LOCAL semantics (txn-scoped).
      entityManager
          .createNativeQuery("SELECT set_config('" + TENANT_GUC + "', :t, true)")
          .setParameter("t", tenant.toString())
          .getSingleResult();
    } catch (RuntimeException ex) {
      // Fail loud in logs but do NOT swallow into a false sense of safety: if the GUC could not be
      // set, RLS policies that read it will (correctly) deny access, which is the fail-closed
      // outcome we want. Rethrow so the caller's transaction rolls back rather than running
      // queries with an unset/forged tenant.
      log.error("Failed to set RLS tenant GUC {} = {}", TENANT_GUC, tenant, ex);
      throw ex;
    }
  }
}
