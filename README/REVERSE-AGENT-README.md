# ソースコードリバースエンジニアリング設計書生成エージェント

ソースコードを解析し、アーキテクチャ設計・静的設計・動的設計・例外設計を含む
**AsciiDoc 設計書（PlantUML図付き）** をリバースエンジニアリングで自動生成するカスタムエージェント群です。

## アーキテクチャ

```
User（ソースディレクトリ指定）
  └─► Design Reverser                    ← ユーザー起動エントリポイント
        │
        ├─► Reverse Architecture Analyst  → .copilot-reverse/context.md
        │                                 → .copilot-reverse/01-architecture.adoc
        │
        ├─► Reverse Static Analyst        → .copilot-reverse/02-static.adoc
        │                                 → .copilot-reverse/diagrams/class-*.puml
        │
        ├─► Reverse Dynamic Analyst       → .copilot-reverse/03-dynamic.adoc
        │                                 → .copilot-reverse/diagrams/seq-*.puml
        │                                 → .copilot-reverse/diagrams/state-*.puml
        │
        ├─► Reverse Exception Analyst     → .copilot-reverse/04-exception.adoc
        │
        └─► Reverse Doc Assembler         → docs/design/{project-name}-design.adoc
```

### コンテキスト管理方式

エージェント間のハンドオフはすべてファイル経由で行います。
オーケストレーターのコンテキストにはファイルパスのみが残り、ソースコードの内容は展開されません。

| 方式 | 内容 |
|---|---|
| **共有コンテキスト分離** | `context.md` にプロジェクト基本情報・アーキテクチャパターンを抽出。全サブエージェントが参照する軽量ファイル |
| **フェーズ別生成** | 各アナリストは「読むファイルの種類」が異なるため独立エージェント化。コンテキストの汚染を防ぐ |
| **include ディレクティブ解決** | 各 `.adoc` は `include::diagrams/*.puml[]` 形式で記述。アセンブラーが最終統合時にインライン展開 |

---

## エージェント一覧

### Design Reverser（`design-reverser.agent.md`）

**ユーザーが直接起動するエントリポイント。**

ソースディレクトリを受け取り、全フェーズを調整します。
自分では設計書を書かず、サブエージェントへの委譲とフロー制御のみを行います。

- **起動方法**: エージェントピッカーから "Design Reverser" を選択
- **引数**: 解析対象のソースディレクトリパス（省略時: ワークスペースルート）
- **ツール**: `agent`, `read`, `search`, `todo`

**実行フロー:**

```
Step 1: プロジェクトファイル走査 → 言語・FW 自動検出
Step 2: todo 登録（Phase 1〜5）
Step 3: Reverse Architecture Analyst 呼び出し（必須・直列）
Step 4: Reverse Static / Dynamic / Exception Analyst を順次呼び出し
Step 5: Reverse Doc Assembler 呼び出し
Step 6: 完了報告
```

各サブエージェントの呼び出しでエラーが発生した場合、スキップして続行するかユーザーに確認します。

---

### Reverse Architecture Analyst（`reverse-architecture-analyst.agent.md`）

**Phase 1: アーキテクチャ・設計方針の解析。**

プロジェクトファイルとディレクトリ構造を走査し、
他のアナリストが依存する **共有コンテキスト (`context.md`)** を生成します。

- **検出内容**: アーキテクチャパターン（MVC / DDD / Clean Architecture / Hexagonal 等）・レイヤー構造・外部依存関係
- **識別対象**: `.csproj`, `package.json`, `pom.xml`, `go.mod`, `Cargo.toml`, `README`, `docker-compose.yml` 等
- **出力**:
  - `.copilot-reverse/context.md` — プロジェクト名・言語・FW・アーキテクチャパターン・命名規則
  - `.copilot-reverse/01-architecture.adoc` — レイヤー構造図（PlantUML）・技術スタック表付き
- **ツール**: `read`, `search`, `edit`

**`context.md` の構造:**

```markdown
# プロジェクトコンテキスト

## 基本情報
- プロジェクト名: MyApp
- 言語: C# / .NET 8
- フレームワーク: ASP.NET Core 8.0
- 構成タイプ: マルチプロジェクト

## アーキテクチャパターン
Clean Architecture（Domain / Application / Infrastructure / Presentation 層）

## レイヤー構造
（レイヤー名: ディレクトリパスの対応）

## 外部依存関係
（カテゴリ別: ORM / メッセージング / 認証 / テスト等）

## 命名規則 / 注目すべき設計上の特徴
```

