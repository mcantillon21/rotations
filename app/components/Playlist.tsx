import React from 'react';

const Playlist = ({ plotdataX, title, playlistURL }) => (
  <>
    {plotdataX.length > 0 && title !== '' && playlistURL && (
      <div className="max-w mt-2 relative flex justify-center">
        <iframe
          src={`https://open.spotify.com/embed/playlist/${playlistURL}?utm_source=generator&theme=0`}
          width="750px"
          height="400"
          allowFullScreen={true}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        ></iframe>
      </div>
    )}
  </>
);

export default Playlist;