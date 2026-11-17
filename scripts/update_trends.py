"""Fetch the public trend sources for the static GitHub Pages build."""

from datetime import datetime, timezone
from pathlib import Path
from urllib.error import URLError
from urllib.parse import quote_plus
from urllib.request import Request, urlopen
from xml.etree import ElementTree
import argparse
import json
import subprocess
import time

from server import FEED_URL, YAHOO_REALTIME_URL, YAHOO_TRENDS_URL, YahooTrendParser

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
FEEDS = {"KR:google": "KR", "US:google": "US", "JP:google": "JP", "JP:yahoo": "JP"}


def fetch_bytes(url):
    request = Request(url, headers={
        "User-Agent": USER_AGENT,
        "Accept": "application/rss+xml,application/xml,text/html;q=0.9,*/*;q=0.8",
        "Accept-Language": "ja,en-US;q=0.8,en;q=0.6",
    })
    with urlopen(request, timeout=15) as response:
        return response.read()


def fetch_google(geo):
    root = ElementTree.fromstring(fetch_bytes(FEED_URL.format(geo=geo)))
    language = {"KR": "ko", "US": "en", "JP": "ja"}[geo]
    items = []
    for node in root.findall(".//item"):
        title = (node.findtext("title") or "").strip()
        if title:
            items.append({
                "title": title,
                "url": f"https://www.google.com/search?q={quote_plus(title)}&gl={geo}&hl={language}",
            })
    if not items:
        raise ValueError(f"Google Trends returned no items for {geo}")
    return items, "google"


def parse_yahoo(payload, target="急上昇ワード"):
    parser = YahooTrendParser(target)
    parser.feed(payload.decode("utf-8", errors="replace"))
    return parser.items[:20]


def fetch_yahoo():
    items = []
    try:
        items = parse_yahoo(fetch_bytes(YAHOO_TRENDS_URL))
    except (URLError, TimeoutError, OSError):
        pass
    if items:
        return items, "web_search"
    items = parse_yahoo(fetch_bytes(YAHOO_REALTIME_URL), "トレンド")
    if not items:
        raise ValueError("Yahoo! JAPAN returned no public trend items")
    return items, "realtime"


def load_previous(ref):
    if not ref:
        return {}
    try:
        result = subprocess.run(
            ["git", "show", f"{ref}:trends.json"],
            check=True,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        return json.loads(result.stdout)
    except (subprocess.CalledProcessError, json.JSONDecodeError):
        return {}


def rank_items(items, history, now):
    baseline = next((entry for entry in reversed(history) if entry["at"] <= now - 3600), None)
    previous_ranks = {title: rank for rank, title in enumerate(baseline["titles"], start=1)} if baseline else {}
    result = []
    for rank, item in enumerate(items, start=1):
        old_rank = previous_ranks.get(item["title"])
        result.append({**item, "rank": rank, "change": old_rank - rank if old_rank else None})
    return result, baseline is not None


def update(previous, now):
    previous_feeds = previous.get("feeds", {})
    previous_history = previous.get("history", {})
    feeds = {}
    histories = {}

    for key, geo in FEEDS.items():
        old_feed = previous_feeds.get(key, {})
        history = [entry for entry in previous_history.get(key, []) if entry.get("at", 0) >= now - 7200]
        if not history and old_feed.get("items"):
            history.append({"at": now - 3600, "titles": [item["title"] for item in old_feed["items"]]})
        try:
            raw_items, feed_type = fetch_yahoo() if key == "JP:yahoo" else fetch_google(geo)
            titles = [item["title"] for item in raw_items]
            if not history or now - history[-1]["at"] >= 600:
                history.append({"at": now, "titles": titles})
            updated = datetime.fromtimestamp(now, timezone.utc).strftime("%H:%M")
        except (URLError, TimeoutError, OSError, ElementTree.ParseError, ValueError) as error:
            print(f"Could not refresh {key}: {error}")
            raw_items = [{"title": item["title"], "url": item["url"]} for item in old_feed.get("items", [])]
            feed_type = old_feed.get("feedType", "google")
            updated = old_feed.get("updated", "")
            if not raw_items:
                history = []

        items, comparison_ready = rank_items(raw_items, history, now)
        feeds[key] = {
            "items": items,
            "updated": updated,
            "comparisonReady": comparison_ready,
            "feedType": feed_type,
        }
        histories[key] = history[-24:]

    return {
        "generatedAt": datetime.fromtimestamp(now, timezone.utc).isoformat(),
        "feeds": feeds,
        "history": histories,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--previous-ref", default="")
    parser.add_argument("--output", default="trends.json")
    args = parser.parse_args()
    data = update(load_previous(args.previous_ref), time.time())
    Path(args.output).write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


if __name__ == "__main__":
    main()
