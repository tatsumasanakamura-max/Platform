# Codex作業ルール

## プロジェクト目的

- 個人開発によるAI Native銀行カードローン申込フォームPoCであり、Codexを主な作業主体とする。
- 仮想銀行、仮想商品、合成データだけを使用する。本番銀行システムではない。

## PoC-1の上限

- 仮想銀行1行、仮想商品1商品、15〜25項目、3〜5条件分岐とする。
- スマートフォンファーストとする。
- 管理画面や汎用基盤を先に作らず、小さな縦切りを優先する。
- PoC-2の機能を人間の確認なく前倒ししない。

## 禁止事項

- 実在人物の個人情報、実在銀行の非公開情報を使用しない。
- 実与信・実審査を実装せず、AI推論を申込実行・判定経路へ入れない。
- 秘密情報やサービスアカウント鍵をGitへ保存しない。
- 任意コード、`eval`、任意正規表現をフォーム定義へ許可しない。
- Firebaseの課金可能なサービスや設定を人間の確認なしに追加しない。
- `main` ブランチへ直接変更しない。
- ユーザーの既存変更を勝手に削除・上書きしない。

## 作業原則

- 実装前に関連する `docs/` を読む。
- 仮定を業務要件として勝手に確定しない。
- フォーム定義、コード、テスト、文書を同期させる。
- 通常開発はローカルまたはEmulator Suiteを優先し、Firebase公開は主要な節目だけ行う。
- Firebase料金・無料枠は実装時の公式情報を確認する。
- 変更影響とテスト結果を報告し、`docs/worklogs/` へ作業内容を記録する。

## 必須検証

技術スタックとコマンドは未確定である。存在しないコマンドを捏造せず、未実行のテストを実行済みと報告しない。

- JSON Schema検証
- ルールUnitテスト
- 名前付きバリデーターUnitテスト
- 代表経路E2E
- build
- secret scan
- 文書リンク・ID整合性

## 検証コマンド

Node.js 24とnpmを使用する。依存関係は`package-lock.json`から復元し、テスト未実行時は成功と報告しない。

- 依存関係: `npm ci`
- TypeScript strict: `npm run typecheck`
- lint: `npm run lint`
- format確認: `npm run format:check`
- JSON Schema／ルール／バリデーター／Component: `npm test`
- Chromium E2E／axe／モバイル幅: `npm run test:e2e`
- WebKit iPhone相当: `npm run test:e2e:webkit`
- production build: `npm run build`
- secret scan: `npm run check:secrets`
- 文書リンク整合性: `npm run check:docs`
- E2E以外の一括ゲート: `npm run verify`

初回E2E前は、公式手順を確認して`npx playwright install chromium webkit`を実行する。Firebase CLIは未導入であり、デプロイコマンドは人間が公開を承認した後に追記する。

## 参照文書

- [概要](docs/README.md)
- [PoC憲章](docs/00_poc_charter.md)
- [スコープ](docs/01_scope.md)
- [機能要件](docs/03_functional_requirements.md)
- [アーキテクチャ](docs/06_system_architecture.md)
- [フォーム定義](docs/07_form_definition.md)
- [ルール評価](docs/08_rule_engine.md)
- [開発ワークフロー](docs/09_ai_development_workflow.md)
- [コストチェックリスト](docs/cost_checklist.md)
- [Worklogテンプレート](docs/worklogs/README.md)

## FormStudio作業時の追加規則

- Studioと申込画面は同じ`FormDefinition`、`RuntimeField`、rule、validatorを使用する。
- 画面構造グループと条件依存ルールを同一属性へ混在させない。
- ブラウザからリポジトリ、Firebase、申込者回答を永続化しない。
- 複合条件は破壊せず読取専用にし、任意コード・任意正規表現を追加しない。
- 詳細は[Studio概要](docs/form-studio/overview.md)を正とする。
