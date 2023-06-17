import os
import numpy as np
import sklearn
from sklearn.cluster import KMeans
from sklearn.manifold import TSNE
import matplotlib.pyplot as plt
import plotly.graph_objs as go
from sklearn.decomposition import PCA
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials, SpotifyOAuth

def auth_spotify(access_token: str):
    sp = spotipy.Spotify(auth=access_token)
    return sp
    
def get_embeddings(access_token: str, songs: list, search: bool = False):
    sp = auth_spotify(access_token)
    track_ids = []
    track_names = []
    track_uris = []
    
    if search:
        for song in songs:
            # Search for the song on Spotify
            song = song.strip()
            result = sp.search(song, limit=1, type='track')
            print('popularity', result['tracks']['items'][0]['popularity'])

            if result['tracks']['items'] and result['tracks']['items'][0]['popularity'] > 20:
                track_id = result['tracks']['items'][0]['id']
                track_name = result['tracks']['items'][0]['name']
                track_uri = result['tracks']['items'][0]['uri']
                if "(" in track_name:
                    track_name = track_name[:track_name.find("(")]
                if "-" in track_name:
                    track_name = track_name[:track_name.find("-")]
                track_names.append(track_name)
                track_ids.append(track_id)
                track_uris.append(track_uri)
            else:
                print(f"Song '{song}' not found on Spotify")
                
        # Buffer the remaining spots with recommendations
        res = sp.recommendations(seed_tracks=track_uris, min_popularity=40, limit=(15 - len(track_names)))
        for track in res['tracks']:
            track_ids.append(track['id'])
            track_uris.append(track['uri'])
            name = track['name']
            if "(" in name:
                name = name[:name.find("(")]
            elif "-" in name:
                name = name[:name.find("-")]
            track_names.append(name)
        
    else:
        for idx, item in enumerate(songs['items']):
            track = item['track']
            track_ids.append(track['id'])
            track_uris.append(track['uri'])
            name = track['name']
            if "(" in name:
                name = name[:name.find("(")]
            elif "-" in name:
                name = name[:name.find("-")]
            track_names.append(name)
            
    song_embeddings = []
    for track_id in track_ids:
        # Call Spotify's audio features API for each track ID
        features = sp.audio_features(track_id)[0]
        relevant_features = [features['danceability'], features['energy'], features['loudness'], features['tempo'], features['valence']]
        relevant_features = (np.array(relevant_features) - np.mean(relevant_features)) / np.std(relevant_features)
        # Concatenate features into a single vector embedding
        song_embeddings.append(relevant_features)
            
    pca = PCA(n_components=3)
    embeddings_3d = pca.fit_transform(song_embeddings)

    x = [e[0] for e in embeddings_3d]
    y = [e[1] for e in embeddings_3d]
    z = [e[2] for e in embeddings_3d]
    
    return x, y, z, track_names, track_uris
