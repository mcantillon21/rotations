import os
import numpy as np
from sklearn.decomposition import PCA
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials, SpotifyOAuth

# Defining useful constant
MIN_POPULARITY = 20
RECOMMENDATION_LIMIT = 15
NUM_PCA_COMPONENTS = 3
FEATURES = ['danceability', 'energy', 'loudness', 'tempo', 'valence']

def authenticate_spotify(access_token: str):
    """Authenticate with the Spotify API using the provided access token."""
    spotify = spotipy.Spotify(auth=access_token)
    return spotify


def get_track_info(track):
    """Extract relevant information from a track object."""
    track_id = track['id']
    track_uri = track['uri']
    track_name = track['name'].split("(", 1)[0].split("-", 1)[0]
    return track_id, track_uri, track_name


def search_songs(spotify, songs):
    """Search for songs on Spotify and return their track IDs, URIs, and names."""
    track_ids = []
    track_uris = []
    track_names = []
    for song in songs:
        result = spotify.search(song.strip(), limit=1, type='track')

        if result['tracks']['items'] and result['tracks']['items'][0]['popularity'] > MIN_POPULARITY:
            track_id, track_uri, track_name = get_track_info(result['tracks']['items'][0])
            track_ids.append(track_id)
            track_uris.append(track_uri)
            track_names.append(track_name)
        else:
            print(f"Song '{song}' not found on Spotify")

    return track_ids, track_uris, track_names


def get_recommendations(spotify, track_uris, track_names):
    """Get song recommendations based on the existing track URIs and names."""
    res = spotify.recommendations(seed_tracks=track_uris, min_popularity=40, limit=RECOMMENDATION_LIMIT - len(track_names))
    for track in res['tracks']:
        track_id, track_uri, track_name = get_track_info(track)
        track_uris.append(track_uri)
        track_ids.append(track_id)
        track_names.append(track_name)
    return track_ids, track_uris, track_names


def extract_song_info_from_playlist(songs):
    """Extract the track IDs, URIs, and names from a list of playlist items."""
    track_ids = []
    track_uris = []
    track_names = []
    for item in songs['items']:
        track_id, track_uri, track_name = get_track_info(item['track'])
        track_ids.append(track_id)
        track_uris.append(track_uri)
        track_names.append(track_name)
    return track_ids, track_uris, track_names


def get_song_embeddings(spotify, track_ids):
    """Generate song embeddings using Spotify's audio features."""
    song_embeddings = []
    for track_id in track_ids:
        features = spotify.audio_features(track_id)[0]
        relevant_features = np.array([features[feature] for feature in FEATURES])
        normalized_features = (relevant_features - np.mean(relevant_features)) / np.std(relevant_features)
        song_embeddings.append(normalized_features)
    return song_embeddings


def apply_pca(song_embeddings):
    """Apply PCA to reduce the dimensionality of song embeddings."""
    pca = PCA(n_components=NUM_PCA_COMPONENTS)
    embeddings_3d = pca.fit_transform(song_embeddings)
    return embeddings_3d


def get_embeddings(access_token: str, songs: list, search: bool = False):
    spotify = authenticate_spotify(access_token)
    
    if search: # Generated 20 Song Titles
        track_ids, track_uris, track_names = search_songs(spotify, songs)
        track_ids, track_uris, track_names = get_recommendations(spotify, track_uris, track_names)
    else: # Recently Liked 20 Songs
        track_ids, track_uris, track_names = extract_song_info_from_playlist(songs)
        
    song_embeddings = get_song_embeddings(spotify, track_ids)
    embeddings_3d = apply_pca(song_embeddings)

    x = [e[0] for e in embeddings_3d]
    y = [e[1] for e in embeddings_3d]
    z = [e[2] for e in embeddings_3d]

    return x, y, z, track_names, track_uris
