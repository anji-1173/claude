# -*- coding: utf-8 -*-
# 使い方: python3 count_chars.py <index.htmlのパス> <店名>
# ARTICLES 内の指定店舗の記事から、地の文（段落文字列）だけを抜き出して文字数を数える。
# img/html/art-stars の要素は除外するので、実質の「書いた文章の量」が分かる。
import re
import sys


def main():
    path, name = sys.argv[1], sys.argv[2]
    h = open(path, encoding="utf-8").read()
    arts = h[h.index("const ARTICLES"):]
    key = '"%s":[' % name
    if key not in arts:
        print("記事が見つかりません: %s" % name)
        sys.exit(1)
    i = arts.index(key)
    end = arts.find("\n],", i)
    seg = arts[i:end]
    texts = re.findall(r'^"((?:[^"\\]|\\.)*)",?$', seg, re.M)
    plain = "".join(t for t in texts if not t.startswith("<span"))
    plain = re.sub(r"\\u[0-9a-f]{4}", "", plain)
    plain = plain.replace('\\"', '"')
    n = len(plain)
    print("%s: %d文字" % (name, n))
    if n < 2000:
        print("→ 目安の2000〜3000字に届いていません。書き足しを検討してください。")
    elif n > 3200:
        print("→ 目安の2000〜3000字をやや超えています。")
    else:
        print("→ 目安の範囲内です。")


if __name__ == "__main__":
    main()
