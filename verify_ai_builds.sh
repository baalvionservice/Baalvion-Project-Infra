#!/usr/bin/env bash
# Verify serverExternalPackages + server-only fix: zero "Critical dependency" warnings, build green.
set -u
ROOT="d:/Baalvion Projects/Frontend"
APPS=(
  "Baalvion-Jobs-Portal-main"
  "Imperialpedia-main"
  "brand-connector-main"
  "company-unified-Dashboard-main"
  "controlthemarket-main"
  "about-baalvion-main"
  "Law-Elite-Network-main"
  "Mining.Baalvion-main"
  "IR-Baalvion-main"
  "AmariseMaisonAvenue-main"
)
SUMMARY="/tmp/ai_verify_summary.txt"
: > "$SUMMARY"
for app in "${APPS[@]}"; do
  dir="$ROOT/$app"
  log="/tmp/verify_${app}.log"
  echo ">>> Building $app ..."
  ( cd "$dir" && rm -rf .next && pnpm build > "$log" 2>&1; echo "EXIT=$?" >> "$log" )
  crit=$(grep -c "Critical dependency" "$log" 2>/dev/null)
  exitc=$(grep -oE "EXIT=[0-9]+" "$log" | tail -1)
  if grep -q "Compiled with warnings" "$log" 2>/dev/null; then cs="WARN"; \
     elif grep -q "✓ Compiled successfully" "$log" 2>/dev/null; then cs="CLEAN"; \
     elif grep -q "Failed to compile" "$log" 2>/dev/null; then cs="FAILCOMPILE"; \
     else cs="?"; fi
  printf "%-32s critical=%-3s compile=%-11s %s\n" "$app" "${crit:-0}" "$cs" "$exitc" >> "$SUMMARY"
done
echo "===== SUMMARY =====" >> "$SUMMARY"
echo "ALLDONE" >> "$SUMMARY"
