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

    function createSidebar(results) {
        // 중복 생성 방지
        const existing = document.getElementById(SIDEBAR_ID);
        if (existing) existing.remove();

        const searchQuery = getSearchQuery();
        const sidebar = document.createElement('div');
        sidebar.id = SIDEBAR_ID;

        // ── Header ──
        const header = document.createElement('div');
        header.className = 'cf-header';

        const titleEl = document.createElement('h2');
        titleEl.className = 'cf-header-title';
        titleEl.textContent = '커뮤니티 반응';
        header.appendChild(titleEl);

        if (results.length > 0) {
            const badge = document.createElement('span');
            badge.className = 'cf-badge';
            badge.textContent = results.length;
            header.appendChild(badge);
        }

        sidebar.appendChild(header);

        // ── Body — 검색 결과 리스트 ──
        if (results.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'cf-empty';
            empty.textContent = '커뮤니티 결과 없음';
            sidebar.appendChild(empty);
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

            sidebar.appendChild(ul);
        }

        // ── 검색 결과 없는 커뮤니티 → site: 검색 바로가기 ──
        const missing = getMissingCommunities(results);

        if (missing.length > 0 && searchQuery) {
            const section = document.createElement('div');
            section.className = 'cf-search-section';

            const sectionTitle = document.createElement('div');
            sectionTitle.className = 'cf-search-section-title';
            sectionTitle.textContent = '🔎 사이트 내 검색';
            section.appendChild(sectionTitle);

            const grid = document.createElement('div');
            grid.className = 'cf-search-grid';

            for (const community of missing) {
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

            section.appendChild(grid);
            sidebar.appendChild(section);
        }

        document.body.appendChild(sidebar);
    }

    /* ──────────────────────────────────────────────
       Init
    ────────────────────────────────────────────── */

    function init() {
        const results = extractCommunityResults();
        createSidebar(results);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
