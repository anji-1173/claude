# -*- coding: utf-8 -*-
# 使い方: python3 validate_pins.py <index.htmlのパス> <町字geoデータのディレクトリ>
#
# 町字geoデータは geolonia/japanese-addresses 形式のJSON
# （[{"town":"字○○","lat":..,"lng":..}, ...]）を市町村名.json で保存したもの。
# 取得例（GitHub Actions経由。セッションのプロキシからは直接届かないことが多い）:
#   curl -s "https://raw.githubusercontent.com/geolonia/japanese-addresses/master/api/ja/%E6%B2%96%E7%B8%84%E7%9C%8C/<市町村名>.json"
#
# チェック内容:
#   1) 全ピンの座標がユニークか（30m未満で重なる = 地図上で片方が完全に隠れる）
#   2) 住所の町字セントロイドから2.5km以上離れていないか
import json
import math
import os
import re
import sys
import unicodedata

NUM = {"一": "1", "二": "2", "三": "3", "四": "4", "五": "5",
       "六": "6", "七": "7", "八": "8", "九": "9", "十": "10"}


def norm(s):
    return unicodedata.normalize("NFKC", s).replace("ヶ", "ケ").replace("冨", "富")


def variants(town):
    t = norm(town).replace("字", "")
    v = {t}
    m = re.match(r"^(.+?)([一二三四五六七八九十]+)丁目$", t)
    if m:
        base, kanji = m.group(1), m.group(2)
        n = NUM.get(kanji, kanji)
        v |= {base + n, base + n + "丁目", base}
    return v


def dist_km(a_lat, a_lng, b_lat, b_lng):
    dx = (b_lng - a_lng) * 99.0 * math.cos(math.radians(a_lat))
    dy = (b_lat - a_lat) * 111.0
    return math.hypot(dx, dy)


def main():
    html_path, geo_dir = sys.argv[1], sys.argv[2]
    h = open(html_path, encoding="utf-8").read()
    gi = h.index("window.SHOP_GEO_DATA = {")
    gseg = h[gi:h.index("};", gi)]
    pins = [
        (m.group(1), float(m.group(2)), float(m.group(3)), m.group(4))
        for m in re.finditer(
            r'"([^"]{1,60})":\{"lat":([0-9.\-]+),"lng":([0-9.\-]+),"addr":"([^"]*)"\}',
            gseg,
        )
    ]
    print("総ピン数:", len(pins))

    # --- 1) 重複チェック（O(n^2)。店数が数千規模になったら空間分割を検討）
    close = []
    for i in range(len(pins)):
        for j in range(i + 1, len(pins)):
            d_km = dist_km(pins[i][1], pins[i][2], pins[j][1], pins[j][2])
            if d_km * 1000 < 30:
                close.append((pins[i][0], pins[j][0], round(d_km * 1000)))
    print("30m未満で重なるペア:", close if close else "なし")
    print("座標ユニーク数:", len({(p[1], p[2]) for p in pins}), "/", len(pins))

    # --- 2) 町字セントロイドとの距離チェック
    towns = {}
    for f in os.listdir(geo_dir):
        if f.endswith(".json") and not f.startswith("_"):
            towns[f[:-5]] = json.load(open(os.path.join(geo_dir, f), encoding="utf-8"))
    if not towns:
        print("(町字geoデータが見つからないため、距離チェックはスキップ)")
        return

    munis_sorted = sorted(towns, key=len, reverse=True)
    flagged = []
    for name, lat, lng, addr in pins:
        a = norm(re.sub(r"[（(].*?[）)]", "", addr)).replace("字", "")
        a = re.sub(r"^(沖縄県|国頭郡|中頭郡|島尻郡)", "", a)
        muni = next((m for m in munis_sorted if m in a), None)
        if not muni:
            flagged.append((name, addr, None, "市町村を判定できず"))
            continue
        rest = a.split(muni, 1)[1]
        km_m = re.match(r"^([^0-9\-（(]+)", rest)
        key = km_m.group(1).strip(" 　") if km_m else ""
        cho = re.match(r"^([^0-9（(]+?)([0-9]+)[-丁]", rest)
        best = None
        for t in towns[muni]:
            if t.get("lat") is None:
                continue
            cands = variants(t["town"])
            hit = key and any(
                key == c or (len(key) > 1 and (c.startswith(key) or key.startswith(c)))
                for c in cands
            )
            if not hit and cho:
                k2 = norm(cho.group(1).strip(" 　") + cho.group(2) + "丁目")
                hit = k2 in cands
            if hit:
                d = dist_km(lat, lng, t["lat"], t["lng"])
                if best is None or d < best[1]:
                    best = (t["town"], d)
        if best is None:
            flagged.append((name, addr, None, "町字[%s]がgeoデータに無し(%s)" % (key, muni)))
        elif best[1] > 2.5:
            flagged.append((name, addr, round(best[1], 2), "町字[%s]から%.2fkm" % (best[0], best[1])))

    print()
    print("=== 要確認（2.5km超 or 町字未照合）:", len(flagged))
    for name, addr, dist, why in sorted(flagged, key=lambda x: -(x[2] or 0)):
        print(f"  {name} | addr={addr} | {why}")


if __name__ == "__main__":
    main()
