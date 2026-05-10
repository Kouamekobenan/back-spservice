import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../users/domain/enums/role.enum.js';

@Injectable()
export class ShopAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Le SUPER_ADMIN a accès à tout par définition
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Récupérer le shopId depuis la requête (Priorité: Body > Query > Params)
    const shopId = request.body.shopId || request.query.shopId || request.params.shopId;

    // Si aucun shopId n'est fourni, on laisse passer (la validation DTO s'en chargera si nécessaire)
    // ou on peut décider de bloquer si le shopId est requis pour cette route.
    if (!shopId) {
      return true;
    }

    // Vérifier si le shopId demandé est dans la liste des accès autorisés
    const hasAccess = user.shopAccesses && user.shopAccesses.includes(shopId);

    if (!hasAccess) {
      throw new ForbiddenException(`Vous n'avez pas accès aux données de la boutique ${shopId}`);
    }

    return true;
  }
}
