---
name: Bug Report
about: Report an issue related to the FastPix Astro Uploader
title: '[BUG] '
labels: bug
assignees: ''
---

# Bug Description
Provide a clear and concise description of the issue you encountered with the FastPix Astro Uploader.

---

# Steps to Reproduce

### 1. **SDK Setup**

Install the FastPix Astro Uploader:

```bash
npm install @fastpix/fp-astro-uploader@latest
```

No stylesheet import is needed - styling ships with the component automatically.

**Basic usage:**

```astro
---
import { FastPixUploader } from "@fastpix/fp-astro-uploader";
---

<FastPixUploader endpoint="https://your-fastpix-upload-url" />
```

### 2. **Example Code to Reproduce**

Provide a minimal reproducible snippet that shows the issue. Example:

```astro
<FastPixUploader id="up" accept="video/*" />

<script>
  import { getUploader } from "@fastpix/fp-astro-uploader/client";
  import { getSignedUrl } from "../lib/get-signed-url";

  const el = await getUploader("#up");
  el.endpoint = getSignedUrl;
  el.addEventListener("fastpix-success", () => console.log("Upload complete"));
  el.addEventListener("fastpix-error", (e) => console.error("Upload error:", e.detail.message));
</script>
```

Replace with the exact code where the bug occurs.

---

# Expected Behavior
```
<!-- Describe what you expected to happen -->
```

# Actual Behavior
```
<!-- Describe what actually happened -->
```

---

# Environment

- **Package Version**: [e.g., 0.1.0]
- **Astro Version**: [e.g., 7.0.7]
- **Browser**: [e.g., Chrome 120, Safari 17.2, Firefox 121]
- **OS**: [e.g., macOS 14, Windows 11, iOS 17]
- **Node/npm**: [e.g., Node 20, npm 10]
- **Rendering mode**: [Static / Server (SSR) / Hybrid, and whether `<ClientRouter />` view transitions are enabled]
- **Integration**: [Default `<FastPixUploader />` / Composed with individual components / Headless via `/core`'s `UploaderController`]

---

# Logs / Errors / Console Output
```
Paste browser console logs, network errors, or SDK errors here
```

---

# Additional Context
Add any information that might help, such as:

- Resumable upload behavior (pause / resume / cancel)
- Chunk size or retry configuration used
- Mobile file access issues (Android Photos/Gallery picker)
- Whether the `endpoint` was a static prop or a function assigned via the element's `endpoint` property from a client script
- View-transition navigation (`astro:page-load`) timing
- Custom appearance or CSS variable overrides

---

# Screenshots / Screen Recording
If applicable, attach screenshots or a short video demonstrating the issue.
