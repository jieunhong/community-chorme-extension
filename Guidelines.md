# 사이트 검색 필터 익스텐션 개발 가이드

## 📋 프로젝트 개요

### 목적
구글 검색 결과 페이지에서 특정 사이트 도메인의 검색 결과만 추출하여 플로팅 사이드바에 표시하는 크롬 익스텐션

### 핵심 컨셉
- **추가 검색 없음**: 현재 페이지 DOM만 파싱
- **API 불필요**: 구글 검색 결과 DOM 직접 읽기
- **자동 실행**: 구글 검색 페이지 접속 시 자동으로 사이드바 생성

---

## 🎯 기능 명세

### 1. 동작 흐름
```
사용자가 Google에서 검색
    ↓
검색 결과 페이지 진입
    ↓
익스텐션이 URL에서 검색어 추출
    ↓
DOM에서 검색 결과 파싱
    ↓
사이트 도메인 필터링
    ↓
플로팅 사이드바 생성 및 표시
    ↓
사용자가 원하는 링크 클릭
```

### 2. 대상 사이트 도메인
```javascript
const COMMUNITY_DOMAINS = [
  "dcinside.com",
  "theqoo.net",
  "ppomppu.co.kr",
  "blind.com",
  "reddit.com"
];
```

### 3. DOM 파싱 로직

#### 구글 검색 결과 구조
- 각 검색 결과는 `<a>` 태그 안에 `<h3>` 포함
- 선택자: `a:has(h3)` 또는 유사한 구조

#### 추출 데이터
```javascript
{
  title: string,  // h3의 텍스트
  href: string,   // a 태그의 href
  domain: string  // 필터링된 사이트 도메인
}
```

---

## 🏗️ 파일 구조

