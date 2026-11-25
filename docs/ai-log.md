# AI Collaboration Log

## App shell lab

This lab was completed within an existing Next.js project.
The setup/app-shell branch was advanced to origin/main before
adding the missing app-shell content. The project was not scaffolded again.

### Prompts

**ChatGPT request:** Explain the proposed stack in plain language and
help complete the existing neighborhood platform app-shell lab step by step.

**Gemini prompt — App Shell Architect:**

Act as a senior teaching assistant. Explain in plain language a minimal
Next.js App Router + TypeScript + Tailwind stack for a neighborhood
property platform.

My existing repository already has Next.js, TypeScript, Tailwind,
ESLint, a src directory, and property and sponsor components.

Propose a file plan and terminal commands to complete an app shell
with a heading, project purpose, and three feature cards:
listings, neighborhood sponsors, and voice help.

Include accessible HTML requirements and a verification checklist.
Preserve existing features. Do not scaffold over the existing app.
Give commands plus a file plan, not a giant code dump.
Never invent command results or credentials. Include no secrets.
Clearly label any proposed voice functionality that is not connected.

### Comparison

1. ChatGPT explained Git, GitHub, and Vercel alongside the application
   stack. Gemini gave more detail about layout.tsx and the src directory.
2. Gemini suggested an optional reusable FeatureCard component and a
   separate TypeScript check. ChatGPT proposed keeping changes focused
   on the homepage, README, and AI log.

### Decisions and verification

| Tool | Prompt | Output used | Output rejected or not used | Verification | Commit |
| --- | --- | --- | --- | --- | --- |
| ChatGPT | Stack explanation and guided completion of the existing app shell | Preserve existing components; add three feature cards, metadata, a skip link, and verification steps | Fresh scaffolding was not used because the application already existed; no fabricated command results were accepted | git diff --check, npm run lint, and npm run build passed; local page loaded on port 3001 | `5599080` |
| Gemini / Google AI Studio | App Shell Architect prompt above | Semantic cards, descriptive headings, keyboard focus, responsive layout, and honest voice integration status | Optional FeatureCard extraction and disabled microphone button were not used; the small shell uses inline cards and a text status | Compared suggestions with existing files; build and lint passed; browser screenshot shows stacked cards; user reported clicks work | `5599080` |

### Observed results

- Node: v24.21.0
- npm: 11.19.0
- Git: 2.39.2 (Apple Git-143)
- Local URL: http://localhost:3001
- Production build and lint passed.
- Initial browser inspection showed a stylesheet HTTP 500 and an older page.
- After stopping development servers, clearing .next, and restarting on
  port 3001, the updated styled page loaded with HTTP 200 responses.
- The latest console screenshot shows no red error entries and includes
  a yellow LMS adapter warning whose source has not been established.
- The user reported that clicks work.
- Keyboard focus makes the skip link visible with a focus outline,
  confirmed by the local-page screenshot.
- Hosted app shell verified in Chrome Incognito on November 25, 2026.
- Production Release Gates passed for merge commit 7454382 (PR #9).
- CI troubleshooting: replaced an invalid Supabase access token,
  configured an IPv4 session-pooler migration dry run in c31a40c,
  and restored the original applied migration in 75fb18b.
- No migration-history repair was performed.
- Voice help is not connected to this webpage; the separate Vapi
  assistant is not represented as an active webpage integration.
- No credentials or private environment values are included in this log.
