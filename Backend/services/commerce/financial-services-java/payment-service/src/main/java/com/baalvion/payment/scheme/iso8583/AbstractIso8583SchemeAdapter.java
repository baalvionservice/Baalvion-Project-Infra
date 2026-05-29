package com.baalvion.payment.scheme.iso8583;

import com.baalvion.payment.scheme.SchemeAdapter;
import com.baalvion.payment.scheme.SchemeRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Currency;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Base for ISO 8583 scheme adapters (Interswitch, NIP, …). Builds a real 0200 financial request
 * from the {@link SchemeRequest}, exchanges it over {@link Iso8583Client}, and parses the 0210
 * response: response code (field 39) "00" → approved (returns RRN, field 37); anything else
 * throws so the router's resilience layer applies.
 *
 * Concrete subclasses supply scheme identity, the configured endpoint/terminal identifiers, and
 * the processing code. PIN/MAC fields are added at certification time via the HSM seam.
 */
public abstract class AbstractIso8583SchemeAdapter implements SchemeAdapter {

  private static final Logger log = LoggerFactory.getLogger(AbstractIso8583SchemeAdapter.class);
  private static final DateTimeFormatter F7 = DateTimeFormatter.ofPattern("MMddHHmmss");
  private static final DateTimeFormatter F12 = DateTimeFormatter.ofPattern("HHmmss");
  private static final DateTimeFormatter F13 = DateTimeFormatter.ofPattern("MMdd");

  protected final Iso8583Codec codec;
  protected final Iso8583Client client;

  protected AbstractIso8583SchemeAdapter(Iso8583Codec codec, Iso8583Client client) {
    this.codec = codec;
    this.client = client;
  }

  protected abstract String host();
  protected abstract int port();
  protected abstract String processingCode();
  protected abstract String terminalId();
  protected abstract String merchantId();
  protected abstract String acquirerId();
  protected abstract int connectTimeoutMs();
  protected abstract int readTimeoutMs();

  @Override
  public String send(SchemeRequest request) {
    Iso8583Message msg = buildRequest(request);
    try {
      String raw = client.exchange(host(), port(), codec.pack(msg), connectTimeoutMs(), readTimeoutMs());
      Iso8583Message response = codec.unpack(raw);
      String responseCode = response.get(39);
      if (!"00".equals(responseCode)) {
        throw new SchemeDeclinedException(request.scheme().name(), responseCode);
      }
      String rrn = response.has(37) ? response.get(37).trim() : msg.get(37);
      log.info("Scheme {} approved: rrn={}, stan={}", request.scheme(), rrn, msg.get(11));
      return rrn;
    } catch (SchemeDeclinedException e) {
      throw e;
    } catch (Exception e) {
      throw new RuntimeException("ISO 8583 exchange failed for " + request.scheme() + ": " + e.getMessage(), e);
    }
  }

  protected Iso8583Message buildRequest(SchemeRequest request) {
    ZonedDateTime now = ZonedDateTime.now(ZoneOffset.UTC);
    Iso8583Message msg = new Iso8583Message("0200")
      .set(3, processingCode())
      .set(4, minorUnits(request))
      .set(7, now.format(F7))
      .set(11, stan())
      .set(12, now.format(F12))
      .set(13, now.format(F13))
      .set(32, acquirerId())
      .set(37, rrn())
      .set(41, terminalId())
      .set(42, merchantId())
      .set(49, numericCurrency(request.currency()));
    if (request.sourceAccountId() != null) {
      msg.set(102, request.sourceAccountId().toString().replace("-", "").substring(0, 28));
    }
    if (request.destinationAccountId() != null) {
      msg.set(103, request.destinationAccountId().toString().replace("-", "").substring(0, 28));
    }
    return msg;
  }

  /** Amount in minor units, 12-digit field 4 (assumes the currency's default fraction digits). */
  protected String minorUnits(SchemeRequest request) {
    int fraction = 2;
    try {
      fraction = Currency.getInstance(request.currency()).getDefaultFractionDigits();
    } catch (Exception ignored) {
      // default to 2 for unknown/test currencies
    }
    long minor = request.amount().movePointRight(Math.max(fraction, 0)).longValueExact();
    return String.format("%012d", minor);
  }

  protected String numericCurrency(String alpha) {
    try {
      return String.format("%03d", Currency.getInstance(alpha).getNumericCode());
    } catch (Exception e) {
      return "000";
    }
  }

  protected String stan() {
    return String.format("%06d", ThreadLocalRandom.current().nextInt(1_000_000));
  }

  protected String rrn() {
    return String.format("%012d", Math.abs(ThreadLocalRandom.current().nextLong() % 1_000_000_000_000L));
  }

  /** A scheme decline (non-"00" response code) — non-retryable in spirit, surfaced to the router. */
  public static class SchemeDeclinedException extends RuntimeException {
    public SchemeDeclinedException(String scheme, String responseCode) {
      super("Scheme " + scheme + " declined with response code " + responseCode);
    }
  }
}
