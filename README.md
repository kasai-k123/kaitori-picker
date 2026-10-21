# 宅配買取えらび

5社6コースの宅配買取をカテゴリ・点数・受取方法・査定後の返送料で比較するMVPです。Astro + TypeScriptで静的ページを生成し、Cloudflare WorkersのStatic Assetsで配信します。Workerは計測APIも提供します。

## 開発

Node.js 22.22以上（検証環境24）とnpmを使用します。

```sh
npm ci
npm run dev
npm run check
npm test
npm run build
```

`npm run dev` は画面開発用です。計測APIを含めたローカル確認は `npm run preview`（ビルド＋Wrangler dev）を使用します。ローカルのAnalytics Engineは本番データセットへの記録確認には使えません。公開・デプロイはこの実装作業に含みません。

## サイトURL

`.env.example` を `.env` にコピーし、必要に応じて `SITE_URL` を変更します。環境変数はビルド時に読み込みます。初期値は `https://kaitori-picker.websl.workers.dev/` です。パス・クエリを含まないHTTP(S)のオリジンを指定してください。変更後は再ビルドが必要です。

canonical、OG URL、robots.txtのSitemap行、sitemap.xmlは同じSITE_URLから生成されます。404にはnoindexを指定し、サイトマップから除外します。アセットの404処理は `wrangler.jsonc` の `not_found_handling: 404-page` を使用します。

## データと比較

- `src/data/kaitori-official-data-2026-10-21.json`：添付JSONを変更せず配置した正本。
- `docs/research.md`：添付調査メモ。出典・例外・判定例。
- `src/lib/compare.ts`：`no`を優先して除外、次に`unknown`、残りを`yes`と判定。表示はyes→unknown、同一状態はデータ順。
- `tests/compare.test.ts`：調査メモの6例と点数境界・未入力・未確認・例外・リンク分離の検証。

点数は選んだ1カテゴリに適用します。未入力なら点数判定をスキップし、カテゴリなしで点数だけ指定するとunknownです。Polletの統合CD/DVD/Blu-rayは21点以上もunknownを維持します。キャンペーンや別コースの条件は流用しません。詳細ページはJSONのサービス一覧から5ページを生成し、ネットオフの2コースを分けて掲載します。

公式申込先は `applicationUrl`、将来の広告用は `affiliateUrl` に分離しています。初期版は `applicationLink()` が常に公式申込先を返します。広告リンクを導入する際は表示・計測・プライバシー説明を併せて更新してください。

## Analytics Engine

`wrangler.jsonc` に `EVENTS` binding／データセット `kaitori_picker_events` を定義しています。本番ではCloudflare側でAnalytics Engineを利用できるアカウント設定が必要です。設定・実記録の確認は未実施です。

ブラウザから同一オリジンの `POST /api/events` にJSONを送信します。

| イベント | タイミング |
| --- | --- |
| page_view | ページ読込時（既知の公開ページ） |
| comparison_interaction | 有効な条件変更・リセット時 |
| service_detail_view | 詳細ページ読込時 |
| outbound_click | 公式申込リンクのクリック時 |

レコードは `indexes[0]=kaitori-picker`、`blobs[0..3]=イベント名/ページパス/サービスID/コースID`、`doubles[0]=1` です。サービスIDは詳細ページのみ、コースIDは申込リンクのクリックのみ入ります。クエリ、点数、Cookie、ユーザーID、IP、User-Agent、参照元を記録しません。DNT/GPCによる停止を実装しています。

WorkerはOrigin・イベント・パス・識別子の組み合わせと1KBのサイズ制限を検証します。未知の属性は拒否します。Origin検証はブラウザからの誤送信対策であり、不正な集計の完全防止を保証するものではありません。計測障害は画面操作・外部リンク遷移を妨げません。binding未設定・記録失敗は503です。サンプリングを含むAnalytics Engineの集計はCloudflare側で行います。

## 未確認の情報

Polletの最低点数・一部カテゴリ、ネットオフ本ゲームのゲーム機最低点数・総合コースのフィギュア、ブックオフ少数ソフトの個別適用などはunknownを維持しています。全項目はJSONの `knownLimitations` と調査メモを参照してください。

## 公開前の確認

このリポジトリはデプロイを自動実行しません。承認された公開作業で、対象Cloudflareアカウント、Workersサブドメイン、Analytics Engine bindingと4イベントの実記録、SITE_URLを確認してください。ASP申請・PRマージは別作業です。