```
community-filter-extension/
├── manifest.json
├── content.js
├── sidebar.css
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 📝 manifest.json

```json
{
  "manifest_version": 3,
  "name": "Community Filter Search",
  "description": "구글 검색 결과에서 사이트 반응만 추출",
  "version": "1.0.0",
  "permissions": [],
  "content_scripts": [
    {
      "matches": ["https://www.google.com/search*"],
      "js": ["content.js"],
      "css": ["sidebar.css"],
      "run_at": "document_idle"
    }
  ],
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

**핵심 포인트:**
- `manifest_version: 3` 사용
- `matches`: 구글 검색 페이지에서만 실행
- `run_at: "document_idle"`: DOM 로딩 완료 후 실행
- `permissions`: 불필요 (현재 페이지 DOM만 접근)

---

## 💻 content.js 구현 가이드

### 1. 사이트 정의
```javascript
const COMMUNITIES = [
  { name: '디시인사이드', domain: 'dcinside.com', icon: '🎮' },
  { name: '더쿠', domain: 'theqoo.net', icon: '✨' },
  { name: '뽐뿌', domain: 'ppomppu.co.kr', icon: '💰' },
  { name: '블라인드', domain: 'blind.com', icon: '💼' },
  { name: 'Reddit', domain: 'reddit.com', icon: '🤖' }
];
```

### 2. DOM 파싱 함수
```javascript
function parseSearchResults() {
  // 구글 검색 결과 DOM 선택
  const searchResults = document.querySelectorAll('a:has(h3)');
  
  const grouped = {};
  
  // 사이트별 초기화
  COMMUNITIES.forEach(community => {
    grouped[community.domain] = [];
  });
  
  // 검색 결과 파싱 및 필터링
  searchResults.forEach(result => {
    const href = result.href;
    const title = result.querySelector('h3')?.innerText;
    
    if (!href || !title) return;
    
    // 사이트 도메인 포함 여부 확인
    COMMUNITIES.forEach(community => {
      if (href.includes(community.domain)) {
        grouped[community.domain].push({
          title: title,
          url: href
        });
      }
    });
  });
  
  return grouped;
}
```

### 3. 사이드바 UI 생성
```javascript
function createSidebar(groupedResults) {
  // 기존 사이드바 제거
  const existing = document.getElementById('community-sidebar');
  if (existing) existing.remove();
  
  // 사이드바 컨테이너 생성
  const sidebar = document.createElement('div');
  sidebar.id = 'community-sidebar';
  sidebar.className = 'community-sidebar';
  
  // 헤더
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <span class="sidebar-title">🔍 사이트 검색</span>
      <button class="sidebar-close" id="sidebar-toggle">✕</button>
    </div>
    <div class="sidebar-content" id="sidebar-content"></div>
  `;
  
  const content = sidebar.querySelector('#sidebar-content');
  
  // 사이트별 결과 렌더링
  COMMUNITIES.forEach(community => {
    const results = groupedResults[community.domain];
    
    if (results && results.length > 0) {
      const section = document.createElement('div');
      section.className = 'community-section';
      
      section.innerHTML = `
        <div class="community-header">
          <span class="community-icon">${community.icon}</span>
          <span class="community-name">${community.name}</span>
        </div>
        <div class="community-results"></div>
      `;
      
      const resultsContainer = section.querySelector('.community-results');
      
      results.slice(0, 5).forEach(result => {
        const link = document.createElement('a');
        link.href = result.url;
        link.target = '_blank';
        link.className = 'result-link';
        link.textContent = result.title;
        resultsContainer.appendChild(link);
      });
      
      content.appendChild(section);
    }
  });
  
  // 결과 없을 때
  if (content.children.length === 0) {
    content.innerHTML = '<div class="no-results">사이트 검색 결과가 없습니다</div>';
  }
  
  document.body.appendChild(sidebar);
  
  // 접기/펼치기 기능
  setupToggle(sidebar);
}
```

### 4. 접기/펼치기 기능
```javascript
function setupToggle(sidebar) {
  const toggle = sidebar.querySelector('#sidebar-toggle');
  let isCollapsed = false;
  
  toggle.addEventListener('click', () => {
    isCollapsed = !isCollapsed;
    if (isCollapsed) {
      sidebar.classList.add('collapsed');
      toggle.textContent = '🔍';
    } else {
      sidebar.classList.remove('collapsed');
      toggle.textContent = '✕';
    }
  });
}
```

### 5. 초기화
```javascript
// 페이지 로드 시 실행
function init() {
  // MutationObserver로 동적 로딩 감지 (선택사항)
  const observer = new MutationObserver((mutations) => {
    const results = parseSearchResults();
    createSidebar(results);
  });
  
  // 초기 실행
  setTimeout(() => {
    const results = parseSearchResults();
    createSidebar(results);
  }, 1000); // 구글 검색 결과 로딩 대기
}

// 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

---

## 🎨 sidebar.css 스타일 가이드

```css
.community-sidebar {
  position: fixed;
  top: 100px;
  right: 20px;
  width: 280px;
  max-height: calc(100vh - 120px);
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 999999;
  overflow: hidden;
  transition: all 0.3s ease;
}

.community-sidebar.collapsed {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.community-sidebar.collapsed .sidebar-content,
.community-sidebar.collapsed .sidebar-title {
  display: none;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
}

.sidebar-close {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.sidebar-content {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  padding: 12px;
}

.community-section {
  margin-bottom: 16px;
}

.community-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 4px 8px;
}

.community-icon {
  font-size: 18px;
}

.community-name {
  font-size: 13px;
  font-weight: 700;
  color: #333;
}

.community-results {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-link {
  display: block;
  padding: 8px 12px;
  font-size: 12px;
  color: #555;
  text-decoration: none;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.2s;
  border: 1px solid transparent;
  line-height: 1.4;
}

.result-link:hover {
  background: #e3f2fd;
  border-color: #2196f3;
  color: #1976d2;
}

.no-results {
  text-align: center;
  padding: 32px 16px;
  color: #999;
  font-size: 13px;
}

/* 스크롤바 스타일 */
.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: #999;
}
```

