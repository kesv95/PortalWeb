from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import URLError
from urllib.request import Request, urlopen
from datetime import datetime
from xml.etree import ElementTree
from html.parser import HTMLParser
from urllib.parse import parse_qs, quote_plus, urljoin, urlparse
import json
import threading

HOST, PORT = "127.0.0.1", 8765
FEED_URL = "https://trends.google.com/trending/rss?geo={geo}"
YAHOO_TRENDS_URL = "https://search.yahoo.co.jp/?lang=1&sub=0"
YAHOO_REALTIME_URL = "https://search.yahoo.co.jp/realtime/"
cache = {}
cache_lock = threading.Lock()

class YahooTrendParser(HTMLParser):
    def __init__(self, target_heading="急上昇ワード"):
        super().__init__()
        self.target_heading = target_heading
        self.heading_tag = None
        self.heading_text = []
        self.in_heading = False
        self.capture = False
        self.anchor = None
        self.items = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in {"h1", "h2", "h3"}:
            self.heading_tag = tag
            self.heading_text = []
            self.in_heading = True
        if self.capture and tag == "a" and attrs.get("href"):
            self.anchor = {"url": urljoin(YAHOO_TRENDS_URL, attrs["href"]), "text": []}

    def handle_endtag(self, tag):
        if self.in_heading and tag == self.heading_tag:
            self.capture = self.target_heading in "".join(self.heading_text)
            self.in_heading = False
            self.heading_tag = None
        if tag == "a" and self.anchor:
            title = " ".join("".join(self.anchor["text"]).split())
            if title:
                self.items.append({"title": title, "url": self.anchor["url"]})
            self.anchor = None

    def handle_data(self, data):
        if self.in_heading:
            self.heading_text.append(data)
        if self.anchor is not None:
            self.anchor["text"].append(data)

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if urlparse(self.path).path == "/api/trends":
            self.serve_trends()
            return
        super().do_GET()

    def serve_trends(self):
        now = datetime.now().timestamp()
        query = parse_qs(urlparse(self.path).query)
        geo = query.get("geo", ["KR"])[0].upper()
        source = query.get("source", ["google"])[0].lower()
        if geo not in {"KR", "US", "JP"}:
            self.send_json({"error": "지원하지 않는 지역입니다."}, 400)
            return
        if source not in {"google", "yahoo"} or (source == "yahoo" and geo != "JP"):
            self.send_json({"error": "지원하지 않는 트렌드 출처입니다."}, 400)
            return
        with cache_lock:
            region_cache = cache.setdefault(f"{geo}:{source}", {"at": 0, "items": [], "history": []})
            if now - region_cache["at"] > 600 or not region_cache["items"]:
                try:
                    request_url = YAHOO_TRENDS_URL if source == "yahoo" else FEED_URL.format(geo=geo)
                    request = Request(request_url, headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                        "Accept-Language": "ja,en-US;q=0.8,en;q=0.6",
                    })
                    if source == "yahoo":
                        try:
                            with urlopen(request, timeout=8) as response:
                                payload = response.read()
                        except (URLError, TimeoutError, OSError):
                            payload = b""
                        parser = YahooTrendParser()
                        if payload:
                            parser.feed(payload.decode("utf-8", errors="replace"))
                        items = parser.items[:20]
                        feed_type = "web_search"
                        if not items:
                            fallback_request = Request(YAHOO_REALTIME_URL, headers={
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                                "Accept-Language": "ja,en-US;q=0.8,en;q=0.6",
                            })
                            with urlopen(fallback_request, timeout=8) as response:
                                fallback_payload = response.read()
                            fallback_parser = YahooTrendParser("トレンド")
                            fallback_parser.feed(fallback_payload.decode("utf-8", errors="replace"))
                            items = fallback_parser.items[:20]
                            feed_type = "realtime"
                        if not items:
                            raise ValueError("Yahoo! JAPANの公開トレンド一覧を読み取れませんでした。")
                    else:
                        with urlopen(request, timeout=8) as response:
                            payload = response.read()
                        root = ElementTree.fromstring(payload)
                        items = []
                        for node in root.findall(".//item"):
                            title = (node.findtext("title") or "").strip()
                            if title:
                                # Google Trends RSS item links point back to the feed itself.
                                language = {"KR": "ko", "US": "en", "JP": "ja"}[geo]
                                items.append({"title": title, "url": f"https://www.google.com/search?q={quote_plus(title)}&gl={geo}&hl={language}"})
                    history = [entry for entry in region_cache["history"] if entry["at"] >= now - 7200]
                    history.append({"at": now, "items": items})
                    region_cache.update(at=now, items=items, history=history, feed_type=feed_type if source == "yahoo" else "google")
                except (URLError, TimeoutError, ElementTree.ParseError, OSError, ValueError) as error:
                    if not region_cache["items"]:
                        service = "Yahoo! JAPAN" if source == "yahoo" else "Google Trends"
                        self.send_json({"error": f"{service} 연결 오류: {error}"}, 502)
                        return
            history = region_cache["history"]
            baseline = next((entry for entry in reversed(history) if entry["at"] <= now - 3600), None)
            previous_ranks = {item["title"]: index + 1 for index, item in enumerate(baseline["items"])} if baseline else {}
            items = []
            for index, item in enumerate(region_cache["items"]):
                old_rank = previous_ranks.get(item["title"])
                items.append({**item, "rank": index + 1, "change": (old_rank - (index + 1)) if old_rank else None})
            updated = datetime.fromtimestamp(region_cache["at"]).strftime("%H:%M")
            self.send_json({"items": items, "updated": updated, "comparisonReady": baseline is not None, "feedType": region_cache.get("feed_type", source)})

    def send_json(self, data, status=200):
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

if __name__ == "__main__":
    print(f"모아 로컬 포털 실행 중: http://{HOST}:{PORT}")
    print("종료하려면 Ctrl+C를 누르세요.")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
