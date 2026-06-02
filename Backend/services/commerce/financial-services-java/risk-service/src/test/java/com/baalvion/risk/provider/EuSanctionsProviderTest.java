package com.baalvion.risk.provider;

import com.baalvion.risk.config.SanctionsProperties;
import com.baalvion.risk.domain.SanctionedEntity.EntityType;
import com.baalvion.risk.domain.SanctionedEntity.ListSource;
import org.junit.jupiter.api.Test;

import java.util.function.Function;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/** Unit tests for the EU FSD XML parse (no network), incl. namespace tolerance. */
class EuSanctionsProviderTest {

  private final EuSanctionsProvider provider = new EuSanctionsProvider(new SanctionsProperties());

  // Default-namespaced document to exercise the namespace-tolerant parser.
  private static final String XML = """
    <export xmlns="http://eu.europa.ec/fpi/fsd/export">
      <sanctionEntity logicalId="13" euReferenceNumber="EU.27.28">
        <subjectType code="person"/>
        <regulation programme="UKR"/>
        <nameAlias wholeName="Vladimir Putin" firstName="Vladimir" lastName="Putin"/>
        <nameAlias wholeName="Vladimir Vladimirovich Putin"/>
        <address countryDescription="RUSSIA" countryIso2Code="RU" city="Moscow"/>
        <citizenship countryIso2Code="RU"/>
      </sanctionEntity>
      <sanctionEntity logicalId="99">
        <subjectType code="enterprise"/>
        <regulation programme="SYR"/>
        <nameAlias wholeName="Acme Trading LLC"/>
      </sanctionEntity>
    </export>
    """;

  @Test
  void parsesPersonsAndEnterprises() {
    var byId = provider.parse(XML).stream()
      .collect(Collectors.toMap(SanctionsListRecord::getExternalId, Function.identity()));

    assertThat(byId).hasSize(2);

    var putin = byId.get("13");
    assertThat(putin.getListSource()).isEqualTo(ListSource.EU_CFSP);
    assertThat(putin.getEntityType()).isEqualTo(EntityType.INDIVIDUAL);
    assertThat(putin.getPrimaryName()).isEqualTo("Vladimir Putin");   // first nameAlias = primary
    assertThat(putin.getAliases()).contains("Vladimir Vladimirovich Putin");
    assertThat(putin.getPrograms()).containsExactly("UKR");
    assertThat(putin.getCountries()).contains("RUSSIA");
    assertThat(putin.getAddresses()).anyMatch(a -> a.contains("Moscow"));

    var acme = byId.get("99");
    assertThat(acme.getEntityType()).isEqualTo(EntityType.ORGANIZATION);
    assertThat(acme.getPrimaryName()).isEqualTo("Acme Trading LLC");
    assertThat(acme.getPrograms()).containsExactly("SYR");
  }
}
