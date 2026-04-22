const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

const sparkstrandRoot = path.resolve(
    __dirname,
    "node_modules/@sparkstrand/chat-api-client"
);

const SUBPATH_MAP = {
    "@sparkstrand/chat-api-client/v2/frontend": path.resolve(sparkstrandRoot, "dist/v2/frontend/index.js"),
    "@sparkstrand/chat-api-client/v2/types": path.resolve(sparkstrandRoot, "dist/v2/types/index.js"),
    "@sparkstrand/chat-api-client/v2/backend": path.resolve(sparkstrandRoot, "dist/v2/backend/index.js"),
    "@sparkstrand/chat-api-client/v2/hooks": path.resolve(sparkstrandRoot, "dist/v2/hooks/index.js"),
    "@sparkstrand/chat-api-client/v2/context": path.resolve(sparkstrandRoot, "dist/v2/context/index.js"),
    "@sparkstrand/chat-api-client/frontend": path.resolve(sparkstrandRoot, "dist/frontend/index.js"),
    "@sparkstrand/chat-api-client/types": path.resolve(sparkstrandRoot, "dist/types/index.js"),
    "@sparkstrand/chat-api-client/hooks": path.resolve(sparkstrandRoot, "dist/hooks/index.js"),
    "@sparkstrand/chat-api-client/context": path.resolve(sparkstrandRoot, "dist/context/index.js"),
    "socket.io-client": path.resolve(__dirname, "node_modules/socket.io-client/build/esm/index.js"),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (SUBPATH_MAP[moduleName]) {
        return { filePath: SUBPATH_MAP[moduleName], type: "sourceFile" };
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
