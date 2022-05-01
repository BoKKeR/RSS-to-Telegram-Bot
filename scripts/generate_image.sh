#!/bin/bash

IMAGE_FOLDER=src/doc

for IMAGE in help
do
    IMAGE_PATH=$IMAGE_FOLDER/$IMAGE.md
    echo $IMAGE_PATH
    IMAGE_HASH=$(md5 -q $IMAGE_PATH)
    ./node_modules/.bin/carbon-now --headless --config carbon-config.json $IMAGE_PATH -t $IMAGE -l img
done