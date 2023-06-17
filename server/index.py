import io
import json
import os
import random
import string
import base64
import requests
from urllib.parse import urlencode
from tempfile import NamedTemporaryFile
import modal

from fastapi import FastAPI, UploadFile, File, HTTPException, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse

from modal import Image, Stub, asgi_app, web_endpoint
from embeddings import get_embeddings, auth_spotify
from replicate_captioning import run_replicate

import stripe

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

stub = Stub("rotation")
image = Image.debian_slim().pip_install(
    "requests", 
    "replicate",
    "scikit-learn", 
    "matplotlib",
    "plotly",
    "spotipy",
    "openai", 
    "stripe"
)

@app.post('/create-portal-session')
async def customer_portal(request: Request):
    stripe.api_key = os.environ["STRIPE_API_KEY"]
    form_data = await request.form()
    email = form_data.get('email')
    access_token = form_data.get('access_token')
    
    customers = stripe.Customer.list(email=email, limit=1).data
    
    if customers:
        customer = customers[0]
    else:
        customer = stripe.Customer.create(email=email)
    
    portalSession = stripe.billing_portal.Session.create(
        customer=customer.id,
        # return_url='http://localhost:3000/?access_token=' + access_token,
        return_url='http://rotations.ai/?access_token=' + access_token,
    )
    
    return {'url': portalSession.url}

@app.get("/")
def root():
    return {"hello": "world"}

@app.get('/auth/login')
def login():
    auth_query_parameters = {
        "response_type": "code",
        "client_id": 'ee88fcbfed6a4c8bb4e0ffb1273d9eb5',
        "redirect_uri": "https://mcantillon21--rotation-fastapi-app.modal.run/auth/callback",
        "scope": "streaming user-read-email user-read-private user-library-read user-library-modify user-read-playback-state user-modify-playback-state playlist-modify-public playlist-modify-private ugc-image-upload",
        "show_dialog": "true"
    }
    
    auth_url = "https://accounts.spotify.com/authorize/?" + urlencode(auth_query_parameters)
    
    return RedirectResponse(auth_url)

