# 커뮤니티 반응 필터 (Community Reaction Filter)

Google 검색 결과에서 주요 커뮤니티의 게시글만 필터링하여 사이드바로 편리하게 보여주는 크롬 익스텐션입니다.

## 🚀 주요 기능

- **자동 필터링**: Google 검색 결과 페이지에서 나무위키, 디시인사이드, 더쿠, 뽐뿌, 블라인드, Reddit 등의 커뮤니티 게시글을 자동으로 감지합니다.
- **사이드바 UI**: 감지된 커뮤니티 게시글을 우측 사이드바에 모아서 보여주어, 여러 페이지를 넘기지 않고도 커뮤니티 반응을 한눈에 확인할 수 있습니다.
- **사이트 내 검색**: 특정 검색어에 대해 각 커뮤니티 내에서 직접 검색할 수 있는 퀵 링크를 제공합니다. (예: `site:dcinside.com [검색어]`)
- **사용자 설정 저장**: 사이드바의 자동 열림/닫힘 상태를 기억하여 다음 검색 시에도 적용됩니다.

## 🛠 지원하는 커뮤니티

- 🌳 나무위키 (namu.wiki)
- 🎮 디시인사이드 (dcinside.com)
- ✨ 더쿠 (theqoo.net)
- 💰 뽐뿌 (ppomppu.co.kr)
- 💼 블라인드 (blind.com)
- 🤖 Reddit (reddit.com)

## 📦 설치 방법

1. 이 저장소를 로컬 환경에 다운로드하거나 클론합니다.
2. Google Chrome 브라우저를 엽니다.
3. 주소창에 `chrome://extensions/`를 입력하여 확장 프로그램 관리 페이지로 이동합니다.
4. 우측 상단의 **'개발자 모드'**를 활성화합니다.
5. **'압축해제된 확장 프로그램을 로드합니다'** 버튼을 클릭합니다.
6. 다운로드한 프로젝트 폴더( `manifest.json` 파일이 있는 위치)를 선택합니다.

## 💻 기술 스택

- **Core**: JavaScript (Vanilla JS), CSS
- **Platform**: Chrome Extension API (Manifest v3)
- **UI Components**: `app` 디렉토리 내에 React 기반의 UI 프로토타입이 포함되어 있습니다.

## 📂 파일 구조

- `manifest.json`: 확장 프로그램 설정 파일
- `content.js`: Google 검색 결과 파싱 및 사이드바 렌더링 로직
- `style.css`: 사이드바 및 UI 스타일링
- `app/`: React 기반 UI 개발 및 테스트를 위한 컴포넌트
- `styles/`: 추가적인 스타일 시트
- `icon256.png`: 확장 프로그램 아이콘

## 📄 라이선스

이 프로젝트는 오픈 소스로 제공됩니다. 상세 내용은 [PRIVACY.md](PRIVACY.md) 및 [Guidelines.md](Guidelines.md)를 참고하세요.
