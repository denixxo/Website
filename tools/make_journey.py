"""Build the journey map in index.html (About section) from Natural Earth data.

    python tools/make_journey.py <ne_110m_land.geojson> \
        <ne_10m_admin_0_boundary_lines_land.geojson> \
        <ne_10m_rivers_lake_centerlines.geojson> <ne_10m_lakes.geojson>

The four GeoJSON files are public domain and not kept in the repository; each
is at https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/<name>
(about 140 KB, 2.3 MB, 7 MB and 5 MB). The land is projected onto an equirectangular frame with
standard parallel 45 N (x = lon * cos 45, y = -lat), lon -15..145 and
lat 8..72, scaled to a 1000-wide viewBox, simplified (Douglas-Peucker) and
baked into the figure as one path. The inset is its own projection (1 degree
of latitude = 80 units, centred on 48.3 N 8.0 E); the 1:10m borders, the Rhine
and the lakes are clipped to its circle and simplified the same way. The stops, labels, inset, flight arc,
plane, dog and flags are all defined here; the figure is written between the
JOURNEY markers in index.html, replacing what is there. The animation itself
is in css/pages.css ("Journey map").
"""
import json
import math
import sys

LON0, LON1, LAT0, LAT1 = -15.0, 145.0, 8.0, 72.0
COS = math.cos(math.radians(45))
K = 1000.0 / ((LON1 - LON0) * COS)
W, H = 1000.0, (LAT1 - LAT0) * K


def proj(lon, lat):
    return ((lon - LON0) * COS * K, (LAT1 - lat) * K)


def dp(points, tol):
    """Douglas-Peucker on a list of (x, y)."""
    if len(points) < 3:
        return points
    (x0, y0), (x1, y1) = points[0], points[-1]
    dx, dy = x1 - x0, y1 - y0
    norm = math.hypot(dx, dy) or 1.0
    best, idx = 0.0, 0
    for i in range(1, len(points) - 1):
        x, y = points[i]
        d = abs(dy * x - dx * y + x1 * y0 - y1 * x0) / norm if norm > 1e-9 else math.hypot(x - x0, y - y0)
        if d > best:
            best, idx = d, i
    if best > tol:
        return dp(points[: idx + 1], tol)[:-1] + dp(points[idx:], tol)
    return [points[0], points[-1]]


def area(points):
    return abs(sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(points, points[1:] + points[:1]))) / 2


def ring_path(ring, tol):
    pts = [proj(lon, lat) for lon, lat in ring]
    # Drop rings entirely outside the frame (with a margin).
    if max(p[0] for p in pts) < -20 or min(p[0] for p in pts) > W + 20:
        return None
    if max(p[1] for p in pts) < -20 or min(p[1] for p in pts) > H + 20:
        return None
    # A closed ring repeats its first point last; DP needs a real baseline,
    # so split the ring at the point farthest from its start.
    if pts[0] == pts[-1]:
        pts = pts[:-1]
    far = max(range(len(pts)), key=lambda i: math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]))
    pts = dp(pts[: far + 1], tol)[:-1] + dp(pts[far:] + pts[:1], tol)[:-1]
    if len(pts) < 4 or area(pts) < 40:
        return None
    out = ["M%d %d" % (round(pts[0][0]), round(pts[0][1]))]
    px, py = round(pts[0][0]), round(pts[0][1])
    for x, y in pts[1:-1]:
        x, y = round(x), round(y)
        if (x, y) == (px, py):
            continue
        out.append("l%d %d" % (x - px, y - py))
        px, py = x, y
    out.append("z")
    return "".join(out)


