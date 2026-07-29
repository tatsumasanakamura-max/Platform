# Firebase Hosting公開手順

## 今回の状態

PoC-1縦切りではFirebaseへデプロイしていない。`firebase.json`に`dist`を配信するSPA Hosting設定だけを準備した。Firestore、Cloud Functions、Authentication、Analyticsは使用しない。

## 人間による事前確認

- Firebase Blazeプランの対象プロジェクトと請求先が意図したものか確認する。
- [コストチェックリスト](cost_checklist.md)に従い、予算通知と利用量確認方法を確認する。予算通知は支出上限ではない。
- Firebase Hostingの料金・無料枠を公開時点の[Firebase公式料金](https://firebase.google.com/pricing)で再確認する。
- 課金可能性がある設定変更はCodexだけで決定しない。
- `npm ci && npm run verify && npm run test:e2e`が成功していることを確認する。
- 本番利用不可表示、合成データ限定、秘密情報なしを手動確認する。

## 手動公開

Firebase CLIとプロジェクトIDは、公開を人間が承認した時点で導入・設定する。現時点では存在しないコマンドやプロジェクトIDを固定しない。承認後は次の順で行う。

1. Firebase CLIの公式手順と現行安定版を確認する。
2. 対象プロジェクトを明示して認証する。
3. `npm ci`、`npm run verify`、`npm run build`を実行する。
4. Hostingだけを対象にしたdeployコマンドを実行する。
5. 公開URLでDemoNotice、主要フロー、利用量を確認する。
6. worklogへ実行者、時刻、コミット、結果を記録する。

通常開発ではローカルViteを使い、主要な節目以外はクラウドへ公開しない。
