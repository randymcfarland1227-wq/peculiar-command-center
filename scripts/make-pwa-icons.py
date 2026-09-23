#!/usr/bin/env python3
"""Forest-and-cream app icons for the Mac / Chrome install button."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1] / "public"
FOREST = (36, 56, 44, 255)
CREAM = (243, 238, 228, 255)

FONT = next(
    path
    for path in (
        "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSerifBold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
    )
    if Path(path).exists()
)


def draw(size: int) -> Image.Image:
    image = Image.new("RGBA", (size, size), FOREST)
    draw = ImageDraw.Draw(image)
    # Keep the mark inside the maskable safe zone.
    font = ImageFont.truetype(FONT, int(size * 0.46))
    letter = "P"
    box = draw.textbbox((0, 0), letter, font=font)
    width = box[2] - box[0]
    height = box[3] - box[1]
    x = (size - width) / 2 - box[0]
    y = (size - height) / 2 - box[1] - size * 0.02
    draw.text((x, y), letter, font=font, fill=CREAM)
    return image


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    master = draw(512)
    master.save(ROOT / "icon-512.png", "PNG")
    master.resize((192, 192), Image.Resampling.LANCZOS).save(ROOT / "icon-192.png", "PNG")
    master.resize((180, 180), Image.Resampling.LANCZOS).save(ROOT / "apple-touch-icon.png", "PNG")


if __name__ == "__main__":
    main()
