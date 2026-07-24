# Firebaseコストチェックリスト

確認基準日: 2026-07-24。Blazeプランを使用するが、通常のPoC利用は無料利用枠内・月額0円を目標とする。予算通知は支出上限でも自動停止でもない。

## Firebase開始前

- [ ] 使用候補サービスごとに必要性を1行で説明した
- [ ] FirebaseとGoogle Cloudの現行料金・無料枠を公式情報で再確認した
- [ ] 月額概算と超過要因をworklogへ記録した
- [ ] Google Cloud Billingの予算とメール通知を設定した
- [ ] 予算通知だけでは課金を停止できないと理解した
- [ ] 課金可能なサービス追加を人間が承認した
- [ ] APIキーの公開可否とSecurity Rulesを確認した

## 通常開発

- [ ] Emulator Suiteまたはローカルモックを使っている
- [ ] 小変更ごとにFirebaseへデプロイしていない
- [ ] Firestore定義を画面遷移ごとに再読込していない
- [ ] 不要なリアルタイムリスナーを使っていない
- [ ] 細かいUXイベントを1件ずつ大量保存していない
- [ ] Functionsを入力項目ごとに呼んでいない
- [ ] Functionsの最小インスタンスは0である
- [ ] 常時処理、定期処理、高頻度ポーリング、大量トリガーがない
- [ ] 公開環境には合成データ以外を保存していない

## 利用量確認

- [ ] Firebase Hostingの保存量・転送量をUsage画面で確認した
- [ ] Firestoreの読取・書込・削除・保存量をUsage画面で確認した
- [ ] Functionsの呼出回数、実行時間、インスタンス設定を確認した
- [ ] Cloud Billing Reportsで当月費用と予測を確認した
- [ ] GitHub Actionsの利用量を確認した
- [ ] 確認日、値、異常、対応をworklogへ記録した

確認タイミングは、Firebase初回公開後、主要変更公開後、月末、PoC終了時とする。

## PoC終了・休止時

- [ ] 不要なHosting preview/releaseを整理した
- [ ] 不要なFunctions、Firestoreデータ、Authentication利用者を削除した
- [ ] スケジュール、トリガー、外部API連携が残っていない
- [ ] 不要なプロジェクト・課金サービスの停止／削除を判断した
- [ ] 最終費用と利用量をPoC評価へ記録した

## 公式情報

- Firebase料金プラン: https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- Hosting: https://firebase.google.com/docs/hosting/usage-quotas-pricing
- Firestore: https://firebase.google.com/docs/firestore/pricing
- Functions: https://firebase.google.com/docs/functions/quotas
- Emulator Suite: https://firebase.google.com/docs/emulator-suite
- Cloud Billing予算: https://cloud.google.com/billing/docs/how-to/budgets

料金・無料枠は変更され得るため、この文書の数値ではなく実装直前の公式情報を正とする。
