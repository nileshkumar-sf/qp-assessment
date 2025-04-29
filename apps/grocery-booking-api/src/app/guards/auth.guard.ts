import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';
import {Request} from 'express';
import {firstValueFrom} from 'rxjs';
import {MessagePatterns, IS_PUBLIC_KEY} from '@grocery-booking-api/shared';
import {Reflector} from '@nestjs/core';

interface TokenValidationResponse {
  userId: string;
  email: string;
  role: string;
  isValid: boolean;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const response = await firstValueFrom<TokenValidationResponse>(
        this.authClient.send(MessagePatterns.AUTH_VALIDATE_TOKEN, token),
      );

      if (!response.isValid) {
        throw new UnauthorizedException('Invalid token');
      }

      // Attach user info to request for use in controllers
      request['user'] = {
        userId: response.userId,
        email: response.email,
        role: response.role,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Failed to validate token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
