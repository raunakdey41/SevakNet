#!/bin/sh
set -e

# We skip the seed check for now as we are using a persistent Firestore DB
echo "🚀  Starting SevakNet backend..."
exec node server.js
