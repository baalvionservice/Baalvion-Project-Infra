package com.baalvion.dealroom.config;

import com.baalvion.dealroom.realtime.DealRoomBroadcaster;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/** Registers the live negotiation WebSocket endpoint: {@code /ws/deal-rooms?dealId=<uuid>}. */
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

  private final DealRoomBroadcaster broadcaster;

  @Override
  public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    registry.addHandler(broadcaster, "/ws/deal-rooms").setAllowedOriginPatterns("*");
  }
}
