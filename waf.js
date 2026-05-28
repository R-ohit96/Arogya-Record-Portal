import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const app = express();
const WAF_PORT = 8080;
const TARGET_URL = 'http://localhost:5173'; // Pointing to your React Frontend

// 1. HELMET - Adds HTTP Security Headers (prevents Clickjacking, MIME sniffing, etc.)
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for local dev so Vite scripts can load
  crossOriginEmbedderPolicy: false
}));

// 2. RATE LIMITER - Prevents DDoS and Brute Force Attacks
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 120, // limit each IP to 120 requests per minute
  message: '🚨 [FIREWALL BLOCKED] Too many requests. Possible DDoS or Bruteforce attack detected.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 3. MALICIOUS PAYLOAD SCANNER (Custom WAF Rules)
app.use((req, res, next) => {
  const url = decodeURIComponent(req.url).toLowerCase();
  // Rule 1: Block SQL Injection attempts in URL
  const sqlInjectionPattern = /union|select|insert|update|delete|drop|alter|truncate|exec|xp_cmdshell|--|;/i;
  
  // Rule 2: Block Directory Traversal (LFI attacks)
  const traversalPattern = /(\.\.\/)|(\.\.\\)/i;

  if (sqlInjectionPattern.test(url)) {
    console.error(`🛑 [WAF ALERT] SQL Injection blocked: ${req.url}`);
    return res.status(403).send('<h1>🚨 Access Denied</h1><p>Malicious SQL payload detected by Firewall.</p>');
  }

  if (traversalPattern.test(url)) {
    console.error(`🛑 [WAF ALERT] Directory Traversal blocked: ${req.url}`);
    return res.status(403).send('<h1>🚨 Access Denied</h1><p>Path Traversal detected by Firewall.</p>');
  }
  
  // Log all safe traffic for SIEM/Audit
  console.log(`✅ [WAF PASSED] ${req.method} ${req.url}`);
  next();
});

// 4. THE PROXY - Forwards safe traffic to the actual project
app.use('/', createProxyMiddleware({
  target: TARGET_URL,
  changeOrigin: true,
  ws: true, // Allow WebSockets for Vite HMR
  logLevel: 'error',
}));

app.listen(WAF_PORT, () => {
  console.log(`
===================================================
🛡️  UNIVERSAL WAF (Web Application Firewall) IS RUNNING!
🔗 Open your browser at: http://localhost:${WAF_PORT}
🎯 Securing & Forwarding traffic to: ${TARGET_URL}
===================================================
  `);
});
