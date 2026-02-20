# NonShopAI — AI Video Generator

NonShopAI is a full-stack web application that generates short-form AI videos from text prompts — no voiceover or text-to-speech required. You define what each clip should look like and describe its motion, the system generates images with Google Flow's image model, converts them into videos using Google's Veo model, and stitches everything together into a final MP4 with optional text overlays and black borders.

---

## Scope

The application manages the entire pipeline from raw idea to finished video:

- Define a project with 1–20 clips, each with an image prompt and a video prompt
- Upload a PDF script and have it automatically parsed into per-clip prompts
- Use the built-in AI interview assistant to generate prompts through a guided conversation
- Generate images in parallel across all clips simultaneously
- Optionally review and hand-pick from 4 generated images before proceeding
- Generate videos from the selected images, all running in parallel
- Compile the clips into a final video with configurable borders, title text, font, color, position, and aspect ratio (9:16 or 16:9)
- Preview and download the final MP4

---

## How the Application Works (In Order)

1. **Create a project** — Enter a project name, choose how many clips (1–20), and decide whether to auto-pick generated images or manually review them.

2. **Define clip prompts** — For each clip, write an image prompt (what the scene looks like) and a video prompt (what motion or action occurs). Three methods are available:
   - Type prompts manually in the clip editor
   - Upload a PDF script — the server parses it and fills in all clip prompts automatically
   - Use the AI Assistant — a multi-turn interview asks you questions about your content and generates all prompts for you

3. **Start generation** — Click "Start Generation." The server launches all clip pipelines in parallel simultaneously. For each clip:
   - An image is generated using the `nano-banana-pro` model via useapi.net
   - If manual review mode is on, you are shown up to 4 image options and asked to pick one
   - The selected image is uploaded as a media asset to useapi.net
   - A video is generated from the image asset using the `veo-3.1-fast` model (async job, polled every 10 seconds)
   - The final video file is downloaded to the server

4. **Monitor progress** — The progress dashboard updates in real time over a Server-Sent Events connection. Each clip shows its current status: generating image → reviewing image → uploading asset → generating video → completed (or failed/skipped).

5. **Configure layout** — Before compiling, use the interactive canvas to set the aspect ratio, border width, title text, font size, color, text position (draggable), and box opacity.

6. **Compile** — Click "Compile Final Video." FFmpeg stitches the clips together, applies borders, adds the text overlay, normalizes audio, and outputs a single MP4.

7. **Download** — Preview the video in the browser and download it.

---

## Requirements

### System Dependencies (must be installed separately)

| Program | Purpose | Install |
|---------|---------|---------|
| **Node.js** v18+ | Runtime for server and client build | https://nodejs.org |
| **npm** v9+ | Package manager (bundled with Node.js) | — |
| **FFmpeg** | Video compilation, concatenation, text overlays | https://ffmpeg.org/download.html |
| **FFprobe** | Audio/video stream probing (bundled with FFmpeg) | — |

> On Windows, ensure `ffmpeg` and `ffprobe` are on your system PATH, or set `FFMPEG_PATH` and `FFPROBE_PATH` in your `.env` file.

### Node Package Dependencies

#### Root
| Package | Version | Purpose |
|---------|---------|---------|
| `concurrently` | ^9.1.0 | Run server and client dev servers simultaneously |

#### Server (`server/`)
| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^4.21.2 | HTTP server and routing |
| `cors` | ^2.8.5 | Cross-origin request headers |
| `dotenv` | ^16.4.7 | Load environment variables from `.env` |
| `multer` | ^1.4.5-lts.1 | Multipart file upload handling (PDF, images) |
| `pdf-parse` | ^1.1.1 | Extract text from uploaded PDF scripts |
| `uuid` | ^11.1.0 | Generate unique project IDs |
| `nodemon` | ^3.1.9 | Auto-restart server on file changes (dev) |
| `ts-node` | ^10.9.2 | Run TypeScript directly without pre-compiling (dev) |
| `typescript` | ^5.7.3 | TypeScript compiler |

