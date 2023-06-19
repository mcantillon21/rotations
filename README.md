# [Rotation 🎧](https://rotations.ai)

Generate a playlist from any picture using AI. Capture the nuances and inflections of your mood perfectly and display its quirks spatially. 

[![Rotation](public/rotations.gif)](https://rotations.ai)

## How it works

Leveraging [CLIP](https://replicate.com/pharmapsychotic/clip-interrogator), [GPT-4](https://openai.com/research/gpt-4) and [Spotify seed recommendations](https://developer.spotify.com/documentation/web-api/reference/get-recommendations), Rotation is able to transform text or images into curated playlists. Then, Rotation uses Principal Component Analysis (PCA) to reduce eight audio features of each song, such as liveness, energy, and tempo, to a dimensionality of three.

[![Rotation](public/diagram.png)]

## Running Locally

### Clone the repository to the local machine

```bash
git clone https://github.com/mcantillon21/rotations/
cd rotations
npm install
npm run dev
```
If just touching the frontend, this is enough to test. 

### Backend

This project uses Modal to deploy the backend, through the public webhook: _https://mcantillon21--rotation-fastapi-app.modal.run_. It make take some effort to re-create the backend, as it will require a Spotify App from your own developer account. 

You will need three keys: OPENAI_API_KEY, REPLICATE_API_KEY and your Spotify App ID / Secret. 

To redeploy to your own webhook, you will need to set up a Modal account and run modal deploy index.py. You will then need to change the endpoint in your frontend to point to the new backend URL. 

