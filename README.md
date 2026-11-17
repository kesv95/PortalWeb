# 모아 — 로컬 개인 포털

브라우저에서 실행하는 개인용 시작 페이지입니다. 검색어를 Google, NAVER, Daum, Bing 중 원하는 포털로 보내고, Google Trends 대한민국 인기 검색어와 자주 가는 사이트를 한 화면에서 볼 수 있습니다.

## 실행 방법

Python 3가 설치된 상태에서 이 폴더에서 실행하세요.

```powershell
python server.py
```

그다음 브라우저에서 <http://127.0.0.1:8765>를 여세요. 종료는 터미널에서 `Ctrl+C`입니다.

## 기능

- 포털별 웹 검색 및 검색 기록(이 브라우저에 최근 12개 보관)
- 언어에 따라 한국 Google/NAVER, 미국 Google/Bing, 일본 Google/Yahoo! JAPAN 검색 포털 선택
- KR/EN/JP 지역별 Google Trends 및 Yahoo! JAPAN 급상승 검색어 (10분 캐시)
- 실행 중 수집한 약 1시간 전 순위와 비교한 상승·하락 표시
- GitHub Pages용 공개 트렌드 스냅샷 (GitHub Actions가 10분마다 갱신)
- 바로가기 추가·삭제 및 다크 테마
- 뉴스, 동영상, 이미지, 지도 바로가기
- 지역 날씨 검색, 네이버 사전 검색, 간편 계산기

검색은 선택한 외부 포털에서 열립니다. Google은 공개 Trends 피드를, Yahoo! JAPAN은 공개 웹 검색 급상승 목록을 사용합니다. 서버 메모리에 최근 순위 기록을 유지해 약 1시간 전 순위와 비교하며, 서버를 재시작하면 기록이 초기화됩니다. NAVER는 실시간 급상승 검색어 서비스를 종료했고, Bing의 공개 검색 API도 종료되어 두 서비스는 순위 목록 대신 안내와 외부 링크를 표시합니다.

GitHub Pages에서는 Python 서버를 실행할 수 없으므로, `.github/workflows/refresh-trends.yml`이 국가별 트렌드를 가져와 `trends-data` 브랜치에 게시합니다. 페이지는 이 공개 JSON 스냅샷을 읽습니다. 저장소의 GitHub Actions 실행이 허용되어 있어야 합니다.
"# PortalWeb" 
