import React, { useEffect, useState, useRef } from "react";
import Plotly from "plotly.js";

type Props = {
  xData: number[];
  yData: number[];
  zData: number[];
  track_names: string[];
  track_uris: string[];
  access_token: string;
};

const Plot = ({
  xData,
  yData,
  zData,
  track_names,
  track_uris,
  access_token,
}: Props) => {
  const gdRef = useRef(null);
  const [is_paused, setPaused] = useState<boolean>(false);
  const [is_active, setActive] = useState<boolean>(false);
  // @ts-ignore
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  // @ts-ignore
  const [current_track, setTrack] = useState<Spotify.Track | null>(null);
  const [device_id, setDeviceId] = useState<string | null>(null);
  const [isRotating, setRotating] = useState<boolean>(true);

  const gd = gdRef.current;

  const data = [
    {
      x: xData,
      y: yData,
      z: zData,
      mode: 'text+markers',
      text: track_names,
      textfont: {
        family: "Arial, sans-serif",
        size: 10,
        color: "white",
      },
      type: "scatter3d",
      marker: {
        color: "#2dd4bf",
        size: 10,
        symbol: "circle",
      },
      hoverinfo: "text",
    },
  ];

  const layout = {
    autosize: true,
    margin: {
      l: 0,
      r: 0,
      b: 20,
      t: 20,
    },
    scene: {
      xaxis: {
        title: ""
      },
      yaxis: {
        title: ""
      },
      zaxis: {
        title: ""
      },
      camera: {
        eye: { x: 1, y: 1, z: 1 },
      },
    },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(211, 0, 0, 0.893)",
    showticklabels: false,
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    // @ts-ignore
    window.onSpotifyWebPlaybackSDKReady = () => {
      // @ts-ignore
      const player = new window.Spotify.Player({
        name: "Rotation",
        getOAuthToken: (cb) => {
          cb(access_token);
        },
        volume: 0.5,
      });

      setPlayer(player);

      player.addListener("ready", ({ device_id }) => {
        console.log("Ready with Device ID", device_id);
        setDeviceId(device_id);
      });

      player.addListener("not_ready", ({ device_id }) => {
        console.log("Device ID has gone offline", device_id);
      });

      player.addListener("player_state_changed", (state) => {
        if (!state) {
          return;
        }

        setTrack(state.track_window.current_track);
        setPaused(state.paused);

        player.getCurrentState().then((state) => {
          if (!state) {
            setActive(false);
          } else {
            setActive(true);
          }
        });
      });

      player.connect();
    };

    const gd = gdRef.current;

    const data = [
      {
        x: xData,
        y: yData,
        z: zData,
        mode: 'text+markers',
        text: track_names,
        textfont: {
          family: "Arial, sans-serif",
          size: 10,
          color: "white",
        },
        type: "scatter3d",
        marker: {
          color: "#2dd4bf",
          size: 10,
          symbol: "circle",
        },
        hoverinfo: "text",
      },
    ];

    const layout = {
      autosize: true,
      margin: {
        l: 0,
        r: 0,
        b: 20,
        t: 20,
      },
      scene: {
        xaxis: {
          title: "",
          tickfont: {color: "rgba(0,0,0,0)"},
        },
        yaxis: {
          title: "",
          tickfont: {color: "rgba(0,0,0,0)"},
        },
        zaxis: {
          title: "",
          tickfont: {color: "rgba(0,0,0,0)"},
        },
        camera: {
          eye: { x: 1, y: 1, z: 1 },
        },
      },
      paper_bgcolor: "rgba(0,0,0,0)",
    };

    if (gd !== null) {
      // @ts-ignore
      Plotly.newPlot(gd, data, layout);

      let cnt = 0;

      // @ts-ignore
      function run() {
        if (isRotating) {
          // Only rotate if flag is true
          rotate("scene", Math.PI / 3600);
          requestAnimationFrame(run);
        }
      }

      if (isRotating) {
        run();
      }

      // @ts-ignore
      function rotate(id: string, angle: number) {
        if (isRotating && gd && gd.layout) {
          const scene = gd.layout[id];
          if (scene) {
            // add this check
            var eye0 = scene.camera.eye;
            var rtz = xyz2rtz(eye0);
            rtz.t += angle;

            var eye1 = rtz2xyz(rtz);
            // @ts-ignore
            Plotly.relayout(gd, id + ".camera.eye", eye1);
          }
        }
      }

      // @ts-ignore
      function xyz2rtz(xyz: { x: number; y: number; z: any; }) {
        return {
          r: Math.sqrt(xyz.x * xyz.x + xyz.y * xyz.y),
          t: Math.atan2(xyz.y, xyz.x),
          z: xyz.z,
        };
      }

      // @ts-ignore
      function rtz2xyz(rtz: { r: any; t: any; z: any; }) {
        return {
          x: rtz.r * Math.cos(rtz.t),
          y: rtz.r * Math.sin(rtz.t),
          z: rtz.z,
        };
      }

      // Add event listener for plotly_hover event
      gd.on("plotly_hover", function (data: any) {
        setRotating(!isRotating); // Stop rotation when hovering
      });

      // Add event listener for plotly_click event
      gd.on("plotly_click", async function (data: { points: { pointNumber: string | number; }[]; }) {
        setRotating(false);
        console.log("Marker clicked at index", data.points[0].pointNumber);
        const devices = device_id ? `?device_id=${device_id}` : "";
        const uri = [track_uris[data.points[0].pointNumber]];
        console.log("URI", uri);
        const res = await fetch(
          `https://api.spotify.com/v1/me/player/play/${devices}`,
          {
            method: "PUT",
            headers: new Headers({
              Authorization: `Bearer ${access_token}`,
              "Content-Type": "application/json",
            }),
            body: JSON.stringify({ uris: uri }),
          }
        );
        console.log(`
        > 💥 Spotify play track: ${res}
      `);
      });

      // Cleanup
      return () => {
        Plotly.purge(gd);
      };
    }
  }, []);

  return <div ref={gdRef} style={{ width: "100%", height: "300px" }} />;
};

export default Plot;
