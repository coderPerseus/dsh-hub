import type { Locale } from './locales';

type DiscoveryCopy = { title: string; intro: string; guide: string; steps: [string, string][]; faq: string; questions: [string, string][]; detailTitle: string };
export const discoveryCopy: Record<Locale, DiscoveryCopy> = {
  'zh-CN': {
    title: '发现 DeepSeek Harness 插件',
    intro: '搜索 DeepSeek Harness 社区插件，比较用途、安装方式与兼容信息，为你的 AI 工作流找到合适的扩展。',
    guide: '从发现到安装，找到适合你的插件',
    steps: [['按任务查找', '用功能关键词或分类缩小范围，再按最近更新或 GitHub Star 排序。'], ['了解插件能力', '查看插件简介、AI 分析和原始 README，确认它能解决什么问题。'], ['确认后安装', '检查兼容状态、依赖范围与安装说明，复制详情页提供的命令。']],
    faq: '关于 DSH Hub 的常见问题',
    questions: [['DSH Hub 是什么？', 'DSH Hub 是 DeepSeek Harness 社区插件目录，汇集插件介绍、源码链接和安装说明，帮助你发现与比较扩展。'], ['收录是否代表已经测试兼容？', '不代表。详情页展示目录记录的兼容状态和依赖范围；未知状态不等于兼容，安装前请结合项目文档确认。'], ['如何安装插件？', '打开插件详情页，查看安装区域。有命令时可复制到你的 Harness 环境执行；没有命令时，请按项目 README 操作。']],
    detailTitle: 'DeepSeek Harness 插件介绍与安装',
  },
  'zh-TW': {
    title: '探索 DeepSeek Harness 插件', intro: '搜尋 DeepSeek Harness 社群插件，比較用途、安裝方式與相容資訊，為你的 AI 工作流程找到合適的擴充。',
    guide: '從探索到安裝，找到適合你的插件',
    steps: [['依任務尋找', '使用功能關鍵字或分類縮小範圍，再依最近更新或 GitHub Star 排序。'], ['了解插件能力', '查看插件簡介、AI 分析與原始 README，確認它能解決什麼問題。'], ['確認後安裝', '檢查相容狀態、依賴範圍與安裝說明，複製詳情頁提供的指令。']],
    faq: '關於 DSH Hub 的常見問題', questions: [['DSH Hub 是什麼？', 'DSH Hub 是 DeepSeek Harness 社群插件目錄，彙集插件介紹、原始碼連結與安裝說明，協助你探索與比較擴充。'], ['收錄是否代表已測試相容？', '不代表。詳情頁顯示目錄記錄的相容狀態與依賴範圍；未知狀態不等於相容，安裝前請參考專案文件確認。'], ['如何安裝插件？', '開啟插件詳情頁並查看安裝區域。有指令時可複製到 Harness 環境執行；沒有指令時，請依專案 README 操作。']], detailTitle: 'DeepSeek Harness 插件介紹與安裝',
  },
  en: {
    title: 'Discover DeepSeek Harness plugins', intro: 'Search community plugins for DeepSeek Harness. Compare capabilities, installation instructions and compatibility to find extensions for your AI workflow.',
    guide: 'Find the right plugin, then get started', steps: [['Search by task', 'Use a feature keyword or category, then sort by recent updates or GitHub stars.'], ['Explore capabilities', 'Read the description, AI analysis and original README to understand what a plugin does.'], ['Check and install', 'Review compatibility, dependency ranges and instructions, then copy the available install command.']],
    faq: 'Questions about DSH Hub', questions: [['What is DSH Hub?', 'DSH Hub is a community plugin directory for DeepSeek Harness, bringing together descriptions, source links and installation instructions to help you discover and compare extensions.'], ['Does inclusion mean a plugin is tested and compatible?', 'No. Detail pages show recorded compatibility and dependency ranges. Unknown does not mean compatible; check the project documentation before installing.'], ['How do I install a plugin?', 'Open its detail page and check the installation section. Copy the command into your Harness environment when available, or follow the project README.']], detailTitle: 'DeepSeek Harness plugin & installation',
  },
  ja: {
    title: 'DeepSeek Harness プラグインを探す', intro: 'DeepSeek Harness のコミュニティプラグインを検索。用途、インストール方法、互換性を比較し、AI ワークフローに合う拡張機能を見つけましょう。',
    guide: 'プラグインの検索からインストールまで', steps: [['タスクで検索', '機能のキーワードやカテゴリで絞り込み、更新日や GitHub Star で並べ替えます。'], ['機能を確認', '紹介、AI 分析、元の README を読み、プラグインの機能を確認します。'], ['確認してインストール', '互換性、依存関係、手順を確認し、利用可能なインストールコマンドをコピーします。']],
    faq: 'DSH Hub のよくある質問', questions: [['DSH Hub とは？', 'DeepSeek Harness のコミュニティプラグイン集です。紹介、ソースへのリンク、インストール手順をまとめ、拡張機能の検索と比較を支援します。'], ['掲載されていれば互換性は検証済みですか？', 'いいえ。詳細ページは記録された互換性と依存関係を表示します。不明は互換性ありを意味しません。導入前にプロジェクトの文書を確認してください。'], ['インストール方法は？', '詳細ページのインストール欄を開き、コマンドがあれば Harness 環境で実行します。ない場合はプロジェクトの README に従ってください。']], detailTitle: 'DeepSeek Harness プラグイン・導入方法',
  },
  ko: {
    title: 'DeepSeek Harness 플러그인 찾기', intro: 'DeepSeek Harness 커뮤니티 플러그인을 검색하세요. 기능, 설치 방법, 호환성을 비교해 AI 워크플로에 맞는 확장 기능을 찾을 수 있습니다.',
    guide: '검색부터 설치까지', steps: [['작업으로 검색', '기능 키워드나 카테고리로 범위를 좁히고 최근 업데이트 또는 GitHub Star로 정렬하세요.'], ['기능 살펴보기', '소개, AI 분석, 원본 README를 읽고 플러그인의 기능을 확인하세요.'], ['확인 후 설치', '호환성과 의존성 범위, 설치 안내를 확인한 뒤 제공된 설치 명령을 복사하세요.']],
    faq: 'DSH Hub 자주 묻는 질문', questions: [['DSH Hub란 무엇인가요?', 'DeepSeek Harness 커뮤니티 플러그인 디렉터리입니다. 소개, 소스 링크, 설치 안내를 모아 확장 기능 검색과 비교를 돕습니다.'], ['등록된 플러그인은 호환성 검증이 끝났나요?', '아니요. 상세 페이지는 기록된 호환성과 의존성 범위를 표시합니다. 알 수 없음은 호환을 의미하지 않으므로 설치 전 프로젝트 문서를 확인하세요.'], ['어떻게 설치하나요?', '상세 페이지의 설치 영역을 확인하세요. 명령이 있으면 Harness 환경에 복사해 실행하고, 없으면 프로젝트 README를 따르세요.']], detailTitle: 'DeepSeek Harness 플러그인 및 설치',
  },
};
