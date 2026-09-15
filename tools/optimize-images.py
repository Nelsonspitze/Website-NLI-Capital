#!/usr/bin/env python3
"""Verkleint de beeldbestanden van nlicapital.nl naar 2x hun weergavegrootte.

De site heeft geen buildstap: dit script draai je met de hand zodra er nieuw
beeldmateriaal bijkomt, waarna het resultaat gewoon wordt meegecommit.

    python tools/optimize-images.py [--dry-run]

Doelbreedtes zijn twee keer de gemeten maximale CSS-weergavebreedte uit
css/style.css, zodat de foto's ook op retinaschermen scherp blijven:

    about-split blok      536px  ->  1200
    portfoliokaart        564px  ->  1200
    paginabrede hero     ~1920px ->  1920
    teamkaart         368-552px  ->   800
    logo-pill          200x56px  ->   400
    contactfoto        ~220x180  ->   600

Er wordt nooit opgeschaald: is de bron smaller dan het doel, dan blijft de
bronbreedte staan. Een bestand wordt alleen overschreven als het resultaat
kleiner is dan wat er al ligt.
"""

import argparse
import os
import shutil
import sys

from PIL import Image, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Verkleinen vlakt microcontrast af, en de browser verkleint daarna zelf nog een
# slag naar de CSS-breedte met een goedkoop filter. Een milde unsharp mask na het
# schalen compenseert dat: zichtbaar knapper op ware grootte, zonder halo's.
# Kost ongeveer 10% extra bestandsgrootte.
UNSHARP = ImageFilter.UnsharpMask(radius=0.8, percent=70, threshold=3)


def sharpen(im, resized):
    """Alleen verscherpen als er daadwerkelijk verkleind is."""
    return im.filter(UNSHARP) if resized else im


JPEG_OPTS = dict(quality=82, optimize=True, progressive=True)
# Hercodering van een al kleine bron verliest kwaliteit, dus die krijgt meer bits.
JPEG_OPTS_HQ = dict(quality=90, optimize=True, progressive=True)

# (bron, doelbreedte, doelbestand of None voor "zelfde naam")
PHOTOS = [
    ("assets/images/teamfoto.jpg", 1200, None),
    ("assets/images/Persbericht-1-suzannekemperfotografie.jpg", 1200, None),
    ("assets/images/Persbericht-2-suzannekemperfotografie.jpg", 1200, None),
    ("assets/images/Persbericht-3-suzannekemperfotografie.jpg", 1200, None),
    ("assets/images/nli-capital-mbo-hero.jpg", 1200, None),
    # Heet .jpg maar is in werkelijkheid een PNG; wordt hier een echte JPEG.
    ("assets/images/kantoor.jpg", 600, None),
    ("assets/team/CJ.jpg", 800, None),
    ("assets/team/MW.jpg", 800, None),
    ("assets/team/NdR.jpg", 800, None),
    ("assets/team/QH.jpg", 800, None),
    ("assets/team/RB.jpg", 800, None),
    ("assets/team/RN.jpg", 800, None),
    ("assets/team/DM.jpg", 800, None),
    # Foto's in een verkeerd formaat: PNG met 256 kleuren geeft banding.
    ("assets/team/MS.png", 800, "assets/team/MS.jpg"),
    ("assets/portfolio/hetraco-photo.png", 1200, "assets/portfolio/hetraco-photo.jpg"),
    ("assets/portfolio/lease-parcours-photo.jpg", 1200, None),
    # Turner, HIG en Quinnect blijven ongemoeid: die bronnen zijn al kleiner dan
    # 1200 breed, hercoderen maakt ze alleen groter en zachter.
]

# Paginabrede achtergrond op portfolio/<naam>.html. Aparte bestanden, omdat
# dezelfde foto daar over de volle schermbreedte wordt uitgerekt terwijl hij op
# de kaartweergave maar 564px breed is.
HEROES = [
    ("assets/portfolio/hetraco-photo.png", 1920, "assets/portfolio/hetraco-hero.jpg"),
    ("assets/portfolio/lease-parcours-photo.jpg", 1920, "assets/portfolio/lease-parcours-hero.jpg"),
    ("assets/portfolio/turner-photo.jpg", 1920, "assets/portfolio/turner-hero.jpg"),
    ("assets/portfolio/hig-photo.jpg", 1920, "assets/portfolio/hig-hero.jpg"),
    ("assets/portfolio/quinnect-photo.webp", 1920, "assets/portfolio/quinnect-hero.jpg"),
]

# Logo's houden hun transparantie, dus die blijven PNG.
LOGOS = [
    ("assets/portfolio/quinnect-logo.png", 400),
    ("assets/portfolio/hetraco-logo.png", 400),
    ("assets/portfolio/turner-logo.png", 400),
    ("assets/portfolio/lease-parcours-logo.png", 200),
]

# Socialpreview. Losse uitsnede, want linkpreviews renderen op 1200x630 terwijl
# de bronfoto 3:2 is. De uitsnede ligt iets boven het midden zodat er geen
# hoofden afvallen.
OG = ("assets/images/og-image.jpg", 1200, 630, 0.40)

TOTALS = {"before": 0, "after": 0}


def kb(n):
    return f"{n / 1024:,.0f} KB".rjust(10)


def load(path):
    return ImageOps.exif_transpose(Image.open(path))


