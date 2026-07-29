# UI基盤・本人情報縦切り worklog

## 作業概要

| 項目       | 記録                                                                                |
| ---------- | ----------------------------------------------------------------------------------- |
| 区分       | PoC-1 基盤構築／初期商品                                                            |
| 作業日     | 2026-07-29                                                                          |
| ブランチ   | `feat/ui-foundation-personal-section`                                               |
| 開始時刻   | 07:45 JST                                                                           |
| 終了時刻   | 完了時に更新                                                                        |
| 実作業時間 | 完了時に更新                                                                        |
| 関連要件   | FR-UI-001〜007、FR-FRM-001〜007、FR-RUL-001〜004、NFR-UX-001〜006、NFR-ACC-001〜006 |

## Codexへの指示

世界水準のUI/UX原則を、個人開発PoCの制約を維持しながら、フォーム定義駆動の本人情報1セクションへ実装する。React 19、Vite 8、React Hook Form、React Aria Components、Ajv、Vitest、Playwright、axe-coreを使い、Firebaseへはデプロイしない。

## Codexが作成した内容

- デザイン原則、ビジュアル言語、部品契約、アクセシビリティ、公式参照文書
- Vite／React／TypeScript strict基盤と再現可能なlockfile
- JSON Schema 2020-12と参照・重複を含む静的検証
- React非依存の条件ルール、名前付きバリデーター、送信データ生成
- Calm Trustデザイントークンとアクセシブルな正式UI部品
- 開始、本人情報、確認、APIスタブ送信中、完了の縦切り
- Unit、Component、E2E、axe、文書・secret検査
- Firebase Hosting用の静的SPA設定と手動公開前チェック

## 人間が修正した内容

現時点なし。Codexの自己レビューと自動テストで検出した修正は「発生した問題」へ記録する。

## テスト結果

- `npm run verify`: TypeScript strict、lint、format、Vitest 41件、build、secret scan、文書リンク検査がすべて成功。
- `npm run test:e2e`: Chromium 7件成功。正常完了、必須修正、メール／郵便番号、戻る保持、キーボード、axe、320／390px、200%視覚拡大を確認。
- `npm run test:e2e:webkit`: Chromium／iPhone相当WebKit計13件成功。WebKitの主要6経路を確認。
- axe-core: critical／serious違反0。これはWCAG適合宣言ではない。
- 実ブラウザ目視: 390×844の開始／入力／エラー、1280×800の開始画面を確認。情報階層、余白、フォーカス、長い日本語、ボタン優先順位、横スクロールなしを確認。
- 320pxはE2E、200%はChromiumの視覚スケーリングで主要操作と横スクロールなしを確認。
- スクリーンリーダー実機とソフトウェアキーボード実機は未確認。

## 発生した問題

- TypeScript 6でCSS Modulesの型参照が不足したため、Vite型参照を追加した。
- Ajv strictモードでJSON Schemaのunion型許可を明示した。
- 最初のComponentテストでエラー文が入力へ関連付かなかったため、React AriaのerrorMessage slotへ修正した。
- 実ブラウザで、必須エラーが同文で識別しにくく、onBlur時にErrorSummaryへフォーカスが移る問題を発見した。項目名を含む文面へ変更し、概要フォーカスはセクション移動検証時だけに限定した。
- 戻る操作と非表示項目解除の責務を分け、通常の画面戻りでは回答を保持し、条件で非表示になった項目だけ登録解除する方針へ修正した。

## 次回改善点

- PoC-1の残りセクションを増やす前に、今回の手動ユーザーテストで文面と入力負荷を評価する。
- 実測後に進捗のステップ数と所要時間表示を更新する。
- PoC-2へ進む場合だけ途中保存とブラウザ再訪時の復元を検討する。
