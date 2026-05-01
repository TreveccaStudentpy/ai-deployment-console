# AI Deployment Console

A production-ready demo web app that shows how an AI Deployment Engineer can turn a real-world request into a structured deployment brief.

## Stack

- Node.js
- Vercel serverless functions
- OpenAI Responses API
- HTML, CSS, and JavaScript
- No Express server and no frontend framework

## Project Structure

```text
api/ask.js
public/index.html
public/style.css
public/app.js
package.json
```

## Run Locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Add your OpenAI API key to `.env.local`.

4. Start the Vercel local server:

   ```bash
   npm run dev
   ```

5. Open the local URL printed by Vercel, usually `http://localhost:3000`.

## Environment Variables

| Name | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes | Authenticates requests to the OpenAI API. |
| `OPENAI_MODEL` | No | Overrides the default model. Defaults to `gpt-4.1-mini`. |

## Push to GitHub

```bash
git init
git add .
git commit -m "Build AI deployment console"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-deployment-console.git
git push -u origin main
```

## Deploy on Vercel

1. Import the GitHub repository in Vercel.
2. Add `OPENAI_API_KEY` in Project Settings > Environment Variables.
3. Optionally add `OPENAI_MODEL`.
4. Deploy. Vercel will serve `public/` as the frontend and `api/ask.js` as the serverless backend.

## Notes

- Prompt history is stored in browser `localStorage`.
- The server logs lightweight request metadata only, not full prompt contents.
- AI output is requested as structured JSON so the frontend can render consistent sections.
