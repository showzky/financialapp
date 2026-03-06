const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.unstable_enableSymlinks = true;

// ---------------------------------------------------------------------------
// Force singleton packages (react, react-native) to always resolve from the
// mobile project's node_modules, preventing duplicate copies in a monorepo
// where the root workspace may have a different React version.
// ---------------------------------------------------------------------------
const singletonPkgs = ['react', 'react-native'];

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Check if the requested module belongs to a singleton package
  for (const pkg of singletonPkgs) {
    if (moduleName === pkg || moduleName.startsWith(pkg + '/')) {
      try {
        const resolvedPath = require.resolve(moduleName, {
          paths: [path.resolve(projectRoot, 'node_modules')],
        });
        return { type: 'sourceFile', filePath: resolvedPath };
      } catch {
        // fall through to default resolution
      }
    }
  }

  // Default resolution
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
