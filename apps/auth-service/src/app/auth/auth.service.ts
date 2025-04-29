import {Injectable, Inject, UnauthorizedException} from '@nestjs/common';
import {JwtPayloadDto} from '@grocery-booking-api/shared';
import {ClientProxy} from '@nestjs/microservices';
import {JwtService} from '@nestjs/jwt';
import {RedisService} from '@grocery-booking-api/shared';
import * as bcrypt from 'bcrypt';
import {MessagePatterns} from '@grocery-booking-api/shared';
import {lastValueFrom} from 'rxjs';

interface TokenValidationResponse {
  userId: string;
  email: string;
  role: string;
  isValid: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async register(email: string, password: string) {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user through user service
    return lastValueFrom(
      this.userClient.send(MessagePatterns.USER_CREATE, {
        email,
        password: hashedPassword,
        role: 'USER',
      }),
    );
  }

  async login(email: string, password: string) {
    // Get user through user service
    const user = await lastValueFrom(
      this.userClient.send(MessagePatterns.USER_GET, {email}),
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {token};
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const payload = this.jwtService.verify(token);
      return !!payload;
    } catch (error) {
      return false;
    }
  }

  async validateUser(payload: JwtPayloadDto) {
    return lastValueFrom(
      this.userClient.send(MessagePatterns.USER_GET, {email: payload.email}),
    );
  }

  async logout(userId: string): Promise<void> {
    // Invalidate token in Redis
    await this.redisService.del(`token:${userId}`);
  }
}
