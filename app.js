const $ = (selector) => document.querySelector(selector);
const engines = {
    google: (q) => `https://www.google.com/search?q=${q}`,
    naver: (q) => `https://search.naver.com/search.naver?query=${q}`,
    daum: (q) => `https://search.daum.net/search?w=tot&q=${q}`,
    bing: (q) => `https://www.bing.com/search?q=${q}`,
    yahoo: (q) => `https://search.yahoo.co.jp/search?p=${q}`
};
const defaults = [
    {name: 'Google', url: 'https://www.google.com'},
    {name: 'NAVER', url: 'https://www.naver.com'},
    {name: 'Daum', url: 'https://www.daum.net'},
    {name: 'YouTube', url: 'https://www.youtube.com'},
    {name: '지도', url: 'https://www.google.com/maps/'},
    {name: '뉴스', url: 'https://news.google.com/?hl=ko&gl=KR&ceid=KR:ko'},
    {name: 'Gmail', url: 'https://mail.google.com'},
    {name: '날씨', url: 'https://www.google.com/search?q=날씨'}
];
let links = JSON.parse(localStorage.getItem('moa-links') || 'null') || defaults;
let locale = ['ko', 'en', 'ja'].includes(localStorage.getItem('moa-locale')) ? localStorage.getItem('moa-locale') : 'ko';
let trendRequestId = 0;
const geoByLocale = {ko: 'KR', en: 'US', ja: 'JP'};
const copy = {
    ko: {
        title: '모아 — 나만의 로컬 포털', brand: '모아 홈', brandWord: '모아', brandMark: '모', navLabel: '바로가기', trendsNav: '실시간 이슈', quickNav: '바로가기', language: '언어 선택', theme: '테마 변경',
        eyebrow: '나만의 인터넷 시작 페이지', headline: '궁금한 것을 <span>모아</span>보세요', subtitle: '여러 검색 포털과 오늘의 이슈를 한곳에서', query: '무엇이 궁금하세요?', queryLabel: '검색어', engineLabel: '검색 포털', search: '검색', engineNav: '검색 포털 바로 선택', engineGoogle: 'Google', engineNaver: 'NAVER', engineBing: 'Bing', engineYahoo: 'Yahoo! JAPAN',
        trendKicker: "WHAT'S HAPPENING", trendTitle: '지금 많이 찾는 이슈', refresh: '이슈 새로고침', sourceLabel: '이슈 출처', trendNote: 'Google Trends 대한민국 인기 검색어 · 최근 1시간 순위 변화', loading: '이슈를 불러오는 중…',
        trendComparison: 'Google Trends 현재 순위를 약 1시간 전 저장된 순위와 비교했어요. 새 항목은 NEW로 표시됩니다.', trendWarmup: 'Google Trends 제공 순위예요. 순위 변화는 시작 후 1시간 정도 데이터가 쌓이면 표시됩니다.',
        trendError: '인기 검색어를 가져오지 못했어요.', fetchError: '트렌드를 가져오지 못했어요. 인터넷 연결을 확인한 뒤 새로고침해 주세요.', bingUnavailable: 'Bing은 공개 실시간 검색어 순위 데이터를 제공하지 않아 이곳에서 순위 목록을 표시할 수 없어요.', bingLink: 'Bing 뉴스 열기 ↗', bingNote: 'Microsoft의 공개 검색 트렌드 API가 종료되어 Bing 검색어 순위를 불러올 수 없습니다.', yahooNote: 'Yahoo! JAPAN 웹 검색의 급상승 검색어 · 최근 1시간 순위 변화', yahooRealtimeNote: 'Yahoo!リアルタイム検索의 화제 키워드 (SNS 트렌드)', yahooComparison: 'Yahoo! JAPAN의 현재 순위를 약 1시간 전 저장된 순위와 비교했어요.', yahooWarmup: 'Yahoo! JAPAN 순위 변화는 시작 후 1시간 정도 데이터가 쌓이면 표시됩니다.', yahooRealtimeComparison: 'Yahoo!リアルタイム検索의 트렌드 순위를 약 1시간 전과 비교했어요.', yahooRealtimeWarmup: 'SNS 트렌드 순위는 약 1시간의 데이터가 쌓인 뒤 변동을 표시합니다.',
        naverUnavailable: '네이버는 실시간 급상승 검색어 서비스를 종료해 현재 순위 데이터를 제공하지 않아요.', naverLink: '네이버 데이터랩 검색어 트렌드 열기 ↗', naverUpdated: 'NAVER 데이터랩', naverNote: '네이버 데이터랩에서 직접 키워드를 지정해 검색 추이를 확인할 수 있어요',
        exploreKicker: 'EXPLORE', exploreTitle: '주제별로 둘러보기', news: '뉴스', newsSub: '오늘의 주요 소식', videos: '동영상', videosSub: '영상 콘텐츠 검색', images: '이미지', imagesSub: '사진과 이미지 찾기', maps: '지도', mapsSub: '장소와 길 찾기',
        quickKicker: 'QUICK ACCESS', quickTitle: '바로가기', edit: '편집', done: '완료', name: '이름', address: '주소 (예: example.com)', add: '추가', quickNameLabel: '바로가기 이름', quickAddressLabel: '바로가기 주소', invalidUrl: '올바른 웹 주소를 입력해 주세요.',
        toolsKicker: 'LITTLE TOOLS', toolsTitle: '간편 도구', weather: '날씨', weatherSub: '지역 날씨 검색', calculator: '계산기', calculatorSub: '간단한 계산', dictionary: '사전', dictionaryMark: '가', dictionarySub: '단어 뜻 찾아보기',
        privacy: '검색어와 바로가기는<br><b>이 브라우저에만</b> 저장돼요.', footer: '모아 포털 <span>·</span> 개인용 로컬 시작 페이지 <span>·</span> 이슈 출처: Google Trends',
        calcTitle: '간편 계산기', calcInput: '예: (1200 + 3500) * 0.1', expressionLabel: '계산식', calcInitial: '계산 결과가 여기에 표시돼요', calculate: '계산하기', close: '닫기',
        weatherPrompt: '날씨를 확인할 지역을 입력해 주세요.', weatherTerm: '날씨', dictionaryPrompt: '뜻을 찾아볼 단어를 입력해 주세요.', calcInvalid: '숫자와 + − × ÷ 괄호만 입력해 주세요.', calcResult: '결과:', calcImpossible: '계산할 수 없는 식이에요.', calcCheck: '계산식을 확인해 주세요.', updated: '업데이트',
        defaultNames: {지도: '지도', 뉴스: '뉴스', 날씨: '날씨'}
    },
    en: {
        title: 'Moa — Your Personal Portal', brand: 'Moa home', brandWord: 'Moa', brandMark: 'M', navLabel: 'Navigation', trendsNav: 'Trending', quickNav: 'Quick access', language: 'Choose language', theme: 'Change theme',
        eyebrow: 'Your personal start page', headline: 'Explore with <span>Moa</span>', subtitle: "Search across portals and explore today's trends in one place", query: 'What are you curious about?', queryLabel: 'Search query', engineLabel: 'Search engine', search: 'Search', engineNav: 'Choose a search engine', engineGoogle: 'Google', engineNaver: 'NAVER', engineBing: 'Bing', engineYahoo: 'Yahoo! JAPAN',
        trendKicker: "WHAT'S HAPPENING", trendTitle: 'Trending now', refresh: 'Refresh trends', sourceLabel: 'Trend source', trendNote: 'Google Trends · United States · Rank changes over the past hour', loading: 'Loading trends…',
        trendComparison: 'Current Google Trends ranks compared with a snapshot from about one hour ago. New terms are marked NEW.', trendWarmup: 'Rank changes will appear after about an hour of data has been collected.',
        trendError: 'Could not load trending searches.', fetchError: 'Could not load trends. Check your connection and refresh the page.', bingUnavailable: 'Bing does not provide a public live search-ranking feed, so its search keywords cannot be ranked here.', bingLink: 'Open Bing News ↗', bingNote: 'Microsoft retired its public Bing Search APIs, so live Bing search rankings are unavailable.', yahooNote: 'Yahoo! JAPAN rising web searches · Rank changes over the past hour', yahooRealtimeNote: 'Yahoo! JAPAN Real-Time Search topics (social trends)', yahooComparison: 'Current Yahoo! JAPAN ranks compared with a snapshot from about one hour ago.', yahooWarmup: 'Yahoo! JAPAN rank changes will appear after about an hour of data has been collected.', yahooRealtimeComparison: 'Yahoo! JAPAN Real-Time Search ranks compared with a snapshot from about one hour ago.', yahooRealtimeWarmup: 'Social trend rank changes appear after about an hour of data has been collected.',
        naverUnavailable: 'NAVER no longer provides real-time trending search rankings.', naverLink: 'Open NAVER DataLab search trends ↗', naverUpdated: 'NAVER DataLab', naverNote: 'Explore search trends in NAVER DataLab by choosing your own keywords.',
        exploreKicker: 'EXPLORE', exploreTitle: 'Explore by topic', news: 'News', newsSub: "Today's top stories", videos: 'Videos', videosSub: 'Search video content', images: 'Images', imagesSub: 'Find photos and images', maps: 'Maps', mapsSub: 'Find places and directions',
        quickKicker: 'QUICK ACCESS', quickTitle: 'Quick access', edit: 'Edit', done: 'Done', name: 'Name', address: 'Address (e.g. example.com)', add: 'Add', quickNameLabel: 'Shortcut name', quickAddressLabel: 'Shortcut address', invalidUrl: 'Enter a valid web address.',
        toolsKicker: 'LITTLE TOOLS', toolsTitle: 'Handy tools', weather: 'Weather', weatherSub: 'Search local weather', calculator: 'Calculator', calculatorSub: 'Quick calculations', dictionary: 'Dictionary', dictionaryMark: 'A', dictionarySub: 'Look up a word',
        privacy: 'Searches and shortcuts are<br>stored <b>only in this browser</b>.', footer: 'Moa Portal <span>·</span> Personal start page <span>·</span> Trends by Google Trends',
        calcTitle: 'Calculator', calcInput: 'e.g. (1200 + 3500) * 0.1', expressionLabel: 'Expression', calcInitial: 'Your result will appear here', calculate: 'Calculate', close: 'Close',
        weatherPrompt: 'Enter a location for the weather.', weatherTerm: 'weather', dictionaryPrompt: 'Enter a word to look up.', calcInvalid: 'Use numbers, + − × ÷, and parentheses only.', calcResult: 'Result:', calcImpossible: 'This expression cannot be calculated.', calcCheck: 'Check the expression and try again.', updated: 'updated',
        defaultNames: {지도: 'Maps', 뉴스: 'News', 날씨: 'Weather'}
    },
    ja: {
        title: 'モア — あなたのポータル', brand: 'モア ホーム', brandWord: 'モア', brandMark: 'モ', navLabel: 'ナビゲーション', trendsNav: 'トレンド', quickNav: 'クイックアクセス', language: '言語を選択', theme: 'テーマを変更',
        eyebrow: '自分だけのインターネットスタートページ', headline: '気になることを<span>モア</span>で', subtitle: '複数の検索ポータルと今日の話題をひとつの場所に', query: '何を調べますか？', queryLabel: '検索キーワード', engineLabel: '検索ポータル', search: '検索', engineNav: '検索ポータルを選択', engineGoogle: 'Google', engineNaver: 'NAVER', engineBing: 'Bing', engineYahoo: 'Yahoo! JAPAN',
        trendKicker: "WHAT'S HAPPENING", trendTitle: 'いま注目の話題', refresh: 'トレンドを更新', sourceLabel: 'トレンドの出典', trendNote: 'Google Trends · 日本 · 過去1時間の順位変動', loading: 'トレンドを読み込み中…',
        trendComparison: 'Google Trendsの現在の順位を約1時間前の記録と比較しています。新しい検索語にはNEWと表示します。', trendWarmup: '順位変動は、データが約1時間蓄積されると表示されます。',
        trendError: '急上昇中の検索語を取得できませんでした。', fetchError: 'トレンドを取得できません。接続を確認してページを更新してください。', bingUnavailable: 'Bingは公開中のリアルタイム検索ランキングを提供していないため、ここに順位を表示できません。', bingLink: 'Bingニュースを開く ↗', bingNote: 'Microsoftの公開Bing Search APIは終了しており、Bingの検索順位を取得できません。', yahooNote: 'Yahoo! JAPAN ウェブ検索の急上昇ワード · 過去1時間の順位変動', yahooRealtimeNote: 'Yahoo!リアルタイム検索のトレンドワード（SNS上の話題）', yahooComparison: 'Yahoo! JAPANの現在の順位を約1時間前の記録と比較しています。', yahooWarmup: 'Yahoo! JAPANの順位変動は、データが約1時間蓄積されると表示されます。', yahooRealtimeComparison: 'Yahoo!リアルタイム検索の順位を約1時間前の記録と比較しています。', yahooRealtimeWarmup: 'SNSトレンドの順位変動は、約1時間分のデータが蓄積されると表示されます。',
        naverUnavailable: 'NAVERはリアルタイム急上昇検索語の提供を終了しました。', naverLink: 'NAVERデータラボの検索トレンドを開く ↗', naverUpdated: 'NAVER データラボ', naverNote: 'NAVERデータラボでキーワードを指定して検索傾向を確認できます。',
        exploreKicker: 'EXPLORE', exploreTitle: 'トピックから探す', news: 'ニュース', newsSub: '今日の主なニュース', videos: '動画', videosSub: '動画を検索', images: '画像', imagesSub: '写真や画像を検索', maps: '地図', mapsSub: '場所やルートを検索',
        quickKicker: 'QUICK ACCESS', quickTitle: 'クイックアクセス', edit: '編集', done: '完了', name: '名前', address: 'URL (例: example.com)', add: '追加', quickNameLabel: 'ショートカット名', quickAddressLabel: 'ショートカットURL', invalidUrl: '有効なウェブアドレスを入力してください。',
        toolsKicker: 'LITTLE TOOLS', toolsTitle: '便利なツール', weather: '天気', weatherSub: '地域の天気を検索', calculator: '電卓', calculatorSub: 'かんたんな計算', dictionary: '辞書', dictionaryMark: '辞', dictionarySub: '単語の意味を調べる',
        privacy: '検索語とショートカットは<br><b>このブラウザー内のみ</b>に保存されます。', footer: 'モア ポータル <span>·</span> 個人用スタートページ <span>·</span> トレンド提供: Google Trends',
        calcTitle: '電卓', calcInput: '例: (1200 + 3500) * 0.1', expressionLabel: '計算式', calcInitial: '計算結果がここに表示されます', calculate: '計算する', close: '閉じる',
        weatherPrompt: '天気を調べる地域を入力してください。', weatherTerm: '天気', dictionaryPrompt: '意味を調べる単語を入力してください。', calcInvalid: '数字と + − × ÷、括弧のみ入力できます。', calcResult: '結果:', calcImpossible: '計算できない式です。', calcCheck: '計算式を確認してください。', updated: '更新',
        defaultNames: {지도: '地図', 뉴스: 'ニュース', 날씨: '天気'}
    }
};

