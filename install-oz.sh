#!/bin/bash

# Install specific OpenZeppelin contracts version to the workspace root
pnpm add -w hardhat @openzeppelin/contracts@5.0.1

echo "OpenZeppelin contracts installed successfully!"
echo "Now you can try running: pnpm run compile"
