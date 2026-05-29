package com.baalvion.payment.scheme.iso8583;

import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Production ISO 8583 codec (ASCII variant, hex bitmap) — pack/unpack of MTI + primary/secondary
 * bitmap + FIXED / LLVAR / LLLVAR data elements (design §3 scheme integration).
 *
 * ASCII conventions used (common for Interswitch/Postilion ASCII links):
 *   - MTI: 4 ASCII digits
 *   - bitmap: 16 hex chars per 64-bit map (primary, then secondary when field 1 is set)
 *   - FIXED numeric fields are left-padded with '0'; FIXED alpha fields right-padded with ' '
 *   - LLVAR/LLLVAR carry a 2-/3-digit ASCII length prefix
 *
 * MAC/PIN-block fields are intentionally out of scope here (they require the scheme's HSM/keys);
 * a {@code MacProvider} hook is the seam for that during certification.
 */
@Component
public class Iso8583Codec {

  private final Map<Integer, FieldDefinition> registry;

  public Iso8583Codec() {
    this.registry = defaultRegistry();
  }

  public Iso8583Codec(Map<Integer, FieldDefinition> registry) {
    this.registry = registry;
  }

  /** Common data elements for financial request/response (0200/0210) over ASCII links. */
  public static Map<Integer, FieldDefinition> defaultRegistry() {
    Map<Integer, FieldDefinition> r = new LinkedHashMap<>();
    r.put(2, FieldDefinition.llvar(2, 19, true));      // PAN
    r.put(3, FieldDefinition.fixed(3, 6, true));       // Processing code
    r.put(4, FieldDefinition.fixed(4, 12, true));      // Amount, transaction (minor units)
    r.put(7, FieldDefinition.fixed(7, 10, true));      // Transmission date & time MMDDhhmmss
    r.put(11, FieldDefinition.fixed(11, 6, true));     // STAN
    r.put(12, FieldDefinition.fixed(12, 6, true));     // Local transaction time hhmmss
    r.put(13, FieldDefinition.fixed(13, 4, true));     // Local transaction date MMDD
    r.put(18, FieldDefinition.fixed(18, 4, true));     // Merchant category code
    r.put(32, FieldDefinition.llvar(32, 11, true));    // Acquiring institution id
    r.put(37, FieldDefinition.fixed(37, 12, false));   // Retrieval reference number
    r.put(39, FieldDefinition.fixed(39, 2, false));    // Response code
    r.put(41, FieldDefinition.fixed(41, 8, false));    // Card acceptor terminal id
    r.put(42, FieldDefinition.fixed(42, 15, false));   // Card acceptor id
    r.put(43, FieldDefinition.fixed(43, 40, false));   // Card acceptor name/location
    r.put(49, FieldDefinition.fixed(49, 3, true));     // Currency code, transaction
    r.put(102, FieldDefinition.llvar(102, 28, false)); // Account identification 1
    r.put(103, FieldDefinition.llvar(103, 28, false)); // Account identification 2
    return r;
  }

  // ---- pack ----

  public String pack(Iso8583Message message) {
    if (message.getMti() == null || message.getMti().length() != 4) {
      throw new IllegalArgumentException("MTI must be 4 digits");
    }
    Map<Integer, String> fields = message.fields();
    boolean secondary = fields.keySet().stream().anyMatch(f -> f > 64);

    boolean[] bits = new boolean[129];
    if (secondary) {
      bits[1] = true;
    }
    for (int f : fields.keySet()) {
      bits[f] = true;
    }

    StringBuilder sb = new StringBuilder();
    sb.append(message.getMti());
    sb.append(bitsToHex(bits, 1, 64));
    if (secondary) {
      sb.append(bitsToHex(bits, 65, 128));
    }
    for (Map.Entry<Integer, String> e : fields.entrySet()) {
      sb.append(encodeField(e.getKey(), e.getValue()));
    }
    return sb.toString();
  }

  private String encodeField(int field, String value) {
    FieldDefinition def = def(field);
    if (value == null) {
      value = "";
    }
    switch (def.lengthType()) {
      case FIXED -> {
        if (value.length() > def.maxLength()) {
          throw new IllegalArgumentException("Field " + field + " exceeds fixed length " + def.maxLength());
        }
        return pad(value, def.maxLength(), def.numeric());
      }
      case LLVAR -> {
        require(value.length() <= def.maxLength(), field, def.maxLength());
        return String.format("%02d", value.length()) + value;
      }
      case LLLVAR -> {
        require(value.length() <= def.maxLength(), field, def.maxLength());
        return String.format("%03d", value.length()) + value;
      }
      default -> throw new IllegalStateException("Unsupported length type");
    }
  }

  // ---- unpack ----

  public Iso8583Message unpack(String raw) {
    if (raw == null || raw.length() < 20) {
      throw new IllegalArgumentException("Message too short to be ISO 8583");
    }
    int pos = 0;
    Iso8583Message message = new Iso8583Message(raw.substring(0, 4));
    pos = 4;

    boolean[] bits = new boolean[129];
    hexToBits(raw.substring(pos, pos + 16), bits, 1);
    pos += 16;
    if (bits[1]) {
      hexToBits(raw.substring(pos, pos + 16), bits, 65);
      pos += 16;
    }

    for (int field = 2; field <= 128; field++) {
      if (!bits[field]) {
        continue;
      }
      FieldDefinition def = def(field);
      String value;
      switch (def.lengthType()) {
        case FIXED -> {
          value = raw.substring(pos, pos + def.maxLength());
          pos += def.maxLength();
        }
        case LLVAR -> {
          int len = Integer.parseInt(raw.substring(pos, pos + 2));
          pos += 2;
          value = raw.substring(pos, pos + len);
          pos += len;
        }
        case LLLVAR -> {
          int len = Integer.parseInt(raw.substring(pos, pos + 3));
          pos += 3;
          value = raw.substring(pos, pos + len);
          pos += len;
        }
        default -> throw new IllegalStateException("Unsupported length type");
      }
      message.set(field, value);
    }
    return message;
  }

  // ---- helpers ----

  private FieldDefinition def(int field) {
    FieldDefinition def = registry.get(field);
    if (def == null) {
      throw new IllegalArgumentException("No ISO 8583 field definition for field " + field);
    }
    return def;
  }

  private void require(boolean ok, int field, int max) {
    if (!ok) {
      throw new IllegalArgumentException("Field " + field + " exceeds max length " + max);
    }
  }

  private String pad(String value, int len, boolean numeric) {
    if (numeric) {
      StringBuilder sb = new StringBuilder();
      for (int i = value.length(); i < len; i++) {
        sb.append('0');
      }
      return sb.append(value).toString();
    }
    StringBuilder sb = new StringBuilder(value);
    while (sb.length() < len) {
      sb.append(' ');
    }
    return sb.toString();
  }

  private String bitsToHex(boolean[] bits, int from, int to) {
    StringBuilder sb = new StringBuilder();
    for (int nibble = from; nibble <= to; nibble += 4) {
      int v = 0;
      for (int i = 0; i < 4; i++) {
        v = (v << 1) | (bits[nibble + i] ? 1 : 0);
      }
      sb.append(Character.forDigit(v, 16));
    }
    return sb.toString().toUpperCase();
  }

  private void hexToBits(String hex, boolean[] bits, int startBit) {
    int bit = startBit;
    for (int i = 0; i < hex.length(); i++) {
      int v = Character.digit(hex.charAt(i), 16);
      for (int j = 3; j >= 0; j--) {
        bits[bit++] = ((v >> j) & 1) == 1;
      }
    }
  }
}