@app.get("/auth/callback")
def auth_callback(request: Request):
    global current_index
    code = request.query_params.get('code')
    
    curr_id = os.environ["SPOTIFY_CLIENT_ID"]
    curr_secret = os.environ["SPOTIFY_CLIENT_SECRET"]    

    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": "https://mcantillon21--rotation-fastapi-app.modal.run/auth/callback"
    }
    client_creds = f"{curr_id}:{curr_secret}"
    creds_b64 = base64.b64encode(client_creds.encode()).decode()

    headers = {
        'Authorization': f'Basic {creds_b64}',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    response = requests.post("https://accounts.spotify.com/api/token", data=data, headers=headers)
    response_json = response.json()
    
    if "access_token" in response_json:
        access_token = response_json["access_token"]
        redirect_url = 'http://rotations.ai/?access_token=' + access_token
        # redirect_url = 'http://localhost:3000/?access_token=' + access_token

        return RedirectResponse(redirect_url)
    else:
        raise HTTPException(status_code=400, detail="Could not authenticate with Spotify")
    
def extract_stream(file: UploadFile = File(...)):
    image_as_bytes = file.file.read()
    # We convert the bytes into a Streamable object of bytes
    return io.BytesIO(image_as_bytes)

@app.get('/graph_saved_songs')
def graph_saved_songs(access_token: str):
    sp = auth_spotify(access_token)
    results = sp.current_user_saved_tracks(limit=20)
    
    (x, y, z, track_names, track_uris) = get_embeddings(access_token, results, False)
    res = {'x': x, 'y': y, 'z': z, 'labels': track_names, 'uris': track_uris}
    return JSONResponse(content=res)

@app.post('/generate_playlist')
async def generate_playlist(access_token: str, query_string: str = Form(None), file: UploadFile = File(None)):
    prompt = ''
    url = "https://api.openai.com/v1/chat/completions"
    OPENAI_SECRET_KEY = os.environ["OPENAI_API_KEY"]
    my_headers = {
        'Content-Type' : 'application/json',
        'Authorization' : f'Bearer {OPENAI_SECRET_KEY}',
        'Access-Control-Allow-Origin': '*'
    }
    if file:
        from PIL import Image
        from io import BytesIO, BufferedReader

        img_file = extract_stream(file)
        img = Image.open(img_file)

        # Convert image to RGB format
        if img.mode == 'RGBA':
            img = img.convert('RGB')
        
        b_handle = BytesIO()
        img.save(b_handle, format="JPEG")
        b_handle.seek(0)
        b_handle.name = "temp.png"
        expected_img_data = BufferedReader(b_handle)
                
        prompt = run_replicate(expected_img_data)
        print(prompt)
                
        # prompt = 'a woman jumping on top of a bed in a bedroom, a screenshot, inspired by Mary Elizabeth Price, trending on pinterest, 0 0 s nostalgia, still image from the movie, teen magazine cover, low res, as though she is dancing, ecstatic, victory, reese witherspoon face, actual photo, early morning mood'
        
        data = {
            "model": "gpt-4",
            "messages": [{"role": "user", "content": f"Generate a 5-songs playlist that best represents this: {prompt}. Don't take literal semantic meaning, only take the vibe and feeling of the overall picture. Don't include an explanation, quotes, numbers or special characters. To begin, provide one word that summarizes the mood well, then separate each song with a new line and format as song - artist."}],
            "temperature": 0.1
        }
        response = requests.post(url, headers=my_headers, data=json.dumps(data))
        content = response.json()['choices'][0]['message']['content']
        title = content.split('\n')[0]
        song_list = content.split('\n')[2:]
            
    elif query_string:
        prompt = query_string
        
        # genres =  ["acoustic", "afrobeat", "alt-rock", "alternative", "ambient", "anime", "black-metal", "bluegrass", "blues", "bossanova", "brazil", "breakbeat", "british", "cantopop", "chicago-house", "children", "chill", "classical", "club", "comedy", "country", "dance", "dancehall", "death-metal", "deep-house", "detroit-techno", "disco", "disney", "drum-and-bass", "dub", "dubstep", "edm", "electro", "electronic", "emo", "folk", "forro", "french", "funk", "garage", "german", "gospel", "goth", "grindcore", "groove", "grunge", "guitar", "happy", "hard-rock", "hardcore", "hardstyle", "heavy-metal", "hip-hop", "holidays", "honky-tonk", "house", "idm", "indian", "indie", "indie-pop", "industrial", "iranian", "j-dance", "j-idol", "j-pop", "j-rock", "jazz", "k-pop", "kids", "latin", "latino", "malay", "mandopop", "metal", "metal-misc", "metalcore", "minimal-techno", "movies", "mpb", "new-age", "new-release", "opera", "pagode", "party", "philippines-opm", "piano", "pop", "pop-film", "post-dubstep", "power-pop", "progressive-house", "psych-rock", "punk", "punk-rock", "r-n-b", "rainy-day", "reggae", "reggaeton", "road-trip", "rock", "rock-n-roll", "rockabilly", "romance", "sad", "salsa", "samba", "sertanejo", "show-tunes", "singer-songwriter", "ska", "sleep", "songwriter", "soul", "soundtracks", "spanish", "study", "summer", "swedish", "synth-pop", "tango", "techno", "trance", "trip-hop", "turkish", "work-out", "world-music"]
        data = {
            "model": "gpt-4",
            "messages": [{"role": "user", "content": f"Generate a 5-songs playlist that best represents this: {prompt}. Don't take literal semantic meaning, only take the vibe and feeling of the overall phrase. Don't include an explanation, quotes, numbers or special characters. Separate each song with a new line and format as song - artist."}],
            "temperature": 0.1
        }
        response = requests.post(url, headers=my_headers, data=json.dumps(data))
        content = response.json()['choices'][0]['message']['content']
        song_list = content.split('\n')
        title = query_string
        
    # song_list = ['Kokomo - The Beach Boys', 'Island in the Sun - Weezer', 'Banana Pancakes - Jack Johnson', 'Under the Boardwalk - The Drifters', 'Margaritaville - Jimmy Buffett', 'Three Little Birds - Bob Marley', 'Summer Breeze - Seals and Crofts', 'Soak Up the Sun - Sheryl Crow', "Surfin' USA - The Beach Boys", 'Walking on Sunshine - Katrina and the Waves', 'California Girls - The Beach Boys', "Doin' Time - Lana Del Rey", 'Red Red Wine - UB40', 'Jamming - Bob Marley', 'Escape (The Piña Colada Song) - Rupert Holmes', 'I Can See Clearly Now - Johnny Nash', 'Good Vibrations - The Beach Boys', 'Sun is Shining - Bob Marley', "California Dreamin' - The Mamas and the Papas", 'Here Comes the Sun - The Beatles']
    (x, y, z, track_names, track_uris)= get_embeddings(access_token, song_list, True)   
    
    print('GENERATE PLAYLIST GENERATED', track_names, track_uris)
    
    res = {'x': x, 'y': y, 'z': z, 'labels': track_names, 'uris': track_uris, 'title': title}
    
    return JSONResponse(content=res)

@app.post('/save_to_spotify')
async def save_to_spotify(request: Request):
    from io import BytesIO
    from PIL import Image
    body = await request.form()
    access_token = body['access_token']
    track_uris = body['track_uris']
    playlist_title = body['playlist_title'].lower()
    
    sp = auth_spotify(access_token)
    user_id = sp.current_user()['id']

    # Create the playlist in the user's Spotify account
    playlist = sp.user_playlist_create(user=user_id, name=playlist_title, description="by rotation")

    track_uris = track_uris.strip("[]").replace("'", "").replace('"', '').split(",")
    sp.user_playlist_add_tracks(user_id, playlist['id'], track_uris)
    
    from PIL import ImageOps

    if 'file' in body:
        playlist_image = body['file'].file.read()
        image_data = base64.b64encode(playlist_image)
        if len(image_data) > 256000: # check if image is too big
            image = Image.open(BytesIO(playlist_image))

            # Preserve EXIF orientation
            exif = image._getexif()
            if exif:
                orientation = exif.get(0x0112)
                image = ImageOps.exif_transpose(image)

            image = image.resize((300, 300))
            buffer = BytesIO()
            if image.mode == 'RGBA':
                image = image.convert('RGB')
            image.save(buffer, format="JPEG")
            playlist_image = buffer.getvalue()
            image_data = base64.b64encode(playlist_image)
        sp.playlist_upload_cover_image(playlist['id'], image_data)

    playlist_url = playlist['external_urls']['spotify']
    return {'message': f'Playlist created and saved to Spotify!', 'playlist_url': playlist_url}
    
@stub.function(image=image, gpu="any", secrets=[
    modal.Secret.from_name("openai-api-key"),
    modal.Secret.from_name("spotify-secrets"),
    modal.Secret.from_name("stripe-secret"), 
    modal.Secret.from_name("replicate-key")
])
@asgi_app()
def fastapi_app():
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    return app

if __name__ == "__main__":
    stub.deploy("webapp")
