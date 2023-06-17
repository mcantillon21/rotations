"use client";
import React from 'react';
import { Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const Title = () => (
  <div className="align-center" >
    <div className="font-sans font-extrabold text-6xl text-white mb-0.5 mt-10 flex justify-center bg-white bg-clip-text animate-shine">
      Rotation
    </div>
    <Text className="text-center text-lg mb-2 text-white" fontSize="md">
      Transform any picture or text into a customized playlist
    </Text>
    </div>
);

export default Title;