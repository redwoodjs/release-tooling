#!/usr/bin/env bash

# Small script for testing @lib/cwd.ts.
# Comment in the desired test case and run the script.

# # - No RWFW_PATH
# unset RWFW_PATH
# yarn triage

# # - Nothing at RWFW_PATH
# RWFW_TEMP_PATH="$(dirname "$RWFW_PATH")/rwfw_path_temp"
# mv "$RWFW_PATH" "$RWFW_TEMP_PATH"
# yarn triage
# mv "$RWFW_TEMP_PATH" "$RWFW_PATH"
