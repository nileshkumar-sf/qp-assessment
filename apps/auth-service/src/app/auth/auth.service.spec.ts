import {Test, TestingModule} from '@nestjs/testing';
import {AuthService} from './auth.service';
import {JwtService} from '@nestjs/jwt';
import {RedisService} from '@grocery-booking-api/shared';
import {UserService} from '@grocery-booking-api/user-service';
import {LoginDto} from './dto/login.dto';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let redisService: RedisService;
  let userService: UserService;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockRedisService = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  const mockUserService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    redisService = module.get<RedisService>(RedisService);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return access token and user data on successful login', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: 1,
        email: loginDto.email,
        password: '$2b$10$hashedpassword',
      };

      const token = 'jwt-token';

      mockUserService.findOne.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue(token);
      mockRedisService.set.mockResolvedValue('OK');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
        },
      });
      expect(mockUserService.findOne).toHaveBeenCalledWith({
        email: loginDto.email,
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({sub: user.id});
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `token:${token}`,
        JSON.stringify({userId: user.id}),
      );
    });

    it('should throw error if user not found', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserService.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('validateToken', () => {
    it('should return user data if token is valid', async () => {
      const token = 'valid-token';
      const payload = {sub: 1};
      const user = {
        id: 1,
        email: 'test@example.com',
      };

      mockJwtService.verify.mockReturnValue(payload);
      mockUserService.findOne.mockResolvedValue(user);

      const result = await service.validateToken(token);

      expect(result).toEqual(user);
      expect(mockJwtService.verify).toHaveBeenCalledWith(token);
      expect(mockUserService.findOne).toHaveBeenCalledWith(payload.sub);
    });

    it('should throw error if token is invalid', async () => {
      const token = 'invalid-token';

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.validateToken(token)).rejects.toThrow(
        'Invalid token',
      );
    });
  });

  describe('logout', () => {
    it('should remove token from Redis', async () => {
      const token = 'valid-token';

      mockRedisService.del.mockResolvedValue(1);

      await service.logout(token);

      expect(mockRedisService.del).toHaveBeenCalledWith(`token:${token}`);
    });
  });
});