#### Client (`client/`)
| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.2.0 | UI library |
| `react-dom` | ^19.2.0 | DOM rendering |
| `tailwindcss` | ^4.1.18 | Utility-first CSS framework |
| `@tailwindcss/vite` | ^4.1.18 | Tailwind integration for Vite |
| `clsx` | ^2.1.1 | Conditional CSS class builder |
| `tailwind-merge` | ^3.4.0 | Merge conflicting Tailwind classes |
| `lucide-react` | ^0.564.0 | Icon library |
| `vite` | ^7.3.1 | Frontend build tool and dev server |
| `typescript` | ~5.9.3 | TypeScript compiler |

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Required
USEAPI_TOKEN=user:your-token-here
USEAPI_BASE_URL=https://api.useapi.net/v1/google-flow
PORT=3001
OUTPUT_DIR=./server/output

# Optional — AI Assistant LLM backend
LLM_PROVIDER=mock           # Options: mock | openai | anthropic
LLM_API_KEY=                # OpenAI or Anthropic API key
LLM_MODEL=                  # e.g. gpt-4o-mini or claude-haiku-4-5-20251001

# Optional — FFmpeg paths (if not on system PATH)
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe

# Optional — Logging
LOG_LEVEL=info              # Options: debug | info | warn | error
```

---

## Running the Project

```bash
# Install all dependencies (root + server + client)
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Run both server and client in dev mode
npm run dev
```

- Server runs at `http://localhost:3001`
- Client runs at `http://localhost:5173`

---

## Backend Architecture & Code Deep-Dive

### Directory Structure

```
server/src/
├── index.ts                  # Express app entry point
├── config.ts                 # Environment config loader
├── types/
│   ├── project.ts            # Project, Clip, Settings domain types
│   └── api.ts                # useapi.net API response types
├── middleware/
│   └── errorHandler.ts       # Global error handler middleware
├── routes/
│   ├── api.ts                # Root router — mounts all subrouters
│   ├── health.ts             # GET /health — account status and credits
│   ├── projects.ts           # CRUD — create/read/update/delete projects and clips
│   ├── generation.ts         # POST /generate, SSE /status, image selection, abort
│   ├── compile.ts            # POST /compile, GET /download
│   └── chat.ts               # POST /chat — LLM prompt generation
├── services/
│   ├── pipeline.ts           # PipelineOrchestrator — parallel clip processing
│   ├── imageGen.ts           # Image generation and download
│   ├── videoGen.ts           # Video generation and download
│   ├── assetUpload.ts        # Upload image to useapi as reusable asset
│   ├── jobPoller.ts          # Async job polling with timeout
│   ├── compiler.ts           # FFmpeg video compilation
│   ├── downloader.ts         # File and buffer download utilities
│   ├── pdfParser.ts          # PDF text extraction and clip splitting
│   ├── projectStore.ts       # In-memory + disk project persistence
│   ├── chatService.ts        # LLM adapters (mock, OpenAI, Anthropic)
│   └── useapi.ts             # useapi.net API client with retry
└── utils/
    ├── logger.ts             # Structured logger (debug/info/warn/error)
    └── retry.ts              # Exponential backoff retry wrapper
```

### Service-by-Service Breakdown

#### `pipeline.ts` — PipelineOrchestrator
The central coordinator. When generation starts, it filters clips that haven't been completed yet and launches all of them simultaneously using `Promise.allSettled()`. Each clip runs its own three-stage process independently. The orchestrator emits progress events at every status change, which are picked up by the SSE endpoint and streamed to the client. It also holds the `selectImage()` method, which the generation route calls when a user picks an image during manual review — this unblocks the clip's `waitForImageSelection` promise and allows it to proceed.

#### `imageGen.ts` — Image Generation
Calls the `nano-banana-pro` model through the useapi client. If auto-pick mode is on, it requests 1 image and downloads it immediately. If manual review mode is on, it requests 4 images and returns the FIFE URLs for the client to display. After user selection, `downloadSelectedImage()` fetches the chosen image to disk.

#### `assetUpload.ts` — Asset Upload
Reads the locally downloaded image file, sends it as a binary buffer to useapi's `/assets` endpoint, and returns the `mediaGenerationId`. This ID is what gets passed to the video generation step as the `startImage` reference.

