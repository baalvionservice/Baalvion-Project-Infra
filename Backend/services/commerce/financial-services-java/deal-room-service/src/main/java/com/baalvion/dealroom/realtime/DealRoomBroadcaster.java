package com.baalvion.dealroom.realtime;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.net.URI;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket fan-out for live negotiation updates. Participants connect to
 * {@code /ws/deal-rooms?dealId=<uuid>} and receive every event in that room (new counter-offer,
 * message, agreement, signature) as JSON the instant it happens. In-memory per-instance registry;
 * for multi-replica fan-out put a Redis/Kafka relay in front (the outbox already carries the events).
 */
@Slf4j
@Component
public class DealRoomBroadcaster extends TextWebSocketHandler {

  private final ObjectMapper objectMapper;
  private final Map<String, Set<WebSocketSession>> rooms = new ConcurrentHashMap<>();

  public DealRoomBroadcaster(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @Override
  public void afterConnectionEstablished(WebSocketSession session) {
    String dealId = dealIdOf(session);
    if (dealId == null) {
      try { session.close(CloseStatus.BAD_DATA.withReason("dealId query parameter required")); } catch (Exception ignored) {}
      return;
    }
    rooms.computeIfAbsent(dealId, k -> ConcurrentHashMap.newKeySet()).add(session);
    log.debug("WS connected to deal room {} ({} subscribers)", dealId, rooms.get(dealId).size());
  }

  @Override
  public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
    String dealId = dealIdOf(session);
    if (dealId != null) {
      Set<WebSocketSession> set = rooms.get(dealId);
      if (set != null) { set.remove(session); if (set.isEmpty()) rooms.remove(dealId); }
    }
  }

  /** Push a typed event to everyone watching a deal room. Best-effort; dead sessions are dropped. */
  public void publish(String dealId, String type, Object payload) {
    Set<WebSocketSession> set = rooms.get(dealId);
    if (set == null || set.isEmpty()) return;
    String json;
    try { json = objectMapper.writeValueAsString(Map.of("type", type, "dealId", dealId, "payload", payload)); }
    catch (Exception e) { log.warn("WS serialize failed for deal {}: {}", dealId, e.getMessage()); return; }
    TextMessage frame = new TextMessage(json);
    for (WebSocketSession s : set) {
      try { if (s.isOpen()) s.sendMessage(frame); }
      catch (Exception e) { log.debug("WS send failed; dropping session: {}", e.getMessage()); set.remove(s); }
    }
  }

  private String dealIdOf(WebSocketSession session) {
    URI uri = session.getUri();
    if (uri == null || uri.getQuery() == null) return null;
    for (String pair : uri.getQuery().split("&")) {
      String[] kv = pair.split("=", 2);
      if (kv.length == 2 && kv[0].equals("dealId") && !kv[1].isBlank()) return kv[1];
    }
    return null;
  }
}