def gc(lat1, lon1, lat2, lon2, n=40):
    """Points along the great circle from 1 to 2."""
    p1 = (math.radians(lat1), math.radians(lon1))
    p2 = (math.radians(lat2), math.radians(lon2))
    d = 2 * math.asin(math.sqrt(math.sin((p2[0] - p1[0]) / 2) ** 2 + math.cos(p1[0]) * math.cos(p2[0]) * math.sin((p2[1] - p1[1]) / 2) ** 2))
    pts = []
    for i in range(n + 1):
        f = i / n
        a = math.sin((1 - f) * d) / math.sin(d)
        b = math.sin(f * d) / math.sin(d)
        x = a * math.cos(p1[0]) * math.cos(p1[1]) + b * math.cos(p2[0]) * math.cos(p2[1])
        y = a * math.cos(p1[0]) * math.sin(p1[1]) + b * math.cos(p2[0]) * math.sin(p2[1])
        z = a * math.sin(p1[0]) + b * math.sin(p2[0])
        pts.append((math.degrees(math.atan2(y, x)), math.degrees(math.atan2(z, math.sqrt(x * x + y * y)))))
    return pts



INSET_LAT, INSET_LON, INSET_K, INSET_R = 48.3, 8.0, 80.0, 140.0


def inset_proj(lon, lat):
    return ((lon - INSET_LON) * math.cos(math.radians(INSET_LAT)) * INSET_K, (INSET_LAT - lat) * INSET_K)


def clip_lines(geojson, keep, tol=0.8):
    """Line features passing `keep`, projected into the inset, cut to its circle
    (runs of points inside, each extended to where it crosses the edge)."""
    data = json.load(open(geojson, encoding="utf-8"))
    out = []

    def inside(p):
        return math.hypot(p[0], p[1]) <= INSET_R

    def edge(a, b):
        # Point on segment a-b at distance INSET_R from the centre, a inside.
        lo, hi = 0.0, 1.0
        for _ in range(30):
            mid = (lo + hi) / 2
            q = (a[0] + (b[0] - a[0]) * mid, a[1] + (b[1] - a[1]) * mid)
            lo, hi = (mid, hi) if inside(q) else (lo, mid)
        return (a[0] + (b[0] - a[0]) * lo, a[1] + (b[1] - a[1]) * lo)

    for f in data["features"]:
        if not keep(f["properties"]):
            continue
        g = f["geometry"]
        lines = g["coordinates"] if g["type"] == "MultiLineString" else [g["coordinates"]]
        for line in lines:
            pts = [inset_proj(lon, lat) for lon, lat, *_ in line]
            if not any(inside(q) for q in pts):
                continue
            run = []
            for i, q in enumerate(pts):
                if inside(q):
                    if not run and i > 0:
                        run.append(edge(q, pts[i - 1]))
                    run.append(q)
                elif run:
                    run.append(edge(run[-1], q))
                    out.append(run)
                    run = []
            if run:
                out.append(run)
    d = []
    for run in out:
        run = dp(run, tol)
        d.append("M%.1f %.1f" % run[0] + "".join("L%.1f %.1f" % q for q in run[1:]))
    return "".join(d)


def clip_polygons(geojson, tol=0.8):
    """Polygon features with any point inside the inset, projected into it;
    the SVG clip-path trims whatever crosses the edge."""
    data = json.load(open(geojson, encoding="utf-8"))
    d = []
    for f in data["features"]:
        g = f["geometry"]
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        for poly in polys:
            for ring in poly:
                pts = [inset_proj(lon, lat) for lon, lat, *_ in ring]
                if not any(math.hypot(x, y) <= INSET_R for x, y in pts):
                    continue
                pts = dp(pts[:-1] if pts[0] == pts[-1] else pts, tol)
                if len(pts) >= 3:
                    d.append("M%.1f %.1f" % pts[0] + "".join("L%.1f %.1f" % q for q in pts[1:]) + "Z")
    return "".join(d)


def land_path(geojson, tol=1.5):
    data = json.load(open(geojson, encoding="utf-8"))
    paths = []
    for f in data["features"]:
        g = f["geometry"]
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        for poly in polys:
            for ring in poly:
                p = ring_path(ring, tol)
                if p:
                    paths.append(p)
    return "".join(paths)


def arc_path():
    pts = [proj(lon, lat) for lon, lat in gc(*STOPS["strasbourg"], *STOPS["seoul"], 24)]
    return "M%.0f %.0f" % pts[0] + "".join(" L%.0f %.0f" % p for p in pts[1:])


