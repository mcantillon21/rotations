import React from 'react';
import { Text, Center } from '@chakra-ui/react';

import dynamic from "next/dynamic";
const Plot = dynamic(() => import("./PlotGraph"), {
    ssr: false,
  });

const Visualization = ({ plotdataX, plotdataY, plotdataZ, plotdataLabels, plotdataUris, accessToken, plotKey }) => (
  <>
    {plotdataX.length > 0 && (
      <Center flexDirection={'column'} key={plotKey}>
        <Text className="text-white text-center m-2">
          <i>
            Your songs visualized in space. The closer the dots, the more similar the songs.
          </i>
        </Text>
        <Plot
          key={plotKey}
          xData={plotdataX}
          yData={plotdataY}
          zData={plotdataZ}
          track_names={plotdataLabels}
          track_uris={plotdataUris}
          access_token={accessToken}
        />
      </Center>
    )}
  </>
);

export default Visualization;

