# Agents Configuration
# このファイルをプロジェクトに合わせて編集してください

## Project Settings
# [必須] 実装対象の言語とフレームワークを指定してください
- language: （例: C# / TypeScript / Java / Python）
- framework: （例: ASP.NET Core / NestJS / Spring Boot）
# [任意] コーディング規約ファイルのパス。存在しない場合はデフォルトを使用します
- coding_style_ref: .github/config/coding-style.md

## Paths
# [必須] 設計書・実装ファイルの配置パスを指定してください
- design_doc_dir: .github/design/
- impl_dir: src/
- interface_dir: src/interfaces/
# [任意] 中間ファイル・トレースの出力先（変更不要な場合はデフォルトのまま）
- tmp_dir: .copilot-impl/
- trace_active_dir: .copilot-impl/trace/active/
- trace_archive_dir: .copilot-impl/trace/archive/

## Flow Settings
# [任意] リトライ上限回数（デフォルト: 3）
- retry_limit: 3
# [任意] CP1 承認キーワード（デフォルト: 承認）
- cp1_approval_keyword: 承認
# [任意] CP3（全クラス実装完了通知）を有効にするか（デフォルト: true）
- cp3_enabled: true
