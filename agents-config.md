# Agents Configuration

このファイルをプロジェクトに合わせて編集してください。
他言語に対応する場合は、言語別のエージェントを新規作成してください。

## Project Settings

- language: C#
- framework: （例: ASP.NET Core / Console App / Class Library）
- coding_style_ref: .github/config/coding-style.md

## Paths

- design_doc_dir: .github/design/
- impl_dir: src/
- interface_dir: src/interfaces/
- tmp_dir: .copilot-impl/
- trace_active_dir: .copilot-impl/trace/active/
- trace_archive_dir: .copilot-impl/trace/archive/

## Flow Settings

- retry_limit: 3
- cp1_approval_keyword: 承認
- cp3_enabled: true

## Build Settings

- build_retry_limit: 3
- build_tool: dotnet
