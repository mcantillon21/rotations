"use client";
import Head from "next/head";
import { useEffect, useState, useRef } from "react";
import {
  Button,
  useToast,
} from "@chakra-ui/react";
import GradientCanvas from "./components/GradientCanvas";
import axios from "axios";

import { motion } from "framer-motion";

import { ChakraProvider } from '@chakra-ui/react'
import Visualization from "./components/Visualization";
import Playlist from "./components/Playlist";
import Title from "./components/Title";
import SearchBar from "./components/SearchBar";
import GenerateButton from "./components/GenerateButton";

function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef(null);
  const [accessToken, setAccessToken] = useState("");
  const [username, setUsername] = useState("");
  const [plotdataX, setPlotdataX] = useState([]);
  const [plotdataY, setPlotdataY] = useState([]);
  const [plotdataZ, setPlotdataZ] = useState([]);
  const [plotdataLabels, setPlotdataLabels] = useState([]);
  const [plotdataUris, setPlotdataUris] = useState([]);
  const [plotKey, setPlotKey] = useState(0);

  const [title, setTitle] = useState("");
  const [playlistURL, setPlaylistURL] = useState("");

  const [estimatedTime, setEstimatedTime] = useState(0);

  const toast = useToast();

  const baseHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
    "Access-Control-Allow-Headers":
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials, Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers",
  };

  const headers_formdata = {
    ...baseHeaders,
    accept: "application/json",
    "Content-Type": "multipart/form-data",
  };

  const headers_json = {
    ...baseHeaders,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    if (params.access_token) {
      setAccessToken(params.access_token);

      axios
        .get(`https://api.spotify.com/v1/me`, {
          headers: {
            Authorization: `Bearer ${params.access_token}`,
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          setUsername(response.data.display_name);
          setEmail(response.data.email);
        })
        .catch((error) => {
          console.log(error);
        });

      axios
        .get(
          `https://mcantillon21--rotation-fastapi-app.modal.run/graph_saved_songs?access_token=${params.access_token}`,
          {
            headers: baseHeaders,
          }
        )
        .then((response) => {
          setPlotdataX(response.data.x);
          setPlotdataY(response.data.y);
          setPlotdataZ(response.data.z);
          setPlotdataLabels(response.data.labels);
          setPlotdataUris(response.data.uris);
        })
        .catch((error) => {
          toast({
            title: "Authentication Failed!",
            description: "Reach out to admin if this is a mistake.",
            status: "error",
            duration: 5000,
            isClosable: true,
            containerStyle: {
              maxWidth: "90%",
            },
          });
          console.log(error);
        });
    }

    setEstimatedTime(getRandomNumber);
  }, []);

  function getRandomNumber() {
    let min = 35;
    let max = 100;
    let increment = 5;

    let range = max - min + 1;
    let num = Math.floor(Math.random() * range) + min;

    return Math.ceil(num / increment) * increment;
  }

  const handleGeneratePlaylist = async (query_string) => {
    if (!accessToken) {
      toast({
        title: "Error: No access token",
        description: "Please log in to Spotify",
        status: "error",
        duration: 5000,
        isClosable: true,
        containerStyle: {
          maxWidth: "90%",
        },
      });
      return;
    }

    if (!query_string && !fileRef.current) {
      toast({
        title: "Error: Required fields not filled out",
        description: "Please describe a vibe or upload an image",
        status: "error",
        duration: 5000,
        isClosable: true,
        containerStyle: {
          maxWidth: "90%",
        },
      });
      return;
    }

    if (query_string && fileRef.current) {
      toast({
        title: "Warning: Too many fields filled out",
        description: "Only the image will be used",
        status: "warning",
        duration: 5000,
        isClosable: true,
        containerStyle: {
          maxWidth: "90%",
        },
      });
    }

    try {
      const formData = new FormData();	
      if (fileRef.current) {	
        formData.append("file", fileRef.current[0], "file");	
      }	
      if (query) {	
        formData.append("query_string", query);	
      }	
      const axiosResponse = await axios.post(	
        "https://mcantillon21--rotation-fastapi-app.modal.run/generate_playlist",	
        formData,	
        {	
          headers: headers_formdata,	
          params: {	
            access_token: accessToken,	
          },	
        }	
      );	

      setPlotKey(plotKey + 1);	
      setPlotdataX(axiosResponse.data.x);	
      setPlotdataY(axiosResponse.data.y);	
      setPlotdataZ(axiosResponse.data.z);	
      setPlotdataLabels(axiosResponse.data.labels);	
      setPlotdataUris(axiosResponse.data.uris);	
      setTitle(axiosResponse.data.title);

      // Save the playlist to Spotify
      const form2Data = new FormData();
      formData.append("access_token", accessToken);
      formData.append("track_uris", JSON.stringify(axiosResponse.data.uris));	
      formData.append("username", username);	
      if (axiosResponse.data.title) {	
        formData.append("playlist_title", axiosResponse.data.title)
      } else {
        formData.append("playlist_title", "Custom Rotation");
      }
      if (fileRef.current) {
        formData.append("file", fileRef.current[0], "file");
      }

      const response = await axios.post(
        "https://mcantillon21--rotation-fastapi-app.modal.run/save_to_spotify",
        formData,
        {
          headers: headers_formdata,
        }
      );

      const url = response.data.playlist_url;
      const id = url.split("/").pop();
      setPlaylistURL(id);
      if (axiosResponse.status != 200) {
        toast({
          title: "Sorry, we ran into an issue",
          description: `${axiosResponse.statusText}`,
          status: "error",
          duration: 5000,
          isClosable: true,
          containerStyle: {
            maxWidth: "90%",
          },
        });
      }
    } catch (error) {
      toast({
        title: "Sorry, we ran into an issue. Check back soon!",
        description: `${error}`,
        status: "error",
        duration: 5000,
        isClosable: true,
        containerStyle: {
          maxWidth: "90%",
        },
      });
    }
    setLoading(false);
  };

  const loginSpotify = async () => {
    await axios
      .get("https://mcantillon21--rotation-fastapi-app.modal.run/auth/login", {
        headers: headers_json
      })
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => {
        toast({
          title: "Sorry login did not work!",
          description: `${error}`,
          status: "error",
          duration: 5000,
          isClosable: true,
          containerStyle: {
            maxWidth: "90%",
          },
        });
        console.error(error);
      });
  };

  const getProfile = async () => {
    await axios
      .get("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        setUsername(response.data.display_name);
      })
      .catch((error) => {
        toast({
          title: "Sorry login did not work!",
          description: `${error}`,
          status: "error",
          duration: 5000,
          isClosable: true,
          containerStyle: {
            maxWidth: "90%",
          },
        });
        console.error(error);
      });
  };

  const handleClick = async () => {
    let clientId = 1;
    while (!accessToken) {
      try {
        const response = await fetch(`https://mcantillon21--rotation-fastapi-app.modal.run/auth/login`);
        const { url } = await response.json();
        // accessToken = new URL(url).searchParams.get("access_token");
      } catch (error) {
        setError(error);
        clientId++;
      }
    }

    if (accessToken) {
      // window.location.href = `http://localhost:3000/?access_token=${access_token}`;
      window.location.href = `http://rotations.ai/?access_token=${access_token}`;
    } else {
      setError("Could not authenticate with Spotify");
    }
  };


  return (
    <ChakraProvider>
      <div className="flex min-h-screen flex-col items-center relative">
        <GradientCanvas />
        <Head>
          <title>Rotation</title>
          <meta
            name="description"
            content="Transform pictures and words into a customized song playlist."
          />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link
            rel="icon"
            href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎧</text></svg>"
          />
        </Head>
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.5 }}
          className="flex w-full flex-row-reverse absolute m-6 mr-16"
        >
          {username ? (
            <>
	            <Button backgroundColor="#1DB954" className="text-white">	
              {username} <i className="fa fa-spotify mt-1 ml-2"></i>	
              </Button>
            </>
          ) : (
            <a href="https://mcantillon21--rotation-fastapi-app.modal.run/auth/login">
              <Button backgroundColor="#1DB954" className="text-white">
                Connect Spotify <i className="fa fa-spotify mt-1 ml-2"></i>
              </Button>
            </a>
          )}
        </motion.div>

        <main className="flex flex-col object-fill p-5 w-full">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.5 }}
          >
          <Title/>	
            <SearchBar query={query} setQuery={setQuery} fileRef={fileRef} fileName={fileName} setFileName={setFileName} username={username} toast={toast} />	
            <GenerateButton loading={loading} estimatedTime={estimatedTime} handleGeneratePlaylist={handleGeneratePlaylist} query={query}/>	
            <Visualization plotdataX={plotdataX} plotdataY={plotdataY} plotdataZ={plotdataZ} plotdataLabels={plotdataLabels} plotdataUris={plotdataUris} accessToken={accessToken} plotKey={plotKey}/>	
            <Playlist plotdataX={plotdataX} tpitle={title} playlistURL={playlistURL}/>
          </motion.div>
        </main>

      </div>
    </ChakraProvider>
  );
}

export default Home;
