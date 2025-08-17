// src/categories/categories.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

type Audience = 'men' | 'women' | 'kids' | 'baby' | 'unisex';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  // NEW: bulk (optional)
  @Post('bulk')
  createMany(@Body() dtos: CreateCategoryDto[]) {
    return this.categoriesService.upsertManyBySlug(dtos);
  }

  // NEW: filter by ?audience=men
  @Get()
  findAll(@Query('audience') audience?: Audience) {
    return this.categoriesService.findAll(audience);
  }

  // NEW: tree endpoint (flat → tree)
  @Get('tree')
  getTree(@Query('audience') audience?: Audience) {
    return this.categoriesService.findTreeByAudience(audience);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
