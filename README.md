# FastPix Astro Uploader - resumable, chunked file uploads for Astro (`<FastPixUploader />`)

[![npm version](https://img.shields.io/npm/v/@fastpix/fp-astro-uploader)](https://www.npmjs.com/package/@fastpix/fp-astro-uploader)
[![npm downloads](https://img.shields.io/npm/dm/@fastpix/fp-astro-uploader)](https://www.npmjs.com/package/@fastpix/fp-astro-uploader)
[![license](https://img.shields.io/npm/l/@fastpix/fp-astro-uploader)](https://github.com/FastPix/astro-web-uploader/blob/main/LICENSE)
[![Astro](https://img.shields.io/badge/Astro-BC52EE?logo=astro&logoColor=white)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A FastPix Astro component for resumable uploads, built on the [FastPix resumable web uploads SDK](https://github.com/FastPix/web-uploads-sdk).

`<FastPixUploader />` provides a complete upload experience, including file selection, drag-and-drop, upload progress, and pause, resume, and cancel controls. You can also compose it from individual components to customize the layout. Provide an upload URL, and the component uploads the file in resumable chunks, reports progress, and fires a `success` event when the upload completes.

**Works with:** Astro 7+ · TypeScript · any UI framework (or none) · drag-and-drop · resumable chunked uploads

📖 **Docs:** https://fastpix.com/docs/video-on-demand-api/input-video/direct-upload-video-media &nbsp;·&nbsp; 📦 **npm:** https://www.npmjs.com/package/@fastpix/fp-astro-uploader &nbsp;·&nbsp; 🚀 **Dashboard:** https://dashboard.fastpix.com

## Key Features

- **Resumable** - pause, resume, and cancel an in-progress upload.
- **Eager or lazy URL** - pass a URL string on the component, or assign a function that returns one when a file is selected.
- **Customizable appearance** - customize the accent color, border radius, sizing, and other UI elements using CSS variables or the `appearance` prop. No styling library is required.
- **Server-rendered, zero-flicker** - markup is printed by Astro at build/request time; a small framework-free client runtime hydrates it with no visual mismatch.
- **No UI framework required** - the client runtime is plain custom elements, not React/Vue/Svelte - works in any Astro project regardless of which UI framework (if any) you use elsewhere.
- **Headless option** - drive the upload lifecycle from a `/core` controller while rendering your own UI.
- **Typed** - ships with TypeScript definitions and a typed `fastpix-*` DOM event map.
- **Accessible** - status changes are announced to assistive technology, supports keyboard navigation.

## Start here

If you are adding the FastPix Astro Uploader for the first time, follow these steps in order:

1. [Install the component](#install-the-component)
2. [Get a signed upload URL](#get-a-signed-upload-url)
3. [Add the uploader to a page](#add-the-uploader)
4. [Provide the upload URL](#provide-the-upload-url)
5. [Handle the upload result](#handle-the-upload-result)
6. [Understand the upload workflow](#understand-the-upload-workflow)

Do not skip the verification step. If an install, credential, or upload-URL problem occurs, fix it before continuing.

---

### Before you begin

To use the component, make sure you have:

- An Astro project (Astro 7+; see the peer-dependency note in [Install the component](#install-the-component)).
- Node.js and a package manager (npm, pnpm, or yarn).
- A FastPix account, with an Access Token and a Secret Key.
- A backend or serverless function that can create a signed upload URL - your credentials must never ship in browser code.

FastPix uploads use a **signed URL**: you create a short-lived upload URL on your server with the [Upload media from device](https://fastpix.com/docs/video-on-demand-api/input-video/direct-upload-video-media) API, then hand only that URL to the component.

> **Security:** Never expose your Access Token or Secret Key in browser code. Create signed URLs on your server and return only the URL to the client.

---

## Install the component

Install the component using your preferred package manager.:

### Using npm

```bash
npm install @fastpix/fp-astro-uploader@latest
```

### Using pnpm

```bash
pnpm add @fastpix/fp-astro-uploader@latest
```

### Using yarn

```bash
yarn add @fastpix/fp-astro-uploader@latest
```

`astro` (v7 or later) is a peer dependency and should already be in your project.

No stylesheet import is needed - styling ships with the component automatically (see [Appearance](#appearance)).

## Get a signed upload URL

To use this component, you need a signed upload URL.

To make API requests, you'll need a valid **Access Token** and **Secret Key**. See the [Basic Authentication Guide](https://fastpix.com/docs/getting-started/activate-your-account) for details on retrieving these credentials.

After you have your credentials, use the [Upload media from device](https://fastpix.com/docs/video-on-demand-api/input-video/direct-upload-video-media) API to generate a signed URL. You pass that URL to the component, and it uploads the file in resumable chunks. Creating the upload URL, checking when the media is ready for playback, and rendering the player are handled in your own application.


## Add the uploader

### Import

```astro
---
import { FastPixUploader } from "@fastpix/fp-astro-uploader";
---
```

### Integration

The fastest path - a complete uploader with sensible defaults:

```astro
---
import { FastPixUploader } from "@fastpix/fp-astro-uploader";
---

<FastPixUploader endpoint="https://your-fastpix-upload-url" />
```

## Provide the upload URL

A static string works for the zero-config case above. In practice you'll create the upload URL once a file is selected - Astro's server→client boundary means a _function_ prop can't cross from frontmatter, so assign it from a client `<script>` instead, via the element's `endpoint` property. It receives the selected `File` and returns the URL (it may be async). Here `getSignedUrl` is your own function that returns a FastPix upload URL for the file:

```astro
<FastPixUploader id="up" />

<script>
  import { getUploader } from "@fastpix/fp-astro-uploader/client";
  import { getSignedUrl } from "../lib/get-signed-url";

  const el = await getUploader("#up");
  el.endpoint = getSignedUrl;
</script>
```

> **Note:** The signed URL is created through the [Upload media from device](https://fastpix.com/docs/video-on-demand-api/input-video/direct-upload-video-media) API. Keep that call on your server so your credentials are never exposed to the browser.

### Example project

A minimal, runnable Astro example lives in [`example/`](example). Run `npm install && npm run dev` in that folder to try the uploader end to end.

## Handle the upload result

Listen for `fastpix-*` DOM events to respond to the upload lifecycle. All are optional.

```astro
<FastPixUploader id="up" accept="video/*" />

<script>
  import { getUploader } from "@fastpix/fp-astro-uploader/client";
  import { getSignedUrl } from "../lib/get-signed-url";

  const el = await getUploader("#up");
  el.endpoint = getSignedUrl;

  el.addEventListener("fastpix-progress", (e) => console.log("Progress:", e.detail.progress));
  el.addEventListener("fastpix-chunk-success", (e) =>
    console.log(
      `Chunk ${e.detail.chunkNumber}${e.detail.totalChunks ? ` of ${e.detail.totalChunks}` : ""}`,
    ),
  );
  el.addEventListener("fastpix-success", () => console.log("Upload complete"));
  el.addEventListener("fastpix-error", (e) => console.error("Upload error:", e.detail.message));
</script>
```

`fastpix-success` fires when the upload finishes. Anything after that - waiting for the media to be processed, then playing it - belongs to your application.

See [Events](#events) for the full list.

### Verify your integration

The integration works when `fastpix-progress` climbs to 100 and `fastpix-success` fires, and the uploaded media then appears in your [FastPix Dashboard](https://dashboard.fastpix.com/). Anything after success - waiting for the media to process, then playing it - belongs to your application.

## Understand the upload workflow

Your server creates a signed upload URL; the `<FastPixUploader />` component uploads the selected file to it in resumable chunks and fires `fastpix-success` when the upload finishes. Processing the media and playing it back happen afterward in your own app.

![FastPix Astro upload workflow: your server creates a signed upload URL, the FastPixUploader component uploads the file in resumable chunks to FastPix, fires the fastpix-success event, and your app then plays the processed media.](https://static.fastpix.com/astro-upload-workflow.png)

## Next steps

After your first upload works, go further:

- Build a custom layout from the individual components - see [Composition](#composition).
- Understand upload states and the endpoint model - see [Concepts](#concepts).
- Configure chunk size, retries, file limits, sizing, and appearance - see [Parameters Accepted](#parameters-accepted).
- Drive it from scripts, or build a fully headless uploader - see [Imperative control](#imperative-control) and [Headless / `/core`](#headless--core).
- Theme it with CSS variables or the `appearance` prop, no CSS library required - see [Appearance](#appearance).

## Composition

Render the individual components as children to control layout and styling. Each one binds to the nearest `<FastPixUploader>` ancestor automatically, so they work wherever you place them and in any order.

```astro
---
import {
  FastPixUploader,
  FastPixDropZone,
  FastPixStatus,
  FastPixTrack,
  FastPixStartButton,
  FastPixPauseButton,
  FastPixResumeButton,
  FastPixAbortButton,
} from "@fastpix/fp-astro-uploader";
---

<FastPixUploader id="up" autoStart={false}>
  <FastPixDropZone overlay>
    <p>Drag a video here, or click to browse</p>
  </FastPixDropZone>

  <FastPixStatus />
  <FastPixTrack showLabel />

  <FastPixStartButton />
  <FastPixPauseButton />
  <FastPixResumeButton />
  <FastPixAbortButton />
</FastPixUploader>

<script>
  import { getUploader } from "@fastpix/fp-astro-uploader/client";
  import { getSignedUrl } from "../lib/get-signed-url";

  (await getUploader("#up")).endpoint = getSignedUrl;
</script>
```

Apply an appearance without writing any CSS:

```astro
<FastPixUploader
  endpoint="https://your-fastpix-upload-url"
  size="lg"
  appearance={{ accentColor: "#00d1ff", radius: "12px" }}
/>
```

Drive it programmatically from a script, using `getUploader` instead of a ref:

```astro
<FastPixUploader id="up" endpoint="https://your-fastpix-upload-url" />
<button id="pause-btn">Pause</button>
<button id="reset-btn">Start over</button>

<script>
  import { getUploader } from "@fastpix/fp-astro-uploader/client";

  const el = await getUploader("#up");
  document.querySelector("#pause-btn")!.addEventListener("click", () => el.pause());
  document.querySelector("#reset-btn")!.addEventListener("click", () => el.reset());
</script>
```

## Concepts

**Upload states.** The component is always in exactly one state. Child components and styling react to it via the `data-fastpix-state` attribute.

| State       | Meaning                                                                              |
| ----------- | ------------------------------------------------------------------------------------ |
| `idle`      | No file selected yet.                                                                |
| `ready`     | A file is selected but the upload hasn't started (only when `autoStart` is `false`). |
| `resolving` | Preparing the upload (resolving the URL from a function `endpoint`).                 |
| `uploading` | Sending chunks.                                                                      |
| `paused`    | Upload held; it can be resumed from where it stopped.                                |
| `error`     | The upload failed; it can be retried.                                                |
| `success`   | All bytes delivered.                                                                 |

Typical flow: `idle → ready → resolving → uploading → success`, with `paused` reachable from `uploading`, and `error` recoverable into a new attempt.

**Endpoint.**
The `endpoint` prop (or attribute) is a plain URL string, known up front. For a URL resolved at upload time, assign a function `(file) => string | Promise<string>` to the element's `endpoint` _property_ from a client script instead - function values cannot cross Astro's server→client prop boundary, only serializable ones can.

**Controlled file.**
If your app already has a `File` (for example, from your own picker), call `el.selectFile(file)` from a client script instead of using the built-in picker or drop zone.

## Parameters Accepted

The `<FastPixUploader>` component accepts the following props:

| Name                | Type                   | Required | Description                                                                                                                                                                                   |
| ------------------- | ---------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `endpoint`          | `string`               | Optional | The upload URL. For a URL resolved per file, assign a function to the element's `endpoint` property from a client script instead (see [Providing the upload URL](#provide-the-upload-url)). |
| `autoStart`         | `boolean`              | Optional | Start uploading as soon as a valid file is available. Default is `true`. Set `false` to require an explicit start.                                                                            |
| `accept`            | `string`               | Optional | Allowed file types (e.g. `"video/*"`, `".mp4"`), enforced for both the picker and the drop zone. See [File access on mobile](#file-access-on-mobile).                                         |
| `maxFileSize`       | `number` (in KB)       | Optional | Reject files larger than this before uploading.                                                                                                                                               |
| `chunkSize`         | `number` (in KB)       | Optional | Size of each upload chunk. **Minimum:** 5120 KB (5 MB), **Maximum:** 512000 KB (500 MB), in multiples of 256 KB.                                                                              |
| `retryChunkAttempt` | `number`               | Optional | Number of retry attempts per chunk on failure.                                                                                                                                                |
| `delayRetry`        | `number` (in seconds)  | Optional | Delay between retry attempts.                                                                                                                                                                 |
| `disabled`          | `boolean`              | Optional | Disable all interaction. Default is `false`.                                                                                                                                                  |
| `size`              | `"sm" \| "md" \| "lg"` | Optional | Overall size of the rendered components. Default is `"md"`.                                                                                                                                   |
| `appearance`        | `FastPixAppearance`    | Optional | Appearance values applied as CSS variables (see [Appearance](#appearance)).                                                                                                                   |
| `id`                | `string`               | Optional | Element id - required to address the instance from a client `<script>` via `getUploader`.                                                                                                     |
| `class`             | `string`               | Optional | Class applied to the root element.                                                                                                                                                            |

### Example usage of integrating all parameters

```astro
<FastPixUploader
  id="up"
  endpoint="https://your-fastpix-upload-url"
  autoStart={false}
  accept="video/*"
  maxFileSize={2_000_000}
  chunkSize={16_384}
  retryChunkAttempt={6}
  delayRetry={2}
  size="lg"
  appearance={{ accentColor: "#00d1ff" }}
/>
```

### Events

Every event is a bubbling, composed `CustomEvent` with the `fastpix-` prefix; payload lives in `detail`. Listen with the standard DOM `addEventListener` - TypeScript consumers get full typing on `detail` automatically once `@fastpix/fp-astro-uploader/client` is imported anywhere in the file.

| Name                            | `detail`                                    | Fires when                                                                |
| ------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `fastpix-file-select`           | `{ file }`                                  | A valid, readable file is picked or dropped.                              |
| `fastpix-file-reject`           | `{ file, reason, message }`                 | A file fails `accept`, `maxFileSize`, or can't be read.                   |
| `fastpix-upload-start`          | `{ file }`                                  | The upload begins.                                                        |
| `fastpix-progress`              | `{ progress }` (0–100)                      | Progress updates.                                                         |
| `fastpix-chunk-attempt`         | `{ chunkNumber, totalChunks?, chunkSize? }` | A chunk upload is attempted.                                              |
| `fastpix-chunk-success`         | `{ chunkNumber, totalChunks?, chunkSize? }` | A chunk finishes successfully.                                            |
| `fastpix-chunk-attempt-failure` | `{ chunkNumber, attempt, totalAttempts }`   | A chunk attempt fails and will be retried.                                |
| `fastpix-pause`                 | `null`                                      | The upload is paused.                                                     |
| `fastpix-resume`                | `null`                                      | The upload is resumed.                                                    |
| `fastpix-abort`                 | `null`                                      | The upload is cancelled.                                                  |
| `fastpix-error`                 | `{ message }`                               | The upload fails.                                                         |
| `fastpix-success`               | `null`                                      | The upload completes.                                                     |
| `fastpix-state-change`          | `{ state }`                                 | The state changes.                                                        |
| `fastpix-offline`               | `null`                                      | The browser loses its network connection (fires while idle or uploading). |
| `fastpix-online`                | `null`                                      | The browser regains its network connection.                               |

`fastpix-file-reject`'s `reason` is one of `"type" | "size" | "unreadable" | "busy"`, alongside a ready-to-display `message`. The `"unreadable"` reason covers files the browser hands over but won't let the page read - see [File access on mobile](#file-access-on-mobile). The `"busy"` reason fires when a file is selected while an upload is already in progress; cancel the current upload before selecting another.

The chunk events report which chunk is in flight and how many there are. Failure events report only chunk counters. To determine the cause of a failure, use the `fastpix-error` event.

### Imperative control

`getUploader(selector)` resolves the underlying element (awaiting its custom-element definition first, so it's safe to call before the page has finished hydrating). The element itself carries the imperative surface.

| Method             | Description                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| `start()`          | Start the upload (use with `autoStart={false}`).                                                |
| `pause()`          | Pause the active upload.                                                                        |
| `resume()`         | Resume a paused upload.                                                                         |
| `abort()`          | Cancel the upload and return to idle.                                                           |
| `reset()`          | Clear the file and return to idle ("upload another").                                           |
| `getState()`       | Returns the current `UploaderState` (as `{ status, progress, file, errorMessage, isOffline }`). |
| `getFile()`        | Returns the current `File`, or `null`.                                                          |
| `selectFile(file)` | Select a `File` obtained outside the built-in picker/drop zone.                                 |

```astro
<script>
  import { getUploader } from "@fastpix/fp-astro-uploader/client";

  const el = await getUploader("#up");
  el.start();
  if (el.getState().status === "error") el.reset();
</script>
```

## Components

All components accept `class` and `style`. They must be rendered inside `<FastPixUploader>`.

### `<FastPixFilePicker>`

A standalone button that opens the file picker. Use it on its own or alongside `FastPixDropZone`. Do not place it inside `FastPixDropZone`, because the drop zone already opens the file picker when clicked.

| Name           | Type   | Description                                 |
| -------------- | ------ | ------------------------------------------- |
| slot (default) | markup | Custom button label (default: `"Browse…"`). |

```astro
<FastPixFilePicker>Select a video</FastPixFilePicker>
```

### `<FastPixDropZone>`

A drop area that also opens the file dialog when clicked or activated with the keyboard. Put inline, non-interactive content inside it (text or an icon) - not another button.

| Name           | Type      | Description                                                                        |
| -------------- | --------- | ---------------------------------------------------------------------------------- |
| `overlay`      | `boolean` | Show a highlight overlay while a file is dragged over.                             |
| `label`        | `string`  | Accessible label for the zone (default: `"Drag a file here, or press to browse"`). |
| slot (default) | markup    | Inline content shown inside the zone.                                              |

```astro
<FastPixDropZone overlay>
  <p>Drag a video here, or click to browse</p>
</FastPixDropZone>
```

### `<FastPixTrack>`

The progress indicator.

| Name        | Type                   | Description                                       |
| ----------- | ---------------------- | ------------------------------------------------- |
| `variant`   | `"linear" \| "radial"` | Bar or circular indicator. Default is `"linear"`. |
| `showLabel` | `boolean`              | Show the percentage. Default is `false`.          |

```astro
<FastPixTrack variant="radial" showLabel />
```

### `<FastPixStatus>`

Text describing the current state.

| Name     | Type                                      | Description                                                         |
| -------- | ----------------------------------------- | ------------------------------------------------------------------- |
| `labels` | `Partial<Record<UploaderStatus, string>>` | Override the text shown for any state (for wording or translation). |

```astro
<FastPixStatus
  labels={{
    idle: "Pick a video to begin",
    uploading: "Uploading your video…",
    success: "All done!",
  }}
/>
```

### `<FastPixStartButton>`

Starts the upload. Active when a file is ready (or to retry after an error). Pair with `autoStart={false}`.

| Name           | Type   | Description                         |
| -------------- | ------ | ----------------------------------- |
| slot (default) | markup | Custom label (default: `"Upload"`). |

```astro
<FastPixStartButton>Start upload</FastPixStartButton>
```

### `<FastPixPauseButton>`

Pauses an active upload.

| Name           | Type   | Description                        |
| -------------- | ------ | ---------------------------------- |
| slot (default) | markup | Custom label (default: `"Pause"`). |

```astro
<FastPixPauseButton>Hold</FastPixPauseButton>
```

### `<FastPixResumeButton>`

Resumes a paused upload.

| Name           | Type   | Description                         |
| -------------- | ------ | ----------------------------------- |
| slot (default) | markup | Custom label (default: `"Resume"`). |

```astro
<FastPixResumeButton>Continue</FastPixResumeButton>
```

### `<FastPixAbortButton>`

Cancels the upload and returns to idle.

| Name           | Type   | Description                         |
| -------------- | ------ | ----------------------------------- |
| slot (default) | markup | Custom label (default: `"Cancel"`). |

```astro
<FastPixAbortButton>Cancel</FastPixAbortButton>
```

## Headless / `/core`

Build a completely custom uploader with no provided markup by driving `UploaderController` directly - the same state machine and validation the `.astro` components use, with no DOM or Astro dependency at all.

```ts
import { UploaderController } from "@fastpix/fp-astro-uploader/core";

const controller = new UploaderController({
  config: { endpoint: getSignedUrl, autoStart: false },
});
controller.attach(); // starts tracking window online/offline

controller.on("progress", (progress) => console.log(progress));
controller.on("stateChange", (state) => console.log(state));

fileInput.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (file) controller.selectFile(file);
});
startButton.addEventListener("click", () => controller.start());
```

It returns / exposes:

| Name                                                            | Type             | Description                                                                                                  |
| --------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------ |
| `getState()`                                                    | `UploaderState`  | `{ status, progress, file, errorMessage, isOffline }`.                                                       |
| `getFile()`                                                     | `File \| null`   | Selected file.                                                                                               |
| `getConfig()` / `setConfig(patch)`                              | `UploaderConfig` | Read or patch the config; validated only when `start()` runs.                                                |
| `selectFile` / `start` / `pause` / `resume` / `abort` / `reset` | methods          | Control actions.                                                                                             |
| `on(event, cb)` / `off(event, cb)`                              | methods          | Subscribe to the same event names as the DOM layer, without the `fastpix-` prefix or `CustomEvent` wrapping. |
| `attach()` / `detach()`                                         | methods          | Start/stop tracking `window` online/offline events.                                                          |
| `destroy()`                                                     | method           | Detach, abort any active upload, and drop all listeners.                                                     |

## Appearance

There are three ways to customize the appearance, from lightest to most involved. They can be combined.

**1. CSS variables.** Set any `--fastpix-*` variable on the component (or globally on `:root`). This covers most cases.

```css
fastpix-uploader {
  --fastpix-accent-color: #00d1ff;
  --fastpix-radius: 12px;
  --fastpix-surface: #111;
}
```

**2. The `appearance` prop.** The same variables as a typed object, when you'd rather not write CSS.

```astro
<FastPixUploader
  endpoint="https://your-fastpix-upload-url"
  appearance={{ accentColor: "#00d1ff", radius: "12px" }}
/>
```

**3. `class` / `style`.** Every component accepts these for full control.

### CSS variables

| Variable                           | Controls                                               | Default                                  |
| ---------------------------------- | ------------------------------------------------------ | ---------------------------------------- |
| `--fastpix-accent-color`           | Accent: progress fill, active borders, primary buttons | `#ff5b1a`                                |
| `--fastpix-bg`                     | Component background                                   | `transparent`                            |
| `--fastpix-surface`                | Inner surfaces (drop zone)                             | `#ffffff`                                |
| `--fastpix-text-color`             | Primary text                                           | `#2f2f2f`                                |
| `--fastpix-text-muted`             | Secondary text                                         | `#8a8a8a`                                |
| `--fastpix-border-color`           | Borders                                                | `#333`                                   |
| `--fastpix-border-color-hover`     | Hover border                                           | `#555`                                   |
| `--fastpix-radius`                 | Corner radius                                          | `8px`                                    |
| `--fastpix-font-family`            | Font stack                                             | `system-ui, sans-serif`                  |
| `--fastpix-error-color`            | Error text / border                                    | `#ef4444`                                |
| `--fastpix-success-color`          | Success text / border                                  | `#22c55e`                                |
| `--fastpix-gap`                    | Internal spacing                                       | `1rem`                                   |
| `--fastpix-padding`                | Component padding                                      | `2rem`                                   |
| `--fastpix-track-height`           | Progress bar thickness                                 | `8px`                                    |
| `--fastpix-track-bg`               | Empty track                                            | `#222`                                   |
| `--fastpix-track-fill`             | Filled track                                           | `var(--fastpix-accent-color)`            |
| `--fastpix-track-radius`           | Track radius                                           | `999px`                                  |
| `--fastpix-dropzone-border`        | Drop zone border (idle)                                | `2px dashed var(--fastpix-border-color)` |
| `--fastpix-dropzone-border-active` | Drop zone border (dragging)                            | `var(--fastpix-accent-color)`            |
| `--fastpix-dropzone-bg`            | Drop zone background (idle)                            | `var(--fastpix-surface)`                 |
| `--fastpix-dropzone-bg-active`     | Drop zone background (dragging)                        | accent tint                              |
| `--fastpix-overlay-bg`             | Drag overlay                                           | `rgba(0,0,0,.6)`                         |
| `--fastpix-button-bg`              | Button background                                      | `var(--fastpix-accent-color)`            |
| `--fastpix-button-text`            | Button label                                           | `#fff`                                   |
| `--fastpix-button-bg-hover`        | Button hover background                                | darker accent                            |
| `--fastpix-button-radius`          | Button radius                                          | `var(--fastpix-radius)`                  |

### `appearance` prop keys

`accentColor`, `background`, `surface`, `textColor`, `mutedColor`, `borderColor`, `radius`, `fontFamily`, `trackHeight`, `trackFill`, `errorColor`, `successColor`.

### Styling by state

The root carries the current state as a data attribute, so you can style any phase in plain CSS:

```css
fastpix-uploader[data-fastpix-state="error"] {
  /* error look */
}
fastpix-uploader[data-fastpix-state="success"] {
  /* success look */
}
.fastpix-dropzone[data-fastpix-dragging] {
  /* while dragging */
}
```

Available hooks: `data-fastpix-state` (the current state), `data-fastpix-dragging` (on the drop zone), `data-fastpix-size` (`sm`/`md`/`lg`), and `data-fastpix-disabled`.

### Size

The `size` prop (`"sm" | "md" | "lg"`) scales padding, spacing, text, and control sizes together.

```astro
<FastPixUploader endpoint="https://your-fastpix-upload-url" size="sm" />
```

## Types

All types are exported for use in your own code, from both the main entry and `/core`:

`UploaderStatus`, `UploaderState`, `UploaderConfig`, `UploaderError`, `EndpointInput`, `EndpointResolver`, `FileRejection`, `RejectReason`, `ChunkInfo`, `ChunkFailureInfo`, `FastPixAppearance`, `UploaderEventMap`, `UploaderController`, `UploaderControllerOptions`, and the prop types for each `.astro` component.

## File access on mobile

A browser provides a `File` object that your application cannot read. This commonly occurs on Android when using `accept="video/*"`, which opens the Photos or Gallery app. The selected file might be sandboxed, preventing the browser from reading its contents for upload.

The component guards against this: when a file is selected, it verifies the bytes are readable before accepting it. If they aren't, the file is rejected through `fastpix-file-reject` with `reason: "unreadable"` and a message that names the user's browser and OS and tells them to pick the video from their device's file manager instead of the Photos/Gallery picker.

> **Note:** To reduce how often this happens, you can broaden `accept` (for example `"video/*,audio/*"`) or omit it entirely, which makes Android open the system file manager rather than the media picker. Since you can't force a particular `accept`, the readability check is always on as a safety net.

## Framework and browser support

- **Astro** 7 and later.
- **Any UI framework, or none** - the client runtime is plain custom elements with no React/Vue/Svelte dependency, so it works regardless of which (if any) UI framework the rest of your Astro project uses.
- **View transitions (`<ClientRouter />`)** - instances re-bind automatically after every page swap; see the [Detailed Usage](#detailed-usage) note below.
- **Browsers** - modern evergreen browsers. The default styles use `color-mix()` for accent tints; if you target older browsers, override the affected variables with explicit colors.

## Accessibility

- Status text is announced to assistive technology (`role="status"`, `aria-live="polite"`), so screen-reader users hear state and progress changes.
- All controls - including the drop zone - are real buttons: keyboard focusable, activatable with Enter or Space, and shown with visible focus rings.
- The `disabled` state is reflected for both pointer and assistive interaction.

## FAQ

**Which package do I install?**
`@fastpix/fp-astro-uploader`. See [Install the component](#install-the-component).

**Do I need React, Vue, or Svelte?**
No. The client runtime is plain custom elements, so it works in any Astro project regardless of UI framework. See [Framework and browser support](#framework-and-browser-support).

**Where does the upload URL come from?**
You create a signed upload URL on your server with the FastPix Direct Upload API and pass it to the component. See [Get a signed upload URL](#get-a-signed-upload-url).

**Why can't I pass a function `endpoint` as a prop?**
Astro can't serialize a function across the server-to-client boundary. Assign the function to the element's `endpoint` property from a client `<script>` instead. See [Provide the upload URL](#provide-the-upload-url).

**Can I build my own UI?**
Yes - compose the individual components, or go fully headless with the `/core` controller. See [Composition](#composition) and [Headless / `/core`](#headless--core).

**What chunk sizes are allowed?**
5 MB to 500 MB (5120-512000 KB), in multiples of 256 KB. See [Parameters Accepted](#parameters-accepted).

**How do I know the upload finished?**
Listen for the `fastpix-success` event. See [Handle the upload result](#handle-the-upload-result).

## Which FastPix repo do I need?

This component uploads from an Astro app. For other frameworks and the backend:

| I want to... | Repo |
|---|---|
| Add resumable uploads in plain JS or any web app | [web-uploads-sdk](https://github.com/FastPix/web-uploads-sdk) |
| Add a React uploader component | [react-web-uploader](https://github.com/FastPix/react-web-uploader) |
| Upload from a React Native app | [react-native-uploader](https://github.com/FastPix/react-native-uploader) |
| Generate signed upload URLs from a Node backend | [node-sdk](https://github.com/FastPix/node-sdk) |
| Play the uploaded video on the web | [web-player-component](https://github.com/FastPix/web-player-component) |

Browse everything in the [FastPix organization](https://github.com/orgs/FastPix/repositories).

## References

[FastPix Homepage](https://www.fastpix.com/)

[FastPix Dashboard](https://dashboard.fastpix.com/)

[Resumable Web Uploads SDK](https://github.com/FastPix/web-uploads-sdk)

[Basic Authentication Guide](https://fastpix.com/docs/getting-started/activate-your-account)

[FastPix Documentation](https://fastpix.com/docs/video-on-demand-api/input-video/direct-upload-video-media)

## Detailed Usage

Under `<ClientRouter />`, uploader instances re-bind automatically after every swap. Navigating away mid-upload aborts the upload. Re-run any consumer `<script>` per navigation with the standard `astro:page-load` pattern:

```astro
<script>
  document.addEventListener("astro:page-load", async () => {
    const el = document.querySelector("#up");
    if (!el) return;
    (await import("@fastpix/fp-astro-uploader/client")).getUploader(el).then((u) => {
      u.endpoint = getSignedUrl;
    });
  });
</script>
```

For more detailed steps and advanced usage of the underlying upload engine, refer to the official [FastPix Documentation](https://fastpix.com/docs/video-on-demand-api/input-video/direct-upload-video-media).

## License

[MIT](./LICENSE)
