#!/bin/bash

echo ""
echo "========================================"
echo " PHP INI Automation Pro v2.0.0"
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file with default paths..."
    cat > .env << EOF
# PHP Installation Paths
PVM_PATH="/home/$USER/pvm/"
LARAGON_PATH="/opt/laragon/bin/"
XAMPP_PATH="/opt/lampp/bin/php/"
WAMP_PATH="/opt/wamp/bin/"
DEFAULT_PATH="/usr/local/php/"
EOF
    echo ""
    echo ".env file created with default paths."
    echo "Edit .env file if your PHP installations are in different locations."
    echo ""
fi

echo "Starting PHP INI Automation Pro CLI..."
echo ""

# Start the CLI tool
bun start
