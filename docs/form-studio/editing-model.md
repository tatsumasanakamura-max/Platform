# Studio編集モデル

## 状態

`baseline`、`draft`、`past`、`future`、最後に保存したJSONを別々に保持する。編集コマンドは`FormDefinition`を直接変異せず、新しい定義を返す。履歴は最大50版とし、編集後はfutureを破棄する。初期状態へ戻した操作もUndoできる。

## 構造と依存

画面構造上の親子関係は`sections[].groups[]`の`field_ids`で表す。条件依存は`rules[]`と項目の`visibility_rule_id`／`required_rule_id`で表し、同一モデルへ混在させない。

PoC-1Bの条件編集は`visibility`、`required`と`equals/notEquals/in/exists`だけである。既存の`and/or/not`等は保持し、読取専用として警告する。

## 編集コマンド

追加、複製、削除、上下移動、セクション移動、グループ設定、ID変更、属性更新、条件設定を純粋関数として実装する。ID変更はグループ、条件参照、シナリオも追随する。削除は専用確認ダイアログを通し、専用ルール・グループ・シナリオ参照を整理する。
