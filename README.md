# hanjang-be

한장 API 서버. NestJS 11, REST, Drizzle, Postgres 16.

- FO(수험생 앱)·BO(운영 웹)의 REST 계약
- 수험생 User: 카카오·전화 인증, JWT access/refresh
- admin: 아이디·비밀번호, 초대 링크 발급. BO 로그인과 `POST /mcp`는 admin JWT만

## 로컬

```bash
pnpm install
pnpm db:up          # docker compose, 컨테이너 hanjang-postgres
pnpm migrate        # migrations/*.sql 순서대로 적용, 체크섬은 _migrations
pnpm seed:admin     # ADMIN_ROOT_LOGIN_ID/ADMIN_ROOT_PASSWORD로 root admin 시드
pnpm start:dev      # http://localhost:5500 REST, POST /mcp
```

## 환경 변수

`.env.example` 참고. 주요 값:

| 변수 | 용도 |
| --- | --- |
| `POSTGRES_*` | Postgres 접속. 로컬 기본 `hanjang` DB |
| `JWT_ACCESS_TOKEN_SECRET` / `JWT_REFRESH_TOKEN_SECRET` | 수험생·admin JWT 서명 |
| `KAKAO_*` | 카카오 OAuth |
| `SMS_PROVIDER_*`, `SMS_SENDER_ID`, `PHONE_CODE_PEPPER` | 전화 인증 SMS. 없으면 DevSmsSender |
| `ADMIN_ROOT_LOGIN_ID` / `ADMIN_ROOT_PASSWORD` | `pnpm seed:admin`이 만드는 root admin |
| `DD_SERVICE` / `DD_ENV` / `DD_VERSION` | Datadog JSON 로그 태그 (`hanjang-be`) |

## SMS Provider

`SMS_PROVIDER_URL` 설정 시 HTTP 발송. 기본 페이로드:

```json
{ "to": "+821012345678", "text": "[한장] 인증번호는 123456입니다.", "senderId": "sender" }
```

프로덕션은 `SMS_PROVIDER_AUTHORIZATION` 필수.

## admin

- `pnpm seed:admin`이 root admin 1명을 만든다. 모든 admin은 같은 권한.
- `POST /admin/login`(아이디·비밀번호) → admin JWT.
- `POST /admin/invites` → 초대 링크 생성·복사. 메일 발송 없음.
- `POST /admin/invites/accept` → 링크에서 아이디·비밀번호 설정 시 admin 생성. 만료·사용済 링크 거부.

## MCP

`POST /mcp` — Streamable HTTP. `Authorization: Bearer <admin JWT>` 필수.

도구: `list_exam_papers`, `add_question`, `add_quiz`. 추가만 열고 발행·수정·삭제는 열지 않는다. 검증 규칙은 BO와 같은 서비스 코드를 쓴다.

```json
{
  "mcpServers": {
    "hanjang": {
      "url": "http://localhost:5500/mcp",
      "headers": { "Authorization": "Bearer <admin JWT>" }
    }
  }
}
```

## 모듈

`auth`·`user`·`phone`·`database` 유지. `admin`·`exam`·`question`·`session`·`grade`·`quiz`·`mcp` 추가.

테이블: `users`, `admin`, `adminInvite`, `examPaper`, `question`, `examSession`, `answer`, `stroke`, `quiz`, `quizSession` 외 인증 보조 테이블.

## 테스트

```bash
pnpm test           # 단위
pnpm test:e2e       # HTTP e2e
```
