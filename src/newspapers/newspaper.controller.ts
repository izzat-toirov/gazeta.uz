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
import { NewspaperService } from './newspaper.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiQuery, ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateNewspaperDto } from './dto/create-newspaper.dto';
import { UpdateNewspaperDto } from './dto/update-newspaper.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@ApiTags('Newspapers')
@Controller('newspapers')
export class NewspaperController {
  constructor(private readonly newspaperService: NewspaperService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new newspaper' })
  @ApiResponse({ status: 201, description: 'The newspaper has been successfully created.', type: Object })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation error or foreign key constraint violation' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Token missing or invalid' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not Found - Record does not exist' })
  @Roles('EDITOR', 'ADMIN', 'SUPER_ADMIN')
  create(@Body() createNewspaperDto: CreateNewspaperDto, @Req() req: Request) {
    const processedDto = {
      ...createNewspaperDto,
      pdfUrl: this.constructAbsoluteUrl(createNewspaperDto.pdfUrl, req),
      coverImage: createNewspaperDto.coverImage ? this.constructAbsoluteUrl(createNewspaperDto.coverImage, req) : null,
    };
    return this.newspaperService.create(processedDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all newspapers with optional filters' })
  @ApiResponse({ status: 200, description: 'List of newspapers retrieved successfully.', type: [Object] })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid query parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Token missing or invalid' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiQuery({ name: 'fromDate', required: false, type: String, description: 'Filter by date range (from)' })
  @ApiQuery({ name: 'toDate', required: false, type: String, description: 'Filter by date range (to)' })
  @Public()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Req() req?: Request,
  ) {
    const query = {
      page: page || '1',
      limit: limit || '10',
      fromDate,
      toDate,
    };
    
    return this.newspaperService.findAll(query, req);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a newspaper by ID' })
  @ApiResponse({ status: 200, description: 'Newspaper retrieved successfully.', type: Object })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Token missing or invalid' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not Found - Newspaper does not exist' })
  @Public()
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req?: Request) {
    return this.newspaperService.findOne(id, req);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a newspaper' })
  @ApiResponse({ status: 200, description: 'The newspaper has been successfully updated.', type: Object })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation error or foreign key constraint violation' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Token missing or invalid' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not Found - Newspaper does not exist' })
  @Roles('EDITOR', 'ADMIN', 'SUPER_ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNewspaperDto: UpdateNewspaperDto,
    @Req() req?: Request,
  ) {
    const processedDto = {
      ...updateNewspaperDto,
    };
    
    // Only update URLs if they were provided in the request
    if (updateNewspaperDto.pdfUrl) {
      processedDto.pdfUrl = this.constructAbsoluteUrl(updateNewspaperDto.pdfUrl, req);
    }
    if (updateNewspaperDto.coverImage) {
      processedDto.coverImage = this.constructAbsoluteUrl(updateNewspaperDto.coverImage, req);
    }
    
    return this.newspaperService.update(id, processedDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a newspaper' })
  @ApiResponse({ status: 200, description: 'The newspaper has been successfully deleted.', type: Object })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Token missing or invalid' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not Found - Newspaper does not exist' })
  @Roles('EDITOR', 'ADMIN', 'SUPER_ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.newspaperService.remove(id);
  }
  
  private constructAbsoluteUrl(relativePath: string, req?: Request): string {
    if (!req) {
      // Fallback to localhost if no request object provided
      return `http://localhost:3000${relativePath}`;
    }
    
    const protocol = req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}${relativePath}`;
  }
}