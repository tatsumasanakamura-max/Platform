# ルールエンジン

## 1. 原則

ルールは宣言的、型付き、副作用なし、停止性が保証され、同一入力・同一定義版で同一結果を返す。ルール評価中のネットワーク、時刻直接参照、乱数、AI推論、任意コード実行を禁止する。基準日は評価コンテキストとして明示的に渡す。

## 2. ルール種別

| ID | 種別 | 出力 | 例 |
|---|---|---|---|
| RULE-TYPE-01 | validation | valid/error code | 年齢・桁・範囲 |
| RULE-TYPE-02 | visibility | boolean | 自営業時だけ屋号表示 |
| RULE-TYPE-03 | requiredness | boolean | 条件に応じ必須 |
| RULE-TYPE-04 | navigation | next section ID | 回答別に後続変更 |
| RULE-TYPE-05 | derivation | typed value | 送信向け正規化・区分 |
| RULE-TYPE-06 | mapping condition | include/exclude | API項目の出力条件 |

与信・審査可否はルール種別に含めない。

## 3. 許可式

ASTまたはJSON Logic相当の制限DSLを使う。初期演算子は `and/or/not`、`eq/ne`、`gt/gte/lt/lte`、`in`、`exists`、`length`、`matchesApprovedPattern`、`dateDiff` とする。暗黙型変換を禁止し、null/unknownを明示する。

```yaml
rule_id: VIS-EMP-001
type: visibility
description: 自営業の場合に屋号を表示する
when:
  op: eq
  args:
    - field: employment.employment_type
    - literal: SELF_EMPLOYED
result: true
else: false
requirement_refs: [FR-APP-006]
test_refs: [TEST-VIS-EMP-001, TEST-VIS-EMP-002]
```

## 4. 評価順序

1. 入力を型・正規形へ変換する。
2. 表示条件を固定点まで評価する。
3. 非表示値ポリシーを適用する。
4. 必須条件を評価する。
5. 指定タイミングの単項目・複合検証を評価する。
6. セクション完了時に遷移を評価する。
7. 送信時はサーバーで1〜6と全体整合性を再評価する。

ルール依存グラフは公開時にトポロジカルソートし、循環を拒否する。

## 5. 結果契約

評価結果は `rule_id`、`outcome`、`reason_code`、`referenced_field_ids`、`definition_hash` を返す。利用者向け文面は `reason_code` から表示し、ログには原則として入力値を含めない。

## 6. 矛盾解決

- 同一属性を複数ルールが設定する設計は原則禁止し、公開検査で拒否する。
- 例外的な優先順位は明示的 `priority` と決定表で表現し、暗黙の配列順を使わない。
- 非表示項目は必須にしない。両者が真になる可能性があればFDV-005違反。
- 遷移は「最初に一致」ではなく、相互排他または明示優先順位を検証する。

## 7. テスト戦略

| ID | テスト | 必須内容 |
|---|---|---|
| RET-001 | 例示テスト | 要件の正常・異常例 |
| RET-002 | 境界値 | 直前、境界、直後、null、型不正 |
| RET-003 | 決定表 | 条件組合せと期待結果。全行を実行 |
| RET-004 | 経路テスト | 全セクション遷移と終端 |
| RET-005 | 性質ベース | 決定性、例外なし、型保存 |
| RET-006 | ミューテーション | 重要ルールのテスト感度 |
| RET-007 | 差分回帰 | 変更影響外の結果が不変 |
| RET-008 | クライアント・サーバー一致 | 同じテストベクトルで結果一致 |

## 8. カバレッジ

行・分岐だけでなく、ルール数、決定表行、真偽結果、経路、境界値、ミューテーションスコアを記録する。重要ルールの定義は業務責任者が決め、MC/DC適用要否はPoCで評価する。

## 9. 変更安全性

ルール変更時、AIは影響する項目、ルール依存先、到達経路、マッピング、テストを候補提示する。決定的解析が実参照を確定し、旧版と新版へ共通テストコーパスを流して意図した差分以外を検出する。

