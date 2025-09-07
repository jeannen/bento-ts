/**
 * Example: Using HEYO's dynamic configuration feature
 * This shows how to use different widget configurations on different pages
 */

import { HEYO, loadHeyo } from '@heyo/js';
import type { HeyoWidgetSettings } from '@heyo/js';

// Initialize HEYO with your project ID
async function initializeHeyo() {
    await loadHeyo({
        projectId: 'your-project-id-here',
        hidden: false // Show widget by default
    });

    // Wait for the widget to be ready
    const checkReady = setInterval(() => {
        if (HEYO.ready) {
            clearInterval(checkReady);
            configureForCurrentPage();
        }
    }, 100);
}

// Configure widget based on current page
function configureForCurrentPage() {
    const path = window.location.pathname;
    
    // Landing page: Show as agent card to build trust
    if (path === '/' || path === '/home') {
        const landingConfig: HeyoWidgetSettings = {
            widgetStyle: 'agent-card',
            widgetPosition: 'right',
            widgetSize: 'medium',
            widgetColor: '#10b981' // Green for welcoming feel
        };
        HEYO.configure(landingConfig);
    }
    
    // Dashboard: Minimal bubble to save space
    else if (path.includes('/dashboard')) {
        const dashboardConfig: HeyoWidgetSettings = {
            widgetStyle: 'bubble',
            widgetPosition: 'right',
            widgetSize: 'small',
            widgetColor: '#6b7280' // Gray for subtle presence
        };
        HEYO.configure(dashboardConfig);
    }
    
    // Support/Help pages: Large, prominent widget
    else if (path.includes('/support') || path.includes('/help')) {
        const supportConfig: HeyoWidgetSettings = {
            widgetStyle: 'bubble',
            widgetPosition: 'right',
            widgetSize: 'large',
            widgetColor: '#ef4444' // Red for urgency/attention
        };
        HEYO.configure(supportConfig);
    }
    
    // Documentation: Left-positioned for easy access
    else if (path.includes('/docs')) {
        const docsConfig: HeyoWidgetSettings = {
            widgetStyle: 'bubble',
            widgetPosition: 'left',
            widgetSize: 'medium',
            widgetColor: '#3b82f6' // Blue for informational
        };
        HEYO.configure(docsConfig);
    }
}

// React example
export function useHeyoConfiguration() {
    useEffect(() => {
        initializeHeyo();
        
        // Reconfigure on route changes
        const handleRouteChange = () => {
            if (HEYO.ready) {
                configureForCurrentPage();
            }
        };
        
        // Listen for route changes (example for React Router)
        window.addEventListener('popstate', handleRouteChange);
        
        return () => {
            window.removeEventListener('popstate', handleRouteChange);
        };
    }, []);
}

// Vue 3 example
export function setupHeyoConfiguration() {
    const route = useRoute();
    
    onMounted(async () => {
        await initializeHeyo();
    });
    
    watch(() => route.path, () => {
        if (HEYO.ready) {
            configureForCurrentPage();
        }
    });
}

// Vanilla JavaScript example
document.addEventListener('DOMContentLoaded', () => {
    initializeHeyo();
    
    // For SPAs, listen to custom navigation events
    document.addEventListener('app:navigation', () => {
        if (HEYO.ready) {
            configureForCurrentPage();
        }
    });
});

// Dynamic configuration based on user preferences
export function configureBasedOnUserPreferences(isDarkMode: boolean, isCompactView: boolean) {
    const config: HeyoWidgetSettings = {
        widgetStyle: isCompactView ? 'bubble' : 'agent-card',
        widgetSize: isCompactView ? 'small' : 'medium',
        widgetColor: isDarkMode ? '#374151' : '#10b981',
        widgetPosition: 'right'
    };
    
    HEYO.configure(config);
}

// A/B testing example
export function configureForABTest(variant: 'A' | 'B') {
    const configs: Record<string, HeyoWidgetSettings> = {
        A: {
            widgetStyle: 'bubble',
            widgetSize: 'medium',
            widgetColor: '#3b82f6'
        },
        B: {
            widgetStyle: 'agent-card',
            widgetSize: 'small',
            widgetColor: '#10b981'
        }
    };
    
    HEYO.configure(configs[variant]);
}
