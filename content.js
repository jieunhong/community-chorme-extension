(() => {
    'use strict';

    /* ──────────────────────────────────────────────
       Config
    ────────────────────────────────────────────── */
    const COMMUNITY_DOMAINS = [
        { domain: 'namu.wiki', name: '나무위키', icon: '🌳' },
        { domain: 'dcinside.com', name: '디시인사이드', icon: '🎮' },
        { domain: 'theqoo.net', name: '더쿠', icon: '✨' },
        { domain: 'ppomppu.co.kr', name: '뽐뿌', icon: '💰' },
        { domain: 'blind.com', name: '블라인드', icon: '💼' },
        { domain: 'reddit.com', name: 'Reddit', icon: '🤖' },
    ];

    const MAX_RESULTS = 8;
    const SIDEBAR_ID = 'community-filter-sidebar';

    /* ──────────────────────────────────────────────
       Helpers
    ────────────────────────────────────────────── */

    /** 현재 구글 검색어를 URL 파라미터에서 추출 */
    function getSearchQuery() {
        const params = new URLSearchParams(window.location.search);
        return params.get('q') || '';
    }

    /**
     * 주어진 URL 문자열에서 호스트를 추출한 뒤,
     * COMMUNITY_DOMAINS 목록에 포함되는 도메인을 반환합니다.
     */
    function matchCommunityDomain(href) {
        try {
            const hostname = new URL(href).hostname;
            return COMMUNITY_DOMAINS.find(
                (c) => hostname === c.domain || hostname.endsWith('.' + c.domain)
            ) || null;
        } catch {
            return null;
        }
    }

    /**
     * 구글 검색 결과 DOM에서 커뮤니티 게시글을 추출합니다.
     * 구조: <a href="..."><h3>제목</h3></a>
     */
    function extractCommunityResults() {
        const results = [];
        const anchors = document.querySelectorAll('a');

        for (const anchor of anchors) {
            const h3 = anchor.querySelector('h3');
            if (!h3) continue;

            const href = anchor.href;
            if (!href) continue;

            const community = matchCommunityDomain(href);
            if (!community) continue;

            const title = h3.textContent.trim();
            if (!title) continue;

            // 중복 URL 방지
            if (results.some((r) => r.href === href)) continue;

            results.push({ title, href, domain: community.domain });

            if (results.length >= MAX_RESULTS) break;
        }

        return results;
    }

    /**
     * 검색 결과가 없는 커뮤니티 목록 반환
     */
    function getMissingCommunities(results) {
        const foundDomains = new Set(results.map((r) => r.domain));
        return COMMUNITY_DOMAINS.filter((c) => !foundDomains.has(c.domain));
    }

    /* ──────────────────────────────────────────────
       Sidebar 생성
    ────────────────────────────────────────────── */

    const MINI_BTN_ID = 'community-filter-mini-btn';

    function createSidebar(results, defaultOpen) {
        // 중복 생성 방지
        const existing = document.getElementById(SIDEBAR_ID);
        if (existing) existing.remove();
        const existingBtn = document.getElementById(MINI_BTN_ID);
        if (existingBtn) existingBtn.remove();

        const searchQuery = getSearchQuery();
        const sidebar = document.createElement('div');
        sidebar.id = SIDEBAR_ID;

        // ── 최소화 버튼 (별도 요소 — 사이드바가 숨겨질 때 표시) ──
        const miniBtn = document.createElement('button');
        miniBtn.id = MINI_BTN_ID;
        miniBtn.className = 'cf-mini-btn';
        miniBtn.innerHTML = '💬';
        miniBtn.title = '커뮤니티 반응 열기';
        miniBtn.addEventListener('click', () => {
            sidebar.style.display = '';
            miniBtn.style.display = 'none';
        });

        // 기본 상태 적용
        if (defaultOpen) {
            sidebar.style.display = '';
            miniBtn.style.display = 'none';
        } else {
            sidebar.style.display = 'none';
            miniBtn.style.display = '';
        }

        // ── Header ──
        const header = document.createElement('div');
        header.className = 'cf-header';

        const headerLeft = document.createElement('div');
        headerLeft.className = 'cf-header-left';

        const titleEl = document.createElement('h2');
        titleEl.className = 'cf-header-title';
        titleEl.textContent = '커뮤니티 반응';
        headerLeft.appendChild(titleEl);

        if (results.length > 0) {
            const badge = document.createElement('span');
            badge.className = 'cf-badge';
            badge.textContent = results.length;
            headerLeft.appendChild(badge);
        }

        header.appendChild(headerLeft);

        // 최소화 버튼
        const collapseBtn = document.createElement('button');
        collapseBtn.className = 'cf-collapse-btn';
        collapseBtn.innerHTML = '✕';
        collapseBtn.title = '최소화';
        collapseBtn.addEventListener('click', () => {
            sidebar.style.display = 'none';
            miniBtn.style.display = '';
        });
        header.appendChild(collapseBtn);

        sidebar.appendChild(header);

        // ── Body (스크롤 가능한 영역) ──
        const body = document.createElement('div');
        body.className = 'cf-body';

        if (results.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'cf-empty';
            empty.textContent = '커뮤니티 결과 없음';
            body.appendChild(empty);
        } else {
            const ul = document.createElement('ul');
            ul.className = 'cf-list';

            for (const item of results) {
                const community = COMMUNITY_DOMAINS.find((c) => c.domain === item.domain);
                const li = document.createElement('li');
                li.className = 'cf-list-item';

                const a = document.createElement('a');
                a.className = 'cf-link';
                a.href = item.href;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';

                const titleSpan = document.createElement('span');
                titleSpan.textContent = item.title;
                a.appendChild(titleSpan);

                const domainSpan = document.createElement('span');
                domainSpan.className = 'cf-link-domain';
                domainSpan.setAttribute('data-domain', item.domain);
                domainSpan.textContent = community ? `${community.icon} ${community.name}` : item.domain;
                a.appendChild(domainSpan);

                li.appendChild(a);
                ul.appendChild(li);
            }

            body.appendChild(ul);
        }

        sidebar.appendChild(body);

        // ── Footer — 사이트 내 검색 (항상 표시, 하단 고정) ──
        if (searchQuery) {
            const footer = document.createElement('div');
            footer.className = 'cf-footer';

            const sectionTitle = document.createElement('div');
            sectionTitle.className = 'cf-search-section-title';
            sectionTitle.textContent = '🔎 사이트 내 검색';
            footer.appendChild(sectionTitle);

            const grid = document.createElement('div');
            grid.className = 'cf-search-grid';

            for (const community of COMMUNITY_DOMAINS) {
                const link = document.createElement('a');
                link.className = 'cf-search-link';
                link.href = `https://www.google.com/search?q=site:${community.domain}+${encodeURIComponent(searchQuery)}`;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.setAttribute('data-domain', community.domain);

                const icon = document.createElement('span');
                icon.className = 'cf-search-icon';
                icon.textContent = community.icon;

                const name = document.createElement('span');
                name.className = 'cf-search-name';
                name.textContent = community.name;

                link.appendChild(icon);
                link.appendChild(name);
                grid.appendChild(link);
            }

            footer.appendChild(grid);

            // 자동 열기 토글 (footer 하단)
            const toggleRow = document.createElement('div');
            toggleRow.className = 'cf-toggle-row';

            const toggleText = document.createElement('span');
            toggleText.className = 'cf-toggle-text';
            toggleText.textContent = '검색 시 자동 열기';
            toggleRow.appendChild(toggleText);

            const toggleLabel = document.createElement('label');
            toggleLabel.className = 'cf-toggle';

            const toggleInput = document.createElement('input');
            toggleInput.type = 'checkbox';
            toggleInput.checked = defaultOpen;

            const toggleSlider = document.createElement('span');
            toggleSlider.className = 'cf-toggle-slider';

            toggleLabel.appendChild(toggleInput);
            toggleLabel.appendChild(toggleSlider);
            toggleRow.appendChild(toggleLabel);

            // 호버 시 나타날 설명 텍스트
            const toggleDesc = document.createElement('div');
            toggleDesc.className = 'cf-toggle-desc';
            const updateDesc = (checked) => {
                toggleDesc.textContent = checked ? '기본 활성화' : '기본 비활성화';
            };
            updateDesc(toggleInput.checked);

            toggleInput.addEventListener('change', () => {
                chrome.storage.local.set({ sidebarDefaultOpen: toggleInput.checked });
                updateDesc(toggleInput.checked);
            });

            footer.appendChild(toggleRow);
            footer.appendChild(toggleDesc);
            sidebar.appendChild(footer);
        }

        document.body.appendChild(miniBtn);
        document.body.appendChild(sidebar);
    }

    /* ──────────────────────────────────────────────
       Init
    ────────────────────────────────────────────── */

    function init() {
        chrome.storage.local.get(['sidebarDefaultOpen'], (data) => {
            // 기본값: true (처음 사용 시 사이드바 열린 상태)
            const defaultOpen = data.sidebarDefaultOpen !== undefined
                ? data.sidebarDefaultOpen
                : true;
            const results = extractCommunityResults();
            createSidebar(results, defaultOpen);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