STOPS = {  # lat, lon
    "strasbourg": (48.5734, 7.7521),
    "basel": (47.5596, 7.5886),
    "karlsruhe": (49.0069, 8.4037),
    "lindau": (47.5460, 9.6840),
    "seoul": (37.5665, 126.9780),
}

if len(sys.argv) < 5:
    sys.exit(__doc__)
LAND = land_path(sys.argv[1])
ARC = arc_path()
BORDERS = clip_lines(sys.argv[2], lambda p: True)
RHINE = clip_lines(sys.argv[3], lambda p: (p.get("name_en") or "") in ("Rhein", "Rhine"))
LAKES = clip_polygons(sys.argv[4])
print("inset borders", len(BORDERS), "bytes, rhine", len(RHINE), "bytes, lakes", len(LAKES), "bytes")
for k, (lat, lon) in STOPS.items():
    print("%-10s %7.1f %7.1f" % ((k,) + proj(lon, lat)))
print("arc", ARC)



def t(cls, x, y, anchor, en, fr=None, ko=None, de=None):
    """A <text> whose content switches with the page language."""
    fr, ko, de = fr or en, ko or en, de or en
    return ('<text class="%s" x="%s" y="%s" text-anchor="%s">'
            '<tspan lang="en">%s</tspan><tspan lang="fr">%s</tspan>'
            '<tspan lang="ko">%s</tspan><tspan lang="de">%s</tspan></text>'
            % (cls, x, y, anchor, en, fr, ko, de))


def year(x, y, anchor, s):
    return '<text class="journey__year" x="%s" y="%s" text-anchor="%s">%s</text>' % (x, y, anchor, s)


DOG = """<g class="journey__dog" transform="translate(-3 -7) scale(0.9)">
            <circle class="journey__hit" cx="5" cy="-12" r="18"/>
            <path class="journey__dog-black" d="M-13 -9C-13 -14 -9 -17 -4 -17L5 -17C8 -17 10 -16 11 -14L13 -21C13 -24 16 -25 18 -24L24 -22L24 -19L19 -18C17 -17 15 -15 14 -13L12 -9L11 -1L9 -1L8 -8L6 -9L4 -1L2 -1L1 -8L-5 -8L-6 -1L-8 -1L-9 -8L-11 -8L-12 -1L-14 -1L-13 -9ZM-13 -12L-17 -14L-16 -10ZM14 -23L10 -20L13 -15Z"/>
            <path class="journey__dog-tan" d="M9 -5h2v3h-2zM2 -5h2v3h-2zM-8 -5h2v3h-2zM-14 -5h2v3h-2zM15 -19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0ZM14 -23a1 1 0 1 0 2 0a1 1 0 1 0 -2 0Z"/>
            <path class="journey__dog-white" d="M11 -14L14 -12L12 -8L10 -9ZM9 -2h2v2h-2zM2 -2h2v2h-2zM-8 -2h2v2h-2zM-14 -2h2v2h-2zM19 -18L24 -19L24 -21L21 -21Z"/>
          </g>"""

PLANE = """<g class="journey__plane j-fly" style="offset-path: path('%s')"><g class="journey__craft j-level">
          <path class="journey__plane-body" d="M-18 -7L-24 -20L-15 -20L-7 -7ZM-22 -7L-28 -12L-22 -12ZM-2 2L-14 14L-5 14L10 2Z"/>
          <path class="journey__plane-body" d="M28 0C28 -4 24 -7 16 -7L-18 -7C-24 -7 -28 -4 -28 0C-28 4 -24 7 -18 7L16 7C24 7 28 4 28 0Z"/>
          <path class="journey__plane-window" d="M-12 -2a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0ZM-6 -2a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0ZM0 -2a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0ZM6 -2a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0ZM12 -2a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0ZM21 -3a2 2 0 1 0 4 0a2 2 0 1 0 -4 0Z"/>
          %s
        </g></g>""" % (ARC, DOG)

