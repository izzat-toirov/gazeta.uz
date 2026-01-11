import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
  Req,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiQuery, ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@ApiTags('Articles')
@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new article' })
  @ApiResponse({ status: 201, description: 'The article has been successfully created.', type: Object })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation error or foreign key constraint violation' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Token missing or invalid' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not Found - Category, author, or newspaper does not exist' })
  @Roles('REPORTER', 'EDITOR', 'ADMIN', 'SUPER_ADMIN')
  create(
    @Body() createArticleDto: CreateArticleDto,
    @GetUser() user: any,
    @Req() req: Request,
  ) {
    // Assign authorId from authenticated user, not from request body
    return this.articleService.create({
      ...createArticleDto,
      authorId: user.id,
    }, user.id, req);
  }

  @Get()
  @ApiOperation({ summary: 'Get all articles with optional filters' })
  @ApiResponse({ status: 200, description: 'List of articles retrieved successfully.', type: [Object] })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid query parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Token missing or invalid' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number, description: 'Filter by category ID' })
  @ApiQuery({ name: 'authorId', required: false, type: Number, description: 'Filter by author ID' })
  @ApiQuery({ name: 'isPublished', required: false, type: Boolean, description: 'Filter by published status' })
  @ApiQuery({ name: 'newspaperId', required: false, type: Number, description: 'Filter by newspaper ID' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by title or content' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort by field (createdAt or viewCount)' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort order (asc or desc)' })
  @Public()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
    @Query('authorId') authorId?: string,
    @Query('isPublished') isPublished?: string,
    @Query('newspaperId') newspaperId?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Req() req?: Request,
  ) {
    const query = {
      page: page || '1',
      limit: limit || '10',
      categoryId: categoryId,
      authorId: authorId,
      isPublished: isPublished,
      newspaperId: newspaperId,
      search,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
    };
    
    return this.articleService.findAll(query, req);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an article by ID' })
  @ApiResponse({ status: 200, description: 'Article retrieved successfully.', type: Object })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Token missing or invalid' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not Found - Article does not exist' })
  @Public()
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req?: Request) {
    return this.articleService.findOne(id, req);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get an article by slug' })
  @ApiResponse({ status: 200, description: 'Article retrieved successfully.', type: Object })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid slug format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Token missing or invalid' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not Found - Article does not exist' })
  @Public()
  findBySlug(@Param('slug') slug: string, @Req() req?: Request) {
    return this.articleService.findBySlug(slug, req);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an article' })
  @ApiResponse({ status: 200, description: 'The article has been successfully updated.', type: Object })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation error or foreign key constraint violation' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Token missing or invalid' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions or not the author' })
  @ApiResponse({ status: 404, description: 'Not Found - Article does not exist' })
  @Roles('REPORTER', 'EDITOR', 'ADMIN', 'SUPER_ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateArticleDto: UpdateArticleDto,
    @GetUser() user: any,
    @Req() req?: Request,
  ) {
    // Only allow updates if the user is the author or has appropriate role
    return this.articleService.update(id, updateArticleDto, user.id, user.role, req);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an article' })
  @ApiResponse({ status: 200, description: 'The article has been successfully deleted.', type: Object })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Token missing or invalid' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions or not the author' })
  @ApiResponse({ status: 404, description: 'Not Found - Article does not exist' })
  @Roles('REPORTER', 'EDITOR', 'ADMIN', 'SUPER_ADMIN')
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: any) {
    // Only allow deletion if the user is the author or has appropriate role
    return this.articleService.remove(id, user.id, user.role);
  }
}