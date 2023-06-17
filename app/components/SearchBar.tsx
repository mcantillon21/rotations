"use client";
import React, { useState, useEffect } from 'react';
import { Button, Input } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FileInput } from './FileInput';

const SearchBar = ({ query, setQuery, fileRef, fileName, setFileName, username, toast }) => {
  const [placeholder, setPlaceholder] = useState('✨');
  const words = [
    'Describe your vibe',
    '', // empty string for a pause
    'frolicking through sun-kissed meadows',
    '',
    'essay writing at 3am with a pounding headache',
    '',
    'hopping off the plane at LAX with a dream and my cardigan',
  ];

  let i = 0;
  let timer;

  function typingEffect() {
    let word = words[i].split('');
    let letterCount = 0;
    let placeholder = '✨ ';
    var loopTyping = function () {
      if (letterCount < word.length) {
        placeholder += word[letterCount];
        setPlaceholder(placeholder);
        letterCount++;
      } else {
        setTimeout(function () {
          deletingEffect(word);
        }, 1000);
        return false;
      }
      timer = setTimeout(loopTyping, 100);
    };
    loopTyping();
  }

  function deletingEffect(word) {
    let letterCount = word.length - 1;
    var loopDeleting = function () {
      if (letterCount >= 0) {
        word.pop();
        let placeholder = '✨ ' + word.join('');
        setPlaceholder(placeholder);
        letterCount--;
        timer = setTimeout(loopDeleting, 100);
      } else {
        if (words.length > i + 1) {
          i++;
        } else {
          i = 0;
        }
        setTimeout(function () {
          typingEffect();
        }, 1000);
        return false;
      }
    };
    loopDeleting();
  }

  useEffect(() => {
    typingEffect();
  }, []);

  return (
    <div
      className="first-line:relative mx-auto rounded-lg backdrop-filter backdrop-blur-md mt-10 mb-4 w-[80%]"
      style={{
        background:
          'radial-gradient(63.94% 63.94% at 50% 0%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%), rgba(255, 255, 255, 0.01)',
        borderRadius: '10px',
      }}
    >
      <div className="flex flex-row p-2" >
        <Input
          placeholder={placeholder}
          value={query}
          id="search-bar"
          mt={4}
          ml={4}
          onChange={(e) => {
            e.preventDefault();
            setQuery(e.target.value);
          }}
          _hover={{ borderColor: "#9B72F2", borderWidth: "1px" }}
          focusBorderColor={"#9B72F2"}
          textColor="white"
        />
        {fileName ? (
          <div className="w-full flex flex-row justify-around items-center m-4">
            <p className="text-center text-xs ml-1 text-white">
              File: {fileName}
            </p>
            <FileInput
              name="first"
              accept=".png, .jpg, .jpeg"
              id="png"
              onChange={(file) => {
                fileRef.current = file;
                setFileName(file?.[0].name || "");
              }}
              className="ml-2"
            >
              <Button onClick={() => document.getElementById("png")?.click()}>
                Re-Upload
              </Button>
            </FileInput>
          </div>
        ) : (
          <FileInput
            name="first"
            accept=".png, .jpg, .jpeg"
            id="png"
            onChange={(file) => {
              fileRef.current = file;
              setFileName(file?.[0].name || "");
            }}
            className="ml-2 w-35"
          >
            <Button
              className="max-w-40 sm:w-auto"
              onClick={(e) => {
                e.preventDefault();
                if (username) {
                  document.getElementById("png")?.click();
                } else {
                  toast({
                    title: "Please connect your Spotify account!",
                    description:
                      "You must be authenticated to upload a picture.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    containerStyle: {
                      maxWidth: "90%",
                    },
                  });
                }
              }}
              m={4}
              ml={0}
              _disabled={{ opacity: 0.1 }}
            >
              or Upload a Pic
            </Button>
          </FileInput>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
