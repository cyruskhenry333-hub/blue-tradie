import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Authentication middleware
  async function requireAuth(req: any, res: any, next: any) {
    try {
      // Import auth service dynamically
      const { authService } = await import('./services/auth-service');
      
      // Check for session cookie
      const cookieName = authService.getSessionCookieName();
      const sessionId = req.cookies[cookieName];
      
      if (sessionId) {
        const session = await authService.getValidSession(sessionId);
        if (session) {
          req.user = { id: session.userId };
          return next();
        }
      }
      
      // Check if user is in demo mode (existing demo system)
      if (req.session?.mode === 'demo' && req.session?.testUser) {
        return next();
      }
      
      // If no authentication, redirect to login
      return res.redirect('/login');
      
    } catch (error) {
      console.error('[AUTH] Authentication check failed:', error);
      return res.redirect('/login');
    }
  }
  
  // Protected routes requiring authentication
  const protectedRoutes = ['/dashboard', '/welcome', '/profile', '/settings', '/invoices', '/ai-advisors'];
  
  protectedRoutes.forEach(route => {
    app.get(route, requireAuth, (req: any, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  });

  // fall through to index.html if the file doesn't exist (for public routes)
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
