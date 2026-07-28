# フォーム定義

## 目的

フォーム定義は、画面項目、限定条件ルール、名前付き項目バリデーターを動かす実行可能仕様である。PoC-1ではGitHub上のJSONまたはYAMLをビルド時に読み込み、JSON Schema v0で検証する。公開Definition Registryは作らない。

## PoC-1の構造

項目は必ず `sections[].fields[]` に格納する。ルート直下に独立した `fields` 配列は持たない。

```text
form
├─ bank_id
├─ product_id
├─ form_version
├─ sections[]
│  └─ fields[]
├─ rules[]
└─ navigation[]
```

| ID | 属性 | 内容 |
|---|---|---|
| FD-001 | `bank_id` | 仮想銀行ID |
| FD-002 | `product_id` | 仮想商品ID |
| FD-003 | `form_version` | 変更を識別する版 |
| FD-004 | `sections[]` | セクションID、表示名、順序、配下の項目 |
| FD-005 | `sections[].fields[]` | 型、表示名、固定状態、ルール参照、選択肢、バリデーター |
| FD-006 | `rules[]` | visibility/required/validation/navigation の条件ルール |
| FD-007 | `navigation[]` | 基本遷移と条件付きnavigationルール参照 |

`status`、`brand_ref`、`consents`、外部`mappings`、詳細`traceability` はPoC-1の必須にしない。ブランド文言は単純な設定として持ち、正式同意文として扱わない。

## 項目の概念契約

```yaml
sections:
  - section_id: personal
    label: 本人情報
    fields:
      - field_id: personal.email
        type: string
        label: メールアドレス
        visible: true
        required: true
        validators:
          - type: maxLength
            value: 254
            error_code: EMAIL_TOO_LONG
          - type: email
            error_code: EMAIL_INVALID
        validation_timing: [onBlur, onSectionNext, onSubmit]
      - field_id: personal.postal_code
        type: string
        label: 郵便番号
        visible: true
        required: true
        validators:
          - type: postalCodeJP
            error_code: POSTAL_CODE_INVALID
```

項目の最小属性は `field_id`、`type`、`label`、`visible`、`visibility_rule_id`、`required`、`required_rule_id`、`options`、`validators`、`validation_rule_ids`、`validation_timing`、`order` とする。表示名をIDに使わない。型は `string/integer/decimal/boolean/date/enum` に限定する。

## visibleとrequiredの評価規則

`visibility_rule_id` がある場合はvisibilityルール結果を使い、ない場合は固定値 `visible` を使う。

```text
effective_visible =
  visibility_rule_id がある
    ? visibilityルールの評価結果
    : visibleの固定値
```

`required_rule_id` がある場合はrequiredルール結果を使い、ない場合は固定値 `required` を使う。非表示項目は必須にしない。

```text
effective_required =
  effective_visible
  AND
  (
    required_rule_id がある
      ? requiredルールの評価結果
      : requiredの固定値
  )
```

条件変更で非表示になった項目は送信対象から必ず除外する。画面内の値はセクション滞在中だけ保持してよい。再表示時に値を保持するか消去するかはPoC-1実装前に一方へ固定する（OQ-11）。

## 名前付き項目バリデーター

単項目の形式、長さ、数値範囲は条件ルールではなく `validators` で表す。PoC-1で許可する候補は次のとおりで、`required` は含めない。

| type | 用途 |
|---|---|
| `minLength` | 最小文字数 |
| `maxLength` | 最大文字数 |
| `minValue` | 数値の最小値 |
| `maxValue` | 数値の最大値 |
| `email` | メールアドレス形式 |
| `postalCodeJP` | 日本の郵便番号形式 |
| `phoneJP` | 日本の電話番号形式 |
| `katakana` | カタカナ形式 |
| `date` | 日付形式・実在日付 |

フォーム定義に任意正規表現、JavaScript式、任意コードを記載できない。バリデーターは表示文ではなく `error_code` を返し、UIは単純なエラーメッセージ定義から文面を解決する。大規模な多言語基盤は作らない。

`validation_timing` は `onBlur`、`onSectionNext`、`onSubmit` から選ぶ。`onBlur` は早すぎるエラーを避けて限定的に使い、`onSectionNext` は当該セクション、`onSubmit` はフォーム全体を確認する。

単項目だけで表現できない回答条件や複数項目の関係は `validation_rule_ids` からvalidationルールを参照する。PoC-1では複雑な相関チェックを増やしすぎない。

## navigationの責務

ルート `navigation` はセクション間の基本遷移を定義し、`default_next_section_id` と条件付き遷移に使う `navigation_rule_ids` を持つ。navigationルールは条件一致時の `next_section_id` だけを返す。一致する条件がなければ既定遷移を使う。

```yaml
navigation:
  - from_section_id: personal
    default_next_section_id: employment
    navigation_rule_ids: [NAV-PERSONAL-001]
rules:
  - rule_id: NAV-PERSONAL-001
    type: navigation
    condition:
      op: equals
      field: personal.employment_status
      value: RETIRED
    result:
      next_section_id: contract
```

PoC-1では同一セクションで複数navigationルールが同時成立する構成を禁止する。終端セクションは既定遷移なしで明示する。

## Schema・静的検証

| ID | 検証 |
|---|---|
| FDV-001 | 必須属性、型、許可値、`sections[].fields[]` 以外の項目配列禁止 |
| FDV-002 | ID一意性と参照先の存在 |
| FDV-003 | 許可された条件演算子、ルール種別、名前付きバリデーターだけを使用 |
| FDV-004 | 遷移先の存在、到達不能セクション、意図しない循環 |
| FDV-005 | navigationルールの同時成立可能性、既定遷移または終端の存在 |
| FDV-006 | visible/requiredの参照と型、非表示項目を必須にしない評価 |
| FDV-007 | validatorの引数、error_code、validation_timing |
| FDV-008 | 15〜25項目、3〜5分岐というPoC-1上限の警告 |

## 版管理

公開済みファイルを書き換えた場合は `form_version` を更新する。追跡はGitコミットと定義ハッシュで行う。PoC-2では2商品目、銀行別ブランド、APIマッピング、途中保存に必要な属性を追加する。
