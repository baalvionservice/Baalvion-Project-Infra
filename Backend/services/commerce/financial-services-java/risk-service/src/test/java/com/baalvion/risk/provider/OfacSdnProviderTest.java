package com.baalvion.risk.provider;

import com.baalvion.risk.config.SanctionsProperties;
import com.baalvion.risk.domain.SanctionedEntity.EntityType;
import com.baalvion.risk.domain.SanctionedEntity.ListSource;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for the OFAC SDN provider's CSV parse + join (no network): normalization into the
 * internal {id, name, aliases, country, program} schema, OFAC quoting, the {@code -0-} empty sentinel,
 * entity-type mapping, and compound-program splitting.
 */
class OfacSdnProviderTest {

  private final OfacSdnProvider provider = new OfacSdnProvider(new SanctionsProperties());

  // OFAC feeds are headerless. sdn: ent,name,type,program,...(12 cols). alt: ent,altnum,type,altname,rem.
  // add: ent,addnum,address,city,country,rem.
  private static final String SDN =
    "\"1001\",\"PUTIN, Vladimir\",\"individual\",\"RUSSIA-EO14024\",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"Born 1952\"\n" +
    "\"1002\",\"WAGNER GROUP\",\"entity\",\"RUSSIA-EO14024] [SDGT\",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"-0- \"\n" +
    "\"1003\",\"GRACE 1\",\"vessel\",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"-0- \",\"-0- \"\n";

  private static final String ALT =
    "\"1001\",\"1\",\"aka\",\"PUTIN, Vladimir Vladimirovich\",\"-0- \"\n" +
    "\"1002\",\"2\",\"aka\",\"PMC WAGNER\",\"-0- \"\n";

  private static final String ADD =
    "\"1001\",\"1\",\"-0- \",\"Moscow\",\"Russia\",\"-0- \"\n" +
    "\"1003\",\"1\",\"-0- \",\"-0- \",\"Iran\",\"-0- \"\n";

  @Test
  void parsesJoinsAndNormalizesOfacFeeds() {
    var records = provider.parse(SDN, ALT, ADD).stream()
      .collect(Collectors.toMap(SanctionsListRecord::getExternalId, Function.identity()));

    assertThat(records).hasSize(3);

    var putin = records.get("1001");
    assertThat(putin.getListSource()).isEqualTo(ListSource.OFAC_SDN);
    assertThat(putin.getEntityType()).isEqualTo(EntityType.INDIVIDUAL);
    assertThat(putin.getPrimaryName()).isEqualTo("PUTIN, Vladimir"); // quoted comma preserved
    assertThat(putin.getAliases()).contains("PUTIN, Vladimir Vladimirovich");
    assertThat(putin.getCountries()).contains("Russia");
    assertThat(putin.getPrograms()).containsExactly("RUSSIA-EO14024");

    var wagner = records.get("1002");
    assertThat(wagner.getEntityType()).isEqualTo(EntityType.ORGANIZATION);
    assertThat(wagner.getAliases()).contains("PMC WAGNER");
    assertThat(wagner.getPrograms()).containsExactlyInAnyOrder("RUSSIA-EO14024", "SDGT"); // compound split
    assertThat(wagner.getCountries()).isEmpty();

    var grace = records.get("1003");
    assertThat(grace.getEntityType()).isEqualTo(EntityType.VESSEL);
    assertThat(grace.getPrograms()).isEmpty();      // "-0-" sentinel -> no program
    assertThat(grace.getCountries()).contains("Iran");
    assertThat(grace.getAliases()).isEmpty();
  }

  @Test
  void csvHandlesQuotedCommasAndEmptySentinel() {
    List<List<String>> rows = SanctionsCsv.parse("\"a,b\",\"-0- \",\"c\"\n\"d\",\"e\"\n");
    assertThat(rows).hasSize(2);
    assertThat(rows.get(0).get(0)).isEqualTo("a,b"); // embedded comma inside quotes
    assertThat(rows.get(0).get(1)).isNull();          // -0- -> null
    assertThat(rows.get(1)).containsExactly("d", "e");
  }
}
