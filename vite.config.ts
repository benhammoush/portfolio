/**
 * Loopback-only SPA development and local build preview; not a deployment server.
 * @packageDocumentation
 */
import react from '@vitejs/plugin-react';
import { statSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { defineConfig, type PreviewServer } from 'vite';

/**
 * Reject missing asset requests before Vite's preview SPA fallback can return HTML.
 * @param server - The local preview server and resolved static build directory.
 */
function configurePreviewAssetErrors(server: PreviewServer): void {
  const outputDirectory = resolve(
    server.config.root,
    server.config.build.outDir,
  );

  /**
   * Pass existing files and extensionless app routes through, but never fake an asset.
   * @param request - The local HTTP request; paths are decoded and contained to output.
   * @param response - The response used for invalid paths or genuinely missing files.
   * @param next - Continue to Vite's static serving and SPA route handling.
   */
  function rejectMissingAssets(
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ): void {
    let pathname: string;
    try {
      pathname = decodeURIComponent(
        new URL(request.url ?? '/', 'http://127.0.0.1').pathname,
      );
      // Filesystem APIs reject NUL paths; classify them before statSync can throw.
      if (pathname.includes('\0')) {
        throw new URIError('Invalid request path.');
      }
    } catch {
      response.statusCode = 400;
      response.setHeader('Content-Type', 'text/plain; charset=utf-8');
      response.end('Invalid request path.');
      return;
    }
    // Built assets and file-like URLs are not client routes. Future hosted rewrites
    // must implement this distinction separately; this hook is local preview only.
    if (!pathname.startsWith('/assets/') && !/\.[^/]+$/.test(pathname)) {
      next();
      return;
    }
    const file = resolve(outputDirectory, `.${pathname}`);
    const pathFromOutput = relative(outputDirectory, file);
    const escapesOutput =
      pathFromOutput === '..' ||
      pathFromOutput.startsWith(`..${sep}`) ||
      isAbsolute(pathFromOutput);
    if (escapesOutput || !statSync(file, { throwIfNoEntry: false })?.isFile()) {
      response.statusCode = 404;
      response.setHeader('Content-Type', 'text/plain; charset=utf-8');
      response.end('Asset not found.');
      return;
    }
    next();
  }

  server.middlewares.use(rejectMissingAssets);
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'preview-asset-errors',
      configurePreviewServer: configurePreviewAssetErrors,
    },
  ],
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
});
