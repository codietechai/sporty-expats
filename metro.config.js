const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// The vendor package is installed as a symlink on Linux (EAS).
// We point directly at the real path so Metro can hash the files.
const vendorRoot = path.resolve(__dirname, "vendor/@sparkstrand/chat-api-client");
const sparkstrandRoot = path.resolve(__dirname, "node_modules/@sparkstrand/chat-api-client");

// Tell Metro to watch the vendor folder directly (handles symlink case on Linux)
config.watchFolders = [
    ...(config.watchFolders || []),
    vendorRoot,
];

const SUBPATH_MAP = {
    "@sparkstrand/chat-api-client/v2/frontend": path.resolve(vendorRoot, "dist/v2/frontend/index.js"),
    "@sparkstrand/chat-api-client/v2/types": path.resolve(vendorRoot, "dist/v2/types/index.js"),
    "@sparkstrand/chat-api-client/v2/backend": path.resolve(vendorRoot, "dist/v2/backend/index.js"),
    "@sparkstrand/chat-api-client/v2/hooks": path.resolve(vendorRoot, "dist/v2/hooks/index.js"),
    "@sparkstrand/chat-api-client/v2/context": path.resolve(vendorRoot, "dist/v2/context/index.js"),
    "@sparkstrand/chat-api-client/frontend": path.resolve(vendorRoot, "dist/frontend/index.js"),
    "@sparkstrand/chat-api-client/types": path.resolve(vendorRoot, "dist/types/index.js"),
    "@sparkstrand/chat-api-client/hooks": path.resolve(vendorRoot, "dist/hooks/index.js"),
    "@sparkstrand/chat-api-client/context": path.resolve(vendorRoot, "dist/context/index.js"),
    "socket.io-client": path.resolve(__dirname, "node_modules/socket.io-client/build/esm/index.js"),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (SUBPATH_MAP[moduleName]) {
        return { filePath: SUBPATH_MAP[moduleName], type: "sourceFile" };
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
