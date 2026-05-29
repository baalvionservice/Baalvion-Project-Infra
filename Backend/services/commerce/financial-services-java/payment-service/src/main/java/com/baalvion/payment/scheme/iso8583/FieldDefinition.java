package com.baalvion.payment.scheme.iso8583;

/**
 * Definition of an ISO 8583 data element: its length encoding and maximum length.
 * (ASCII variant — fixed fields are space/zero padded; variable fields carry a 2- or 3-digit
 * ASCII length prefix.)
 */
public record FieldDefinition(int field, LengthType lengthType, int maxLength, boolean numeric) {

  public enum LengthType {
    FIXED,
    LLVAR,   // up to 99, 2-digit length prefix
    LLLVAR   // up to 999, 3-digit length prefix
  }

  static FieldDefinition fixed(int field, int len, boolean numeric) {
    return new FieldDefinition(field, LengthType.FIXED, len, numeric);
  }

  static FieldDefinition llvar(int field, int max, boolean numeric) {
    return new FieldDefinition(field, LengthType.LLVAR, max, numeric);
  }

  static FieldDefinition lllvar(int field, int max, boolean numeric) {
    return new FieldDefinition(field, LengthType.LLLVAR, max, numeric);
  }
}
