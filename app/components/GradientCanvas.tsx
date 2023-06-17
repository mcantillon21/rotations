import { useEffect } from 'react';
import { Gradient } from '../../utils/Gradient';
import { Box } from '@chakra-ui/react';

function GradientCanvas() {
    useEffect(() => {
        try {
            const gradient = new Gradient();
            // @ts-ignore
            gradient.initGradient('#gradient-canvas');
        } catch {}
    }, []);
    return (
    <Box pos="fixed" top={0} left={0} bottom={0} right={0} zIndex={-2}>
        <canvas
            id="gradient-canvas"
            style={{
                width: '100%',
                height: '100%',
            }}
            data-transition-in
        ></canvas>
    </Box>
    );
}

export default GradientCanvas;
