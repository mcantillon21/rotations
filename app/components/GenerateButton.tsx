import React from 'react';
import { VStack, Text, Button } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const GenerateButton = ({ loading, estimatedTime, handleGeneratePlaylist, query }) => (
  <div>
    <VStack>
      {loading ? (
        <Text className="text-white">Estimated wait time: {estimatedTime} seconds</Text>
      ) : (
        <Text></Text>
      )}
      <Button
        className="mt-2 bg-gradient-to-r from-teal-400 to-blue-500 text-white font-bold py-2 px-4 rounded-full m-2 transition-all duration-500 relative overflow-hidden"
        onClick={() => handleGeneratePlaylist(query)}
        border={'1px'}
        backgroundColor={'#fff'}
        variant="outline"
        display={'flex'}
        justifyContent={'center'}
        _hover={{ borderColor: '#9B72F2', borderWidth: '1px' }}
        textColor={'white'}
        disabled={true}
        _disabled={{ opacity: 0.9, backgroundColor: 'red' }}
      >
        {loading ? (
          <span className="shinybutton">Generating ... </span>
        ) : (
          <span className="shinybutton">Generate</span>
        )}
      </Button>
    </VStack>
  </div>
);

export default GenerateButton;
