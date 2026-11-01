# Generates layouts/meadow.svg, the Settings preview: plain shapes, no text or fonts.
# Usage: python3 scripts/generate-preview.py layouts/meadow.svg
import sys
out = []
def r(x, y, w, h, rx, c, extra=""):
    out.append(f'<rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" rx="{rx:.2f}" fill="{c}"{extra}/>')
def c(x, y, rad, col, extra=""):
    out.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{rad:.2f}" fill="{col}"{extra}/>')

DARK = "#2a2a2a"
def cow(x, y, s, face=1, state="walk"):
    sleepy = state == "sleep"
    hide = "#d6d3c8" if sleepy else "#fbfaf4"
    def box(l, t, w, h, rad, col, W=94, ox=0, oy=0):
        ll = W - l - w if face < 0 else l
        r(x + (ox + ll) * s, y + (oy + t) * s, w * s, h * s, rad * s, col)
    if sleepy:
        y += 6 * s
    box(-4, 17, 9, 3, 1.5, DARK); box(-6, 18, 3, 8, 1.5, DARK); box(-10, 24, 8, 8, 4, DARK)
    if not sleepy:
        lift = {12: 0, 26: 3, 46: 3, 58: 0} if state == "walk" else {12: 0, 26: 0, 46: 0, 58: 0}
        for l in (26, 58, 12, 46):
            box(l, 46 - lift[l], 8, 14, 3, hide); box(l, 56 - lift[l], 8, 4, 2, DARK)
    box(3, 8, 68, 46, 23, hide)
    box(11, 12, 18, 14, 7, DARK); box(46, 28, 18, 16, 8, DARK); box(24, 40, 11, 9, 4, DARK)
    box(28, 24, 18, 18, 5, "#d97757")
    # the head, positioned inside the mirrored canvas
    ht = 22 if sleepy else 21 if state == "graze" else 12
    hl = 94 - 60 - 30 if face < 0 else 60
    def h(l, t, w, hh, rad, col):
        r(x + (hl + l) * s, y + (ht + t) * s, w * s, hh * s, rad * s, col)
    h(4, -6, 6, 8, 3, "#e8d9b0"); h(20, -6, 6, 8, 3, "#e8d9b0")
    et = 11 if sleepy else 5
    h(-8, et, 10, 6, 3, DARK); h(28, et, 10, 6, 3, DARK)
    h(0, 0, 30, 32, 14, hide)
    h(17 if face > 0 else 2, 0, 11, 9, 5, DARK)
    for el in (3, 18):
        if sleepy:
            h(el, 12, 8, 2, 1, DARK)
        else:
            h(el, 6, 9, 9, 4.5, "#ffffff")
            h(el + 2.2, 8.4 if state != "graze" else 10, 4.8, 4.8, 2.4, "#000000")
    h(1, 17, 5, 4, 2, "#ffb3c1"); h(24, 17, 5, 4, 2, "#ffb3c1")
    h(5, 19, 20, 13, 6.5, "#f4a6b4")
    h(10, 25, 3, 3.5, 1.5, "#a8566a"); h(17, 25, 3, 3.5, 1.5, "#a8566a")

def pill(x, y, w, h, border, fill):
    r(x, y, w, h, h / 2, fill, f' stroke="{border}" stroke-width="0.8"')

out.append('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">')
out.append('<clipPath id="f"><rect x="60" y="0" width="260" height="104"/></clipPath>')
r(0, 0, 320, 200, 0, "#0a0a0a")

# sidebar: logo, pens, herd
r(0, 0, 60, 200, 0, "#0e0e0e")
c(10, 8, 3, "#d9d9d9"); r(16, 6.5, 16, 3, 1.5, "#d9d9d9")
r(4, 15, 18, 2, 1, "#7a7a7a")
for i, active in enumerate((False, False, False, True)):
    y = 20 + i * 11
    r(4, y, 52, 9, 2, "#2a1012" if active else "#141414", f' stroke="{"#e5383b" if active else "#3a3a3a"}" stroke-width="0.8"')
    r(8, y + 3, 5, 3, 1.5, "#c9a24d")
    r(16, y + 3.2, [28, 24, 30, 10][i], 2.6, 1.3, "#f2f2f2")
