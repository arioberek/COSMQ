#!/bin/sh
# Turns renders/teaser-960.mp4 (rendered by `npm run render:teaser`) into the
# README-friendly loops in out/. Needs ffmpeg (with libwebp) and gifsicle.
set -eu
cd "$(dirname "$0")/.."
SRC=renders/teaser-960.mp4
mkdir -p out

# MP4: small, streamable, silent.
ffmpeg -y -loglevel error -i "$SRC" -an -c:v libx264 -preset slow -crf 20 \
  -pix_fmt yuv420p -movflags +faststart out/cosmq-teaser.mp4

# Animated WebP: 24 fps, loops forever.
ffmpeg -y -loglevel error -i "$SRC" -vf "fps=24" -c:v libwebp_anim -lossless 0 \
  -quality 85 -compression_level 6 -loop 0 out/cosmq-teaser.webp

# GIF: 18 fps, one shared palette, then gifsicle for size.
ffmpeg -y -loglevel error -i "$SRC" -vf "fps=18,split[a][b];[a]palettegen=max_colors=192:stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a" \
  -loop 0 renders/teaser-raw.gif
gifsicle -O3 --lossy=25 renders/teaser-raw.gif -o out/cosmq-teaser.gif

ls -lh out/cosmq-teaser.*
