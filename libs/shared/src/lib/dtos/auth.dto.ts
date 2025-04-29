import {IsEmail, IsNotEmpty, IsString, IsEnum} from 'class-validator';
import {UserRole} from '../enums';
import {ApiProperty} from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({example: 'john@example.com', description: 'User email address'})
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({example: 'password123', description: 'User password'})
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'User role',
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;
}

export class LoginDto {
  @ApiProperty({example: 'john@example.com', description: 'User email address'})
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({example: 'password123', description: 'User password'})
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class JwtPayloadDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID',
  })
  @IsString()
  sub!: string;

  @ApiProperty({example: 'john@example.com', description: 'User email address'})
  @IsEmail()
  email!: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'User role',
  })
  @IsEnum(UserRole)
  role!: UserRole;
}