# Inset: 1 degree of latitude = 80 units, centred on 48.3 N 8.0 E.
INSET = """<g transform="translate(340 395)">
          <g class="journey__inset j-pop" style="--d: .7s">
            <circle class="journey__inset-bg" r="135"/>
            <!-- Lakes, borders and the Rhine, Natural Earth 1:10m, cut to the circle. -->
            <path class="journey__lake" clip-path="url(#j-inset-clip)" d="%s"/>
            <path class="journey__borders" clip-path="url(#j-inset-clip)" d="%s"/>
            <path class="journey__rhine" clip-path="url(#j-inset-clip)" d="%s"/>
            %s
            %s
            %s
            <path class="journey__hop j-draw" d="M-13 -22Q-32 18 -22 59" pathLength="1" style="--d: 1.6s"/>
            <line class="journey__link j-draw" x1="-13" y1="-22" x2="21" y2="-57" pathLength="1" style="--d: 2.6s"/>
            <g class="j-city j-city--strasbourg j-pop" style="--d: 1s"><circle class="journey__hit" cx="-13" cy="-22" r="26"/><circle class="journey__dot" cx="-13" cy="-22" r="5"/>
              %s
              %s</g>
            <g class="j-city j-city--basel j-pop" style="--d: 2.1s"><circle class="journey__hit" cx="-22" cy="59" r="26"/><circle class="journey__dot journey__dot--minor" cx="-22" cy="59" r="4"/>
              %s
              %s</g>
            <g class="j-city j-city--karlsruhe j-pop" style="--d: 3.1s"><circle class="journey__hit" cx="21" cy="-57" r="26"/><circle class="journey__dot" cx="21" cy="-57" r="5"/>
              %s
              %s</g>
            <!-- The PhD: a mortarboard over the Strasbourg–Karlsruhe link. -->
            <use class="journey__cap j-pop" href="#i-education" x="-24" y="-66" width="26" height="26" style="--d: 3.4s"/>
            <!-- Lindau, on the Bodensee: a side trip from Karlsruhe. -->
            <path class="journey__hop journey__hop--lindau j-draw" d="M21 -57Q60 10 90 60" pathLength="1" style="--d: 3.7s; --fade: 4.4s"/>
            <g class="j-city j-city--lindau j-pop" style="--d: 4.2s"><circle class="journey__hit" cx="90" cy="60" r="26"/><circle class="journey__dot journey__dot--minor" cx="90" cy="60" r="4"/>
              %s
              %s</g>
          </g>
        </g>""" % (
    LAKES, BORDERS, RHINE,
    t("journey__country", -58, 44, "middle", "France", ko="프랑스", de="Frankreich"),
    t("journey__country", 28, 30, "middle", "Germany", fr="Allemagne", ko="독일", de="Deutschland"),
    t("journey__country", -22, 104, "middle", "Switzerland", fr="Suisse", ko="스위스", de="Schweiz"),
    t("journey__label", -24, -17, "end", "Strasbourg", ko="스트라스부르"),
    year(-24, 0, "end", "2015 – 2024"),
    t("journey__label journey__label--minor", -12, 64, "start", "Basel", fr="Bâle", ko="바젤"),
    year(-12, 80, "start", "2019"),
    t("journey__label", 31, -52, "start", "Karlsruhe", ko="카를스루에"),
    year(31, -36, "start", "2020 – 2024"),
    t("journey__label journey__label--minor", 96, 82, "end", "Lindau", ko="린다우"),
    year(96, 98, "end", "2024"),
)

FLAG_FR = '<svg viewBox="0 0 72 48"><path fill="#0055a4" d="M0 0h24v48H0z"/><path fill="#fff" d="M24 0h24v48H24z"/><path fill="#ef4135" d="M48 0h24v48H48z"/></svg>'
FLAG_DE = '<svg viewBox="0 0 72 48"><path d="M0 0h72v16H0z"/><path fill="#d00" d="M0 16h72v16H0z"/><path fill="#ffce00" d="M0 32h72v16H0z"/></svg>'


