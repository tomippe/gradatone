#!/bin/bash
# Compile SCSS to CSS and watch for changes

echo "Compiling SCSS to CSS..."
sass style.scss style.css --no-source-map

echo "Watching for SCSS changes..."
sass --watch style.scss:style.css --no-source-map