r(0, 112, 60, 0.6, 0, "#3a3a3a")
r(4, 117, 16, 2, 1, "#7a7a7a")
rows = [("#e5383b", False), ("#3fae4a", True), ("#e8e8e8", False), ("#7a7a7a", False)]
for i, (col, active) in enumerate(rows):
    y = 123 + i * 10
    if active:
        r(3, y - 1, 54, 9, 2.5, "#2a1012")
    r(6, y + 1.5, 4, 4, 1, "#c4c4c4")
    r(13, y + 2.2, 24, 2.6, 1.3, "#f2f2f2")
    c(51, y + 3.5, 1.8, col)

# the pasture
out.append('<g clip-path="url(#f)">')
r(60, 0, 260, 104, 0, "#d9f3fa")
for i, col in enumerate(["#4fb0ec", "#62bdf0", "#76c8f2", "#8bd3f4", "#a0dcf6", "#b4e5f8", "#c8edf9", "#d9f3fa"]):
    r(60, i * 6, 260, 6.5, 0, col)
c(292, 15, 13, "#fff3b0", ' opacity="0.5"'); c(292, 15, 8.5, "#ffd84d")
for cx_, cy_, k in ((135, 17, 1.0), (215, 11, 0.85), (258, 26, 0.65)):
    r(cx_ - 15 * k, cy_, 30 * k, 8 * k, 4 * k, "#ffffff")
    c(cx_ - 4 * k, cy_ + 1 * k, 6 * k, "#ffffff"); c(cx_ + 5 * k, cy_, 7 * k, "#ffffff")
out.append('<ellipse cx="125" cy="118" rx="95" ry="62" fill="#a7d46a"/>')
out.append('<ellipse cx="265" cy="115" rx="125" ry="70" fill="#93c957"/>')
out.append('<ellipse cx="190" cy="165" rx="210" ry="110" fill="#7fbd4a"/>')
for tx, ty in ((80, 74), (110, 92), (150, 70), (205, 96), (245, 72), (300, 90), (168, 98), (275, 62)):
    out.append(f'<path d="M{tx} {ty}l-1.2 -2.6M{tx} {ty}v-3M{tx} {ty}l1.2 -2.6" stroke="#3f8a25" stroke-width="0.5" fill="none"/>')
for fx, fy, col in ((96, 84, "#ffffff"), (136, 96, "#e5383b"), (232, 88, "#ffffff"), (288, 76, "#e5383b")):
    c(fx, fy, 0.9, col)

# signpost
r(65, 34, 2, 28, 0, "#5a3f22")
r(62, 25, 20, 11, 1.2, "#3a2614", ' stroke="#7a5530" stroke-width="0.6"')
r(65, 28, 11, 1.2, 0.6, "#c9a878"); r(65, 31, 7, 2, 1, "#f1efe6")
# title and counts
r(90, 7, 38, 5, 2.5, "#143a5c"); r(90, 15, 28, 2, 1, "#2f5f86")
for x_, w_, col in ((232, 13, "#1f7a2e"), (249, 15, "#e5383b"), (268, 11, "#143a5c"), (283, 17, "#4a5f78")):
    r(x_, 2.5, w_, 1.8, 0.9, col)