function applyLocale() {
    const text = copy[locale];
    document.documentElement.lang = locale === 'ja' ? 'ja' : locale;
    document.title = text.title;
    $('.brand').setAttribute('aria-label', text.brand);
    $('.brand-mark').textContent = text.brandMark;
    $('.brand > span:last-child').textContent = text.brandWord;
    $('.top-links').setAttribute('aria-label', text.navLabel);
    $('.top-links a[href="#trends"]').textContent = text.trendsNav;
    $('.top-links a[href="#quick"]').textContent = text.quickNav;
    $('.language-switch').setAttribute('aria-label', text.language);
    $('#themeButton').setAttribute('aria-label', text.theme);
    $('#themeButton').title = text.theme;
    $('.eyebrow').lastChild.textContent = ` ${text.eyebrow}`;
    $('h1').innerHTML = text.headline;
    $('.subtitle').textContent = text.subtitle;
    $('#query').placeholder = text.query;
    $('#query').setAttribute('aria-label', text.queryLabel);
    $('#engine').setAttribute('aria-label', text.engineLabel);
    const engineChoices = locale === 'ko'
        ? [{id: 'google', label: text.engineGoogle, mark: 'G', icon: 'g-icon'}, {id: 'naver', label: text.engineNaver, mark: 'N', icon: 'n-icon'}]
        : locale === 'en'
            ? [{id: 'google', label: text.engineGoogle, mark: 'G', icon: 'g-icon'}, {id: 'bing', label: text.engineBing, mark: 'b', icon: 'b-icon'}]
            : [{id: 'google', label: text.engineGoogle, mark: 'G', icon: 'g-icon'}, {id: 'yahoo', label: text.engineYahoo, mark: 'Y', icon: 'y-icon'}];
    $('#engine').innerHTML = engineChoices.map((engine) => `<option value="${engine.id}">${engine.label}</option>`).join('');
    $('#engine').value = 'google';
    $('.engine-pills').innerHTML = engineChoices.map((engine, index) => `<button data-engine="${engine.id}" class="engine-pill${index === 0 ? ' selected' : ''}"><span class="${engine.icon}">${engine.mark}</span> ${engine.label}</button>`).join('');
    $('#searchForm button').firstChild.nodeValue = `${text.search} `;
    $('#searchForm button').setAttribute('aria-label', text.search);
    $('.engine-pills').setAttribute('aria-label', text.engineNav);
    $('.trend-panel .kicker').textContent = text.trendKicker;
    $('.trend-panel h2').textContent = text.trendTitle;
    $('#refreshTrends').setAttribute('aria-label', text.refresh);
    $('#refreshTrends').title = text.refresh;
    $('.trend-sources').setAttribute('aria-label', text.sourceLabel);
    $('#trendNote').textContent = text.trendNote;
    const trendSources = locale === 'ko'
        ? [{id: 'google', label: 'Google'}, {id: 'naver', label: 'NAVER'}]
        : locale === 'en'
            ? [{id: 'google', label: 'Google'}, {id: 'bing', label: 'Bing'}]
            : [{id: 'google', label: 'Google'}, {id: 'yahoo', label: 'Yahoo! JAPAN'}];
    $('.trend-sources').innerHTML = trendSources.map((source, index) => `<button class="trend-source${index === 0 ? ' selected' : ''}" type="button" role="tab" aria-selected="${index === 0}" data-source="${source.id}">${source.label}</button>`).join('');
    $('.news-panel .kicker').textContent = text.exploreKicker;
    $('.news-panel h2').textContent = text.exploreTitle;
    const topicCards = document.querySelectorAll('.topic-card');
    [[text.news, text.newsSub], [text.videos, text.videosSub], [text.images, text.imagesSub], [text.maps, text.mapsSub]].forEach(([title, subtitle], i) => {
        topicCards[i].querySelector('b').textContent = title;
        topicCards[i].querySelector('small').textContent = subtitle;
    });
    $('.quick-panel .kicker').textContent = text.quickKicker;
    $('.quick-panel h2').textContent = text.quickTitle;
    $('#editLinks').textContent = $('#quickLinks').classList.contains('editing') ? text.done : text.edit;
    $('#linkName').placeholder = text.name;
    $('#linkName').setAttribute('aria-label', text.quickNameLabel);
    $('#linkUrl').placeholder = text.address;
    $('#linkUrl').setAttribute('aria-label', text.quickAddressLabel);
    $('#addLinkForm button').textContent = text.add;
    $('.tools-panel .kicker').textContent = text.toolsKicker;
    $('.tools-panel h2').textContent = text.toolsTitle;
    [['#weatherTool', text.weather, text.weatherSub], ['#calcTool', text.calculator, text.calculatorSub], ['#dictionaryTool', text.dictionary, text.dictionarySub]].forEach(([selector, title, subtitle]) => {
        $(selector).querySelector('b').textContent = title;
        $(selector).querySelector('small').textContent = subtitle;
    });
    $('#dictionaryTool .tool-icon').textContent = text.dictionaryMark;
    $('.privacy-note p').innerHTML = text.privacy;
    $('footer').innerHTML = text.footer;
    $('#calcDialog .dialog-close').setAttribute('aria-label', text.close);
    $('#calcDialog h2').textContent = text.calcTitle;
    $('#calcInput').placeholder = text.calcInput;
    $('#calcInput').setAttribute('aria-label', text.expressionLabel);
    $('#calcResult').textContent = text.calcInitial;
    $('#calculate').textContent = text.calculate;
    document.querySelectorAll('.language-button').forEach((button) => {
        const selected = button.dataset.locale === locale;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', String(selected));
    });
    renderLinks();
}