def trigram(rotate, kinds):
    """Three bars, inner to outer, each solid or broken, along the diagonal."""
    bars = []
    for i, k in enumerate(kinds):
        y = 16.5 + 3 * i
        if k == "s":
            bars.append('<rect x="-4" y="%s" width="8" height="1.8"/>' % y)
        else:
            bars.append('<rect x="-4" y="%s" width="3.4" height="1.8"/><rect x="0.6" y="%s" width="3.4" height="1.8"/>' % (y, y))
    return '<g transform="rotate(%s)">%s</g>' % (rotate, "".join(bars))


FLAG_KR = ('<svg viewBox="0 0 72 48"><path fill="#fff" d="M0 0h72v48H0z"/>'
           '<g transform="translate(36 24)">'
           '<g transform="rotate(-33.7)">'
           '<path fill="#cd2e3a" d="M-12 0A12 12 0 0 1 12 0A6 6 0 0 1 0 0A6 6 0 0 0 -12 0Z"/>'
           '<path fill="#0047a0" d="M-12 0A6 6 0 0 1 0 0A6 6 0 0 0 12 0A12 12 0 0 1 -12 0Z"/>'
           '</g>'
           + trigram(123.7, "sss") + trigram(-56.3, "bbb") + trigram(-123.7, "bsb") + trigram(56.3, "sbs") +
           '</g></svg>')

ATOM = '<svg class="icon journey__atom j-pop" style="--d: %ss" aria-hidden="true"><use href="#i-orbital"/></svg>'

FLAGS = """<div class="journey__flags" aria-hidden="true">
        <span class="journey__flag j-pop" style="--d: 7.6s">%s</span>
        %s
        <span class="journey__flag j-pop" style="--d: 7.9s">%s</span>
        %s
        <span class="journey__flag j-pop" style="--d: 8.2s">%s</span>
      </div>""" % (FLAG_FR, ATOM % "7.75", FLAG_DE, ATOM % "8.05", FLAG_KR)

def tip(key, x, y, side, en, fr, ko, de):
    """A note shown while its city is hovered. x, y in viewBox units."""
    return ('<div class="journey__tip journey__tip--%s j-tip--%s" style="left: %.1f%%; top: %.1f%%">'
            '<span lang="en">%s</span><span lang="fr">%s</span><span lang="ko">%s</span><span lang="de">%s</span></div>'
            % (side, key, x / 10.0, y / 5.66, en, fr, ko, de))


FLAG_CH = '<svg viewBox="0 0 48 48"><path fill="#d52b1e" d="M0 0h48v48H0z"/><path fill="#fff" d="M19 9h10v10h10v10H29v10H19V29H9V19h10z"/></svg>'


def note(flag, title, *rows):
    """A hover note: the country's flag and the institution, then one line
    per date bracket. Inline SVG rather than a flag emoji, which Windows
    browsers render as two letters."""
    lines = []
    for years, text in rows:
        lines.append(('<span class="journey__tip-year">%s</span> %s' % (years, text)) if years else text)
    return '<b><span class="journey__tip-flag">%s</span>%s</b>%s' % (flag, title, "<br>".join(lines))


