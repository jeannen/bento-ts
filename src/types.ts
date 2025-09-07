export type BentoConfig = {
	/**
	 * Your Bento site UUID (required).
	 * You can find this in your Bento dashboard.
	 * 
	 * @example
	 * { siteUuid: '12345678-1234-1234-1234-123456789012' }
	 */
	siteUuid: string;
	
	/**
	 * Use a different URL to load the script.
	 * Defaults to "https://fast.bentonow.com".
	 * Useful for self-hosted Bento instances.
	 * 
	 * @example
	 * { scriptSrc: 'https://custom.bentonow.com' }
	 */
	scriptSrc?: string;
	
	/**
	 * Use the advanced installation method with the JS file instead of the fast loader.
	 * When true, loads from https://app.bentonow.com/{siteUuid}.js
	 * and automatically calls bento.view() after loading.
	 * 
	 * @default false
	 * @example
	 * { useAdvancedInstallation: true }
	 */
	useAdvancedInstallation?: boolean;
};

/**
 * Custom fields that can be attached to a visitor.
 * Used to store additional information about your users.
 * 
 * @example
 * const fields: BentoCustomFields = {
 *   first_name: 'John',
 *   last_name: 'Doe',
 *   company_size: 50,
 *   is_premium: true,
 *   signup_date: '2024-01-15',
 *   monthly_revenue: 5000,
 *   preferred_language: 'en'
 * };
 */
export type BentoCustomFields = {
	[key: string]: string | number | boolean | null;
};

/**
 * Generic event data that can be sent with track() calls.
 * Can contain any JSON-serializable data.
 * 
 * @example
 * const eventData: BentoEventData = {
 *   button_text: 'Get Started',
 *   page_url: '/pricing',
 *   user_plan: 'free',
 *   feature_flags: ['new_ui', 'dark_mode']
 * };
 */
export type BentoEventData = {
	[key: string]: any;
};

/**
 * Special event data structure for tracking purchases.
 * Used with bento.track('purchase', purchaseData).
 * 
 * @example
 * const purchase: BentoPurchaseEvent = {
 *   unique: {
 *     key: 'ORDER-12345' // Prevents duplicate tracking
 *   },
 *   value: {
 *     currency: 'USD',
 *     amount: 9900 // Amount in cents
 *   },
 *   cart: {
 *     items: [{
 *       product_name: 'Premium Subscription',
 *       product_id: 'sub_premium_monthly',
 *       quantity: 1,
 *       price: 9900
 *     }]
 *   }
 * };
 * 
 * bento.track('purchase', purchase);
 */
export type BentoPurchaseEvent = {
	/** Unique identifier to prevent duplicate purchase tracking */
	unique: {
		/** A unique key for this purchase (e.g., order ID, invoice number) */
		key: string;
	};
	/** The monetary value of the purchase */
	value: {
		/** Three-letter ISO currency code (e.g., 'USD', 'EUR') */
		currency: string;
		/** Amount in cents (e.g., 9900 for $99.00) */
		amount: number;
	};
	/** Optional cart details for the purchase */
	cart?: {
		/** Array of items in the purchase */
		items: Array<{
			/** Human-readable product name */
			product_name: string;
			/** Unique product identifier */
			product_id: string;
			/** Number of units purchased */
			quantity: number;
			/** Price per unit in cents */
			price: number;
		}>;
	};
};

/**
 * User data for the chat widget.
 * Used with $bentoChat.setUser() to identify chat users.
 * 
 * @example
 * const chatUser: BentoChatUser = {
 *   email: 'john@example.com',
 *   name: 'John Doe',
 *   phone_number: '+1 (555) 123-4567'
 * };
 */
export type BentoChatUser = {
	/** The user's email address */
	email?: string;
	/** The user's full name */
	name?: string;
	/** The user's phone number (include country code) */
	phone_number?: string;
};

