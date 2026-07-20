# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - beta release

### Added

- Astro-native resumable upload UI over `@fastpix/resumable-uploads`: server-rendered `.astro` components bound to a framework-free client runtime (private `fpx-*` custom elements) over a portable TypeScript core (`UploaderController`).
- Two usage modes: zero-config default layout (`<FastPixUploader endpoint="…" />`) and slot composition (`FastPixDropZone`, `FastPixFilePicker`, `FastPixTrack` linear/radial, `FastPixStatus`, `FastPixStartButton`, `FastPixPauseButton`, `FastPixResumeButton`, `FastPixAbortButton`).
- Upload lifecycle state machine (`idle → ready → resolving → uploading ⇄ paused → error | success`) with guard-table transitions; `error` is recoverable, resume is a transition, `isOffline` is an orthogonal flag.
- Lazy endpoint resolution: static URL via prop/attribute or a function resolver assigned client-side via the element's `endpoint` property.
- Typed DOM events (`fpx-file-select`, `fpx-file-reject`, `fpx-upload-start`, `fpx-progress`, `fpx-chunk-attempt`, `fpx-chunk-success`, `fpx-chunk-attempt-failure`, `fpx-pause`, `fpx-resume`, `fpx-abort`, `fpx-error`, `fpx-success`, `fpx-state-change`, `fpx-offline`, `fpx-online`) with an `HTMLElementEventMap` augmentation.
- Imperative element surface: `start / pause / resume / abort / reset / getState / getFile / selectFile`, plus `getUploader()` helper for deterministic element resolution.
- File validation on selection: accept matching (mime, wildcard, extension, `.mkv/.avi/.mov` empty-type fallback), max size, readability probe (Android Photos-picker sandboxed-file case), one-upload-at-a-time busy guard.
- Connectivity tracked in every state (including idle) via window listeners; pause intent survives reconnect (the engine self-resumes; the controller re-asserts pause).
- Theming: `--fpx-*` variables, `data-fpx-*` hooks, and `appearance` keys. Baseline styles ship with the components (build-time for `.astro`, embedded in the client runtime for raw elements); no separate stylesheet import.
- Headless `/core` and `/client` subpath exports.
