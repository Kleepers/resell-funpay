import { IsOptional, IsInt, Min, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class FunPayLotQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;
}

export class FunPayLotDto {
  id: number;
  externalId: string;
  server: string;
  rank: string;
  agentsCount: number;
  skinsCount: number;
  titleRu: string;
  descriptionRu?: string | null;
  priceRub: number;
  url: string;
  isActive: boolean;
  firstSeenAt: Date;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class PaginationMetaDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class PaginatedFunPayLotsDto {
  data: FunPayLotDto[];
  meta: PaginationMetaDto;
}
