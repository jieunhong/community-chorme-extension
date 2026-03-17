(() => {
    'use strict';

    /* ──────────────────────────────────────────────
       Config
    ────────────────────────────────────────────── */
    const DEFAULT_COMMUNITY_DOMAINS = [
        { domain: 'github.com', name: 'GitHub', icon: '🐈‍⬛' },
        { domain: 'stackoverflow.com', name: 'StackOverFlow', icon: '📚' },
        { domain: 'okky.kr', name: 'OKKY', icon: '💙' },
        { domain: 'namu.wiki', name: '나무위키', icon: '🌳' },
        { domain: 'dcinside.com', name: '디시인사이드', icon: '🎮' },
        { domain: 'theqoo.net', name: '더쿠', icon: '✨' },
        { domain: 'ppomppu.co.kr', name: '뽐뿌', icon: '💰' },
        { domain: 'reddit.com', name: 'Reddit', icon: '🤖' },
    ];

    /** 기본 + 커스텀 도메인을 합친 전체 목록 (런타임에 갱신) */
    let allCommunityDomains = [...DEFAULT_COMMUNITY_DOMAINS];

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
            return allCommunityDomains.find(
                (c) => hostname === c.domain || hostname.endsWith('.' + c.domain)
            ) || null;
        } catch {
            return null;
        }
    }

    /**
     * 구글 검색 결과 DOM에서 사이트 게시글을 추출합니다.
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
     * 검색 결과가 없는 사이트 목록 반환
     */
    function getMissingCommunities(results) {
        const foundDomains = new Set(results.map((r) => r.domain));
        return allCommunityDomains.filter((c) => !foundDomains.has(c.domain));
    }

    /* ──────────────────────────────────────────────
       Sidebar Dragging
    ────────────────────────────────────────────── */

    function makeElementDraggable(element, handle, onDragEnd) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        let hasMoved = false;

        handle.style.cursor = 'move';
        handle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            if (e.button !== 0) return;
            if (e.target.tagName === 'BUTTON' && e.target !== handle) return;
            if (e.target.closest('button') && e.target.closest('button') !== handle) return;

            hasMoved = false;
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
            element.parentElement.style.userSelect = 'none';
        }

        function elementDrag(e) {
            e = e || window.event;
            const dx = pos3 - e.clientX;
            const dy = pos4 - e.clientY;
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasMoved = true;
            if (!hasMoved) return;

            e.preventDefault();
            pos1 = dx;
            pos2 = dy;
            pos3 = e.clientX;
            pos4 = e.clientY;

            const newTop = element.offsetTop - pos2;
            const newLeft = element.offsetLeft - pos1;
            const padding = 10;
            const maxTop = window.innerHeight - element.offsetHeight - padding;
            const maxLeft = window.innerWidth - element.offsetWidth - padding;
            const clampedTop = Math.max(padding, Math.min(newTop, maxTop));
            const clampedLeft = Math.max(padding, Math.min(newLeft, maxLeft));

            element.style.top = clampedTop + "px";
            element.style.left = clampedLeft + "px";
            element.style.right = 'auto';
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
            if (element.parentElement) element.parentElement.style.userSelect = '';
            if (onDragEnd) onDragEnd(element.style.top, element.style.left, hasMoved);
        }
    }

    /* ──────────────────────────────────────────────
       Sidebar 생성
    ────────────────────────────────────────────── */

    /** site:domain.com 형식을 검색어에서 제거하여 순수 검색어만 추출 */
    function getCleanSearchQuery(query) {
        return query.replace(/site:[^\s]+\s*/i, '').trim();
    }

    const MINI_BTN_ID = 'community-filter-mini-btn';

    function createSidebar(results, config) {
        const { defaultOpen, savedPos } = config;

        // 중복 생성 방지
        const existing = document.getElementById(SIDEBAR_ID);
        if (existing) existing.remove();
        const existingBtn = document.getElementById(MINI_BTN_ID);
        if (existingBtn) existingBtn.remove();

        const searchQuery = getSearchQuery();
        const sidebar = document.createElement('div');
        sidebar.id = SIDEBAR_ID;

        // 위치 적용
        if (savedPos && savedPos.top && savedPos.left) {
            sidebar.style.top = savedPos.top;
            sidebar.style.left = savedPos.left;
            sidebar.style.right = 'auto';
        }

        // ── 최소화 버튼 (별도 요소 — 사이드바가 숨겨질 때 표시) ──
        const miniBtn = document.createElement('button');
        miniBtn.id = MINI_BTN_ID;
        miniBtn.className = 'cf-mini-btn';
        miniBtn.innerHTML = '💬';
        miniBtn.title = '사이트 반응 열기';

        // 최소화 버튼 위치도 사이드바 위치에 따라 조정 가능하지만, 
        // 일단 기본값으로 두고 필요시 연동
        if (savedPos && savedPos.top && savedPos.left) {
            miniBtn.style.top = savedPos.top;
            miniBtn.style.left = `calc(${savedPos.left} + 300px - 44px)`; // 사이드바 오른쪽 끝에 맞춤
            miniBtn.style.right = 'auto';
        }

        let miniBtnMoved = false;
        miniBtn.addEventListener('click', () => {
            if (miniBtnMoved) {
                miniBtnMoved = false;
                return;
            }
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
        titleEl.textContent = '사이트 반응';
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
        collapseBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 드래그 이벤트 방지
            sidebar.style.display = 'none';
            miniBtn.style.display = '';
        });
        header.appendChild(collapseBtn);

        sidebar.appendChild(header);

        // 드래그 기능 추가
        makeElementDraggable(sidebar, header, (top, left) => {
            if (miniBtn) {
                miniBtn.style.top = top;
                miniBtn.style.left = `calc(${left} + 300px - 44px)`;
                miniBtn.style.right = 'auto';
            }
            chrome.storage.local.set({ sidebarPos: { top, left } });
        });

        // miniBtn 드래그 기능
        makeElementDraggable(miniBtn, miniBtn, (top, left, hasMoved) => {
            miniBtnMoved = hasMoved;
            if (hasMoved) {
                sidebar.style.top = top;
                sidebar.style.left = `calc(${left} - 300px + 44px)`;
                sidebar.style.right = 'auto';
                chrome.storage.local.set({
                    sidebarPos: {
                        top: sidebar.style.top,
                        left: sidebar.style.left
                    }
                });
            }
        });


        const body = document.createElement('div');
        body.className = 'cf-body';

        if (results.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'cf-empty';
            empty.textContent = '사이트 결과 없음';
            body.appendChild(empty);
        } else {
            const ul = document.createElement('ul');
            ul.className = 'cf-list';

            for (const item of results) {
                const community = allCommunityDomains.find((c) => c.domain === item.domain);
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

            const cleanQuery = getCleanSearchQuery(searchQuery);

            for (const community of allCommunityDomains) {
                const link = document.createElement('a');
                link.className = 'cf-search-link';
                link.href = `https://www.google.com/search?q=site:${community.domain}+${encodeURIComponent(cleanQuery)}`;
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

            toggleInput.addEventListener('change', () => {
                chrome.storage.local.set({ sidebarDefaultOpen: toggleInput.checked });
            });

            footer.appendChild(toggleRow);
            sidebar.appendChild(footer);

            // ── 커스텀 도메인 관리 섹션 ──
            const customSection = document.createElement('div');
            customSection.className = 'cf-custom-section';

            const customTitle = document.createElement('div');
            customTitle.className = 'cf-search-section-title cf-custom-toggle-title';

            const customTitleText = document.createElement('span');
            customTitleText.textContent = '⚙️ 사이트 관리';

            const customArrow = document.createElement('span');
            customArrow.className = 'cf-custom-arrow';
            customArrow.textContent = '▶';

            customTitle.appendChild(customTitleText);
            customTitle.appendChild(customArrow);
            customSection.appendChild(customTitle);

            // 접고 펼 수 있는 콘텐츠 영역
            const customBody = document.createElement('div');
            customBody.className = 'cf-custom-body';

            // 기본 접힌 상태로 시작, 저장된 상태 불러오기
            chrome.storage.local.get(['customSectionOpen'], (d) => {
                const isOpen = d.customSectionOpen || false;
                customBody.style.display = isOpen ? '' : 'none';
                customArrow.textContent = isOpen ? '▼' : '▶';
                if (isOpen) customSection.classList.add('cf-custom-section-open');
            });

            customTitle.addEventListener('click', () => {
                const isHidden = customBody.style.display === 'none';
                customBody.style.display = isHidden ? '' : 'none';
                customArrow.textContent = isHidden ? '▼' : '▶';
                customSection.classList.toggle('cf-custom-section-open', isHidden);
                chrome.storage.local.set({ customSectionOpen: isHidden });
            });

            // 현재 등록된 커스텀 도메인 목록
            const customListContainer = document.createElement('div');
            customListContainer.className = 'cf-custom-list';

            function renderCustomList() {
                customListContainer.innerHTML = '';
                chrome.storage.local.get(['customDomains'], (data) => {
                    const customs = data.customDomains || [];
                    if (customs.length === 0) {
                        const emptyMsg = document.createElement('div');
                        emptyMsg.className = 'cf-custom-empty';
                        emptyMsg.textContent = '추가된 커스텀 사이트가 없습니다';
                        customListContainer.appendChild(emptyMsg);
                        return;
                    }
                    for (const item of customs) {
                        const row = document.createElement('div');
                        row.className = 'cf-custom-item';

                        const info = document.createElement('span');
                        info.className = 'cf-custom-item-info';
                        info.textContent = `${item.icon} ${item.name}`;

                        const domainText = document.createElement('span');
                        domainText.className = 'cf-custom-item-domain';
                        domainText.textContent = item.domain;

                        const deleteBtn = document.createElement('button');
                        deleteBtn.className = 'cf-custom-delete-btn';
                        deleteBtn.textContent = '✕';
                        deleteBtn.title = '삭제';
                        deleteBtn.addEventListener('click', () => {
                            chrome.storage.local.get(['customDomains'], (d) => {
                                const updated = (d.customDomains || []).filter(c => c.domain !== item.domain);
                                chrome.storage.local.set({ customDomains: updated }, () => {
                                    allCommunityDomains = [...DEFAULT_COMMUNITY_DOMAINS, ...updated];
                                    renderCustomList();
                                    init();
                                });
                            });
                        });

                        row.appendChild(info);
                        row.appendChild(domainText);
                        row.appendChild(deleteBtn);
                        customListContainer.appendChild(row);
                    }
                });
            }
            renderCustomList();
            customBody.appendChild(customListContainer);

            // 추가 폼
            const addForm = document.createElement('div');
            addForm.className = 'cf-custom-form';

            const inputIcon = document.createElement('input');
            const randomIcons = ['🌐', '⭐', '💎', '🔥', '🎯', '🚀', '💡', '🎨', '🍀', '🦋', '🌈', '🎪', '🏆', '🎵', '🌸', '🐝', '🦊', '🐳', '🌙', '☕'];
            inputIcon.className = 'cf-custom-input cf-custom-input-icon';
            inputIcon.type = 'text';
            inputIcon.placeholder = '아이콘';
            inputIcon.value = randomIcons[Math.floor(Math.random() * randomIcons.length)];
            inputIcon.maxLength = 4;

            const inputName = document.createElement('input');
            inputName.className = 'cf-custom-input cf-custom-input-name';
            inputName.type = 'text';
            inputName.placeholder = '이름';

            const inputDomain = document.createElement('input');
            inputDomain.className = 'cf-custom-input cf-custom-input-domain';
            inputDomain.type = 'text';
            inputDomain.placeholder = '도메인 (예: example.com)';

            const addBtn = document.createElement('button');
            addBtn.className = 'cf-custom-add-btn';
            addBtn.textContent = '추가';
            addBtn.addEventListener('click', () => {
                const domain = inputDomain.value.trim();
                const name = inputName.value.trim();
                const icon = inputIcon.value.trim() || '🌐';

                if (!domain || !name) {
                    inputDomain.style.borderColor = !domain ? '#ef4444' : '';
                    inputName.style.borderColor = !name ? '#ef4444' : '';
                    return;
                }

                // 중복 확인
                if (allCommunityDomains.some(c => c.domain === domain)) {
                    inputDomain.style.borderColor = '#ef4444';
                    inputDomain.value = '';
                    inputDomain.placeholder = '이미 등록된 도메인';
                    setTimeout(() => {
                        inputDomain.style.borderColor = '';
                        inputDomain.placeholder = '도메인 (예: example.com)';
                    }, 2000);
                    return;
                }

                chrome.storage.local.get(['customDomains'], (data) => {
                    const customs = data.customDomains || [];
                    customs.push({ domain, name, icon, isCustom: true });
                    chrome.storage.local.set({ customDomains: customs }, () => {
                        allCommunityDomains = [...DEFAULT_COMMUNITY_DOMAINS, ...customs];
                        inputDomain.value = '';
                        inputName.value = '';
                        inputIcon.value = randomIcons[Math.floor(Math.random() * randomIcons.length)];
                        inputDomain.style.borderColor = '';
                        inputName.style.borderColor = '';
                        renderCustomList();
                        // 사이드바 다시 초기화
                        init();
                    });
                });
            });

            // Enter 키로 추가
            [inputIcon, inputName, inputDomain].forEach(input => {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') addBtn.click();
                });
            });

            addForm.appendChild(inputIcon);
            addForm.appendChild(inputName);
            addForm.appendChild(inputDomain);
            addForm.appendChild(addBtn);
            customBody.appendChild(addForm);

            // 기본 사이트 활성/비활성 토글 목록
            const defaultListTitle = document.createElement('div');
            defaultListTitle.className = 'cf-custom-subtitle';
            defaultListTitle.textContent = '기본 사이트';
            customBody.appendChild(defaultListTitle);

            const defaultListContainer = document.createElement('div');
            defaultListContainer.className = 'cf-custom-list';

            chrome.storage.local.get(['disabledDefaults'], (dd) => {
                const disabled = dd.disabledDefaults || [];
                for (const site of DEFAULT_COMMUNITY_DOMAINS) {
                    const row = document.createElement('div');
                    row.className = 'cf-custom-item';

                    const info = document.createElement('span');
                    info.className = 'cf-custom-item-info';
                    info.textContent = `${site.icon} ${site.name}`;

                    const domainText = document.createElement('span');
                    domainText.className = 'cf-custom-item-domain';
                    domainText.textContent = site.domain;

                    const toggleLabel = document.createElement('label');
                    toggleLabel.className = 'cf-toggle cf-custom-toggle';

                    const toggleInput = document.createElement('input');
                    toggleInput.type = 'checkbox';
                    toggleInput.checked = !disabled.includes(site.domain);

                    const toggleSlider = document.createElement('span');
                    toggleSlider.className = 'cf-toggle-slider';

                    toggleInput.addEventListener('change', () => {
                        chrome.storage.local.get(['disabledDefaults'], (d2) => {
                            let updated = d2.disabledDefaults || [];
                            if (toggleInput.checked) {
                                updated = updated.filter(d => d !== site.domain);
                            } else {
                                if (!updated.includes(site.domain)) updated.push(site.domain);
                            }
                            chrome.storage.local.set({ disabledDefaults: updated }, () => {
                                init();
                            });
                        });
                    });

                    toggleLabel.appendChild(toggleInput);
                    toggleLabel.appendChild(toggleSlider);

                    row.appendChild(info);
                    row.appendChild(domainText);
                    row.appendChild(toggleLabel);
                    defaultListContainer.appendChild(row);
                }
            });
            customBody.appendChild(defaultListContainer);

            customSection.appendChild(customBody);
            sidebar.appendChild(customSection);
        }

        document.body.appendChild(miniBtn);
        document.body.appendChild(sidebar);
    }

    /* ──────────────────────────────────────────────
       Init
    ────────────────────────────────────────────── */

    function init() {
        chrome.storage.local.get(['sidebarDefaultOpen', 'sidebarPos', 'customDomains', 'disabledDefaults'], (data) => {
            // 비활성화된 기본 도메인 필터링 + 커스텀 도메인 병합
            const customs = data.customDomains || [];
            const disabled = data.disabledDefaults || [];
            const activeDefaults = DEFAULT_COMMUNITY_DOMAINS.filter(c => !disabled.includes(c.domain));
            allCommunityDomains = [...activeDefaults, ...customs];

            // 기본값: true (처음 사용 시 사이드바 열린 상태)
            const config = {
                defaultOpen: data.sidebarDefaultOpen !== undefined ? data.sidebarDefaultOpen : true,
                savedPos: data.sidebarPos || null
            };
            const results = extractCommunityResults();
            createSidebar(results, config);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
