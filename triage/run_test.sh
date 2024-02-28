#!/usr/bin/env bash

# Small script for testing ./triage/run.ts.
# Comment in the desired test case and run the script.

# # - Worktree isn't clean
# ORIGINAL_PWD="$(pwd)"
# cd "$RWFW_PATH" || exit 1
# echo "This is a test" > triage_test.txt
# cd "$ORIGINAL_PWD" || exit 1
# yarn triage
# cd "$RWFW_PATH" || exit 1
# rm triage_test.txt
# cd "$ORIGINAL_PWD" || exit 1

# # - The next branch hasn't been pulled down
# ORIGINAL_PWD="$(pwd)"
# cd "$RWFW_PATH" || exit 1
# git branch -D next
# cd "$ORIGINAL_PWD" || exit 1
# yarn triage
# cd "$RWFW_PATH" || exit 1
# git checkout -b next origin/next
# git switch main
# cd "$ORIGINAL_PWD" || exit 1
