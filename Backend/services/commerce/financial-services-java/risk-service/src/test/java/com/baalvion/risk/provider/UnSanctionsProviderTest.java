package com.baalvion.risk.provider;

import com.baalvion.risk.config.SanctionsProperties;
import com.baalvion.risk.domain.SanctionedEntity.EntityType;
import com.baalvion.risk.domain.SanctionedEntity.ListSource;
import org.junit.jupiter.api.Test;

import java.util.function.Function;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/** Unit tests for the UN consolidated-list XML parse (no network). */
class UnSanctionsProviderTest {

  private final UnSanctionsProvider provider = new UnSanctionsProvider(new SanctionsProperties());

  private static final String XML = """
    <CONSOLIDATED_LIST dateGenerated="2026-05-01T00:00:00">
      <INDIVIDUALS>
        <INDIVIDUAL>
          <DATAID>6908555</DATAID>
          <FIRST_NAME>Usama</FIRST_NAME><SECOND_NAME>Mohammed</SECOND_NAME><THIRD_NAME>Awad</THIRD_NAME>
          <UN_LIST_TYPE>Al-Qaida</UN_LIST_TYPE>
          <REFERENCE_NUMBER>QDi.001</REFERENCE_NUMBER>
          <NATIONALITY><VALUE>Saudi Arabia</VALUE></NATIONALITY>
          <INDIVIDUAL_ALIAS><QUALITY>Good</QUALITY><ALIAS_NAME>Osama bin Laden</ALIAS_NAME></INDIVIDUAL_ALIAS>
          <INDIVIDUAL_ADDRESS><CITY>Kandahar</CITY><COUNTRY>Afghanistan</COUNTRY></INDIVIDUAL_ADDRESS>
        </INDIVIDUAL>
      </INDIVIDUALS>
      <ENTITIES>
        <ENTITY>
          <DATAID>6908600</DATAID>
          <FIRST_NAME>AL QAIDA</FIRST_NAME>
          <UN_LIST_TYPE>Al-Qaida</UN_LIST_TYPE>
          <ENTITY_ALIAS><ALIAS_NAME>The Base</ALIAS_NAME></ENTITY_ALIAS>
          <ENTITY_ADDRESS><COUNTRY>Afghanistan</COUNTRY></ENTITY_ADDRESS>
        </ENTITY>
      </ENTITIES>
    </CONSOLIDATED_LIST>
    """;

  @Test
  void parsesIndividualsAndEntities() {
    var byId = provider.parse(XML).stream()
      .collect(Collectors.toMap(SanctionsListRecord::getExternalId, Function.identity()));

    assertThat(byId).hasSize(2);

    var ubl = byId.get("6908555");
    assertThat(ubl.getListSource()).isEqualTo(ListSource.UN_CONSOLIDATED);
    assertThat(ubl.getEntityType()).isEqualTo(EntityType.INDIVIDUAL);
    assertThat(ubl.getPrimaryName()).isEqualTo("Usama Mohammed Awad");  // name parts joined
    assertThat(ubl.getAliases()).contains("Osama bin Laden");
    assertThat(ubl.getPrograms()).containsExactly("Al-Qaida");
    assertThat(ubl.getCountries()).contains("Saudi Arabia", "Afghanistan"); // nationality + address
    assertThat(ubl.getAddresses()).anyMatch(a -> a.contains("Kandahar"));

    var org = byId.get("6908600");
    assertThat(org.getEntityType()).isEqualTo(EntityType.ORGANIZATION);
    assertThat(org.getPrimaryName()).isEqualTo("AL QAIDA");
    assertThat(org.getAliases()).contains("The Base");
    assertThat(org.getCountries()).contains("Afghanistan");
  }
}