document.querySelectorAll('.language-button').forEach((button) => button.addEventListener('click', () => {
    locale = button.dataset.locale;
    localStorage.setItem('moa-locale', locale);
    applyLocale();
    loadTrends();
}));

function goSearch(query, engine = $('#engine').value) {
    const q = encodeURIComponent(query.trim());
    if (!q) {
        $('#query').focus();
        return;
    }
    const history = JSON.parse(localStorage.getItem('moa-history') || '[]');
    localStorage.setItem('moa-history', JSON.stringify([query.trim(), ...history.filter((x) => x !== query.trim())].slice(0, 12)));
    window.open(engines[engine](q), '_blank', 'noopener');
}

$('#searchForm').addEventListener('submit', (event) => {
    event.preventDefault();
    goSearch($('#query').value);
});
$('.engine-pills').addEventListener('click', (event) => {
    const pill = event.target.closest('.engine-pill');
    if (!pill) return;
    $('#engine').value = pill.dataset.engine;
    document.querySelectorAll('.engine-pill').forEach((item) => item.classList.toggle('selected', item === pill));
    $('#query').focus();
});

function renderLinks() {
    const root = $('#quickLinks');
    root.innerHTML = '';
    links.forEach((item, index) => {
        const a = document.createElement('a');
        a.className = 'quick-item';
        a.href = item.url;
        a.target = '_blank';
        a.rel = 'noopener';
        const isDefault = defaults.some((defaultItem) => defaultItem.name === item.name && defaultItem.url === item.url);
        const displayName = isDefault ? (copy[locale].defaultNames[item.name] || item.name) : item.name;
        const icon = document.createElement('span');
        icon.className = 'site-icon';
        icon.textContent = displayName.trim().slice(0, 1).toUpperCase();
        const label = document.createElement('span');
        label.textContent = displayName;
        const remove = document.createElement('button');
        remove.className = 'remove-link';
        remove.textContent = '×';
        remove.type = 'button';
        remove.setAttribute('aria-label', locale === 'en' ? `Remove ${displayName}` : locale === 'ja' ? `${displayName}を削除` : `${displayName} 삭제`);
        remove.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            links.splice(index, 1);
            saveLinks();
        });
        a.append(icon, label, remove);
        root.append(a);
    });
}

