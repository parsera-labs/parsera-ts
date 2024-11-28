# Parsera SDK

Official TypeScript SDK for Parsera API - Extract structured data from any webpage.

## Installation

```bash
npm install parsera-sdk
```

1. Visit [parsera.org](https://parsera.org) to get your API key with 20 free credits
2. Follow the installation and usage instructions below

## Basic Usage

```typescript
import { Parsera } from 'parsera-sdk';

// Initialize the client
const parsera = new Parsera({
    apiKey: 'your-api-key',
    timeout: 60000, // 60 second timeout
    retryOptions: {
        maxRetries: 3,
        backoffFactor: 2,
        initialDelay: 1000,
    }
});

// Extract data from a webpage
const data = await parsera.extract({
    url: 'https://example.com/products',
    attributes: {
        title: 'Extract the product title',
        price: 'Get the product price',
        description: 'Extract the product description'
    }
});
```

## Features

- 🚀 Simple and intuitive API
- 🔄 Automatic retries with exponential backoff
- 🌍 Global proxy support
- 🍪 Cookie injection
- 📊 Event-driven architecture
- 🎯 Precision mode for accurate extractions
- ✨ TypeScript support with full type definitions

## Advanced Features

### Precision Mode

Precision mode provides higher accuracy extractions at the cost of additional credits (10 credits per extraction instead of 1).

```typescript
const data = await parsera.extract({
    url: 'https://example.com/products',
    attributes: {
        title: 'Extract the product title',
        price: 'Get the product price'
    },
    precisionMode: true // Enable precision mode (10 credits)
});
```

### Cookie Injection

Inject custom cookies for authenticated page access or specific site configurations:

```typescript
const data = await parsera.extract({
    url: 'https://example.com/private-page',
    attributes: {
        content: 'Extract protected content'
    },
    cookies: [
        {
            name: 'sessionId',
            value: 'abc123',
            domain: '.example.com',
            path: '/',
            sameSite: 'Lax'
        },
        {
            name: 'preferences',
            value: 'theme=dark',
            domain: '.example.com',
            path: '/',
            sameSite: 'Strict'
        }
    ]
});
```

### Proxy Configuration

Configure global or per-request proxy locations:

```typescript
// Global proxy configuration
const parsera = new Parsera({
    apiKey: 'your-api-key',
    defaultProxyCountry: 'UnitedStates'
});

// Per-request proxy override
const data = await parsera.extract({
    url: 'https://example.co.uk/products',
    attributes: {
        price: 'Get the local price'
    },
    proxyCountry: 'random' // Override for this request only
});
```

### Event Handling

The SDK provides comprehensive event handling for monitoring extraction progress:

```typescript
// Monitor extraction progress
parsera.on('extract:start', (event) => {
    console.log(`Starting extraction for ${event.url}`);
});

parsera.on('extract:complete', (event) => {
    console.log(`Extraction completed with ${event.data.length} items`);
});

// Monitor request lifecycle
parsera.on('request:start', (event) => {
    console.log(`API request started: ${event.method} ${event.url}`);
});

parsera.on('request:retry', (event) => {
    console.log(`Retrying request (attempt ${event.retryCount})`);
});

parsera.on('rateLimit', (event) => {
    console.log(`Rate limit hit. Reset in ${event.resetTime} seconds`);
});
```

### Request Cancellation

Cancel ongoing requests using AbortController:

```typescript
const controller = new AbortController();

try {
    const data = await parsera.extract({
        url: 'https://example.com/products',
        attributes: {
            title: 'Extract the product title'
        },
        signal: controller.signal
    });
} catch (error) {
    if (error.name === 'AbortError') {
        console.log('Request was cancelled');
    }
}

// Cancel the request
controller.abort();
```

## API Reference

### Constructor Options

```typescript
interface ParseraOptions {
    apiKey: string;                // Your Parsera API key
    baseUrl?: string;             // Custom API endpoint (optional)
    defaultProxyCountry?: string; // Default proxy location
    timeout?: number;             // Request timeout in ms
    retryOptions?: {              // Retry configuration
        maxRetries?: number;      // Maximum retry attempts
        backoffFactor?: number;   // Exponential backoff multiplier
        initialDelay?: number;    // Initial retry delay in ms
    }
}
```

### Extract Options

```typescript
interface ExtractOptions {
    url: string;                  // Target webpage URL
    attributes: {                 // Data to extract
        [key: string]: string;    // Key: attribute name, Value: extraction instruction
    };
    proxyCountry?: string;       // Override default proxy
    cookies?: {                  // Custom cookies
        name: string;            // Cookie name
        value: string;           // Cookie value
        domain: string;          // Cookie domain
        path?: string;           // Cookie path
        sameSite: "None" | "Lax" | "Strict";
        secure?: boolean;        // Require HTTPS
        httpOnly?: boolean;      // Accessible via HTTP only
    }[];
    precisionMode?: boolean;     // Enable precision mode (10 credits)
    signal?: AbortSignal;        // For request cancellation
}
```

### Events

The SDK emits the following events:

| Event | Description | Data |
|-------|-------------|------|
| `extract:start` | Extraction begins | `{ url: string }` |
| `extract:complete` | Extraction completes | `{ data: any[], url: string }` |
| `extract:error` | Extraction fails | `{ error: Error, url: string }` |
| `request:start` | API request begins | `{ method: string, url: string }` |
| `request:end` | API request completes | `{ method: string, url: string, duration: number }` |
| `request:retry` | Request retry attempt | `{ retryCount: number, error: Error }` |
| `request:error` | Request fails | `{ error: Error }` |
| `rateLimit` | Rate limit reached | `{ resetTime: number }` |
| `timeout` | Request timeout | `{ timeout: number }` |

## Error Handling

```typescript
try {
    const data = await parsera.extract({
        url: 'https://example.com/products',
        attributes: {
            title: 'Extract the product title'
        }
    });
} catch (error) {
    if (error instanceof ParseraRateLimitError) {
        console.log(`Rate limit exceeded. Reset in ${error.resetTime} seconds`);
    } else if (error instanceof ParseraTimeoutError) {
        console.log('Request timed out');
    } else if (error instanceof ParseraAPIError) {
        console.log(`API error: ${error.message}`);
    }
}
```

## Credits Usage

- Standard extraction: 1 credit per request
- Precision mode: 10 credits per request
- Failed requests: No credits charged
- Retried requests: Counted as single request

## License

MIT
