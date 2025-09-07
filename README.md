# Bento TypeScript SDK

A type-safe TypeScript SDK for [Bento](https://bentonow.com) - powerful analytics and email marketing for modern web applications.

## Features

- 🎯 **Simple event tracking**: Track user behavior and custom events
- 👤 **Visitor identification**: Associate events with specific users
- 📊 **Custom fields**: Store and update additional user data
- 💰 **Purchase tracking**: Monitor purchases and calculate LTV
- 💬 **Chat integration**: Control Bento's chat functionality
- 🔍 **Spam checking**: Validate email addresses
- 🌐 **Subdomain tracking**: Track across multiple subdomains

## Installation

```bash
npm install bento-ts
# or
yarn add bento-ts
# or
pnpm add bento-ts
```

## Quick Start

```typescript
// Named import
import bento from 'bento-ts';

// OR default import (recommended)
import Bento from 'bento-ts';

// Initialize Bento with your site UUID
// No need to await - methods are automatically queued until ready!
Bento.init({
  siteUuid: 'YOUR_SITE_UUID',
});

// These calls are queued and executed once Bento is ready
Bento.view();
Bento.identify('user@example.com');
Bento.track('button_clicked', {
  button_name: 'Subscribe',
  page: 'landing',
});

// Only await if you need to ensure Bento is loaded before continuing
const api = await Bento.init({ siteUuid: 'YOUR_SITE_UUID' });
```

## Configuration

### Simple Installation (Default)

```typescript
bento.init({
  siteUuid: 'YOUR_SITE_UUID',
});
```

### Advanced Installation

```typescript
bento.init({
  siteUuid: 'YOUR_SITE_UUID',
  useAdvancedInstallation: true, // Uses the .js file instead of fast loader
});
```

### Custom Script Source

```typescript
bento.init({
  siteUuid: 'YOUR_SITE_UUID',
  scriptSrc: 'https://custom.bentonow.com', // For self-hosted instances
});
```

## API Reference

### Visitor Identification

```typescript
// Identify a visitor by email
bento.identify('user@example.com');
```

### Custom Fields

```typescript
// Update visitor's custom fields
bento.updateFields({
  first_name: 'John',
  last_name: 'Doe',
  plan_type: 'premium',
  signup_date: '2024-01-15',
});
```

### Event Tracking

```typescript
// Track a simple event
bento.track('feature_used');

// Track an event with data
bento.track('video_played', {
  video_id: '12345',
  duration: 120,
  title: 'Getting Started',
});

// Track a purchase
bento.track('purchase', {
  unique: {
    key: 'ORDER-12345', // Prevents duplicate tracking
  },
  value: {
    currency: 'USD',
    amount: 9900, // in cents
  },
  cart: {
    items: [
      {
        product_name: 'Premium Plan',
        product_id: 'plan_premium',
        quantity: 1,
        price: 9900,
      },
    ],
  },
});
```

### Tagging

```typescript
// Add a tag to the current visitor
bento.tag('newsletter_subscriber');
bento.tag('webinar_attendee');
```

### Chat Integration

```typescript
// Control chat visibility
bento.showChat();
bento.hideChat();

// Control chat window
bento.openChat();
bento.closeChat();

// Set user for chat
import { getBentoChat } from 'bento-ts';

window.addEventListener('bentochat:ready', () => {
  const chat = getBentoChat();
  if (chat) {
    chat.setUser('user123', {
      email: 'user@example.com',
      name: 'John Doe',
      phone_number: '+1234567890',
    });
  }
});
```

### Utility Functions

```typescript
// Get visitor's email (if identified)
const email = bento.getEmail();

// Check if an email is spam
const isSpam = await bento.spamCheck('test@example.com');
if (isSpam) {
  console.log('This email appears to be spam');
}

// Track across subdomains (beta)
bento.trackSubdomains(['app.example.com', 'www.example.com']);
```

## TypeScript Support

This SDK is written in TypeScript and provides full type definitions:

```typescript
import type { 
  BentoConfig, 
  BentoCustomFields, 
  BentoEventData,
  BentoPurchaseEvent,
  BentoChatUser 
} from 'bento-ts';

// All methods are fully typed
const fields: BentoCustomFields = {
  plan: 'premium',
  credits: 100,
  active: true,
};

bento.updateFields(fields);
```

## Events

The SDK emits the following events:

- `bento:ready` - Fired when the Bento SDK is fully loaded
- `bentochat:ready` - Fired when the Bento chat widget is ready

```typescript
window.addEventListener('bento:ready', () => {
  console.log('Bento is ready!');
  // Now all Bento methods are available
});
```

## Server-Side Rendering (SSR)

The SDK includes SSR guards and will safely return no-op functions when `window` is undefined:

```typescript
// Safe to use in SSR environments
import bento from 'bento-ts';

// This won't throw errors during SSR
bento.track('event_name');
```

## Best Practices

1. **Initialize early**: Call `bento.init()` as early as possible in your app
2. **No need to await init**: The SDK automatically queues method calls until ready
3. **Update fields before tracking**: Always update custom fields before tracking events
4. **Use unique keys for purchases**: Prevent duplicate purchase tracking with unique keys
5. **Handle async methods**: Only `spamCheck` returns a promise that needs awaiting
6. **Listen for ready events**: Only needed for advanced use cases (like accessing `window.bento` directly)

## Example: Complete Integration

```typescript
import { bento, getBentoChat } from 'bento-ts';

// Initialize Bento early - no await needed!
bento.init({
  siteUuid: 'your-site-uuid',
});

// All these calls are automatically queued until Bento is ready
bento.view();

// Identify user if logged in
const user = getCurrentUser();
if (user) {
  bento.identify(user.email);
  bento.updateFields({
    first_name: user.firstName,
    last_name: user.lastName,
    account_type: user.accountType,
  });
}

// Track form submission
document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
  const email = (e.target as HTMLFormElement).email.value;
  
  // spamCheck is the only method that returns a promise
  const isSpam = await bento.spamCheck(email);
  if (!isSpam) {
    bento.track('signup_form_submitted', { email });
    bento.tag('lead');
  }
});

// Setup chat when ready (only if you need the chat API directly)
window.addEventListener('bentochat:ready', () => {
  const chat = getBentoChat();
  if (chat && user) {
    chat.setUser(user.id, {
      email: user.email,
      name: user.fullName,
    });
  }
});
```

## License

MIT

## Support

- 📧 Email: support@bentonow.com
- 💬 Discord: [Join our community](https://discord.gg/ssXXFRmt5F)
- 📚 Documentation: [docs.bentonow.com](https://docs.bentonow.com)