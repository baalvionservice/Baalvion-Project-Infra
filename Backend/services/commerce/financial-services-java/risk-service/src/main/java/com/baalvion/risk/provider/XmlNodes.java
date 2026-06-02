package com.baalvion.risk.provider;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Minimal, XXE-hardened DOM helpers for the EU/UN sanctions XML. Namespace-insensitive element lookup
 * (matches on local name, ignoring any prefix) so the same parser tolerates the EU feed's namespace
 * and the UN feed's plain elements. Dependency-free (JDK {@code javax.xml}).
 */
public final class XmlNodes {

  private XmlNodes() {}

  public static Document parse(String xml) {
    try {
      DocumentBuilderFactory f = DocumentBuilderFactory.newInstance();
      // Harden against XXE / entity-expansion (the feeds are untrusted external input).
      f.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
      f.setFeature("http://xml.org/sax/features/external-general-entities", false);
      f.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
      f.setXIncludeAware(false);
      f.setExpandEntityReferences(false);
      f.setNamespaceAware(false);
      DocumentBuilder b = f.newDocumentBuilder();
      return b.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception e) {
      throw new IllegalStateException("Failed to parse sanctions XML: " + e.getMessage(), e);
    }
  }

  private static String local(String tagName) {
    int i = tagName.indexOf(':');
    return i >= 0 ? tagName.substring(i + 1) : tagName;
  }

  /** All descendant elements whose local name equals {@code localName}. */
  public static List<Element> descendants(Node root, String localName) {
    List<Element> out = new ArrayList<>();
    NodeList all = (root instanceof Document d) ? d.getElementsByTagName("*")
      : ((Element) root).getElementsByTagName("*");
    for (int i = 0; i < all.getLength(); i++) {
      Node n = all.item(i);
      if (n instanceof Element el && local(el.getTagName()).equals(localName)) {
        out.add(el);
      }
    }
    return out;
  }

  /** Direct child elements with the given local name. */
  public static List<Element> children(Element parent, String localName) {
    List<Element> out = new ArrayList<>();
    NodeList kids = parent.getChildNodes();
    for (int i = 0; i < kids.getLength(); i++) {
      Node n = kids.item(i);
      if (n instanceof Element el && local(el.getTagName()).equals(localName)) {
        out.add(el);
      }
    }
    return out;
  }

  /** Trimmed text of the first direct child with the given local name, or null. */
  public static String childText(Element parent, String localName) {
    List<Element> c = children(parent, localName);
    if (c.isEmpty()) {
      return null;
    }
    String t = c.get(0).getTextContent();
    return (t == null || t.isBlank()) ? null : t.trim();
  }

  /** Attribute value (trimmed) or null. */
  public static String attr(Element el, String name) {
    String v = el.getAttribute(name);
    return (v == null || v.isBlank()) ? null : v.trim();
  }
}
