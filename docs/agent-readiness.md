# エージェント向け公開方針

## 確定した方針

- 対応対象は既存の公開コンテンツと機能に限定する。
- 検索とAIへの入力を許可し、AI学習への利用は拒否する。
- Content Signalsの値は `search=yes, ai-input=yes, ai-train=no` とする。
- 認証、エージェント登録、MCP、A2Aは新設しない。存在しないサービスの発見用メタデータも公開しない。
- Cloudflareの既存機能を優先し、追加費用をできる限り避ける。契約のアップグレードは行わない。

## 現状

- Astroで静的ページを生成し、Cloudflare Workersで配信している。
- `/llms.txt` は公開記事・制作物のMarkdown URLを案内している。
- 記事・制作物には既存の `.md` URLがある。
- `/api/activity` は認証不要の活動データ取得APIである。
- 2026-11-13の本番確認では、ホームへの `Accept: text/markdown` に対して `Content-Type: text/html` が返った。
- 同日のCloudflare管理画面で無料プランを確認した。Markdown自動変換はProプラン限定の無効なスイッチとして表示され、現契約では利用できない。管理設定・契約は変更していない。

## 実装方針

- ホームのLinkヘッダーで既存の `/llms.txt` を `rel="describedby"` として案内する。
- `robots.txt` の全体向けUser-agentブロックに確定したContent Signalsを追加する。
- レスポンスにも同じContent-Signalヘッダーを付け、Markdown変換側の既定値と方針が食い違うのを防ぐ。
- Markdownのコンテンツネゴシエーションはサイト側で実装する。これは現契約でCloudflareの自動変換を利用できないことと、追加費用を避けたいという判断に基づく。
- API Catalog、DNS-AID、Agent Skills、WebMCP、ARDは今回の必須対象に含めない。既存機能を案内するために必要となった場合に検討する。

## 実装

- 公開HTMLページのMarkdown版をビルド時に生成する。記事・制作物の既存Markdown生成は再利用し、ホーム・一覧等は公開HTMLの内容を基に生成する。リクエストごとのHTML変換は行わない。
- Cloudflare Workerの入口でAcceptを判定し、Markdownを要求された場合は対応する静的Markdownを返す。HTMLを既定とし、q値と `text/markdown;q=0` を扱う。
- 対応ページにはHTML/Markdown両方で既存のVary値と `Accept` を保持し、内部の静的ファイル取得先を分ける。CDN向けには両方を `no-store` とし、ブラウザー向けにはHTMLの既存キャッシュ方針を保つ。画像・CSS・JS・既存APIは交渉対象外とする。
- 元の静的レスポンスはリダイレクトを追従せずに取得する。Markdown要求ではHTMLの条件付き・Rangeヘッダーを除外し、HTMLの301・304・206はステータスと本文の意味を保つ。
- ホームのLinkと、robots.txt・レスポンスのContent Signalsを合わせて追加する。
- 有料サービスや契約変更は追加しない。ただし対象HTMLへの通常アクセスもWorkerを通るため、実行回数は増える。ゾーンのFreeプラン確認だけでは、Workersの契約やアカウント全体の残枠を確定できない。
- 無料のURL Rewrite Rulesは採用せず、Accept優先度と既存ルートの扱いをサイトのコードとテストで管理する。
- 有料の実行時変換サービスは使わない。HTML変換用のTurndownとGFM拡張はビルド用の開発依存として追加する。
- 本番設定・デプロイ・pushは行わない。実装依頼で指定された新規ブランチ `feat/agent-discovery` 上にローカルコミットする。

## 検証方針

- ホームのLinkヘッダーとリンク先、Content Signalsの値を確認する。
- Markdown対応後は、同じHTML URLでAcceptなしの場合のHTMLと、Markdownを指定した場合の本文・Content-Type・Varyを確認する。
- HTMLとMarkdownのキャッシュ混同、非公開記事やコメントの混入がないことを確認する。
- ローカル検証と本番反映後の検証を区別する。コミット・公開・DNS変更は別途の明示的な依頼があるまで実施しない。

## 検証結果（2026-11-13）

- 秘密ファイルと非公開コンテンツを除いた一時コピーで、合成コンテンツを使って検証した。
- `pnpm test`: 67件成功。
- `pnpm run build:check`: 成功。9ページのMarkdownを生成し、既存の記事Markdown 1件を再利用。ビルドとキャッシュの非公開データ検査も成功。
- `pnpm exec astro check`: エラー・警告0件。既存の未使用変数に関するヒント2件。
- 変更したJS・TS・JSONのBiomeチェックと `git diff --check`: 成功。
- 生成したWorkerをローカルで起動し、`scripts/check-worker-routes.mjs` が成功。ホーム・記事・一覧・カテゴリ・About・プライバシーポリシーのMarkdown、HTML既定、q=0、HEAD、HTMLの304、別形式のETag・Range指定、301、404、下書き非公開、既存APIを確認。
- 規約・仕様の独立レビューを実施。実HTTPで見つかった301の回帰と、追加レビューで見つかった206のヘッダー不足を修正した。
- 実行環境はNode 24.21.0。リポジトリ指定の24.19.0との差に対する警告と、合成データに公開Productがないことによる既存の警告は残る。
- 本番反映後の検証は未実施。Workers契約・残枠の確認はJevのTypeSafe認証エラー（401）で完了できず、公開前に料金への影響を確認する必要がある。

## 参考

- [RFC 8288: Web Linking](https://www.rfc-editor.org/rfc/rfc8288)
- [Cloudflare Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/)
- [Content Signals](https://contentsignals.org/)