export type BentoAPI = {
	/**
	 * Identify a visitor by email.
	 * Associates all previous and future events from this device with the provided email.
	 * 
	 * @example
	 * // Simple identification
	 * bento.identify('user@example.com');
	 */
	identify(email: string): void;
	
	/**
	 * Update visitor's custom fields.
	 * Should be called before tracking events or page views.
	 * 
	 * @example
	 * // Update user information
	 * bento.updateFields({
	 *   first_name: 'John',
	 *   last_name: 'Doe',
	 *   plan_type: 'premium',
	 *   company_size: 50
	 * });
	 */
	updateFields(fields: BentoCustomFields): void;
	
	/**
	 * Track a custom event with optional data.
	 * @param eventName - The name of the event to track
	 * @param data - Optional data associated with the event
	 * 
	 * @example
	 * // Simple event
	 * bento.track('button_clicked');
	 * 
	 * @example
	 * // Event with data
	 * bento.track('signup_completed', {
	 *   plan: 'premium',
	 *   referral_source: 'google'
	 * });
	 * 
	 * @example
	 * // Track a purchase
	 * bento.track('purchase', {
	 *   unique: { key: 'ORDER-123' },
	 *   value: { currency: 'USD', amount: 9900 },
	 *   cart: {
	 *     items: [{
	 *       product_name: 'Premium Plan',
	 *       product_id: 'plan_premium',
	 *       quantity: 1,
	 *       price: 9900
	 *     }]
	 *   }
	 * });
	 */
	track(eventName: string, data?: BentoEventData | BentoPurchaseEvent): void;
	
	/**
	 * Add a tag to the current visitor for segmentation.
	 * 
	 * @example
	 * bento.tag('premium_customer');
	 * bento.tag('newsletter_subscriber');
	 * bento.tag('webinar_attendee');
	 */
	tag(tagName: string): void;
	
	/**
	 * Track a page view. Call this on each page navigation.
	 * 
	 * @example
	 * // Track page view on route change
	 * bento.view();
	 */
	view(): void;
	
	/**
	 * Show the Bento chat widget if it was hidden.
	 * 
	 * @example
	 * // Show chat for logged-in users
	 * if (user.isLoggedIn) {
	 *   bento.showChat();
	 * }
	 */
	showChat(): void;
	
	/**
	 * Hide the Bento chat widget from the page.
	 * 
	 * @example
	 * // Hide chat on specific pages
	 * if (page === 'checkout') {
	 *   bento.hideChat();
	 * }
	 */
	hideChat(): void;
	
	/**
	 * Open the Bento chat window programmatically.
	 * 
	 * @example
	 * // Open chat when user clicks support button
	 * document.getElementById('support-btn').onclick = () => {
	 *   bento.openChat();
	 * };
	 */
	openChat(): void;
	
	/**
	 * Close the Bento chat window.
	 * 
	 * @example
	 * bento.closeChat();
	 */
	closeChat(): void;
	
	/**
	 * Get the visitor's email if they have been identified.
	 * @returns The visitor's email or undefined if not identified
	 * 
	 * @example
	 * const email = bento.getEmail();
	 * if (email) {
	 *   console.log('User identified as:', email);
	 * }
	 */
	getEmail(): string | undefined;
	
	/**
	 * Check if an email address is likely spam.
	 * This is the only async method that returns a promise.
	 * 
	 * @param email - The email address to check
	 * @returns Promise resolving to true if spam, false otherwise
	 * 
	 * @example
	 * const email = 'test@example.com';
	 * const isSpam = await bento.spamCheck(email);
	 * if (isSpam) {
	 *   alert('Please use a valid email address');
	 * }
	 */
	spamCheck(email: string): Promise<boolean>;
	
	/**
	 * Track visitors across multiple subdomains (beta feature).
	 * This ensures visitor identity persists across your subdomains.
	 * 
	 * @param domains - Array of domains to track across
	 * 
	 * @example
	 * // Track across app and marketing site
	 * bento.trackSubdomains([
	 *   'example.com',
	 *   'app.example.com',
	 *   'www.example.com'
	 * ]);
	 */
	trackSubdomains(domains: string[]): void;
};

export type BentoChatAPI = {
	/**
	 * Set the user for chat functionality.
	 * Only available after 'bentochat:ready' event fires.
	 * 
	 * @param userId - The user's ID
	 * @param userData - Additional user data
	 * 
	 * @example
	 * import { getBentoChat } from 'bento-ts';
	 * 
	 * window.addEventListener('bentochat:ready', () => {
	 *   const chat = getBentoChat();
	 *   if (chat) {
	 *     chat.setUser('user123', {
	 *       email: 'user@example.com',
	 *       name: 'John Doe',
	 *       phone_number: '+1234567890'
	 *     });
	 *   }
	 * });
	 */
	setUser(userId: string, userData?: BentoChatUser): void;
};

export type BentoGlobal = BentoAPI & {
	/**
	 * Initialize and load the Bento script.
	 * No need to await - all methods are automatically queued until ready.
	 * 
	 * @param config - Configuration object with your site UUID
	 * @returns Promise that resolves when Bento is loaded (optional to await)
	 * 
	 * @example
	 * // Simple usage - no await needed!
	 * import Bento from 'bento-ts';
	 * 
	 * Bento.init({ siteUuid: 'YOUR_SITE_UUID' });
	 * Bento.view();
	 * Bento.identify('user@example.com');
	 * 
	 * @example
	 * // Advanced installation
	 * Bento.init({
	 *   siteUuid: 'YOUR_SITE_UUID',
	 *   useAdvancedInstallation: true
	 * });
	 * 
	 * @example
	 * // Only await if you need to know when loaded
	 * await Bento.init({ siteUuid: 'YOUR_SITE_UUID' });
	 * console.log('Bento is now loaded!');
	 */
	init(config: BentoConfig): Promise<BentoAPI>;
};

// -- internal ---------------------------------------------------------
declare global {
	interface Window {
		bento?: BentoAPI;
		bento$?: (callback: () => void) => void;
		$bentoChat?: BentoChatAPI;
	}
	
	// Custom events
	interface WindowEventMap {
		'bento:ready': CustomEvent;
		'bentochat:ready': CustomEvent;
	}
}
