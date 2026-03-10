#!/bin/bash

################################################################################
# Casir-Online SSL Certificate Setup Script
# This script sets up SSL certificates using mkcert for local development
################################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN="casir.local"
SSL_DIR="./nginx/ssl"

echo -e "${BLUE}=========================================="
echo "Casir-Online SSL Certificate Setup"
echo -e "==========================================${NC}"
echo ""

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo -e "${YELLOW}mkcert is not installed${NC}"
    echo ""
    echo "Installing mkcert..."

    # Detect OS and install
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install mkcert nss
        else
            echo -e "${RED}Homebrew not found. Please install Homebrew first${NC}"
            echo "Visit: https://brew.sh"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y mkcert
        elif command -v yum &> /dev/null; then
            sudo yum install -y mkcert
        else
            echo -e "${RED}Unsupported package manager. Please install mkcert manually${NC}"
            echo "Visit: https://github.com/FiloSottile/mkcert"
            exit 1
        fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows
        if command -v choco &> /dev/null; then
            choco install mkcert
        else
            echo -e "${RED}Chocolatey not found${NC}"
            echo "Please install Chocolatey first:"
            echo "  Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
            echo ""
            echo "Then run: choco install mkcert"
            exit 1
        fi
    fi

    echo -e "${GREEN}✓ mkcert installed${NC}"
    echo ""
fi

# Create SSL directory
echo "Creating SSL directory..."
mkdir -p "$SSL_DIR"
echo -e "${GREEN}✓ SSL directory created${NC}"
echo ""

# Install local CA
echo "Installing local Certificate Authority..."
mkcert -install
echo -e "${GREEN}✓ Local CA installed${NC}"
echo ""

# Generate certificates
echo "Generating SSL certificates for $DOMAIN and subdomains..."

# Option 1: For custom domain
read -p "Use custom domain '$DOMAIN'? (Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
    # Add domain to hosts file
    echo ""
    echo "Adding $DOMAIN to hosts file..."
    echo ""
    echo "Please add the following lines to your hosts file:"
    echo ""
    echo "  127.0.0.1 $DOMAIN"
    echo "  127.0.0.1 api.$DOMAIN"
    echo "  127.0.0.1 grafana.$DOMAIN"
    echo "  127.0.0.1 prometheus.$DOMAIN"
    echo ""
    echo "Hosts file locations:"
    if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "  Linux/Mac: /etc/hosts"
        echo ""
        read -p "Add to hosts file automatically? (Y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
            echo "127.0.0.1 $DOMAIN" | sudo tee -a /etc/hosts > /dev/null
            echo "127.0.0.1 api.$DOMAIN" | sudo tee -a /etc/hosts > /dev/null
            echo "127.0.0.1 grafana.$DOMAIN" | sudo tee -a /etc/hosts > /dev/null
            echo "127.0.0.1 prometheus.$DOMAIN" | sudo tee -a /etc/hosts > /dev/null
            echo -e "${GREEN}✓ Domains added to hosts file${NC}"
        fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo "  Windows: C:\\Windows\\System32\\drivers\\etc\\hosts"
        echo ""
        echo "Run Notepad as Administrator and edit the file."
        read -p "Press Enter to continue after adding domains..."
    fi

    # Generate certificate for custom domain
    mkcert -cert-file "$SSL_DIR/cert.pem" -key-file "$SSL_DIR/key.pem" "$DOMAIN" "*.$DOMAIN" localhost 127.0.0.1 ::1
    echo -e "${GREEN}✓ Certificates generated for $DOMAIN${NC}"
else
    # Generate certificate for localhost only
    mkcert -cert-file "$SSL_DIR/cert.pem" -key-file "$SSL_DIR/key.pem" localhost 127.0.0.1 ::1
    echo -e "${GREEN}✓ Certificates generated for localhost${NC}"
fi

echo ""

# Set permissions
echo "Setting certificate permissions..."
chmod 644 "$SSL_DIR/cert.pem"
chmod 600 "$SSL_DIR/key.pem"
echo -e "${GREEN}✓ Permissions set${NC}"

echo ""
echo -e "${GREEN}=========================================="
echo "SSL Certificate Setup Completed!"
echo -e "==========================================${NC}"
echo ""
echo "Certificate files:"
echo "  Certificate: $SSL_DIR/cert.pem"
echo "  Private Key: $SSL_DIR/key.pem"
echo ""
echo "Your application will now use HTTPS with trusted certificates!"
echo ""
echo "Test the certificates:"
echo "  curl -I https://$DOMAIN"
echo "  or"
echo "  curl -I https://localhost"
echo ""
