# プロダクトバックログ

## PoC-1 P0

| ID      | 項目                                       | 完了条件                                                         | 目的         |
| ------- | ------------------------------------------ | ---------------------------------------------------------------- | ------------ |
| PB1-001 | ローカル開発環境とFirebase Hosting最小設定 | ローカルbuildと必要時deploy手順                                  | OBJ-01       |
| PB1-002 | JSON Schema v0                             | FD-001〜008、`sections[].fields[]`、状態・遷移規則と不正例を検証 | OBJ-02,04    |
| PB1-003 | 最小条件ルール評価                         | 9演算子・4種別、required/visibility/navigation規則のUnit合格     | OBJ-03,04    |
| PB1-004 | スマホフォームUI                           | 本人・勤務先・契約、確認・完了                                   | OBJ-01,07    |
| PB1-005 | 仮想商品定義                               | 15〜25項目、3〜5分岐                                             | OBJ-01,02    |
| PB1-006 | ブラウザ/ローカルAPIスタブ                 | 合成結果で完了画面へ進む                                         | OBJ-01       |
| PB1-007 | Unit/E2E/GitHub Actions                    | Schema、条件ルール、validator、代表経路、build                   | OBJ-04       |
| PB1-008 | Codex作業手順とworklog雛形                 | AGENTS.mdと必須記録項目を利用可能                                | OBJ-02,06    |
| PB1-009 | Firebase Emulator Suite                    | 採用サービスをローカルで試験可能                                 | OBJ-01       |
| PB1-010 | Firebase最小サービス決定                   | 必要性、料金、無料枠、概算を記録                                 | OBJ-01       |
| PB1-011 | Firestore Security Rules                   | Firestore採用時のみRulesテスト合格                               | OBJ-04       |
| PB1-012 | Functions最終検証・冪等性                  | Functions採用時のみEmulatorで合格                                | OBJ-04       |
| PB1-013 | コスト運用手順                             | 予算通知、利用量確認、削除手順を文書化                           | OBJ-01       |
| PB1-014 | Scenario SC1-01〜05                        | 変更別KPIと回帰結果を記録                                        | OBJ-03,04    |
| PB1-015 | PoC-1評価                                  | KPI、問題、PoC-2判断を記録                                       | OBJ-01〜07   |
| PB1-016 | 名前付き項目バリデーター                   | 9候補、タイミング、error_code、境界テストを実装                  | OBJ-02,04,07 |

PB1-011/012は条件付きP0であり、Firestore/Functionsを採用しない現在の縦切りでは非該当とする。PB1-002/003/006/007/016は本人情報7項目の範囲で完了した。PB1-004/005は本人情報の縦切りまで完了し、勤務先・契約を含む15〜25項目と3〜5分岐は未完了である。次は少人数の合成データ操作確認を行い、結果を反映してから勤務先情報の最小セクションへ進む。

## PoC-2 P1

- PB2-001: 2商品目と商品差分
- PB2-002: 別銀行ブランド・文言差分
- PB2-003: APIマッピング差分
- PB2-004: 合成データの途中保存・再開
- PB2-005: 必要な場合のみAuthentication、Firestore、Functions、App Check
- PB2-006: 簡易UXイベントと少人数テスト
- PB2-007: 必要性が確認できた場合だけ簡易設定画面

## P2／本番化時

Definition Registry、本格管理画面、多人数承認、本格監査・生成台帳、署名・鍵管理、大規模マルチテナント、SLA/DR、実銀行接続、正式適合を候補とする。PoC-1では着手しない。

## 推奨順

```mermaid
flowchart LR
  A[Schema/Condition Rule/Validator] --> B[静的縦切り]
  B --> C[Test/Worklog]
  C --> D[Hosting/実機]
  D --> E[代表変更]
  E --> F[PoC-1評価]
  F -->|進む場合| G[PoC-2]
```

## PoC-1B

- PB1B-001: FormStudioの3ペイン／狭幅タブUI
- PB1B-002: Draft編集、履歴、Import/Export、localStorage
- PB1B-003: 共通Runtime Preview、validator test、最小条件builder
- PB1B-004: Schema・整合性、属性単位差分、派生Markdown
- PB1B-005: Unit/Component/E2E、axe、実ブラウザ視覚確認

正となる完了範囲は[Studio概要](form-studio/overview.md)を参照する。
