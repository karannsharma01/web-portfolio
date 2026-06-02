#!/bin/bash
# This script is used by Render to securely generate the config.js file
# It reads the secret GEMINI_API_KEY environment variable and writes it to a file.
echo "window.ENV = { API_KEY: '${GEMINI_API_KEY}' };" > config.js