---

### Reverse Static Analyst（`reverse-static-analyst.agent.md`）

**Phase 2: 静的設計（クラス設計・データ設計）の解析。**

`context.md` を読んでから対象言語のソースファイルを収集し、
クラス・インターフェース・DBスキーマを解析します。

- **検出内容**: クラス階層・インターフェース・継承関係・publicメソッドシグネチャ・DBテーブル定義
- **クラス種別判定**: Controller / Service / UseCase / Repository / Entity / DTO 等を命名規則と属性から推定
- **DBスキーマ**: マイグレーションファイル / ORM定義 / SQL ファイルから抽出
- **クラス図分割**: レイヤーまたは機能単位で分割（1ファイル最大20クラス目安）
- **出力**:
  - `.copilot-reverse/02-static.adoc` — クラス一覧表・インターフェース一覧・データ設計表
  - `.copilot-reverse/diagrams/class-{layer}.puml` — PlantUML クラス図
- **ツール**: `read`, `search`, `edit`

**クラス図のファイル命名規則:**
```
class-domain.puml
class-application.puml
class-infrastructure.puml
class-presentation.puml
```

---

### Reverse Dynamic Analyst（`reverse-dynamic-analyst.agent.md`）

**Phase 3: 動的設計（シーケンス図・状態遷移図）の解析。**

`context.md` を読んでからエントリポイントを収集し、
呼び出しチェーンを最大5ホップ追跡してシーケンス図を生成します。

- **エントリポイント検出**: `[HttpPost]` / `@GetMapping` / `@Get()` 等のフレームワーク別アノテーション
- **追跡終了条件**: ORMメソッド到達・外部HTTPクライアント到達・メッセージ発行
- **ユースケース選定基準**: CRUD代表操作・認証フロー・非同期処理・外部連携・複雑エラーパス（最大10件）
- **状態遷移図**: `Status` / `State` 等の列挙型によるライフサイクル管理が検出された場合のみ生成
- **出力**:
  - `.copilot-reverse/03-dynamic.adoc` — ユースケース一覧表・非同期処理対応表
  - `.copilot-reverse/diagrams/seq-{use-case}.puml` — PlantUML シーケンス図
  - `.copilot-reverse/diagrams/state-{entity}.puml` — PlantUML 状態遷移図（任意）
- **ツール**: `read`, `search`, `edit`

**シーケンス図のファイル命名規則:**
```
seq-create-order.puml
seq-user-login.puml
seq-process-payment.puml
```

---

### Reverse Exception Analyst（`reverse-exception-analyst.agent.md`）

**Phase 4: 例外設計（例外クラス階層・エラーハンドリング・ログ設計）の解析。**

`context.md` を読んでからカスタム例外クラスとcatchブロックを網羅的に走査します。

- **検出内容**: カスタム例外クラス階層・グローバルエラーハンドラー・try-catchパターン・エラーコード体系・ログパターン
- **グローバルハンドラー検出**: `IExceptionHandler` / `@ControllerAdvice` / `@Catch()` 等
- **catchパターン分類**: 再スロー（wrap）/ ログのみ / デフォルト値返却 / リソース解放 / 握り潰し（アンチパターン）
- **例外階層図**: カスタム例外が3つ以上存在する場合のみ PlantUML 図を生成
- **出力**:
  - `.copilot-reverse/04-exception.adoc` — 例外クラス一覧・ハンドリングマッピング表・ログ設計
- **ツール**: `read`, `search`, `edit`

---

### Reverse Doc Assembler（`reverse-doc-assembler.agent.md`）

**Phase 5: 最終 AsciiDoc 設計書の組み立て。**

`.copilot-reverse/` 配下の部品ファイルを読み込み、
`include::diagrams/*.puml[]` をインライン展開して完全な単一ファイルを生成します。

- **プロジェクト名取得**: `context.md` の `プロジェクト名:` から出力パスを決定
- **include 解決**: 各 `.adoc` 内の PlantUML includeディレクティブを実ファイル内容に置換
- **出力**: `docs/design/{project-name}-design.adoc`
- **ツール**: `read`, `edit`

---

## 作業ディレクトリ `.copilot-reverse/`

