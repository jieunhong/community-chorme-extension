(() => {
    'use strict';

    /* ──────────────────────────────────────────────
       Config
    ────────────────────────────────────────────── */
    const COMMUNITY_DOMAINS = [
        'dcinside.com',
        'theqoo.net',
        'ppomppu.co.kr',
        'blind.com',
        'reddit.com',
    ];

    const MAX_RESULTS = 8;
    const SIDEBAR_ID = 'community-filter-sidebar';

    /* ──────────────────────────────────────────────
       Helpers
    ────────────────────────────────────────────── */

    /**
     * 주어진 URL 문자열에서 호스트를 추출한 뒤,
     * COMMUNITY_DOMAINS 목록에 포함되는 도메인을 반환합니다.
     * 일치하지 않으면 null을 반환합니다.
     */
    function matchCommunityDomain(href) {
        try {
            const hostname = new URL(href).hostname;
            return COMMUNITY_DOMAINS.find(
                (domain) => hostname === domain || hostname.endsWith('.' + domain)
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

            const domain = matchCommunityDomain(href);
            if (!domain) continue;

            const title = h3.textContent.trim();
            if (!title) continue;

            // 중복 URL 방지
            if (results.some((r) => r.href === href)) continue;

            results.push({ title, href, domain });

            if (results.length >= MAX_RESULTS) break;
        }

        return results;
    }

    /* ──────────────────────────────────────────────
       Sidebar 생성
    ────────────────────────────────────────────── */

    function createSidebar(results) {
        // 중복 생성 방지
        const existing = document.getElementById(SIDEBAR_ID);
        if (existing) existing.remove();

        const sidebar = document.createElement('div');
        sidebar.id = SIDEBAR_ID;

        // Header
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

        // Body — list or empty state
        if (results.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'cf-empty';
            empty.textContent = '커뮤니티 결과 없음';
            sidebar.appendChild(empty);
        } else {
            const ul = document.createElement('ul');
            ul.className = 'cf-list';

            for (const item of results) {
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
                domainSpan.textContent = item.domain;
                a.appendChild(domainSpan);

                li.appendChild(a);
                ul.appendChild(li);
            }

            sidebar.appendChild(ul);
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

    // document_idle 이므로 DOM이 이미 로드된 상태이지만,
    // 동적 렌더링에 대비해 약간의 딜레이를 줍니다.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
