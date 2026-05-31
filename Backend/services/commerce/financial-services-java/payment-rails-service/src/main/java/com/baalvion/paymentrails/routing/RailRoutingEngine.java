package com.baalvion.paymentrails.routing;

import com.baalvion.paymentrails.config.PaymentRailsProperties;
import com.baalvion.paymentrails.domain.PaymentInstruction;
import com.baalvion.paymentrails.domain.PaymentInstruction.Rail;
import com.baalvion.paymentrails.domain.PaymentInstruction.Urgency;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Chooses the clearing rail for a payment by currency, creditor country, amount and urgency.
 * Domestic instant/low-cost rails are preferred for in-country payments under the high-value
 * threshold; cross-border or high-value payments fall back to SWIFT/wire. A caller may pin a
 * specific rail (requestedRail), which is honoured when it is plausible for the destination.
 */
@Component
@RequiredArgsConstructor
public class RailRoutingEngine {

  private final PaymentRailsProperties props;

  // Euro-area (SEPA) countries — abbreviated to the principal members for routing.
  private static final Set<String> SEPA = Set.of(
    "AT", "BE", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV", "LT", "LU",
    "MT", "NL", "PT", "SK", "SI", "ES", "HR");

  public record RoutingDecision(Rail rail, String note) {}

  public RoutingDecision choose(PaymentInstruction p) {
    String ccy = p.getCurrency() == null ? "" : p.getCurrency().toUpperCase();
    String country = p.getCreditorCountry() == null ? "" : p.getCreditorCountry().toUpperCase();
    boolean highValue = p.getAmount().compareTo(props.getHighValueThreshold()) >= 0;
    boolean instant = p.getUrgency() == Urgency.INSTANT;

    // Honour an explicit, plausible request.
    if (p.getRequestedRail() != null && isPlausible(p.getRequestedRail(), ccy, country, p)) {
      return new RoutingDecision(p.getRequestedRail(), "Honoured caller-requested rail " + p.getRequestedRail());
    }

    // EUR within SEPA: instant for small/urgent, otherwise SEPA credit transfer.
    if (ccy.equals("EUR") && SEPA.contains(country)) {
      return (instant && !highValue)
        ? new RoutingDecision(Rail.SEPA_INSTANT, "EUR to SEPA country, instant under high-value threshold")
        : new RoutingDecision(Rail.SEPA, "EUR to SEPA country");
    }
    // USD in the US: FedWire for high-value/priority, else ACH.
    if (ccy.equals("USD") && country.equals("US")) {
      return (highValue || p.getUrgency() == Urgency.PRIORITY)
        ? new RoutingDecision(Rail.FEDWIRE, "High-value/priority USD domestic")
        : new RoutingDecision(Rail.ACH, "USD domestic, standard value");
    }
    // INR in India: UPI under its ceiling, else SWIFT/wire.
    if (ccy.equals("INR") && country.equals("IN")) {
      return p.getAmount().compareTo(props.getUpiMaxAmount()) <= 0
        ? new RoutingDecision(Rail.UPI, "INR domestic within UPI ceiling")
        : new RoutingDecision(Rail.SWIFT, "INR domestic above UPI ceiling → wire");
    }
    if (ccy.equals("BRL") && country.equals("BR")) return new RoutingDecision(Rail.PIX, "BRL domestic instant (Pix)");
    if (ccy.equals("KES") && country.equals("KE")) return new RoutingDecision(Rail.MPESA, "KES domestic mobile money (M-Pesa)");
    if (ccy.equals("MXN") && country.equals("MX")) return new RoutingDecision(Rail.SPEI, "MXN domestic (SPEI)");
    if (ccy.equals("SGD") && country.equals("SG")) return new RoutingDecision(Rail.PAYNOW, "SGD domestic instant (PayNow)");
    if (ccy.equals("GBP") && country.equals("GB")) return new RoutingDecision(Rail.FPS, "GBP domestic (Faster Payments)");
    if (country.equals("CA") && ccy.equals("CAD"))  return new RoutingDecision(Rail.INTERAC, "CAD domestic (Interac)");

    // Everything else (cross-border or unsupported domestic) → SWIFT.
    return new RoutingDecision(Rail.SWIFT, "Cross-border or no domestic rail for " + ccy + "/" + country);
  }

  private boolean isPlausible(Rail rail, String ccy, String country, PaymentInstruction p) {
    return switch (rail) {
      case SEPA, SEPA_INSTANT -> ccy.equals("EUR") && SEPA.contains(country);
      case ACH, FEDWIRE -> ccy.equals("USD") && country.equals("US");
      case UPI -> ccy.equals("INR") && country.equals("IN") && p.getAmount().compareTo(props.getUpiMaxAmount()) <= 0;
      case PIX -> ccy.equals("BRL") && country.equals("BR");
      case MPESA -> ccy.equals("KES");
      case SPEI -> ccy.equals("MXN") && country.equals("MX");
      case PAYNOW -> country.equals("SG");
      case FPS -> ccy.equals("GBP") && country.equals("GB");
      case INTERAC -> country.equals("CA");
      case SWIFT -> true; // always plausible
    };
  }
}
