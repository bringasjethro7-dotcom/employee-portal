#!/bin/bash
# Install the 35 reveal clips: takes the NEWEST 35 ElevenLabs_*.mp3 (by time) and maps them
# in download order to the recorded sequence. Older strays are excluded automatically.
SEQ=(intro awards-intro award-0 award-1 award-3 award-4 noms-10 noms-5 final2 drumroll close rank-23 rank-22 rank-21 rank-20 rank-19 rank-18 rank-17 rank-16 rank-14 rank-13 rank-12 rank-11 rank-7 rank-6 rank-5 rank-4 rank-3 rank-2 rank-1 award-2 rank-15 rank-10 rank-9 rank-8)
SRC="${1:-.}"; OUT="$(cd "$(dirname "$0")" && pwd)"
FILES=$(ls -t "$SRC"/ElevenLabs_*.mp3 2>/dev/null | head -35 | tail -r 2>/dev/null || ls -t "$SRC"/ElevenLabs_*.mp3 | head -35 | tac)
i=0
echo "$FILES" | while read -r f; do
  [ -z "$f" ] && continue
  [ $i -ge 35 ] && break
  cp -f "$f" "$OUT/${SEQ[$i]}.mp3"
  i=$((i+1))
done
echo "Installed: $(ls "$OUT"/*.mp3 2>/dev/null | wc -l) clips"
