# フォーム定義

## 1. 目的

フォーム定義はUI、ルール、遷移、連携、説明仕様の単一の実行可能な情報源である。文書は概念契約を示し、実装時はJSON Schemaとサンプル定義をリポジトリで版管理する。

## 2. ルート構造

| ID | 属性 | 必須 | 説明 |
|---|---|---|---|
| FD-001 | `schema_version` | Yes | 定義メタスキーマ版 |
| FD-002 | `bank_id` | Yes | 不変の銀行識別子 |
| FD-003 | `product_id` | Yes | 銀行内の商品識別子 |
| FD-004 | `form_version` | Yes | SemVer候補。公開後不変 |
| FD-005 | `status` | Yes | draft/review/approved/published/retired |
| FD-006 | `locale` | Yes | 例 `ja-JP` |
| FD-007 | `brand_ref` | Yes | 承認済みブランド定義参照 |
| FD-008 | `sections` | Yes | セクションと項目 |
| FD-009 | `rules` | Yes | 型付きルール |
| FD-010 | `navigation` | Yes | セクション遷移 |
| FD-011 | `mappings` | Yes | 内部モデルから外部契約への写像 |
| FD-012 | `consents` | Yes | 同意ID、文面版、表示条件 |
| FD-013 | `traceability` | Yes | 要件・テスト・決定事項ID |
| FD-014 | `effective_from/to` | No | 新規開始に使用できる期間 |

## 3. 項目契約

各項目は全版・全商品で安定した `field_id` を持つ。表示名をIDに使わない。

```yaml
field_id: employment.employment_type
data_type: enum
label_key: field.employment_type.label
help_key: field.employment_type.help
order: 10
required:
  default: true
  rule_ref: null
visibility:
  default: true
  rule_ref: null
options_ref: employment_types_v1
validation_refs: [VAL-EMP-001]
validation_timing: [onSectionNext, onSubmit]
hidden_value_policy: clear
autocomplete: organization-title
external_mapping_ref: MAP-EMP-001
requirement_refs: [FR-APP-003]
```

`data_type` は `string/integer/decimal/boolean/date/enum/object/array` の許可リストとする。金額は浮動小数を避け、通貨・単位を明示する。日付・電話・郵便番号は内部正規形を定義する。

## 4. セクション契約

`section_id`、表示文言キー、順序、項目参照、表示条件、進捗ラベル、次遷移を持つ。項目を重複配置せず、確認画面は回答モデルの参照として表現する。

## 5. 差分と合成

```mermaid
flowchart LR
  C[共通テンプレート] --> B[銀行ベース]
  B --> P[商品差分]
  P --> V[スキーマ・参照・経路検証]
  V --> S[解決済み不変スナップショット]
  S --> H[hash/署名]
  H --> R[(公開レジストリ)]
```

差分操作は `add/remove/replace/reorder` の許可リストとし、対象IDの存在、型互換性、削除後参照を検査する。深い暗黙継承は避ける。

## 6. バージョニング

- メタスキーマの互換性変更は `schema_version`。
- 銀行・商品の内容変更は `form_version`。
- 公開済み版は変更せず、新版を作成する。
- 申込中セッションは開始版を固定する。重大な法令対応等による強制移行は未決事項。
- 文言、選択肢、同意にも独立版を持たせ、解決済みスナップショットに含める。

## 7. 公開前検証

| ID | 検証 |
|---|---|
| FDV-001 | JSON Schema、型、必須属性 |
| FDV-002 | ID一意性、参照整合性、削除済み参照 |
| FDV-003 | ルール演算子とオペランド型 |
| FDV-004 | 循環、到達不能セクション、終端なし経路 |
| FDV-005 | 非表示かつ必須などの矛盾 |
| FDV-006 | 選択肢コードの重複・外部写像欠落 |
| FDV-007 | API契約・同意版・翻訳キーの完全性 |
| FDV-008 | 要件・ルール・テストのトレーサビリティ |
| FDV-009 | 正規表現ReDoS、禁止HTML、任意コード等の安全性 |
| FDV-010 | 版差分と必要承認の充足 |

## 8. 正規回答モデル

UI構造と審査APIから独立した型付き内部モデルを設ける。回答は `field_id` をキーに保持し、外部コードへの変換はマッピング層で行う。非表示値は `hidden_value_policy` に従い、外部送信対象から常に除外する。

## 9. 仮定

- 仮定 FD-A-01: PoC定義はYAMLで編集し、CI内で正規化JSONへ変換する。
- 仮定 FD-A-02: 文言はキー参照とし、実体は同じ変更単位で版固定する。
- 仮定 FD-A-03: SemVer採用は候補であり、銀行の版管理規程確認後に確定する。

