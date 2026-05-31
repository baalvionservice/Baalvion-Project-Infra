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
 * Live UN Security Council Consolidated List provider (XML). Parses {@code <INDIVIDUAL>} and
 * {@code <ENTITY>} records — names (FIRST/SECOND/THIRD/FOURTH name parts), aliases (ALIAS_NAME),
 * programs (UN_LIST_TYPE), nationality + address countries, and entity-type inference (INDIVIDUAL vs
 * ENTITY→ORGANIZATION). Active only when {@code app.sanctions.un.enabled=true}. Fetch is rate-limited
 * and retried; the parser is a pure, unit-tested seam (no network in tests).
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.sanctions.un.enabled", havingValue = "true")
public class UnSanctionsProvider implements SanctionsListProvider {

  private final SanctionsProperties props;
  private final RestClient http;

  private volatile List<SanctionsListRecord> cached;
  private volatile long lastFetchEpochMs;

  public UnSanctionsProvider(SanctionsProperties props) {
    this.props = props;
    SanctionsProperties.Un un = props.getUn();
    this.http = SanctionsHttp.client(un.getConnectTimeoutMs(), un.getReadTimeoutMs());
  }

  @Override
  public String name() {
    return "un";
  }

  @Override
  public synchronized List<SanctionsListRecord> fetch() {
    SanctionsProperties.Un un = props.getUn();
    long minIntervalMs = un.getMinRefreshIntervalMinutes() * 60_000L;
    if (cached != null && (System.currentTimeMillis() - lastFetchEpochMs) < minIntervalMs) {
      log.info("UN fetch throttled; serving {} cached records", cached.size());
      return cached;
    }
    String xml = SanctionsHttp.get(http, un.getUrl(), un.getMaxRetries(), un.getRetryBackoffMs(), "UN");
    List<SanctionsListRecord> records = parse(xml);
    this.cached = records;
    this.lastFetchEpochMs = System.currentTimeMillis();
    log.info("UN consolidated list fetched: {} entities ({}B)", records.size(), xml.length());
    return records;
  }

  /** Parse the UN consolidated XML. Package-private + pure for unit testing (no network). */
  List<SanctionsListRecord> parse(String xml) {
    Document doc = XmlNodes.parse(xml);
    List<SanctionsListRecord> records = new ArrayList<>();
    for (Element ind : XmlNodes.descendants(doc, "INDIVIDUAL")) {
      records.add(toRecord(ind, true));
    }
    for (Element ent : XmlNodes.descendants(doc, "ENTITY")) {
      records.add(toRecord(ent, false));
    }
    return records;
  }

  private SanctionsListRecord toRecord(Element el, boolean individual) {
    String dataId = firstNonNull(XmlNodes.childText(el, "DATAID"), XmlNodes.childText(el, "REFERENCE_NUMBER"));
    String name = individual ? joinNames(el) : XmlNodes.childText(el, "FIRST_NAME");

    String aliasTag = individual ? "INDIVIDUAL_ALIAS" : "ENTITY_ALIAS";
    List<String> aliases = new ArrayList<>();
    for (Element a : XmlNodes.children(el, aliasTag)) {
      String an = XmlNodes.childText(a, "ALIAS_NAME");
      if (an != null) {
        aliases.add(an);
      }
    }

    List<String> programs = new ArrayList<>();
    String listType = XmlNodes.childText(el, "UN_LIST_TYPE");
    if (listType != null) {
      programs.add(listType);
    }

    Set<String> countries = new LinkedHashSet<>();
    for (Element nat : XmlNodes.children(el, "NATIONALITY")) {
      String v = XmlNodes.childText(nat, "VALUE");
      if (v != null) {
        countries.add(v);
      }
    }
    String addrTag = individual ? "INDIVIDUAL_ADDRESS" : "ENTITY_ADDRESS";
    List<String> addresses = new ArrayList<>();
    for (Element addr : XmlNodes.children(el, addrTag)) {
      String country = XmlNodes.childText(addr, "COUNTRY");
      if (country != null) {
        countries.add(country);
      }
      String line = joinNonNull(" ",
        XmlNodes.childText(addr, "STREET"), XmlNodes.childText(addr, "CITY"),
        XmlNodes.childText(addr, "STATE_PROVINCE"), country);
      if (line != null && !line.isBlank()) {
        addresses.add(line);
      }
    }

    return SanctionsListRecord.builder()
      .listSource(ListSource.UN_CONSOLIDATED)
      .externalId(dataId)
      .entityType(individual ? EntityType.INDIVIDUAL : EntityType.ORGANIZATION)
      .primaryName(name)
      .aliases(aliases)
      .programs(programs)
      .countries(new ArrayList<>(countries))
      .addresses(addresses)
      .build();
  }

  private static String joinNames(Element el) {
    return joinNonNull(" ",
      XmlNodes.childText(el, "FIRST_NAME"), XmlNodes.childText(el, "SECOND_NAME"),
      XmlNodes.childText(el, "THIRD_NAME"), XmlNodes.childText(el, "FOURTH_NAME"));
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