TIPS = """<div class="journey__tips" aria-hidden="true">
          %s
          %s
          %s
          %s
          %s
          <div class="journey__tip journey__tip--photo j-tip--dog" style="left: 88.7%%; top: 53.7%%"><img src="assets/img/journey/dog.webp" width="480" height="514" alt="" loading="lazy"></div>
        </div>""" % (
    tip("strasbourg", 340 - 13, 395 - 22, "left",
        note(FLAG_FR, "Université de Strasbourg",
             ("2015 – 2017", "DEUG in mathematics"),
             ("2015 – 2018", "BSc in physics"),
             ("2018 – 2020", "MSc in physics (Magistère)"),
             ("2020 – 2024", "PhD at IPCMS, Unistra thesis prize")),
        note(FLAG_FR, "Université de Strasbourg",
             ("2015 – 2017", "DEUG de mathématiques"),
             ("2015 – 2018", "Licence de physique"),
             ("2018 – 2020", "Master de physique (Magistère)"),
             ("2020 – 2024", "Thèse à l'IPCMS, prix de thèse Unistra")),
        note(FLAG_FR, "스트라스부르 대학교",
             ("2015 – 2017", "수학 DEUG"),
             ("2015 – 2018", "물리학 학사"),
             ("2018 – 2020", "물리학 석사 (Magistère)"),
             ("2020 – 2024", "IPCMS 박사과정, 스트라스부르 대학교 논문상")),
        note(FLAG_FR, "Université de Strasbourg",
             ("2015 – 2017", "DEUG in Mathematik"),
             ("2015 – 2018", "Bachelor in Physik"),
             ("2018 – 2020", "Master in Physik (Magistère)"),
             ("2020 – 2024", "Promotion am IPCMS, Dissertationspreis der Unistra"))),
    tip("karlsruhe", 340 + 21, 395 - 57, "above",
        note(FLAG_DE, "Karlsruhe Institute of Technology",
             ("2020 – 2024", "German half of the PhD, at INT-KIT, summa cum laude"),
             ("2024", "Researcher at KIT, building on the thesis work")),
        note(FLAG_DE, "Karlsruhe Institute of Technology",
             ("2020 – 2024", "Moitié allemande de la thèse, à l'INT-KIT, summa cum laude"),
             ("2024", "Chercheur au KIT, valorisation des travaux de thèse")),
        note(FLAG_DE, "카를스루에 공과대학교 (KIT)",
             ("2020 – 2024", "박사과정의 독일 쪽 절반, INT-KIT, summa cum laude"),
             ("2024", "KIT 연구원, 학위논문 연구의 후속 작업")),
        note(FLAG_DE, "Karlsruher Institut für Technologie",
             ("2020 – 2024", "Deutsche Hälfte der Promotion, am INT-KIT, summa cum laude"),
             ("2024", "Wissenschaftler am KIT, Verwertung der Dissertation"))),
    tip("basel", 340 - 22, 395 + 59, "right",
        note(FLAG_CH, "University of Basel",
             ("2019", "Master's internship with Prof. D. Loss and Prof. M. Rančić"),
             ("", "Condensed-matter theory and quantum computing")),
        note(FLAG_CH, "Université de Bâle",
             ("2019", "Stage de master auprès des Prof. D. Loss et M. Rančić"),
             ("", "Théorie de la matière condensée et calcul quantique")),
        note(FLAG_CH, "바젤 대학교",
             ("2019", "석사 인턴십, D. Loss 교수와 M. Rančić 교수 지도"),
             ("", "응집물질 이론과 양자컴퓨팅")),
        note(FLAG_CH, "Universität Basel",
             ("2019", "Masterpraktikum bei Prof. D. Loss und Prof. M. Rančić"),
             ("", "Theorie der kondensierten Materie und Quantencomputing"))),
    tip("lindau", 340 + 90, 395 + 60, "right",
        note(FLAG_DE, "Lindau Nobel Laureate Meeting",
             ("2024", "73rd Lindau Meeting (physics), one of six French students nominated by Udice")),
        note(FLAG_DE, "Rencontre des lauréats Nobel de Lindau",
             ("2024", "73e rencontre de Lindau (physique), l'un des six étudiants français nommés par Udice")),
        note(FLAG_DE, "린다우 노벨상 수상자 회의",
             ("2024", "제73회 린다우 회의 (물리학), Udice가 지명한 프랑스 학생 6명 중 한 명")),
        note(FLAG_DE, "Lindauer Nobelpreisträgertagung",
             ("2024", "73. Lindauer Tagung (Physik), einer von sechs von Udice nominierten französischen Studierenden"))),
    tip("seoul", 887, 304, "left",
        note(FLAG_KR, "Center for Quantum Nanoscience (QNS), IBS and Ewha Womans University",
             ("2025 –", "Postdoc, Theory of Quantum Spins on Surfaces group")),
        note(FLAG_KR, "Center for Quantum Nanoscience (QNS), IBS et Université Ewha",
             ("2025 –", "Post-doctorat, groupe de théorie des spins quantiques sur surfaces")),
        note(FLAG_KR, "양자나노과학연구단 (QNS), IBS와 이화여자대학교",
             ("2025 –", "박사후연구원, 표면 위 양자 스핀 이론 그룹")),
        note(FLAG_KR, "Center for Quantum Nanoscience (QNS), IBS und Ewha Womans University",
             ("2025 –", "Postdoc, Gruppe für die Theorie von Quantenspins auf Oberflächen"))),
)

