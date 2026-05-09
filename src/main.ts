import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/execeptions/http.exception.filter';

async function bootstrap() {
  // ─────────────────────────────────────────────
  // 1. CRÉATION DE L'APPLICATION NEST
  // ─────────────────────────────────────────────
  // On adapte le niveau de log selon l'environnement :
  // - production : uniquement les erreurs et avertissements
  // - développement : tous les niveaux (log, debug, verbose…)
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

  // Préfixe global de l'API (ex: "api/v1")
  // Tous les endpoints seront automatiquement préfixés par cette valeur
  const apiPrefix = configService.get('API_PREFIX') || 'api/v1';

  //  FIX : application du préfixe global à TOUS les endpoints
  // Sans cette ligne, le préfixe n'était utilisé que pour Swagger mais PAS pour les routes
  app.setGlobalPrefix(apiPrefix);
  // ─────────────────────────────────────────────
  // 3. CONFIGURATION CORS
  // ─────────────────────────────────────────────
  // Liste des origines autorisées en production
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'https://stockpro-delta.vercel.app',
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
        // Autorise les requêtes sans origin (ex: appels serveur-à-serveur, Postman)
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
  if (process.env.NODE_ENV === 'production') {
    // PRODUCTION : Helmet complet avec Content Security Policy stricte
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            connectSrc: [
              "'self'",
              'http://localhost:3000',
              'http://127.0.0.1:3000',
              'https://stockpro-delta.vercel.app',
            ],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
        crossOriginEmbedderPolicy: false,
      }),
    );
  } else {
    // DÉVELOPPEMENT : Helmet minimal pour ne pas interférer avec les DevTools du navigateur
    app.use(
      helmet({
        contentSecurityPolicy: false, // Désactivé pour éviter les blocages en dev
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: false,
      }),
    );
  }

  // ─────────────────────────────────────────────
  // 6. FILTRES GLOBAUX
  // ─────────────────────────────────────────────
  // Intercepte toutes les exceptions HTTP et retourne une réponse formatée uniformément
  app.useGlobalFilters(new HttpExceptionFilter());

  // ─────────────────────────────────────────────
  // 7. PROTECTION SWAGGER PAR MOT DE PASSE (Basic Auth)
  // ─────────────────────────────────────────────
  // Le navigateur affiche une popup "login/password" avant d'accéder à la doc.
  // Les credentials sont lus depuis les variables d'environnement pour ne jamais
  // les écrire en dur dans le code source.
  //
  // 👉 Ajoute dans ton .env :
  //      SWAGGER_USER=admin
  //      SWAGGER_PASSWORD=MonSuperMotDePasse123
  //
  const swaggerUser = configService.get<string>('SWAGGER_USER', 'admin');
  const swaggerPassword = configService.get<string>(
    'SWAGGER_PASSWORD',
    'changeme',
  );

  // Middleware Basic Auth appliqué UNIQUEMENT sur les routes de Swagger
  // (la route de la doc + les assets statiques json/yaml qu'elle charge)
  app.use(
    [
      `/${apiPrefix}/docs`, // page HTML de Swagger UI
      `/${apiPrefix}/docs-json`, // schéma OpenAPI au format JSON
      `/${apiPrefix}/docs-yaml`, // schéma OpenAPI au format YAML
    ],
    (req, res, next) => {
      // L'en-tête Authorization doit être de la forme : "Basic <base64(user:password)>"
      const authHeader = req.headers['authorization'];

      if (!authHeader || !authHeader.startsWith('Basic ')) {
        // Aucun header → on demande au navigateur d'afficher la popup de connexion
        res.setHeader(
          'WWW-Authenticate',
          'Basic realm="Swagger Docs - Visa Culture"',
        );
        return res
          .status(401)
          .send('🔒 Accès refusé : authentification requise.');
      }

      // Décodage du Base64 → "user:password"
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString(
        'utf-8',
      );
      const [user, password] = credentials.split(':');

      // Vérification des credentials
      if (user === swaggerUser && password === swaggerPassword) {
        return next(); // ✅ Accès accordé
      }

      // Mauvais credentials → on redemande
      res.setHeader(
        'WWW-Authenticate',
        'Basic realm="Swagger Docs - SP SERVICE"',
      );
      return res.status(401).send('🔒 Identifiants incorrects.');
    },
  );

  // ─────────────────────────────────────────────
  // 8. SWAGGER (documentation interactive de l'API)
  // ─────────────────────────────────────────────
  // Accessible à : http://localhost:{PORT}/api/v1/docs  (après authentification)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Api `SP SERVICE`')
    .setDescription(
      'SP SERVICE API: A robust backend for automated SUPERETE  and other services.',
    )
    .setVersion('1.0.0')
    // Ajoute le support du Bearer JWT dans l'interface Swagger (bouton "Authorize")
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  // ─────────────────────────────────────────────
  // 8. DÉMARRAGE DU SERVEUR
  // ─────────────────────────────────────────────
  try {
    await app.listen(port, host);

    const logger = new Logger('Bootstrap');
    logger.log(
      `🚀 Application running on: http://localhost:${port}/${apiPrefix}`,
    );
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
    // En cas d'échec au démarrage, on log l'erreur et on stoppe le processus
    const logger = new Logger('Bootstrap');
    logger.error('❌ Failed to start the server', error);
    process.exit(1);
  }
}

bootstrap();
