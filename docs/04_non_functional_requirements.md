# 非機能要件

本書の基準は個人開発PoC用であり、本番品質や銀行適合を示さない。

| ID | 要件 | 確認方法 |
|---|---|---|
| NFR-UX-001 | 320px幅から主要フローを操作できる | レスポンシブ確認・実機確認 |
| NFR-PERF-001 | 代表スマホで入力・画面遷移に明らかな待ちを生じさせない | Lighthouseと手動計測。数値目標は実装時に設定 |
| NFR-A11Y-001 | 主要導線でWCAG 2.2 AAを目標とする | axe、キーボード、読み上げの簡易確認 |
| NFR-DATA-001 | 実在人物・実在銀行の非公開情報を使わず合成データだけを使う | サンプルとログのレビュー |
| NFR-DATA-002 | 公開環境に申込内容を永続保存しないことを既定とする | 構成・Network確認 |
| NFR-SEC-001 | APIキー、秘密、サービスアカウント鍵をGitへ保存しない | secret scan、git diff |
| NFR-SEC-002 | 入力値をログへ残さず、依存関係の脆弱性確認を行う | ログ確認、依存関係監査 |
| NFR-SEC-003 | Firebase利用時はSecurity Rulesを設定・テストする | Emulator SuiteでRulesテスト |
| NFR-TEST-001 | Schema、Unit、代表E2EをGitHub Actionsの無料枠を意識して実行する | CI結果 |
| NFR-DET-001 | 同一の定義・入力で同一ルール結果になる | ブラウザ/Node共通ベクトル |
| NFR-COST-001 | 通常のPoC利用ではFirebase無料利用枠内・月額0円を目標とする | Firebase/GCP利用量画面 |
| NFR-COST-002 | 開発・自動テストは原則Emulator Suiteを使う | 開発手順・CI設定 |
| NFR-COST-003 | 常時稼働リソースと最小インスタンスを使わない | Functions等の設定確認 |
| NFR-COST-004 | Firestoreの読み書き回数を確認可能にする | Firestore Usage画面・記録 |
| NFR-COST-005 | Functionsの呼出回数と実行時間を確認可能にする | Firebase/GCP Metrics・記録 |
| NFR-COST-006 | 新規Firebaseサービス追加前に料金・無料枠・概算を人間が確認する | ADRまたはworklog |
| NFR-COST-007 | 月次確認方法と不要リソース削除手順を文書化する | [cost_checklist.md](cost_checklist.md) |

## Blazeプランと料金

2026-07-24に公式情報を確認した。Blazeは無料利用枠を含む従量課金で、超過分は課金される。予算アラートは通知であり支出上限ではない。確認時点でHostingは保存10GB、転送10GB/月まで、Firestoreは1データベースについて保存1GiB、読取50,000/日、書込20,000/日、削除20,000/日等の無料枠が案内されているが、これは参考値であり実装へ固定しない。Functionsは無料枠があってもデプロイ等で小額課金の可能性があるため、利用前に再確認する。

- https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- https://firebase.google.com/docs/hosting/usage-quotas-pricing
- https://firebase.google.com/docs/firestore/pricing
- https://firebase.google.com/docs/functions/quotas
- https://cloud.google.com/billing/docs/how-to/budgets

## 本番化時の論点

本番SLA、RTO/RPO、DR、SOC/SIEM、正式なFISC・ASVS・法令・銀行規程適合、鍵管理、実データ保持は本PoCの完了条件に含めない。
