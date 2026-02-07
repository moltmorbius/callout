# Callout API

Backend API for Callout - handles transaction parsing with secure API key storage.

## Setup

1. Install dependencies:
```bash
cd api
yarn
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your Etherscan API key to `.env`:
```
ETHERSCAN_API_KEY=your-key-here
```

Get a free key: https://etherscan.io/apis

## Development

```bash
yarn run dev
```

API runs on http://localhost:3001

## Production

```bash
yarn run build
yarn start
```

## Endpoints

### POST /api/parse-transaction

Parse a theft transaction and identify victim/scammer.

**Request:**
```json
{
  "txHash": "0x...",
  "chainId": 1
}
```

**Response:**
```json
{
  "victim": "0x...",
  "scammer": "0x...",
  "transfers": [
    {
      "from": "0x...",
      "to": "0x...",
      "value": "1000000",
      "token": {
        "symbol": "USDC",
        "name": "USD Coin",
        "address": "0x..."
      }
    }
  ],
  "chainId": 1,
  "txHash": "0x..."
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Deployment

Deployed automatically on Railway alongside the frontend.

Environment variables required:
- `ETHERSCAN_API_KEY` - Your Etherscan API key
- `PORT` - Server port (default: 3001)
