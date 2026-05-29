package com.baalvion.payment.scheme.iso8583;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Pure unit tests for the ISO 8583 codec (no Spring/Testcontainers — runnable on any JDK 17).
 * Covers MTI, primary + secondary bitmap, FIXED, and LLVAR round-tripping.
 */
class Iso8583CodecTest {

  private final Iso8583Codec codec = new Iso8583Codec();

  @Test
  void packsAndUnpacksWithSecondaryBitmap() {
    String acct1 = "0123456789ABCDEF0123456789AB"; // 28 chars (field 102, LLVAR)
    Iso8583Message request = new Iso8583Message("0200")
      .set(3, "000000")
      .set(4, "000000150000")
      .set(7, "0527120000")
      .set(11, "123456")
      .set(37, "REF000000001")
      .set(41, "BAAL0001")
      .set(49, "840")
      .set(102, acct1); // field > 64 forces a secondary bitmap

    String packed = codec.pack(request);
    Iso8583Message decoded = codec.unpack(packed);

    assertThat(decoded.getMti()).isEqualTo("0200");
    assertThat(decoded.get(3)).isEqualTo("000000");
    assertThat(decoded.get(4)).isEqualTo("000000150000");
    assertThat(decoded.get(11)).isEqualTo("123456");
    assertThat(decoded.get(37)).isEqualTo("REF000000001");
    assertThat(decoded.get(41)).isEqualTo("BAAL0001");
    assertThat(decoded.get(49)).isEqualTo("840");
    assertThat(decoded.get(102)).isEqualTo(acct1);
    assertThat(decoded.has(39)).isFalse();
  }

  @Test
  void parsesApprovedResponse() {
    Iso8583Message response = new Iso8583Message("0210")
      .set(39, "00")
      .set(37, "RRN999999999")
      .set(11, "123456");
    Iso8583Message decoded = codec.unpack(codec.pack(response));
    assertThat(decoded.getMti()).isEqualTo("0210");
    assertThat(decoded.get(39)).isEqualTo("00");
    assertThat(decoded.get(37)).isEqualTo("RRN999999999");
  }

  @Test
  void numericFixedFieldIsLeftPadded() {
    Iso8583Message m = new Iso8583Message("0200").set(4, "150000"); // amount, fixed n12
    Iso8583Message decoded = codec.unpack(codec.pack(m));
    assertThat(decoded.get(4)).isEqualTo("000000150000");
  }

  @Test
  void rejectsOverlongFixedField() {
    Iso8583Message m = new Iso8583Message("0200").set(39, "TOOLONG"); // field 39 is fixed length 2
    assertThatThrownBy(() -> codec.pack(m)).isInstanceOf(IllegalArgumentException.class);
  }
}
