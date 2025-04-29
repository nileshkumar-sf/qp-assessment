import {Controller} from '@nestjs/common';
import {MessagePattern, Payload} from '@nestjs/microservices';
import {AuthService} from './auth.service';
import {MessagePatterns} from '@grocery-booking-api/shared';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(MessagePatterns.AUTH_REGISTER)
  async register(@Payload() data: {email: string; password: string}) {
    console.log('register', data);
    return this.authService.register(data.email, data.password);
  }

  @MessagePattern(MessagePatterns.AUTH_LOGIN)
  async login(@Payload() data: {email: string; password: string}) {
    return this.authService.login(data.email, data.password);
  }

  @MessagePattern(MessagePatterns.AUTH_VALIDATE_TOKEN)
  async validateToken(@Payload() token: string) {
    return this.authService.validateToken(token);
  }
}
