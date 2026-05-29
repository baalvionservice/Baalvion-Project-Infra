package com.baalvion.payment.scheme.iso8583;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.charset.StandardCharsets;

/**
 * Minimal, production-shaped TCP client for ISO 8583 scheme links using the common
 * 2-byte big-endian length-prefix framing (Postilion/Interswitch ASCII style). Connect/read
 * timeouts are enforced; one request/response per connection (the resilience layer in
 * {@code SchemeRouter} provides retries/circuit-breaking/timeouts around this call).
 *
 * TLS and persistent multiplexed connections are introduced at certification time; this client
 * is the clean seam for that.
 */
@Component
public class Iso8583Client {

  private static final Logger log = LoggerFactory.getLogger(Iso8583Client.class);

  public String exchange(String host, int port, String message, int connectTimeoutMs, int readTimeoutMs) throws IOException {
    try (Socket socket = new Socket()) {
      socket.connect(new InetSocketAddress(host, port), connectTimeoutMs);
      socket.setSoTimeout(readTimeoutMs);

      byte[] body = message.getBytes(StandardCharsets.US_ASCII);
      if (body.length > 0xFFFF) {
        throw new IOException("ISO 8583 message exceeds 2-byte length frame");
      }
      OutputStream out = socket.getOutputStream();
      out.write((body.length >> 8) & 0xFF);
      out.write(body.length & 0xFF);
      out.write(body);
      out.flush();

      InputStream in = socket.getInputStream();
      int hi = readOctet(in);
      int lo = readOctet(in);
      int len = (hi << 8) | lo;
      byte[] resp = readFully(in, len);
      log.debug("ISO 8583 exchange with {}:{} ({} bytes out, {} bytes in)", host, port, body.length, len);
      return new String(resp, StandardCharsets.US_ASCII);
    }
  }

  private int readOctet(InputStream in) throws IOException {
    int b = in.read();
    if (b < 0) {
      throw new IOException("Connection closed while reading length header");
    }
    return b;
  }

  private byte[] readFully(InputStream in, int len) throws IOException {
    byte[] buf = new byte[len];
    int read = 0;
    while (read < len) {
      int n = in.read(buf, read, len - read);
      if (n < 0) {
        throw new IOException("Connection closed: expected " + len + " bytes, got " + read);
      }
      read += n;
    }
    return buf;
  }
}
