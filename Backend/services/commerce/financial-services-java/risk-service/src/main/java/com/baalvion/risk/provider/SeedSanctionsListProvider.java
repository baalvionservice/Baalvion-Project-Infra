package com.baalvion.risk.provider;

import com.baalvion.risk.domain.SanctionedEntity.EntityType;
import com.baalvion.risk.domain.SanctionedEntity.ListSource;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Default, self-contained watchlist source: a small curated set of entries drawn from the public
 * OFAC SDN and UN consolidated lists, with aliases, so sanctions screening is fully functional with
 * no network access or credentials. Swap to a live downloader by setting
 * {@code app.sanctions.provider} (e.g. {@code ofac}) and providing that provider bean.
 *
 * <p>This is a representative seed for development and tests — NOT a complete list. Production must
 * refresh from the authoritative sources on a schedule.
 */
@Component
@ConditionalOnProperty(name = "app.sanctions.provider", havingValue = "seed", matchIfMissing = true)
public class SeedSanctionsListProvider implements SanctionsListProvider {

  @Override
  public String name() {
    return "seed";
  }

  @Override
  public List<SanctionsListRecord> fetch() {
    return List.of(
      // ----- Individuals (OFAC SDN / UN) -----
      SanctionsListRecord.builder()
        .listSource(ListSource.UN_CONSOLIDATED).externalId("SEED-IND-0001")
        .entityType(EntityType.INDIVIDUAL).primaryName("Osama bin Laden")
        .aliases(List.of("Usama bin Ladin", "Usama bin Muhammad bin Awad bin Ladin", "Abu Abdallah"))
        .programs(List.of("AL-QAIDA")).countries(List.of("Saudi Arabia"))
        .dateOfBirth("1957").remarks("UN 1267 sanctions list (deceased; retained for screening tests).")
        .build(),
      SanctionsListRecord.builder()
        .listSource(ListSource.OFAC_SDN).externalId("SEED-IND-0002")
        .entityType(EntityType.INDIVIDUAL).primaryName("Ayman al-Zawahiri")
        .aliases(List.of("Aiman Muhammad Rabi al-Zawahiri", "Abu Muhammad", "The Doctor"))
        .programs(List.of("SDGT")).countries(List.of("Egypt")).dateOfBirth("1951-06-19")
        .build(),
      SanctionsListRecord.builder()
        .listSource(ListSource.OFAC_SDN).externalId("SEED-IND-0003")
        .entityType(EntityType.INDIVIDUAL).primaryName("Viktor Bout")
        .aliases(List.of("Victor But", "Viktor Anatolyevich Bout", "Boris"))
        .programs(List.of("MERCHANT-OF-DEATH")).countries(List.of("Russia")).dateOfBirth("1967-01-13")
        .build(),
      SanctionsListRecord.builder()
        .listSource(ListSource.OFAC_SDN).externalId("SEED-IND-0004")
        .entityType(EntityType.INDIVIDUAL).primaryName("Joaquin Guzman Loera")
        .aliases(List.of("El Chapo", "Joaquin Archivaldo Guzman Loera", "El Rapido"))
        .programs(List.of("SDNTK")).countries(List.of("Mexico")).dateOfBirth("1957-04-04")
        .build(),

      // ----- Organizations -----
      SanctionsListRecord.builder()
        .listSource(ListSource.OFAC_SDN).externalId("SEED-ORG-0001")
        .entityType(EntityType.ORGANIZATION).primaryName("Islamic Revolutionary Guard Corps")
        .aliases(List.of("IRGC", "Army of the Guardians of the Islamic Revolution", "Pasdaran"))
        .programs(List.of("IRAN", "SDGT")).countries(List.of("Iran"))
        .build(),
      SanctionsListRecord.builder()
        .listSource(ListSource.EU_CFSP).externalId("SEED-ORG-0002")
        .entityType(EntityType.ORGANIZATION).primaryName("Wagner Group")
        .aliases(List.of("PMC Wagner", "ChVK Wagner", "Liga"))
        .programs(List.of("RUSSIA")).countries(List.of("Russia"))
        .build(),
      SanctionsListRecord.builder()
        .listSource(ListSource.OFAC_SDN).externalId("SEED-ORG-0003")
        .entityType(EntityType.ORGANIZATION).primaryName("Bank Melli Iran")
        .aliases(List.of("Bank Melli", "National Bank of Iran", "Melli Bank"))
        .programs(List.of("IRAN", "IFSR")).countries(List.of("Iran"))
        .build(),
      SanctionsListRecord.builder()
        .listSource(ListSource.UK_HMT).externalId("SEED-ORG-0004")
        .entityType(EntityType.ORGANIZATION).primaryName("Tornado Cash")
        .aliases(List.of("Tornado.Cash"))
        .programs(List.of("CYBER")).countries(List.of("Unknown"))
        .remarks("Sanctioned mixing service.")
        .build(),

      // ----- Vessel -----
      SanctionsListRecord.builder()
        .listSource(ListSource.OFAC_SDN).externalId("SEED-VES-0001")
        .entityType(EntityType.VESSEL).primaryName("Grace 1")
        .aliases(List.of("Adrian Darya 1", "Adrian Darya"))
        .programs(List.of("IRAN")).countries(List.of("Iran"))
        .remarks("Crude oil tanker.")
        .build()
    );
  }
}
