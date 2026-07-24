# フォーム定義

## 目的

フォーム定義は、画面項目と限定ルールを動かす実行可能仕様である。PoC-1ではGitHub上のJSONまたはYAMLをビルド時に読み込み、JSON Schema v0で検証する。公開Definition Registryは作らない。

## PoC-1必須ルート

| ID | 属性 | 内容 |
|---|---|---|
| FD-001 | `bank_id` | 仮想銀行ID |
| FD-002 | `product_id` | 仮想商品ID |
| FD-003 | `form_version` | 変更を識別する版 |
| FD-004 | `sections` | セクションID、表示名、順序、fields |
| FD-005 | `fields` | 型、表示名、必須、選択肢、検証参照 |
| FD-006 | `rules` | visibility/required/validation/navigation |
| FD-007 | `navigation` | セクションの次遷移 |

`status`、`brand_ref`、`consents`、外部`mappings`、詳細`traceability` はPoC-1の必須にしない。必要なブランド文言は単純な設定として持ち、正式同意文として扱わない。

## 最小例

```yaml
bank_id: virtual-bank-a
product_id: card-loan-basic
form_version: 0.1.0
sections:
  - section_id: personal
    label: 本人情報
    fields:
      - field_id: personal.age
        type: integer
        label: 年齢
        required: true
        validation_rule_ids: [VAL-AGE-001]
rules:
  - rule_id: VAL-AGE-001
    type: validation
    condition:
      op: greaterThanOrEqual
      field: personal.age
      value: 20
navigation:
  - from: personal
    to: employment
```

## 項目の最小属性

`field_id`、`type`、`label`、`required`、`options`、`validation_rule_ids`、`visibility_rule_id`、`order` を候補とする。型は `string/integer/decimal/boolean/date/enum` に限定する。表示名をIDに使わない。

## Schema検証

| ID | 検証 |
|---|---|
| FDV-001 | 必須属性、型、許可値 |
| FDV-002 | ID一意性と参照先の存在 |
| FDV-003 | 許可された演算子とルール種別 |
| FDV-004 | セクション遷移の到達性と循環 |
| FDV-005 | 非表示かつ必須など代表的な矛盾 |
| FDV-006 | 15〜25項目、3〜5分岐というPoC-1上限の警告 |

## 版管理

公開済みファイルを書き換えた場合は `form_version` を更新する。追跡はGitコミットと定義ハッシュで行う。PoC-2では2商品目、銀行別ブランド、APIマッピング、途中保存に必要な属性を追加する。
