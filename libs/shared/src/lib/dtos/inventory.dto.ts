import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsUUID,
  ValidateNested,
  Min,
} from 'class-validator';
import {Type} from 'class-transformer';
import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';

export class CreateGroceryItemDto {
  @ApiProperty({
    example: 'Organic Apples',
    description: 'Name of the grocery item',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    example: 'Fresh organic apples from local farm',
    description: 'Description of the item',
  })
  @IsString()
  description!: string;

  @ApiProperty({example: 2.99, description: 'Price per unit', minimum: 0})
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({example: 100, description: 'Available quantity', minimum: 0})
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiProperty({example: 'kg', description: 'Unit of measurement'})
  @IsString()
  unit!: string;

  @ApiPropertyOptional({
    example: ['fruits', 'organic'],
    description: 'Item categories',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({each: true})
  categories?: string[];
}

export class UpdateGroceryItemDto {
  @ApiPropertyOptional({
    example: 'Organic Apples',
    description: 'Name of the grocery item',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'Fresh organic apples from local farm',
    description: 'Description of the item',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 2.99,
    description: 'Price per unit',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Available quantity',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({example: 'kg', description: 'Unit of measurement'})
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({
    example: ['fruits', 'organic'],
    description: 'Item categories',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({each: true})
  categories?: string[];
}

export class InventoryCheckDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Grocery item ID',
  })
  @IsUUID()
  itemId!: string;
}

export class UpdateInventoryDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Grocery item ID',
  })
  @IsUUID()
  itemId!: string;

  @ApiProperty({example: 50, description: 'New quantity', minimum: 0})
  @IsNumber()
  @Min(0)
  quantity!: number;
}

class InventoryItemDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Grocery item ID',
  })
  @IsUUID()
  itemId!: string;

  @ApiProperty({example: 2, description: 'Quantity to reserve', minimum: 1})
  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class InventoryReservationDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Order ID',
  })
  @IsUUID()
  orderId!: string;

  @ApiProperty({
    type: [InventoryItemDto],
    example: [{itemId: '123e4567-e89b-12d3-a456-426614174000', quantity: 2}],
    description: 'List of items to reserve',
  })
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => InventoryItemDto)
  items!: InventoryItemDto[];
}