function saveLinks() {
    localStorage.setItem('moa-links', JSON.stringify(links));
    renderLinks();
}

applyLocale();
$('#editLinks').addEventListener('click', () => {
    const editing = $('#quickLinks').classList.toggle('editing');
    $('#editLinks').textContent = editing ? copy[locale].done : copy[locale].edit;
    $('#addLinkForm').hidden = !editing;
});
$('#addLinkForm').addEventListener('submit', (event) => {
    event.preventDefault();
    let url = $('#linkUrl').value.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    try {
        const parsed = new URL(url);
        if (!parsed.hostname.includes('.')) throw new Error();
    } catch {
        $('#linkUrl').setCustomValidity(copy[locale].invalidUrl);
        $('#linkUrl').reportValidity();
        return;
    }
    $('#linkUrl').setCustomValidity('');
    links.push({name: $('#linkName').value.trim(), url});
    saveLinks();
    event.target.reset();
});

async function loadTrends() {
    const requestId = ++trendRequestId;
    const list = $('#trendList');
    const message = $('#trendMessage');
    const source = document.querySelector('.trend-source.selected')?.dataset.source || 'google';
    const text = copy[locale];
    if (source === 'naver') {
        list.innerHTML = '';
        const li = document.createElement('li');
        li.className = 'naver-unavailable';
        const explanation = document.createElement('span');
        explanation.textContent = text.naverUnavailable;
        const link = document.createElement('a');
        link.href = 'https://datalab.naver.com/keyword/trendSearch.naver';
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = text.naverLink;
        li.append(explanation, link);
        list.append(li);
        $('#updatedAt').textContent = text.naverUpdated;
        $('#trendNote').textContent = text.naverNote;
        message.hidden = true;
        $('#refreshTrends').classList.remove('spinning');
        return;
    }
    if (source === 'bing') {
        list.innerHTML = '';
        const li = document.createElement('li');
        li.className = 'naver-unavailable';
        const explanation = document.createElement('span');
        explanation.textContent = text.bingUnavailable;
        const link = document.createElement('a');
        link.href = 'https://www.bing.com/news';
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = text.bingLink;
        li.append(explanation, link);
        list.append(li);
        $('#updatedAt').textContent = 'Bing';
        $('#trendNote').textContent = text.bingNote;
        message.hidden = true;
        $('#refreshTrends').classList.remove('spinning');
        return;
    }
    $('#trendNote').textContent = source === 'yahoo' ? text.yahooNote : text.trendNote;
    list.innerHTML = `<li class="loading">${text.loading}</li>`;
    message.hidden = true;
    $('#refreshTrends').classList.add('spinning');
    try {
        const response = await fetch(`/api/trends?geo=${geoByLocale[locale]}&source=${source}`);
        const data = await response.json();
        if (requestId !== trendRequestId) return;
        if (!response.ok) throw new Error(text.fetchError);
        const yahooRealtimeFallback = source === 'yahoo' && data.feedType === 'realtime';
        if (source === 'yahoo') $('#trendNote').textContent = yahooRealtimeFallback ? text.yahooRealtimeNote : text.yahooNote;
        list.innerHTML = '';
        if (!data.items?.length) throw new Error(text.trendError);
        data.items.slice(0, 10).forEach((item, index) => {
            const li = document.createElement('li');
            const rank = document.createElement('span');
            rank.className = 'rank';
            rank.textContent = String(index + 1).padStart(2, '0');
            const link = document.createElement('a');
            link.className = 'trend-term';
            const titleChars = Array.from(item.title);
            link.textContent = titleChars.length > 28 ? `${titleChars.slice(0, 28).join('')}…` : item.title;
            link.title = item.title;
            link.href = item.url;
            link.target = '_blank';
            link.rel = 'noopener';
            const arrow = document.createElement('span');
            arrow.className = 'trend-arrow';
            if (!data.comparisonReady) {
                arrow.textContent = '·';
                arrow.classList.add('trend-new');
            } else if (item.change === null) {
                arrow.textContent = locale === 'ja' ? '新着' : locale === 'en' ? 'NEW' : '신규';
                arrow.classList.add('trend-new');
            } else if (item.change > 0) {
                arrow.textContent = `↑ ${item.change}`;
                arrow.classList.add('trend-up');
            } else if (item.change < 0) {
                arrow.textContent = `↓ ${Math.abs(item.change)}`;
                arrow.classList.add('trend-down');
            } else {
                arrow.textContent = '—';
            }
            li.append(rank, link, arrow);
            list.append(li);
        });
        $('#updatedAt').textContent = data.updated ? `${data.updated} ${text.updated}` : text.updated;
        message.textContent = source === 'yahoo'
            ? (yahooRealtimeFallback
                ? (data.comparisonReady ? text.yahooRealtimeComparison : text.yahooRealtimeWarmup)
                : (data.comparisonReady ? text.yahooComparison : text.yahooWarmup))
            : (data.comparisonReady ? text.trendComparison : text.trendWarmup);
        message.hidden = false;
    } catch (error) {
        if (requestId !== trendRequestId) return;
        list.innerHTML = `<li class="loading">${text.trendError}</li>`;
        message.textContent = text.fetchError;
        message.hidden = false;
    } finally {
        if (requestId === trendRequestId) $('#refreshTrends').classList.remove('spinning');
    }
}

