package com.baalvion.risk.provider;

import com.baalvion.risk.config.SanctionsProperties;
import com.baalvion.risk.domain.SanctionedEntity.EntityType;
import com.baalvion.risk.domain.SanctionedEntity.ListSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Live EU Consolidated Financial Sanctions List provider (FSD XML). Parses {@code <sanctionEntity>}
 * records — name + aliases ({@code nameAlias}), subject type ({@code subjectType@code}:
 * person→INDIVIDUAL, enterprise→ORGANIZATION), programmes ({@code regulation@programme}), and countries
 * ({@code address}/{@code citizenship}). Active only when {@code app.sanctions.eu.enabled=true}. Fetch
 * is rate-limited + retried; the parser is a pure, unit-tested, namespace-tolerant seam (no network in tests).
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.sanctions.eu.enabled", havingValue = "true")
public class EuSanctionsProvider implements SanctionsListProvider {

  private final SanctionsProperties props;
  private final RestClient http;

  private volatile List<SanctionsListRecord> cached;
  private volatile long lastFetchEpochMs;

  public EuSanctionsProvider(SanctionsProperties props) {
    this.props = props;
    SanctionsProperties.Eu eu = props.getEu();
    this.http = SanctionsHttp.client(eu.getConnectTimeoutMs(), eu.getReadTimeoutMs());
  }

  @Override
  public String name() {
    return "eu";
  }

  @Override
  public synchronized List<SanctionsListRecord> fetch() {
    SanctionsProperties.Eu eu = props.getEu();
    long minIntervalMs = eu.getMinRefreshIntervalMinutes() * 60_000L;
    if (cached != null && (System.currentTimeMillis() - lastFetchEpochMs) < minIntervalMs) {
      log.info("EU fetch throttled; serving {} cached records", cached.size());
      return cached;
    }
    String xml = SanctionsHttp.get(http, eu.getUrl(), eu.getMaxRetries(), eu.getRetryBackoffMs(), "EU");
    List<SanctionsListRecord> records = parse(xml);
    this.cached = records;
    this.lastFetchEpochMs = System.currentTimeMillis();
    log.info("EU consolidated list fetched: {} entities ({}B)", records.size(), xml.length());
    return records;
  }

  /** Parse the EU FSD XML. Package-private + pure for unit testing (no network). Namespace-tolerant. */
  List<SanctionsListRecord> parse(String xml) {
    Document doc = XmlNodes.parse(xml);
    List<SanctionsListRecord> records = new ArrayList<>();
    for (Element ent : XmlNodes.descendants(doc, "sanctionEntity")) {
      records.add(toRecord(ent));
    }
    return records;
  }

  private SanctionsListRecord toRecord(Element ent) {
    String externalId = firstNonNull(XmlNodes.attr(ent, "logicalId"), XmlNodes.attr(ent, "euReferenceNumber"));

    EntityType type = EntityType.OTHER;
    List<Element> subjectTypes = XmlNodes.children(ent, "subjectType");
    if (!subjectTypes.isEmpty()) {
      String code = XmlNodes.attr(subjectTypes.get(0), "code");
      if (code != null) {
        type = switch (code.toLowerCase()) {
          case "person" -> EntityType.INDIVIDUAL;
          case "enterprise" -> EntityType.ORGANIZATION;
          default -> EntityType.OTHER;
        };
      }
    }

    // First non-blank nameAlias = primary; the rest = aliases.
    String primary = null;
    List<String> aliases = new ArrayList<>();
    for (Element na : XmlNodes.children(ent, "nameAlias")) {
      String whole = aliasName(na);
      if (whole == null) {
        continue;
      }
      if (primary == null) {
        primary = whole;
      } else {
        aliases.add(whole);
      }
    }

    Set<String> programs = new LinkedHashSet<>();
    for (Element reg : XmlNodes.children(ent, "regulation")) {
      String prog = firstNonNull(XmlNodes.attr(reg, "programme"), XmlNodes.attr(reg, "regulationType"));
      if (prog != null) {
        programs.add(prog);
      }
    }

    Set<String> countries = new LinkedHashSet<>();
    List<String> addresses = new ArrayList<>();
    for (Element addr : XmlNodes.children(ent, "address")) {
      String country = firstNonNull(XmlNodes.attr(addr, "countryDescription"), XmlNodes.attr(addr, "countryIso2Code"));
      if (country != null && !"UNKNOWN".equalsIgnoreCase(country)) {
        countries.add(country);
      }
      String line = joinNonNull(" ", XmlNodes.attr(addr, "street"), XmlNodes.attr(addr, "city"), country);
      if (line != null && !line.isBlank()) {
        addresses.add(line);
      }
    }
    for (Element cit : XmlNodes.children(ent, "citizenship")) {
      String country = firstNonNull(XmlNodes.attr(cit, "countryDescription"), XmlNodes.attr(cit, "countryIso2Code"));
      if (country != null && !"UNKNOWN".equalsIgnoreCase(country)) {
        countries.add(country);
      }
    }

    return SanctionsListRecord.builder()
      .listSource(ListSource.EU_CFSP)
      .externalId(externalId)
      .entityType(type)
      .primaryName(primary)
      .aliases(aliases)
      .programs(new ArrayList<>(programs))
      .countries(new ArrayList<>(countries))
      .addresses(addresses)
      .build();
  }

  private static String aliasName(Element nameAlias) {
    String whole = XmlNodes.attr(nameAlias, "wholeName");
    if (whole != null) {
      return whole;
    }
    return joinNonNull(" ", XmlNodes.attr(nameAlias, "firstName"),
      XmlNodes.attr(nameAlias, "middleName"), XmlNodes.attr(nameAlias, "lastName"));
  }

  private static String joinNonNull(String sep, String... parts) {
    StringBuilder sb = new StringBuilder();
    for (String p : parts) {
      if (p != null && !p.isBlank()) {
        if (sb.length() > 0) sb.append(sep);
        sb.append(p.trim());
      }
    }
    return sb.length() == 0 ? null : sb.toString();
  }

  private static String firstNonNull(String a, String b) {
    return a != null ? a : b;
  }
}
