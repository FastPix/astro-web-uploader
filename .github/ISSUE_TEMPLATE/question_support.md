---
name: Question/Support
about: Ask questions or get help with the FastPix Astro Uploader
title: '[QUESTION] '
labels: ['question', 'needs-triage']
assignees: ''
---

# Question/Support

Thank you for reaching out! We're here to help you with the FastPix Astro Uploader. To get faster and more accurate help, please provide the following information:

## Question Type
- [ ] How to use a specific component or prop
- [ ] Integration help
- [ ] Configuration question (chunk size, retries, appearance)
- [ ] Assigning a function `endpoint` from a client script
- [ ] View transitions (`<ClientRouter />`) behavior
- [ ] Performance question
- [ ] Troubleshooting help
- [ ] Other: _______________

## Question
**What would you like to know?**

<!-- Provide a clear and specific question about the Astro Uploader -->

## What You've Tried
**What have you already attempted to solve this?**

```astro
---
import { FastPixUploader } from "@fastpix/fp-astro-uploader";
---

<FastPixUploader endpoint="https://your-fastpix-upload-url" accept="video/*" />
```

## Current Setup
**Describe your current setup:**
- Astro rendering mode (static / server / hybrid), whether view transitions (`<ClientRouter />`) are enabled, and whether you're using the default `<FastPixUploader />`, composing individual components, or the headless `UploaderController` from `/core`.

## Environment
- **Package Version**: [e.g., 0.1.0]
- **Astro Version**: [e.g., 7.0.7]
- **Browser**: [e.g., Chrome 120, Safari 17]
- **OS**: [e.g., macOS 14, Windows 11]
- **Node/npm**: [e.g., Node 20, npm 10]
- **Integration**: [Default component / Composed components / Headless `UploaderController`]

## Configuration
**Current uploader configuration:**

```astro
<FastPixUploader
  id="up"
  autoStart={false}
  accept="video/*"
  maxFileSize={2_000_000}
  chunkSize={16_384}
  retryChunkAttempt={6}
/>

<script>
  import { getUploader } from "@fastpix/fp-astro-uploader/client";
  import { getSignedUrl } from "../lib/get-signed-url";

  (await getUploader("#up")).endpoint = getSignedUrl;
</script>
```

## Expected Outcome
**What are you trying to achieve?**

<!-- Example: Custom layout with composed components, resumable uploads, custom appearance, mobile file access, view-transition-safe re-binding, etc. -->

## Error Messages (if any)
```
<!-- Paste any console errors or unexpected behavior -->
```

## Additional Context

### Use Case
**What are you building?**
- [ ] Astro site or app (static, SSR, or hybrid)
- [ ] Content management / upload dashboard
- [ ] Video streaming product
- [ ] Other: _______________

### Timeline
**When do you need this resolved?**
- [ ] ASAP (blocking development)
- [ ] This week
- [ ] This month
- [ ] No rush

### Resources Checked
**What resources have you already checked?**
- [ ] README.md
- [ ] CHANGELOG.md
- [ ] Code examples
- [ ] GitHub Issues
- [ ] Other: _______________

## Priority
Please indicate the urgency:
- [ ] Critical (Blocking production deployment)
- [ ] High (Blocking development)
- [ ] Medium (Would like to know soon)
- [ ] Low (Just curious)

## Checklist
Before submitting, please ensure:
- [ ] I have provided a clear question
- [ ] I have described what I've tried
- [ ] I have included my current setup and environment
- [ ] I have checked existing documentation
- [ ] I have provided sufficient context

---

**We'll do our best to help you get unstuck!**

**Helpful Resources:**
- [FastPix Documentation](https://fastpix.com/docs/video-on-demand-api/upload-and-import-videos/direct-upload-video-media)
- [Astro Uploader README](https://github.com/FastPix/astro-web-uploader#readme)
- [GitHub Discussions](https://github.com/FastPix/astro-web-uploader/issues)
