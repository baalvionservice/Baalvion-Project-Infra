package com.baalvion.reconciliation.inbound;

/** A polled inbound advice file: its name and raw bytes. */
public record AdviceFile(String name, byte[] content) {}
