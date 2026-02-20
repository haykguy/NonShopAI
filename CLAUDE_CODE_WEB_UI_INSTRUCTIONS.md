# CLAUDE CODE INSTRUCTIONS: VEO 3 AUTOMATION WEB UI
## Build Instructions for Automated Video Generation Interface

---

## PROJECT OVERVIEW

Create a web application that automates the Veo 3 video generation workflow by:
1. Accepting 7 image files + 7 text prompts from generated PDF scripts
2. Taking image prompts and using text to image with Nano Banana Pro to create the images.
3. Taking the images and matching them with associated video text prompt. Generating a video using frames to video with the attached text prompt with Veo 3.1 Fast
3. Managing video generation queue
4. Downloading and compiling final 56-second video
5. Providing user-friendly interface for batch processing

---

## TECH STACK RECOMMENDATION

**Frontend:**
- React.js (user interface)
- Tailwind CSS (styling)
- shadcn/ui (components)

**Backend:**
- Node.js + Express (API server)
- Python (video processing with FFmpeg)

**APIs/Services:**
- useAPI.net Google Flow API ( see attached documentation)
- FFmpeg (video compilation)

**Deployment:**
- Vercel (frontend + serverless functions)
- Or Docker container (full-stack)

---

## FEATURE REQUIREMENTS

### Core Features (MVP)

1. **Upload Interface**
   - Auto-populate from PDF (optional: PDF parser)
   - Validation (ensure 7 images + 7 prompts)

2. **Useapi.net Veo 3 Integration**
   - API authentication
   - Batch upload images
   - Submit prompts with "Character speaks ALL THE WORDS" format
   - Queue management (handle rate limits)
   - Progress tracking per clip

3. **Video Compilation**
   - Auto-download 7 generated clips
   - FFmpeg compilation to single 56-second video
   - Custom Text on screen and resizing video. (Black borders)
   - Export as MP4 (1080x1920, 30fps)

4. **User Dashboard**
   - Current job status
   - Queue position
   - Estimated completion time
   - Download final video button
---


**Document Version**: 1.0
**Compatible With**: Claude Code, Veo 3 API, FFmpeg 6.0+
**Last Updated**: February 2026
