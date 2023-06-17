import replicate

def run_replicate(expected_img_data):
    
    prompt = replicate.run(
        "pharmapsychotic/clip-interrogator:a4a8bafd6089e1716b06057c42b19378250d008b80fe87caa5cd36d40c1eda90",
        input={"image": expected_img_data},
    )
    return prompt