def report(src, dst, before, after, note=""):
    TOTALS["before"] += before
    TOTALS["after"] += after
    label = src if src == dst else f"{src} -> {dst}"
    pct = f"-{100 - 100 * after / before:.0f}%" if before else "nieuw"
    print(f"  {kb(before)} ->{kb(after)}  {pct:>6}  {label} {note}")


def process_photo(src, width, out, dry):
    src_abs = os.path.join(ROOT, src)
    if not os.path.exists(src_abs):
        print(f"  OVERGESLAGEN (bestaat niet): {src}")
        return
    dst = out or src
    dst_abs = os.path.join(ROOT, dst)
    before = os.path.getsize(src_abs)

    im = load(src_abs)
    orig_w = im.width
    if im.mode != "RGB":
        im = im.convert("RGB")
    resized = im.width > width
    if resized:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im = sharpen(im, resized)

    tmp = dst_abs + ".tmp"
    im.save(tmp, "JPEG", **(JPEG_OPTS if orig_w > width else JPEG_OPTS_HQ))
    after = os.path.getsize(tmp)

    same_file = os.path.abspath(dst_abs) == os.path.abspath(src_abs)
    if same_file and after >= before:
        os.remove(tmp)
        print(f"  {kb(before)}             OVERGESLAGEN (zou groeien): {src}")
        return
    if dry:
        os.remove(tmp)
    else:
        os.replace(tmp, dst_abs)
    report(src, dst, before, after, f"({im.width}x{im.height})")


def process_hero(src, width, out, dry):
    src_abs = os.path.join(ROOT, src)
    dst_abs = os.path.join(ROOT, out)
    if not os.path.exists(src_abs):
        print(f"  OVERGESLAGEN (bestaat niet): {src}")
        return
    im = load(src_abs)
    too_small = im.width < width
    if not too_small:
        im = sharpen(
            im.convert("RGB").resize(
                (width, round(im.height * width / im.width)), Image.LANCZOS
            ),
            True,
        )
        if not dry:
            im.save(dst_abs, "JPEG", **JPEG_OPTS)
    elif src.lower().endswith((".jpg", ".jpeg")):
        # Al te klein en al JPEG: 1-op-1 overnemen in plaats van hercoderen.
        if not dry:
            shutil.copyfile(src_abs, dst_abs)
    else:
        im = im.convert("RGB")
        if not dry:
            im.save(dst_abs, "JPEG", **JPEG_OPTS_HQ)
    after = os.path.getsize(dst_abs) if os.path.exists(dst_abs) else 0
    note = f"({im.width}x{im.height})"
    if too_small:
        note += "  LET OP: bron te klein voor 1920, wacht op nieuw materiaal"
    report(src, out, 0, after, note)


def process_logo(src, width, dry):
    src_abs = os.path.join(ROOT, src)
    if not os.path.exists(src_abs):
        print(f"  OVERGESLAGEN (bestaat niet): {src}")
        return
    before = os.path.getsize(src_abs)
    im = load(src_abs)
    if im.mode != "RGBA":
        im = im.convert("RGBA")
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    tmp = src_abs + ".tmp"
    im.save(tmp, "PNG", optimize=True)
    after = os.path.getsize(tmp)
    if after >= before:
        os.remove(tmp)
        print(f"  {kb(before)}             OVERGESLAGEN (zou groeien): {src}")
        return
    if dry:
        os.remove(tmp)
    else:
        os.replace(tmp, src_abs)
    report(src, src, before, after, f"({im.width}x{im.height})")


def process_og(dry):
    src, w, h, bias = OG
    src_abs = os.path.join(ROOT, src)
    before = os.path.getsize(src_abs)
    im = load(src_abs).convert("RGB")
    if (im.width, im.height) == (w, h):
        # Al op maat; opnieuw coderen zou alleen kwaliteit kosten.
        print(f"  {kb(before)}             OVERGESLAGEN (al {w}x{h}): {src}")
        return
    target = w / h
    if im.width / im.height > target:
        new_w = round(im.height * target)
        left = (im.width - new_w) // 2
        im = im.crop((left, 0, left + new_w, im.height))
    else:
        new_h = round(im.width / target)
        top = round((im.height - new_h) * bias)
        im = im.crop((0, top, im.width, top + new_h))
    im = sharpen(im.resize((w, h), Image.LANCZOS), True)
    tmp = src_abs + ".tmp"
    im.save(tmp, "JPEG", **JPEG_OPTS)
    after = os.path.getsize(tmp)
    if dry:
        os.remove(tmp)
    else:
        os.replace(tmp, src_abs)
    report(src, src, before, after, f"({w}x{h} uitsnede)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="niets wegschrijven")
    dry = ap.parse_args().dry_run
    if dry:
        print("DRY RUN, er wordt niets weggeschreven\n")

    # Hero's eerst: die lezen dezelfde bronbestanden als PHOTOS en hebben een
    # grotere doelbreedte nodig. Andersom zouden ze een al verkleinde bron krijgen.
    print("Paginabrede hero's")
    for src, width, out in HEROES:
        process_hero(src, width, out, dry)

    print("\nFoto's")
    for src, width, out in PHOTOS:
        process_photo(src, width, out, dry)

    print("\nSocialpreview")
    process_og(dry)

    print("\nLogo's")
    for src, width in LOGOS:
        process_logo(src, width, dry)

    b, a = TOTALS["before"], TOTALS["after"]
    print(f"\n  {kb(b)} ->{kb(a)}  totaal ({b / 1048576:.1f} MB -> {a / 1048576:.1f} MB)")


if __name__ == "__main__":
    sys.exit(main())