#### `videoGen.ts` — Video Generation
Submits an async video generation job to useapi using the `veo-3.1-fast` model with the asset ID as the starting frame. It then hands off the job ID to the poller and waits. Once the job completes, it downloads the resulting video file to disk.

#### `jobPoller.ts` — Job Polling
Polls the useapi job status endpoint every 10 seconds. Continues until the job status is `completed` or `failed`, or until the 10-minute timeout is hit. On each poll it calls back with the current status so the pipeline can emit a `video_progress` event to the client.

#### `compiler.ts` — FFmpeg Compilation
Handles two cases:
- **Single clip**: Scales the video to the inner canvas size, pads to the full output size with black borders, adds the drawtext overlay.
- **Multiple clips**: Probes each video for audio tracks. For clips with no audio, it generates a silent audio stream to keep FFmpeg's concat from failing. Concatenates all video and audio streams, then adds the text overlay on top. Output is H.264 video with AAC audio at 30fps.

#### `pdfParser.ts` — PDF Parsing
Uses `pdf-parse` to extract raw text, then applies three regex strategies in order of priority to split it into clip sections: explicit `CLIP N` markers, `Scene N` markers, or numbered sections (`1.`, `2.`, etc.). Within each section it looks for `IMAGE PROMPT:` and `VIDEO PROMPT:` labels to populate the clip fields.

#### `projectStore.ts` — Persistence
Maintains an in-memory `Map` of projects keyed by project ID. On every write, it asynchronously serializes the project to a JSON file at `output/projects/{id}.json`. On server startup it loads all existing JSON files back into memory, so projects survive server restarts.

#### `chatService.ts` — LLM Adapters
Three adapters share a common interface: `MockAdapter` (returns hardcoded interview questions for local development), `OpenAiAdapter` (calls OpenAI's chat completions API), and `AnthropicAdapter` (calls Anthropic's messages API). The system prompt is built from the project's clip count, existing prompts, and an instruction to produce a JSON code fence at the end with the completed prompts.

#### `useapi.ts` — API Client
A class wrapping every useapi.net endpoint the application needs. Every outbound call passes through the `retry.ts` wrapper, which retries on HTTP 429 (rate limit), 500, and 503 with exponential backoff (1.5× multiplier per attempt).

### Real-Time Progress: Server-Sent Events

When the client navigates to the generation step, it opens an `EventSource` connection to `/api/projects/{id}/status`. The server keeps this response open and writes `data: {...}\n\n` lines each time the pipeline emits a progress event. Events include clip status changes, image review prompts, video poll updates, and pipeline completion or error. The client's `useGeneration` hook parses these events and updates the React state, driving the progress dashboard in real time.

### Data Flow Summary

```
User Input
    │
    ▼
Client (React + Vite)
    │  REST API calls (fetch)
    ▼
Express Server (port 3001)
    │
    ├── projects.ts ──► projectStore ──► disk JSON files
    │
    ├── generation.ts
    │       │
    │       ▼
    │   PipelineOrchestrator
    │       │  Promise.allSettled (all clips in parallel)
    │       │
    │       ├── imageGen ──► useapi /images ──► download to disk
    │       ├── assetUpload ──► useapi /assets
    │       ├── videoGen ──► useapi /videos (async)
    │       │       └── jobPoller ──► useapi /jobs/{id} (every 10s)
    │       └── downloader ──► fetch video from FIFE URL
    │
    ├── compile.ts ──► compiler (FFmpeg subprocess) ──► final MP4
    │
    └── SSE stream ──► client EventSource ──► ProgressDashboard
```

---

## External Services

| Service | Used For |
|---------|---------|
| **useapi.net** | Google Flow API proxy — image generation, asset hosting, video generation, job polling |
| **Google Flow / nano-banana-pro** | AI image generation model |
| **Google Flow / veo-3.1-fast** | AI video generation model (image-to-video) |
| **OpenAI API** *(optional)* | LLM for AI prompt interview assistant |
| **Anthropic API** *(optional)* | LLM alternative for AI prompt interview assistant |
