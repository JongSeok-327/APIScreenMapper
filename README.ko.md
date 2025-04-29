# API Screen Mapper

[![en](https://img.shields.io/badge/lang-English-blue.svg)](README.md) [![ko](https://img.shields.io/badge/lang-한국어-red.svg)](README.ko.md)

화면 이미지에 API 포인트를 매핑하고 관리하는 도구입니다.

## 주요 기능

- 프로젝트별 화면 관리
- 화면 이미지에 API 포인트 매핑
- Query와 Mutation 구분
- API 코드와 설명 관리
- 화면과 API 목록 내보내기 (이미지, 마크다운)
- 드래그 앤 드롭으로 API 포인트 위치 조정
- API 목록 순서 변경

## 시작하기

### 필수 조건

- Node.js 16.0.0 이상
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone https://github.com/JongSeok-327/APIScreenMapper.git
cd graphql-screen-mapper

# 의존성 설치
npm install
# 또는
yarn install

# 개발 서버 실행
npm start
# 또는
yarn start
```

### 빌드

```bash
npm run build
# 또는
yarn build
```

## 사용 방법

1. 프로젝트 생성
2. 화면 이미지 업로드
3. 화면을 클릭하여 API 포인트 추가
4. API 정보 입력 (이름, 타입, 코드, 설명)
5. API 포인트 드래그하여 위치 조정
6. 내보내기 기능으로 문서화

## 기술 스택

- React
- TypeScript
- Material-UI
- Dexie (IndexedDB)
- Monaco Editor 