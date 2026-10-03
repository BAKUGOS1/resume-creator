#!/usr/bin/env python3
"""Build the static, subset TTFs used by the PDF engine and the live preview.

jsPDF cannot use variable fonts and does no shaping, so every face is pinned to a
static instance and subset to scripts we can render without shaping (Latin,
Greek, Cyrillic, Vietnamese + common symbols). Layout tables are dropped so the
browser preview measures exactly like jsPDF (no kerning, no ligatures).

Usage:  python3 scripts/build-fonts.py <path-to-google-fonts-repo>
Needs:  pip install fonttools
"""
import sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset

UNICODES = (
    list(range(0x20, 0x7F)) + list(range(0xA0, 0x250)) +      # Latin, Latin-1, Ext-A/B
    list(range(0x370, 0x400)) + list(range(0x400, 0x500)) +   # Greek, Cyrillic
    list(range(0x1E00, 0x1F00)) +                             # Latin Extended Additional (Vietnamese)
    list(range(0x2000, 0x2070)) + list(range(0x20A0, 0x20C1)) +  # punctuation, currency (₹ €)
    [0x2116, 0x2122, 0x2190, 0x2192, 0x2212, 0x2713, 0x25CF, 0x25AA, 0x25A0]
)

# (output name, source file relative to repo, axis pins)
FACES = [
    ("gsf-400", "ofl/googlesansflex/GoogleSansFlex[GRAD,ROND,opsz,slnt,wdth,wght].ttf", {"wght": 400}),
    ("gsf-600", "ofl/googlesansflex/GoogleSansFlex[GRAD,ROND,opsz,slnt,wdth,wght].ttf", {"wght": 600}),
    ("inter-400", "ofl/inter/Inter[opsz,wght].ttf", {"wght": 400}),
    ("inter-600", "ofl/inter/Inter[opsz,wght].ttf", {"wght": 600}),
    ("inter-700", "ofl/inter/Inter[opsz,wght].ttf", {"wght": 700}),
    ("sserif-400", "ofl/sourceserif4/SourceSerif4[opsz,wght].ttf", {"wght": 400}),
    ("sserif-600", "ofl/sourceserif4/SourceSerif4[opsz,wght].ttf", {"wght": 600}),
    ("ssans-400", "ofl/sourcesans3/SourceSans3[wght].ttf", {"wght": 400}),
    ("ssans-600", "ofl/sourcesans3/SourceSans3[wght].ttf", {"wght": 600}),
    ("noto-400", "ofl/notosans/NotoSans[wdth,wght].ttf", {"wght": 400}),
    ("noto-700", "ofl/notosans/NotoSans[wdth,wght].ttf", {"wght": 700}),
    ("jbmono-400", "ofl/jetbrainsmono/JetBrainsMono[wght].ttf", {"wght": 400}),
    ("jbmono-700", "ofl/jetbrainsmono/JetBrainsMono[wght].ttf", {"wght": 700}),
]


def build(src_root: Path, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, rel, pins in FACES:
        font = TTFont(src_root / rel)
        if "fvar" in font:
            axes = {a.axisTag: a.defaultValue for a in font["fvar"].axes}
            axes.update(pins)
            font = instantiateVariableFont(font, axes)
        opts = subset.Options()
        opts.layout_features = []
        opts.drop_tables += ["kern", "GPOS", "GSUB", "GDEF", "STAT", "DSIG"]
        opts.name_IDs = ["*"]
        opts.notdef_outline = True
        opts.hinting = False
        sub = subset.Subsetter(opts)
        sub.populate(unicodes=UNICODES)
        sub.subset(font)
        out = out_dir / f"{name}.ttf"
        font.save(out)
        print(f"{out.name:16} {out.stat().st_size // 1024:>4} KB")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    build(Path(sys.argv[1]), Path(__file__).resolve().parent.parent / "public" / "fonts")