CAPTION = """<figcaption class="journey__caption">
        <span lang="en">Studies in Strasbourg, an internship in Basel, a French-German PhD between Strasbourg and Karlsruhe, then a postdoc in Seoul, with the dog.</span>
        <span lang="fr">Études à Strasbourg, un stage à Bâle, une thèse franco-allemande entre Strasbourg et Karlsruhe, puis un post-doctorat à Séoul, avec le chien.</span>
        <span lang="ko">스트라스부르에서의 학업, 바젤에서의 인턴십, 스트라스부르와 카를스루에의 프랑스-독일 공동 박사과정, 그리고 서울에서의 박사후연구, 강아지와 함께.</span>
        <span lang="de">Studium in Straßburg, ein Praktikum in Basel, eine deutsch-französische Promotion zwischen Straßburg und Karlsruhe, dann Postdoc in Seoul, mit dem Hund.</span>
      </figcaption>"""

FIGURE = """      <!-- JOURNEY: start -->
      <!-- The journey map: where the studies, the PhD and the postdoc took
           place, animated once as it scrolls into view (css/pages.css,
           "Journey map"). The land outline is Natural Earth 1:110m (public
           domain), projected and simplified by a one-off script; the three
           Rhine cities sit 4–9 px apart at this scale, hence the inset. Each
           city shows a note while hovered (the .journey__tip divs). -->
      <figure class="journey" data-reveal data-i18n-aria-label="journeyMap" aria-label="Map of my journey: Strasbourg, Karlsruhe, then Seoul">
        <div class="journey__stage">
        <svg class="journey__map" viewBox="0 0 1000 566" aria-hidden="true" focusable="false">
          <defs><clipPath id="j-inset-clip"><circle r="134"/></clipPath></defs>
          <path class="journey__land" d="%s"/>
          <path class="journey__arc j-arc" d="%s" pathLength="1"/>
          <g class="j-pop" style="--d: .4s"><circle class="journey__ring" cx="142" cy="207" r="10"/><circle class="journey__dot" cx="142" cy="207" r="4"/></g>
          <line class="journey__leader j-draw" x1="142" y1="207" x2="242" y2="302" pathLength="1" style="--d: .6s"/>
          %s
          <g class="j-city j-city--seoul j-pop" style="--d: 7.2s"><circle class="journey__hit" cx="887" cy="304" r="26"/><circle class="journey__ring" cx="887" cy="304" r="10"/><circle class="journey__dot" cx="887" cy="304" r="5"/>
            %s
            %s</g>
          %s
        </svg>
        %s
        </div>
        %s
        %s
      </figure>
      <!-- JOURNEY: end -->
""" % (LAND, ARC,
       INSET,
       t("journey__label", 858, 328, "end", "Seoul", fr="Séoul", ko="서울"),
       year(858, 344, "end", "2025 –"),
       PLANE, TIPS, FLAGS, CAPTION)

index = "index.html"
html = open(index, encoding="utf-8").read()
START, END = "      <!-- JOURNEY: start -->\n", "      <!-- JOURNEY: end -->\n"
if START in html:
    a, b = html.index(START), html.index(END) + len(END)
    html = html[:a] + FIGURE + html[b:]
else:
    anchor = '      <div class="chip-cluster" data-reveal style="margin-top: var(--space-5)">'
    assert anchor in html
    html = html.replace(anchor, FIGURE + anchor, 1)
open(index, "w", encoding="utf-8", newline="\n").write(html)
print("wrote", index, len(FIGURE), "bytes of figure")
