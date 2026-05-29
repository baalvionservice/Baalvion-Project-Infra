package com.baalvion.payment.scheme.iso8583;

import java.util.Map;
import java.util.TreeMap;

/**
 * An ISO 8583 message: a 4-digit MTI plus data elements keyed by field number (2..128).
 * Field 1 (secondary-bitmap presence) is managed by the codec, not set directly.
 */
public class Iso8583Message {

  private String mti;
  private final TreeMap<Integer, String> fields = new TreeMap<>();

  public Iso8583Message() {}

  public Iso8583Message(String mti) {
    this.mti = mti;
  }

  public String getMti() {
    return mti;
  }

  public Iso8583Message setMti(String mti) {
    this.mti = mti;
    return this;
  }

  public Iso8583Message set(int field, String value) {
    if (field < 2 || field > 128) {
      throw new IllegalArgumentException("Field must be 2..128: " + field);
    }
    fields.put(field, value);
    return this;
  }

  public String get(int field) {
    return fields.get(field);
  }

  public boolean has(int field) {
    return fields.containsKey(field);
  }

  /** Unmodifiable, ascending view of present data elements. */
  public Map<Integer, String> fields() {
    return new TreeMap<>(fields);
  }

  @Override
  public String toString() {
    return "ISO8583[mti=" + mti + ", fields=" + fields.keySet() + "]";
  }
}
