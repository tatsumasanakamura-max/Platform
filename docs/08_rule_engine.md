# ルール評価と項目バリデーション

## 方針

PoC-1では汎用DSLを作りすぎない。条件ルールと名前付き項目バリデーターを分離する。いずれも型付き・副作用なしとし、外部I/O、現在時刻、乱数、AI、任意コード、`eval`、任意正規表現を使わない。同一の定義と入力は常に同一結果にする。

## 条件ルールの演算子

| ID | 演算子 |
|---|---|
| OP-01 | `equals` |
| OP-02 | `notEquals` |
| OP-03 | `in` |
| OP-04 | `exists` |
| OP-05 | `greaterThanOrEqual` |
| OP-06 | `lessThanOrEqual` |
| OP-07 | `and` |
| OP-08 | `or` |
| OP-09 | `not` |

条件ルールはvisibility、required、conditional validation、navigationに使う。暗黙の型変換を避け、nullと未回答を区別する。

## 条件ルール種別

| ID | 種別 | 責務・出力 |
|---|---|---|
| RULE-01 | `visibility` | 項目を表示するかをbooleanで返す |
| RULE-02 | `required` | 項目を入力する必要があるかをbooleanで返す |
| RULE-03 | `validation` | 回答条件・複数項目関係の業務チェック結果とerror_codeを返す |
| RULE-04 | `navigation` | 条件成立時のnext_section_idを返す |

`derivation`、複雑な日付計算、汎用マッピング条件はPoC-2以降の候補とする。

## 名前付き項目バリデーター

単項目の形式・文字数・数値範囲は項目の `validators` で評価する。PoC-1では次の候補に限定する。

| ID | type | 用途 |
|---|---|---|
| VAL-01 | `minLength` | 最小文字数 |
| VAL-02 | `maxLength` | 最大文字数 |
| VAL-03 | `minValue` | 数値の最小値 |
| VAL-04 | `maxValue` | 数値の最大値 |
| VAL-05 | `email` | メールアドレス形式 |
| VAL-06 | `postalCodeJP` | 日本の郵便番号形式 |
| VAL-07 | `phoneJP` | 日本の電話番号形式 |
| VAL-08 | `katakana` | カタカナ形式 |
| VAL-09 | `date` | 日付形式・実在日付 |

`required` は必須状態として別管理し、バリデーターに重複させない。各バリデーターは `error_code` を返し、UIが利用者向け文面へ変換する。

## 責務分担

| 仕組み | 判断内容 |
|---|---|
| 固定required／requiredルール | 項目を入力する必要があるか |
| named validators | その項目単体の形式・文字数・数値範囲が正しいか |
| validationルール | 回答条件や複数項目の関係による業務的チェック |

例として、会社員の場合だけ勤務先名が必要かはrequiredルール、メール形式は`email`バリデーター、希望額に応じた別項目との整合性はvalidationルールで扱う。

## 評価順

1. 入力を定義された型へ変換する。
2. 固定visibleまたはvisibilityルールから `effective_visible` を決める。
3. 固定requiredまたはrequiredルールから `effective_required` を決める。非表示項目は必須にしない。
4. 表示中かつ回答済みの項目へ、指定タイミングのnamed validatorsを適用する。
5. 指定タイミングのconditional validationルールを評価する。
6. セクション完了時にnavigationルールを評価する。一致がなければルートnavigationの既定遷移を使う。
7. 非表示項目を送信対象から除外する。

## navigation規則

同一セクションで複数navigationルールが同時に成立する構成は禁止する。Schemaまたは静的検証で、遷移先の存在、到達不能、意図しない循環、条件の重複可能性、既定遷移または終端を確認する。

## バリデーションタイミング

- `onBlur`: 形式エラーを必要以上に早く出さないよう限定的に使う。
- `onSectionNext`: 当該セクションの必須、named validators、validationルールを確認する。
- `onSubmit`: フォーム全体を同じ規則で再確認する。

クライアント側チェックはPoC用であり、本番では信頼できるサーバーによる再検証が必要である。

## テスト

- RET-001: 条件演算子のtrue/false/nullを確認する。
- RET-002: 各named validatorで正常値、境界直前、境界値、境界直後を確認する。
- RET-003: 空文字、nullまたは未回答、型不正、日本語入力の代表例を確認する。
- RET-004: visible/requiredの固定値とルール参照の優先関係を確認する。
- RET-005: 3〜5件の条件分岐と既定navigationを含む代表経路を確認する。
- RET-006: ブラウザとNode.jsで同じ関数・テストベクトルを使う。
- RET-007: 変更後に全テストを再実行し回帰成功率を記録する。

MC/DC、ミューテーションテスト、網羅的な組合せ生成はPoC-1の完了条件にしない。
