import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  session: any;
}

export function passwordGateMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Force enable password gate for immediate protection - hardcode temporarily
  const FORCE_ENABLE_GATE = true;
  const PASSWORD = "preview2024";
  
  // Skip password gate if ADMIN_PREVIEW_PASSWORD is not set (disabled)
  if (!FORCE_ENABLE_GATE && !process.env.ADMIN_PREVIEW_PASSWORD) {
    return next();
  }

  // Skip password gate for API endpoints, health checks, assets, and login routes
  if (req.path.startsWith('/api/') || 
      req.path.startsWith('/health') ||
      req.path.startsWith('/assets/') ||
      req.path.startsWith('/_vite/') ||
      req.path.endsWith('.js') ||
      req.path.endsWith('.css') ||
      req.path.endsWith('.png') ||
      req.path.endsWith('.jpg') ||
      req.path.endsWith('.ico') ||
      req.path === '/password-gate' ||
      req.path === '/login' ||
      req.path.startsWith('/auth/')) {
    return next();
  }

  // Check if user has already authenticated with password
  if (req.session?.passwordAuthenticated) {
    return next();
  }

  // Redirect to password gate page
  res.redirect('/password-gate');
}

export function handlePasswordGate(req: AuthenticatedRequest, res: Response) {
  if (req.method === 'POST') {
    const { password } = req.body;
    
    if (password === "preview2024" || password === process.env.ADMIN_PREVIEW_PASSWORD) {
      // Set secure session flag
      req.session.passwordAuthenticated = true;
      
      // Redirect to home page
      res.redirect('/');
    } else {
      // Show password page with error
      res.send(generatePasswordPage(true));
    }
  } else {
    // Show password page
    res.send(generatePasswordPage(false));
  }
}

function generatePasswordPage(hasError: boolean): string {
  const showEmailCapture = false; // Disabled for live app testing
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>Blue Tradie – Coming Soon</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
        }
        
        .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            padding: 2rem;
            width: 100%;
            max-width: 450px;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        .logo {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 1rem;
            color: #fff;
        }
        
        .coming-soon-section {
            margin-bottom: 2rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .main-title {
            font-size: 1.4rem;
            font-weight: 600;
            color: #fff;
            margin-bottom: 1rem;
            line-height: 1.3;
        }
        
        .description {
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 1.5rem;
            font-size: 1rem;
            line-height: 1.5;
        }
        
        .email-capture {
            margin-bottom: 1.5rem;
        }
        
        .email-capture h3 {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 1rem;
            font-weight: 500;
        }
        
        .email-form {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        
        .email-form input[type="email"] {
            flex: 1;
            padding: 0.75rem;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            font-size: 0.9rem;
            backdrop-filter: blur(5px);
        }
        
        .email-form input[type="email"]:focus {
            outline: none;
            border-color: rgba(255, 255, 255, 0.6);
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
        }
        
        .email-form input[type="email"]::placeholder {
            color: rgba(255, 255, 255, 0.6);
        }
        
        .email-btn {
            padding: 0.75rem 1rem;
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            color: #fff;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(5px);
            white-space: nowrap;
        }
        
        .email-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        .invite-section {
            margin-top: 2rem;
        }
        
        .invite-note {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 1rem;
            font-style: italic;
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.9);
        }
        
        input[type="password"] {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            font-size: 1rem;
            backdrop-filter: blur(5px);
            transition: all 0.3s ease;
        }
        
        input[type="password"]:focus {
            outline: none;
            border-color: rgba(255, 255, 255, 0.6);
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
        }
        
        input[type="password"]::placeholder {
            color: rgba(255, 255, 255, 0.6);
        }
        
        .submit-btn {
            width: 100%;
            padding: 0.75rem;
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            color: #fff;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(5px);
        }
        
        .submit-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-1px);
        }
        
        .submit-btn:active {
            transform: translateY(0);
        }
        
        .error {
            color: #fecaca;
            margin-top: 1rem;
            padding: 0.75rem;
            background: rgba(239, 68, 68, 0.2);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 8px;
            font-size: 0.9rem;
        }
        
        .info {
            margin-top: 2rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.4;
        }
        
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: #fff;
            font-weight: 500;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            z-index: 1000;
        }
        
        .toast.success {
            background: rgba(34, 197, 94, 0.9);
            border: 1px solid rgba(34, 197, 94, 0.3);
        }
        
        .toast.error {
            background: rgba(239, 68, 68, 0.9);
            border: 1px solid rgba(239, 68, 68, 0.3);
        }
        
        .toast.show {
            opacity: 1;
            transform: translateX(0);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🔧 Blue Tradie</div>
        
        <!-- Public Coming Soon Section -->
        <div class="coming-soon-section">
            <div class="main-title">We're putting the finishing touches on Blue Tradie</div>
            <div class="description">
                We're in private preview while we upgrade the demo and payments. Public access will open soon.
            </div>
            
            ${showEmailCapture ? `
            <div class="email-capture">
                <h3>Want a heads-up when we open?</h3>
                <div class="email-form">
                    <input 
                        type="email" 
                        id="waitlist-email" 
                        placeholder="Enter your email"
                        required
                    />
                    <button type="button" class="email-btn" onclick="submitEmail()">
                        Notify me when it's live
                    </button>
                </div>
            </div>
            ` : ''}
        </div>
        
        <!-- Invite Section -->
        <div class="invite-section">
            <div class="invite-note">If you were invited, enter your preview password below.</div>
            
            <form method="POST" action="/password-gate">
                <div class="form-group">
                    <label for="password">Access Password</label>
                    <input 
                        type="password" 
                        id="password" 
                        name="password" 
                        placeholder="Enter preview password"
                        required
                    />
                </div>
                
                <button type="submit" class="submit-btn">
                    Access Blue Tradie
                </button>
            </form>
            
            ${hasError ? '<div class="error">❌ Incorrect password. Please try again.</div>' : ''}
        </div>
    </div>
    
    <div id="toast" class="toast"></div>
    
    ${showEmailCapture ? `
    <script>
        async function submitEmail() {
            const email = document.getElementById('waitlist-email').value;
            const toast = document.getElementById('toast');
            
            if (!email || !email.includes('@')) {
                showToast('Please enter a valid email address', 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/public-notify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        email,
                        userAgent: navigator.userAgent,
                        referrer: document.referrer
                    }),
                });
                
                if (response.ok) {
                    showToast("Thanks! We'll email you when we open.", 'success');
                    document.getElementById('waitlist-email').value = '';
                } else {
                    throw new Error('Server error');
                }
            } catch (error) {
                showToast("Couldn't save that email—try again.", 'error');
            }
        }
        
        function showToast(message, type) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.className = \`toast \${type} show\`;
            
            setTimeout(() => {
                toast.className = \`toast \${type}\`;
            }, 3000);
        }
        
        // Allow Enter key to submit email
        document.getElementById('waitlist-email').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                submitEmail();
            }
        });
    </script>
    ` : ''}
</body>
</html>`;
}