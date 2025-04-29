import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {IsString, IsNumber, IsArray, Min} from 'class-validator';

@Entity()
export class GroceryItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @IsString()
  name!: string;

  @Column('text')
  @IsString()
  description!: string;

  @Column('decimal', {precision: 10, scale: 2})
  @IsNumber()
  @Min(0)
  price!: number;

  @Column()
  @IsNumber()
  @Min(0)
  quantity!: number;

  @Column()
  @IsString()
  unit!: string;

  @Column('simple-array', {nullable: true})
  @IsArray()
  @IsString({each: true})
  categories!: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
