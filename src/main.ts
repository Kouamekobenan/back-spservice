import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/execeptions/http.exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn']
        : ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // ─────────────────────────────────────────────
  // 2. CONFIGURATION GÉNÉRALE (port, host, préfixe)
  // ─────────────────────────────────────────────
  const configService = app.get(ConfigService);

  // Port : priorité à la variable d'env PORT, sinon valeur du config service, sinon 3000
  const port = process.env.PORT
    ? parseInt(process.env.PORT, 10)
    : configService.get<number>('PORT', 3000);

  // Host : 0.0.0.0 pour écouter sur toutes les interfaces réseau (nécessaire en Docker/prod)
  const host = '0.0.0.0';

  const apiPrefix = configService.get('API_PREFIX') || 'api/v1';

  // Application du préfixe global à TOUS les endpoints
  app.setGlobalPrefix(apiPrefix);

  // ─────────────────────────────────────────────
  // 3. CONFIGURATION CORS
  // ─────────────────────────────────────────────

  /**
   * Liste des origines autorisées en production.
   *
   * NOTES :
   * - 'file://' retiré  → les requêtes file:// n'envoient pas d'en-tête Origin,
   *   elles sont déjà gérées par le cas (!origin) ci-dessous.
   * - 'capacitor-electron://-' corrigé → l'origin réelle envoyée par Capacitor
   *   Electron est 'capacitor-electron://localhost'.
   * - 'app://.' corrigé → l'origin valide est 'app://' (sans le point final).
   */
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'https://stockpro-delta.vercel.app',
    'https://back-spservice-production.up.railway.app',
    'capacitor-electron://localhost', 
    'https://localhost',  
     'https://spservices.localhost',          
    'app://',    
     'capacitor-electron://-',                      
  ];

  if (process.env.NODE_ENV !== 'production') {
    // DÉVELOPPEMENT : CORS très permissif pour faciliter les DevTools et le hot-reload
    app.enableCors({
      origin: true, // Accepte toutes les origines
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: '*',
      exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });
  } else {
    // PRODUCTION : CORS strict, uniquement les origines listées ci-dessus
    app.enableCors({
      origin: (origin, callback) => {
        // Autorise les requêtes sans origin (ex: appels serveur-à-serveur, Postman,
        // requêtes file:// qui n'envoient pas d'en-tête Origin)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        // Bloque et log toute origine non autorisée
        console.warn(`🚫 CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Authorization',
        'Content-Type',
        'Accept',
        'Origin',
        'X-Requested-With',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers',
      ],
      exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });
  }

  // ─────────────────────────────────────────────
  // 4. MIDDLEWARE DE DEBUG CORS (dev uniquement)
  // ─────────────────────────────────────────────
  // Log chaque requête entrante avec son origine pour diagnostiquer les problèmes CORS
  if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
      console.log(
        `🔍 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`,
      );
      // Log supplémentaire pour les requêtes preflight OPTIONS
      if (req.method === 'OPTIONS') {
        console.log('🔄 Preflight request detected');
        console.log('Headers:', req.headers);
      }
      next();
    });
  }

  // ─────────────────────────────────────────────
  // 5. HELMET (sécurité des en-têtes HTTP)
  // ─────────────────────────────────────────────

  /**
   * Le tableau connectSrc de la CSP DOIT correspondre exactement à allowedOrigins
   * pour éviter que le navigateur bloque silencieusement les requêtes fetch/XHR
   * même si CORS les laisse passer.
   */
  if (process.env.NODE_ENV === 'production') {
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", ...allowedOrigins],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc:  ["'self'", "'unsafe-inline'"],
            imgSrc:    ["'self'", 'data:', 'https:'],
          },
        },
        // Autorise les navigateurs cross-origin à lire les réponses
        // (indispensable pour un frontend hébergé sur un domaine différent)
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        crossOriginOpenerPolicy:   false,
        crossOriginEmbedderPolicy: false,
      }),
    );
  } else {
    app.use(
      helmet({
        contentSecurityPolicy:     false,
        crossOriginResourcePolicy: false,
        crossOriginOpenerPolicy:   false,
        crossOriginEmbedderPolicy: false,
      }),
    );
  }

  // ─────────────────────────────────────────────
  // 6. FILTRES GLOBAUX
  // ─────────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  // ─────────────────────────────────────────────
  // 7. PROTECTION SWAGGER PAR MOT DE PASSE (Basic Auth)
  // ─────────────────────────────────────────────
  const swaggerUser = configService.get<string>('SWAGGER_USER', 'admin');
  const swaggerPassword = configService.get<string>('SWAGGER_PASSWORD', 'changeme');

  // Middleware Basic Auth appliqué UNIQUEMENT sur les routes de Swagger
  app.use(
    [
      `/${apiPrefix}/docs`,       // page HTML de Swagger UI
      `/${apiPrefix}/docs-json`,  // schéma OpenAPI au format JSON
      `/${apiPrefix}/docs-yaml`,  // schéma OpenAPI au format YAML
    ],
    (req, res, next) => {
      const authHeader = req.headers['authorization'];

      if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Swagger Docs - SP SERVICE"');
        return res.status(401).send('🔒 Accès refusé : authentification requise.');
      }

      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
      const [user, password] = credentials.split(':');

      if (user === swaggerUser && password === swaggerPassword) {
        return next(); // ✅ Accès accordé
      }

      res.setHeader('WWW-Authenticate', 'Basic realm="Swagger Docs - SP SERVICE"');
      return res.status(401).send('🔒 Identifiants incorrects.');
    },
  );

  // ─────────────────────────────────────────────
  // 8. SWAGGER (documentation interactive de l'API)
  // ─────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Api `SP SERVICE`')
    .setDescription(
      'SP SERVICE API: A robust backend for automated SUPERETE and other services.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  // ─────────────────────────────────────────────
  // 9. DÉMARRAGE DU SERVEUR
  // ─────────────────────────────────────────────
  try {
    await app.listen(port, host);

    const logger = new Logger('Bootstrap');
    logger.log(`🚀 Application running on: http://localhost:${port}/${apiPrefix}`);
    logger.log(
      `📖 Swagger documentation: http://localhost:${port}/${apiPrefix}/docs (🔒 Basic Auth activé)`,
    );
    logger.log(`📡 Listening on ${host}:${port}`);

    if (process.env.NODE_ENV !== 'production') {
      logger.log('✅ CORS: Toutes origines autorisées (dev mode)');
      logger.log('✅ Helmet: Mode minimal (dev mode)');
    } else {
      logger.log('✅ CORS enabled for:', allowedOrigins);
    }
  } catch (error) {
    const logger = new Logger('Bootstrap');
    logger.error('❌ Failed to start the server', error);
    process.exit(1);
  }
}

bootstrap();