---

## 🚀 개발 순서

### Phase 1: 기본 구조 (30분)
1. manifest.json 작성
2. content.js 파일 생성
3. 사이트 상수 정의

### Phase 2: DOM 파싱 (30분)
1. parseSearchResults() 함수 구현
2. 구글 검색 결과 구조 분석
3. 사이트 도메인 필터링 로직

### Phase 3: UI 구현 (1시간)
1. createSidebar() 함수 구현
2. sidebar.css 스타일링
3. 접기/펼치기 기능

### Phase 4: 테스트 및 개선 (30분)
1. 다양한 검색어로 테스트
2. 결과 없을 때 처리
3. 성능 최적화

---

## 🧪 테스트 시나리오

### 1. 기본 동작 테스트
```
1. 구글에서 "entp 특징" 검색
2. 사이드바가 오른쪽에 나타나는지 확인
3. 사이트별로 그룹핑되어 있는지 확인
4. 링크 클릭 시 새 탭에서 열리는지 확인
```

### 2. 엣지 케이스
```
- 사이트 결과가 0개일 때
- 검색 결과가 매우 많을 때
- 페이지 스크롤 시 사이드바 고정 여부
- 접기/펼치기 동작
```

### 3. 다양한 검색어
```
- "react 사용법"
- "맛집 추천"
- "mbti 특징"
- "프로그래밍 공부"
```

---

## 🔧 개선 아이디어 (MVP 이후)

### 1. 사이트별 그룹핑 개선
- 결과 없는 사이트는 "검색하기" 링크 제공
- 예: `디시 결과 없음 → [디시에서 검색하기]`

### 2. 설정 기능
- 사용자가 사이트 추가/제거
- 사이드바 위치 조정
- 자동 실행 on/off

### 3. 성능 최적화
- Debounce/Throttle 적용
- 결과 캐싱
- Virtual Scrolling (결과가 많을 때)

### 4. UI/UX 개선
- 드래그로 위치 이동
- 다크 모드 지원
- 애니메이션 효과

---

## ⚠️ 주의사항

### 1. 구글 DOM 구조 변경
- 구글은 검색 결과 DOM 구조를 자주 변경
- 여러 선택자 패턴 준비 필요
- Fallback 로직 구현 권장

### 2. 성능
- MutationObserver 사용 시 과도한 호출 방지
- Debounce 적용 필수

### 3. 보안
- CSP (Content Security Policy) 준수
- XSS 방지를 위한 textContent 사용

---

## 📚 참고 자료

### Chrome Extension 공식 문서
- https://developer.chrome.com/docs/extensions/mv3/

### 필요한 지식
- JavaScript DOM API
- CSS Positioning (fixed)
- Chrome Extension Content Scripts

### 유용한 도구
- Chrome Extension 디버깅: `chrome://extensions/`
- DOM Inspector: 개발자 도구 Elements 탭

---

## 🎯 MVP 완성 기준

✅ 구글 검색 페이지에서 자동 실행  
✅ 5개 사이트 도메인 필터링  
✅ 플로팅 사이드바 UI 표시  
✅ 사이트별 그룹핑  
✅ 링크 클릭 시 새 탭 열기  
✅ 접기/펼치기 기능  

---

## 📞 구현 시 질문 사항

개발 중 아래 사항들을 결정해야 합니다:

1. **결과 개수 제한**: 사이트당 최대 몇 개? (권장: 3-5개)
2. **초기 상태**: 사이드바가 펼쳐진 상태? 접힌 상태?
3. **위치**: 고정 위치? 드래그 가능?
4. **아이콘**: 텍스트 이모지? 이미지 파일?

현재 기획서 기준 권장값:
- 결과 개수: 사이트당 최대 5개
- 초기 상태: 펼쳐진 상태
- 위치: 오른쪽 상단 고정 (top: 100px, right: 20px)
- 아이콘: 이모지 사용