# one cow in each state
cow(92, 45, 0.33, 1, "graze")                      # grazing
out.append('<path d="M112 41v-4M112 39q-2 -2 -3 -1M112 38q2 -2 3 -1" stroke="#2f8a3a" stroke-width="0.7" fill="none"/>')
cow(158, 37, 0.29, -1, "stand")                    # needs you
pill(166, 24, 22, 7.5, "#e5383b", "#fff1f1")
r(170, 26, 1, 2.2, 0.4, "#e5383b"); r(170, 28.7, 1, 0.9, 0.4, "#e5383b"); r(173, 27, 11, 1.5, 0.7, "#e5383b")
cow(232, 39, 0.3, 1, "stand")                      # done
pill(240, 26, 20, 7.5, "#3fae4a", "#effaf0")
out.append('<path d="M243.5 29.8l1.3 1.3l2.4 -2.8" stroke="#1f7a2e" stroke-width="0.8" fill="none"/>')
r(249, 29, 8, 1.5, 0.7, "#1f7a2e")
cow(190, 69, 0.38, -1, "sleep")                    # sleeping
out.append('<path d="M212 66h3l-3 3.5h3M217 62h2.2l-2.2 2.6h2.2" stroke="#33507a" stroke-width="0.7" fill="none"/>')
cow(116, 69, 0.36, 1, "walk")                      # walking
out.append('</g>')

# tab bar
r(60, 104, 260, 11, 0, "#0a0a0a"); r(60, 115, 260, 0.5, 0, "#3a3a3a")
r(63, 106.5, 20, 7, 2, "#181818", ' stroke="#3a3a3a" stroke-width="0.5"')
r(66, 109, 3, 2.4, 0.6, "#d97757"); r(71, 109.2, 8, 2, 1, "#f2f2f2")
r(290, 109, 11, 2, 1, "#c4c4c4"); r(304, 109, 12, 2, 1, "#c4c4c4")

# panes
def pane(x, w, focused, widths):
    r(x, 118, w, 74, 2.5, "#0a0a0a", f' stroke="{"#e5383b" if focused else "#3a3a3a"}" stroke-width="0.7"')
    r(x + 3, 121, 3, 2.4, 0.6, "#d97757"); r(x + 8, 121.2, 14, 2, 1, "#f2f2f2")
    r(x, 126, w, 0.4, 0, "#3a3a3a")
    y = 130
    for i, (pw, col) in enumerate(widths):
        r(x + 5, y, min(pw, w - 10), 2, 1, col)
        y += 5
pane(63, 150, True, [(95, "#e8e8e8"), (120, "#7a7a7a"), (70, "#e8e8e8"), (105, "#7a7a7a"), (40, "#3fae4a"), (85, "#e8e8e8"), (125, "#7a7a7a"), (60, "#ff5c5f"), (6, "#e5383b")])
pane(216, 101, False, [(50, "#e8e8e8"), (70, "#7a7a7a"), (40, "#7a7a7a"), (60, "#e8e8e8"), (32, "#3fae4a"), (55, "#7a7a7a")])

# status bar
r(60, 194, 260, 6, 0, "#0e0e0e"); r(64, 196, 22, 1.8, 0.9, "#7a7a7a"); r(91, 196, 14, 1.8, 0.9, "#7a7a7a"); r(296, 196, 20, 1.8, 0.9, "#7a7a7a")
out.append('</svg>')
LIGHT = {"#0a0a0a":"#fdfcf9","#0e0e0e":"#f4f2ec","#141414":"#ffffff","#181818":"#ffffff","#2a1012":"#e9e5dc","#3a3a3a":"#d3cfc4","#7a7a7a":"#5f5c54","#f2f2f2":"#161616","#e8e8e8":"#161616","#c4c4c4":"#3f3d38","#d9d9d9":"#161616","#e5383b":"#c81e1e","#3fae4a":"#166534","#ff5c5f":"#c81e1e"}
# The panes are dark on the left and light on the right: one layout, two appearances.
head, tail = out[0], out[-1]
dark = "\n".join(out[1:-1])
light = dark.replace('id="f"', 'id="fl"').replace('url(#f)', 'url(#fl)')
for a, b in LIGHT.items():
    light = light.replace(a, b)
svg = "\n".join([
    head,
    dark,
    '<clipPath id="split"><path d="M216 104H320V200H176Z"/></clipPath>',
    '<g clip-path="url(#split)">', light, '</g>',
    tail, "",
])
open(sys.argv[1], "w").write(svg)
