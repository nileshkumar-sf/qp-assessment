import {Injectable, CanActivate, ExecutionContext} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {ROLES_KEY} from '@grocery-booking-api/shared';
import {UserRole} from '@grocery-booking-api/shared';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true; // No roles required, allow access
    }

    const {user} = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      return false; // No user or role found, deny access
    }

    return requiredRoles.includes(user.role as UserRole);
  }
}
