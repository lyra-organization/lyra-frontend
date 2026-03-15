const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Prevent Metro from bundling Node.js "ws" module —
// React Native has a built-in WebSocket global that Supabase Realtime uses automatically.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'ws') {
    return { type: 'empty' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
