# `@fastpix/fp-astro-uploader` — example

Minimal Astro app that consumes the published SDK and lets you run a real
resumable upload end to end — file select, progress, and pause/resume/abort.

## What this is

A plain [Astro](https://astro.build) app that renders `<FastPixUploader />` from
the published [`@fastpix/fp-astro-uploader`](https://www.npmjs.com/package/@fastpix/fp-astro-uploader)
package. The component is a server-rendered `.astro` element with a
framework-free custom-element runtime — no React, no client framework. Nothing
to configure in code; you paste a signed upload URL into the page at runtime.

## One-time setup

```bash
cd example
npm install
```

This pulls Astro 7 **and** the published SDK (the `"@fastpix/fp-astro-uploader"`
entry in `package.json`). The uploader ships its own CSS, so there is no
stylesheet to import.

## Run

```bash
npm run dev
```

Open the URL Astro prints (default `http://localhost:4321`).

## What to expect

1. The page shows a URL input and the uploader.
2. Paste a signed upload URL, then pick or drop a file.
3. As chunks upload, the track fills and the element reflects
   `resolving → uploading → success` (visible on its `data-fastpix-state`).
4. The component emits bubbling `fastpix-*` DOM events (`fastpix-progress`,
   `fastpix-success`, `fastpix-error`, …) you can listen for.

## Configure before running

Nothing to edit — the signed upload URL is pasted into the input on the page.

Because a function `endpoint` can't cross Astro's server→client boundary, the
resolver is assigned from a client `<script>` via the element's `endpoint`
property (see `src/pages/index.astro`). It reads the input and throws when empty.

You generate the signed URL server-side with the
[Upload media from device](https://fastpix.com/docs/video-on-demand-api/input-video/direct-upload-video-media)
API, using your **Access Token** and **Secret Key** from
`https://dashboard.fastpix.com`. Keep that call on your server so your
credentials never reach the browser.

## Verifying the upload in the FastPix dashboard

After the uploader reports success:

1. Visit `https://dashboard.fastpix.com → Media`.
2. The new upload appears and moves to **Ready** once processing finishes.

## Troubleshooting

- **Uploader shows an error the moment you pick a file** — you didn't enter a
  URL first. The `endpoint` resolver in `src/pages/index.astro` throws when the
  input is empty; that surfaces as the recoverable error state by design. Enter a
  URL and pick the file again.
- **Upload fails immediately** — the signed URL is expired or malformed. Signed
  upload URLs are short-lived; generate a fresh one.
- **`getUploader("#uploader")` never resolves** — the id in the `<script>` must
  match the `id` on `<FastPixUploader>`. It waits for the custom element to
  upgrade, so a typo hangs silently.

## How this affects the published package

This example lives at `example/` inside the SDK repo. The SDK's `package.json`
ships only `"files": ["src/components", "src/styles", "dist"]`, so **the example
never ships to npm** — it stays in source control as documentation.
