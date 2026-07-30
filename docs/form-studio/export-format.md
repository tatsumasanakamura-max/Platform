# Studio出力形式

エラー0件の場合に次をブラウザからダウンロードできる。

| ファイル                | 内容                                                   |
| ----------------------- | ------------------------------------------------------ |
| `form-definition.json`  | 実行可能仕様の正                                       |
| `change-manifest.json`  | BaselineとDraftの項目ID・属性単位差分                  |
| `field-catalog.md`      | 項目ID、セクション、ラベル、型、必須、表示条件、ヘルプ |
| `validation-catalog.md` | validator、設定値、error_code、日本語メッセージ        |
| `rule-catalog.md`       | rule_id、種別、条件                                    |
| `open-questions.md`     | 手入力事項と自動警告                                   |
| `scenarios.json`        | 最大2件の回答値と期待表示項目                          |

追加・削除は`property: "$field"`、順序は`order`、所属変更は`section_id/group_id`として記録する。options、validators、visibility condition、required conditionも項目単位で比較する。Markdownは再生成可能な派生成果物であり手編集を正にしない。
