import { useState, useEffect } from 'react';
import { Search, X, ExternalLink } from 'lucide-react';

interface CommunityResult {
  title: string;
  url: string;
  domain: string;
}

interface CommunityGroup {
  name: string;
  icon: string;
  domain: string;
  results: CommunityResult[];
}

const COMMUNITIES = [
  { name: '나무위키', domain: 'namu.wiki', icon: '🌳' },
  { name: '디시인사이드', domain: 'dcinside.com', icon: '🎮' },
  { name: '더쿠', domain: 'theqoo.net', icon: '✨' },
  { name: '뽐뿌', domain: 'ppomppu.co.kr', icon: '💰' },
  { name: '블라인드', domain: 'blind.com', icon: '💼' },
  { name: 'Reddit', domain: 'reddit.com', icon: '🤖' }
];

export default function App() {
  const [searchQuery, setSearchQuery] = useState('entp 특징');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [communityGroups, setCommunityGroups] = useState<CommunityGroup[]>([]);

  useEffect(() => {
    // URL 파라미터에서 검색어 가져오기
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    if (query) {
      setSearchQuery(query);
    }
  }, []);

  useEffect(() => {
    // DOM이 렌더링된 후 검색 결과 파싱
    const timer = setTimeout(() => {
      parseSearchResults();
    }, 100);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const parseSearchResults = () => {
    // 구글 검색 결과처럼 구성된 DOM에서 링크 추출
    const searchResults = document.querySelectorAll('.search-result-item');
    const grouped: { [key: string]: CommunityResult[] } = {};

    // 커뮤니티별로 초기화
    COMMUNITIES.forEach(community => {
      grouped[community.domain] = [];
    });

    // 검색 결과 파싱 및 필터링
    searchResults.forEach(result => {
      const linkElement = result.querySelector('a');
      const titleElement = result.querySelector('h3');

      if (linkElement && titleElement) {
        const url = linkElement.getAttribute('href') || '';
        const title = titleElement.textContent || '';

        // 커뮤니티 도메인에 해당하는지 확인
        COMMUNITIES.forEach(community => {
          if (url.includes(community.domain)) {
            grouped[community.domain].push({
              title,
              url,
              domain: community.domain
            });
          }
        });
      }
    });

    // CommunityGroup 형태로 변환
    const groups: CommunityGroup[] = COMMUNITIES.map(community => ({
      name: community.name,
      icon: community.icon,
      domain: community.domain,
      results: grouped[community.domain] || []
    })).filter(group => group.results.length > 0); // 결과가 있는 것만

    setCommunityGroups(groups);
  };

  const handleResultClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const hasResults = communityGroups.length > 0;

  return (
    <>
      {/* 데모용 가상 구글 검색 페이지 배경 */}
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <h1 className="text-4xl font-bold text-blue-600">Google</h1>
            <div className="flex-1 border-2 border-gray-300 rounded-full px-4 py-2">
              <span className="text-gray-700">{searchQuery}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">약 1,234,567개의 검색 결과</p>
          <div className="space-y-6">
            {/* 일반 검색 결과 */}
            <div className="search-result-item space-y-1">
              <div className="text-sm text-gray-600">www.example1.com</div>
              <a href="https://www.example1.com">
                <h3 className="text-xl text-blue-800 hover:underline cursor-pointer">
                  검색 결과 제목 1 - {searchQuery}
                </h3>
              </a>
              <p className="text-sm text-gray-700">
                {searchQuery}에 대한 검색 결과입니다. 여기에는 관련된 정보와 내용이 표시됩니다...
              </p>
            </div>

            {/* 디시인사이드 결과 */}
            <div className="search-result-item space-y-1">
              <div className="text-sm text-green-700">gall.dcinside.com</div>
              <a href={`https://gall.dcinside.com/board/lists/?id=programming&s_type=search_subject_memo&s_keyword=${encodeURIComponent(searchQuery)}`}>
                <h3 className="text-xl text-blue-800 hover:underline cursor-pointer">
                  [{searchQuery}] 디시인사이드 갤러리 - 성격 유형 특징 총정리
                </h3>
              </a>
              <p className="text-sm text-gray-700">
                디시인사이드에서 {searchQuery}에 대해 유저들이 토론한 내용입니다. 실제 경험담과 특징들이 정리되어 있습니다...
              </p>
            </div>

            {/* 더쿠 결과 */}
            <div className="search-result-item space-y-1">
              <div className="text-sm text-green-700">theqoo.net</div>
              <a href={`https://theqoo.net/square/search?search_type=post&keyword=${encodeURIComponent(searchQuery)}`}>
                <h3 className="text-xl text-blue-800 hover:underline cursor-pointer">
                  {searchQuery} 실제 후기 모음 - 더쿠
                </h3>
              </a>
              <p className="text-sm text-gray-700">
                더쿠 커뮤니티에서 {searchQuery}에 대한 실제 사용자들의 후기와 의견을 확인할 수 있습니다...
              </p>
            </div>

            {/* 일반 검색 결과 */}
            <div className="search-result-item space-y-1">
              <div className="text-sm text-gray-600">www.example2.com</div>
              <a href="https://www.example2.com">
                <h3 className="text-xl text-blue-800 hover:underline cursor-pointer">
                  검색 결과 제목 2 - {searchQuery}
                </h3>
              </a>
              <p className="text-sm text-gray-700">
                {searchQuery}에 대한 검색 결과입니다. 여기에는 관련된 정보와 내용이 표시됩니다...
              </p>
            </div>

            {/* 뽐뿌 결과 */}
            <div className="search-result-item space-y-1">
              <div className="text-sm text-green-700">www.ppomppu.co.kr</div>
              <a href={`https://www.ppomppu.co.kr/search_bbs.php?keyword=${encodeURIComponent(searchQuery)}`}>
                <h3 className="text-xl text-blue-800 hover:underline cursor-pointer">
                  [뽐뿌] {searchQuery} 관련 정보 및 추천글
                </h3>
              </a>
              <p className="text-sm text-gray-700">
                뽐뿌에서 {searchQuery}에 대한 다양한 의견과 정보를 확인할 수 있습니다...
              </p>
            </div>

            {/* Reddit 결과 */}
            <div className="search-result-item space-y-1">
              <div className="text-sm text-green-700">www.reddit.com</div>
              <a href={`https://www.reddit.com/search/?q=${encodeURIComponent(searchQuery)}`}>
                <h3 className="text-xl text-blue-800 hover:underline cursor-pointer">
                  r/MBTI - Discussion about {searchQuery} : reddit
                </h3>
              </a>
              <p className="text-sm text-gray-700">
                Reddit community discussing {searchQuery} personality traits and characteristics...
              </p>
            </div>

            {/* 블라인드 결과 */}
            <div className="search-result-item space-y-1">
              <div className="text-sm text-green-700">www.teamblind.com</div>
              <a href={`https://www.teamblind.com/kr/search/${encodeURIComponent(searchQuery)}`}>
                <h3 className="text-xl text-blue-800 hover:underline cursor-pointer">
                  {searchQuery} 직장인들의 실제 의견 - 블라인드
                </h3>
              </a>
              <p className="text-sm text-gray-700">
                블라인드에서 직장인들이 {searchQuery}에 대해 나눈 대화와 의견들입니다...
              </p>
            </div>

            {/* 일반 검색 결과 */}
            <div className="search-result-item space-y-1">
              <div className="text-sm text-gray-600">www.example3.com</div>
              <a href="https://www.example3.com">
                <h3 className="text-xl text-blue-800 hover:underline cursor-pointer">
                  검색 결과 제목 3 - {searchQuery}
                </h3>
              </a>
              <p className="text-sm text-gray-700">
                {searchQuery}에 대한 검색 결과입니다. 여기에는 관련된 정보와 내용이 표시됩니다...
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 플로팅 사이드바 */}
      <div
        className={`fixed top-20 right-6 transition-all duration-300 ${isCollapsed ? 'w-12' : 'w-[280px]'
          }`}
        style={{ zIndex: 9999 }}
      >
        {isCollapsed ? (
          // 접힌 상태
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-12 h-12 bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-blue-50 transition-colors"
          >
            <Search className="w-5 h-5 text-gray-700" />
          </button>
        ) : (
          // 펼쳐진 상태
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-white" />
                <span className="text-white font-semibold">커뮤니티 검색</span>
              </div>
              <button
                onClick={() => setIsCollapsed(true)}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 검색어 표시 */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <p className="text-xs text-gray-500 mb-1">검색어</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{searchQuery}</p>
            </div>

            {/* 구분선 */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mx-4 my-2" />

            {/* 커뮤니티 리스트 */}
            <div className="px-3 py-2 space-y-3 max-h-[600px] overflow-y-auto">
              {communityGroups.map((group) => (
                <div key={group.name} className="space-y-2">
                  {/* 커뮤니티 헤더 */}
                  <div className="flex items-center gap-2 px-2">
                    <span className="text-lg">{group.icon}</span>
                    <span className="text-sm font-bold text-gray-800">
                      {group.name}
                    </span>
                  </div>

                  {/* 검색 결과 목록 */}
                  <div className="space-y-1">
                    {group.results.map((result, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleResultClick(result.url)}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors group border border-transparent hover:border-blue-200"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-gray-700 group-hover:text-blue-600 line-clamp-2 flex-1">
                            {result.title}
                          </p>
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 flex-shrink-0 mt-0.5" />
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* 구분선 (마지막 아이템 제외) */}
                  {group.name !== 'Reddit' && (
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-2" />
                  )}
                </div>
              ))}
            </div>

            {/* 구분선 */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mx-4 my-2" />

            {/* 푸터 */}
            <div className="px-4 py-3 bg-gray-50">
              <button
                onClick={() => setIsCollapsed(true)}
                className="w-full text-xs text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                접기
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}