$('#refreshTrends').addEventListener('click', loadTrends);
$('.trend-sources').addEventListener('click', (event) => {
    const button = event.target.closest('.trend-source');
    if (!button) return;
    document.querySelectorAll('.trend-source').forEach((item) => {
        const selected = item === button;
        item.classList.toggle('selected', selected);
        item.setAttribute('aria-selected', String(selected));
    });
    loadTrends();
});
loadTrends();
setInterval(() => {
    if (document.visibilityState === 'visible' && ['google', 'yahoo'].includes(document.querySelector('.trend-source.selected')?.dataset.source)) loadTrends();
}, 10 * 60 * 1000);

$('#weatherTool').addEventListener('click', () => {
    const place = prompt(copy[locale].weatherPrompt, locale === 'ja' ? '東京' : locale === 'en' ? 'New York' : '서울');
    if (place) window.open(`https://www.google.com/search?q=${encodeURIComponent(locale === 'en' ? `weather in ${place}` : `${place} ${copy[locale].weatherTerm}`)}`, '_blank', 'noopener');
});
$('#dictionaryTool').addEventListener('click', () => {
    const word = prompt(copy[locale].dictionaryPrompt);
    if (word) window.open(`https://dict.naver.com/search.nhn?query=${encodeURIComponent(word)}`, '_blank', 'noopener');
});
$('#calcTool').addEventListener('click', () => $('#calcDialog').showModal());

function calculate() {
    const expression = $('#calcInput').value.trim();
    if (!/^[\d\s()+\-*/.%]+$/.test(expression)) {
        $('#calcResult').textContent = copy[locale].calcInvalid;
        return;
    }
    try {
        const value = Function(`"use strict"; return (${expression.replace(/%/g, '/100')})`)();
        $('#calcResult').textContent = Number.isFinite(value) ? `${copy[locale].calcResult} ${Number(value.toPrecision(10))}` : copy[locale].calcImpossible;
    } catch {
        $('#calcResult').textContent = copy[locale].calcCheck;
    }
}

$('#calculate').addEventListener('click', calculate);
$('#calcInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') calculate();
});
$('#themeButton').addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('moa-dark', document.documentElement.classList.contains('dark') ? '1' : '0');
});
if (localStorage.getItem('moa-dark') === '1') document.documentElement.classList.add('dark');
