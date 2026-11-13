# エージェント向け公開方針

## 方針

- 対応対象は既存の公開コンテンツと機能に限定する。
- 検索とAIへの入力を許可し、AI学習への利用は拒否する。Content Signalsは `search=yes, ai-input=yes, ai-train=no` とする。
- 認証、エージェント登録、MCP、A2A、存在しないサービスの発見用メタデータは追加しない。
- Cloudflareの自動Markdown変換は追加費用を避けるため使わず、既存の公開ページからMarkdownを生成する。

## 実装

- ホームでは `/llms.txt` を `rel="describedby"` のLinkヘッダーで案内する。`robots.txt` と公開HTML/MarkdownページのHTTPレスポンスには同じContent Signalsを付ける。
- 公開HTMLページのMarkdown版をビルド時に生成する。記事・制作物の既存Markdownを再利用し、リクエストごとのHTML変換は行わない。
- Workerは `Accept` に応じてHTMLまたは静的Markdownを返す。HTMLを既定とし、q値と `text/markdown;q=0` を扱う。画像・CSS・JS・既存APIは交渉対象外とする。
- 同じURLでHTMLとMarkdownを返すため、両方に `Vary: Accept` を付け、Cloudflare CDNでは `no-store` にする。これによりAcceptの異なる本文が同じCDNキャッシュ項目に混ざらない。HTMLのブラウザー向け `Cache-Control` は維持する。CDNキャッシュを使わない分の配信影響と、本番のWorkers契約・利用枠への影響は公開前に確認する。
- 通常のHTMLアクセスも対象ルートではWorkerを通る。Workersの利用上限に収まるかは実トラフィックで確認する。追加サービスや契約変更は行わない。
- Markdown要求ではHTMLの条件付き・Rangeヘッダーを除外する。リダイレクトを追従せず、HTMLの301・304・206は元の意味を保つ。
- HTML変換にはビルド用の開発依存としてTurndownとGFM拡張を使う。

## 検証方法

- `pnpm test` でMarkdown生成、Accept交渉、ヘッダー、記事Markdownの再利用を確認する。
- `pnpm run build:check` でビルド生成物と公開境界を確認する。
- ローカルWorkerに対して `pnpm run check:worker -- http://127.0.0.1:8787` を実行し、HTML・Markdown、q値、HEAD、条件付きリクエスト、リダイレクト、404、既存APIを確認する。
- 本番反映後の動作とWorkersの契約・利用枠への影響は、ローカル検証と分けて確認する。

## 参考

- [RFC 8288: Web Linking](https://www.rfc-editor.org/rfc/rfc8288)
- [Cloudflare Vary](https://developers.cloudflare.com/cache/concepts/vary/)
- [Cloudflare CDN-Cache-Control](https://developers.cloudflare.com/cache/concepts/cdn-cache-control/)
- [Cloudflare Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/)
- [Content Signals](https://contentsignals.org/)