実行後にワークスペースの `.copilot-reverse/` に以下の中間ファイルが生成されます。
これらは再実行時の差分更新や、個別アナリストの再実行に利用できます。

```
.copilot-reverse/
├── context.md              # プロジェクト基本情報（全アナリストが参照）
├── 01-architecture.adoc    # アーキテクチャ・設計方針セクション
├── 02-static.adoc          # 静的設計セクション
├── 03-dynamic.adoc         # 動的設計セクション
├── 04-exception.adoc       # 例外設計セクション
└── diagrams/
    ├── class-domain.puml       # クラス図（レイヤー別）
    ├── class-application.puml
    ├── seq-create-order.puml   # シーケンス図（ユースケース別）
    ├── seq-user-login.puml
    └── state-order.puml        # 状態遷移図（エンティティ別、任意）
```

### 最終出力ファイル

```
docs/design/
└── {project-name}-design.adoc   # PlantUML インライン埋め込み済み完全設計書
```

**AsciiDoc 設計書の構造:**

```asciidoc
= {project-name} ソフトウェア設計書
:toc: left
:toclevels: 3
:sectnums:

== はじめに
（生成日時・技術スタック・アーキテクチャパターンのサマリー表）

== 1. アーキテクチャ・設計方針
=== 1.1 プロジェクト概要
=== 1.2 アーキテクチャパターン
=== 1.3 レイヤー構造（PlantUML パッケージ図）
=== 1.4 外部依存関係・技術スタック
=== 1.5 設計上の特徴・方針

== 2. 静的設計
=== 2.1 クラス設計（PlantUML クラス図）
=== 2.2 データ設計

== 3. 動的設計
=== 3.1 ユースケース一覧
=== 3.2 主要ユースケースのシーケンス図（PlantUML）
=== 3.3 状態遷移図（PlantUML、任意）
=== 3.4 非同期処理・イベント処理

== 4. 例外設計
=== 4.1 例外クラス階層（PlantUML、3クラス以上の場合）
=== 4.2 例外クラス一覧
=== 4.3 グローバルエラーハンドリング
=== 4.4 例外ハンドリングパターン
=== 4.5 エラーコード体系（任意）
=== 4.6 ログ設計

== 付録
=== A. 解析対象ファイル一覧
=== B. 制約事項・免責
```

---

## 対応言語・フレームワーク

Architecture Analyst がプロジェクトファイルを検索して自動判定します。

| プロジェクトファイル | 言語 | 検出されるFW例 |
|---|---|---|
| `*.csproj` / `*.sln` | C# / .NET | ASP.NET Core / EF Core / MediatR |
| `package.json` + `tsconfig.json` | TypeScript | NestJS / Express / Prisma |
| `pom.xml` / `build.gradle` | Java | Spring Boot / JPA / Hibernate |
| `pyproject.toml` / `setup.py` | Python | FastAPI / Django / SQLAlchemy |
| `go.mod` | Go | Gin / Echo / GORM |
| `Cargo.toml` | Rust | Axum / Actix-web / Diesel |

---

## 個別フェーズの再実行

設計書の一部だけを更新したい場合、サブエージェントを直接呼び出せます（`user-invocable: false` のため、`design-reverser` 経由で引数として指示するか、プロンプトで明示的に呼び出してください）。

| 更新したいセクション | 再実行するエージェント |
|---|---|
| アーキテクチャ・技術スタック | Reverse Architecture Analyst |
| クラス図・データ設計 | Reverse Static Analyst |
| シーケンス図・状態遷移 | Reverse Dynamic Analyst |
| 例外設計・ログ設計 | Reverse Exception Analyst |
| 最終 adoc の再統合のみ | Reverse Doc Assembler |

---

## 拡張候補

- **差分更新モード**: 前回生成時からの変更ファイルのみを再解析して部分更新する `--diff` モードをオーケストレーターに追加
- **CI 統合**: `git push` フックで `design-reverser` を自動実行し、設計書を常に最新に保つ
- **ワークスペース固有の補足**: `.github/instructions/reverse-style.instructions.md` でプロジェクト固有の命名規則・除外ディレクトリを指定
- **TDD エージェントとの連携**: 本エージェントで生成した `docs/design/*.adoc` を `TDD Orchestrator` の入力として使用し、「設計書生成 → 実装」を一気通貫で実行
