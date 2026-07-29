# UI部品契約

部品の実装は`src/components/`、フォーム定義との契約は[フォーム定義](../07_form_definition.md)を正とする。React Aria Componentsで操作・ARIA動作を担い、React Hook Formを回答とエラー状態の正とする。

| 部品             | 用途・状態                           | アクセシビリティ                                 | 禁止事項／定義対応                 |
| ---------------- | ------------------------------------ | ------------------------------------------------ | ---------------------------------- |
| AppHeader        | 仮想ブランド表示                     | `header`ランドマーク                             | 実在銀行を連想させない             |
| DemoNotice       | 本番利用不可、非審査、合成データ限定 | 名前付き`aside`                                  | 閉じられない重要説明として常時表示 |
| ProgressHeader   | 現在地と全体像                       | 名前、現在値、テキストを持つprogressbar          | 根拠のない所要時間断定             |
| SectionHeading   | セクション目的                       | 一意な`h1`                                       | 装飾目的の見出し                   |
| TextField        | 文字、メール、電話、日付             | 常設Label、description、error、required／invalid | placeholderによるラベル代替        |
| NumberField      | 数値入力                             | TextFieldと同じ。適切なinput mode                | 暗黙の文字列・数値変換             |
| RadioGroupField  | 2〜5件の選択                         | RadioGroup、矢印キー操作                         | 少数選択肢をSelectへ隠す           |
| SelectField      | 多数選択肢                           | Label、ListBox、キーボード操作                   | 少数選択肢への濫用                 |
| CheckboxField    | 独立した真偽入力                     | Checkboxの選択状態を通知                         | 同意の初期選択                     |
| InlineHelp       | 入力例・理由                         | 入力とdescriptionで関連付け                      | 重要条件をヘルプだけに隠す         |
| FieldError       | 項目直下の修正案内                   | errorMessageとして入力に関連付け                 | コードや専門語の直接表示           |
| ErrorSummary     | セクションエラー一覧                 | `role=alert`、発生時フォーカス、項目リンク       | 項目直下エラーの代替にしない       |
| PrimaryButton    | その画面の主操作                     | 処理中をテキスト表示し無効化                     | 複数の主操作、煽る文言             |
| SecondaryButton  | 戻る・修正                           | 44px以上の操作領域                               | 主操作より強い見た目               |
| ConfirmationCard | 送信前の回答確認                     | `dl`でラベルと値を関連付け                       | 実申込の受付と誤認させる表示       |
| CompletionPanel  | スタブ受付の完了                     | 見出しと次の説明                                 | 審査完了・融資確定と誤認させる表現 |

## エラー契約

ドメイン層は`error_code`だけを返し、`src/messages/errors.ja.ts`が利用者向け文面へ変換する。必須は名前付きバリデーターに含めない。形式エラーはonBlur、セクション全体はonSectionNext、送信前はonSubmitで再検証する。
