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
import { AdvertisementService } from './advertisement.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ApiQuery, ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@ApiTags('Advertisements')
@Controller('advertisements')
export class AdvertisementController {
  constructor(private readonly advertisementService: AdvertisementService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new advertisement' })
  @ApiResponse({ status: 201, description: 'The advertisement has been successfully created.', type: Object })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation error or foreign key constraint violation' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Token missing or invalid' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not Found - Record does not exist' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  create(@Body() createAdvertisementDto: CreateAdvertisementDto, @Req() req: Request) {
    const processedDto = {
      ...createAdvertisementDto,
      imageUrl: this.constructAbsoluteUrl(createAdvertisementDto.imageUrl, req),
    };
    return this.advertisementService.create(processedDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all advertisements with optional filters' })
  @ApiResponse({ status: 200, description: 'List of advertisements retrieved successfully.', type: [Object] })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid query parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Token missing or invalid' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status (default: true)' })
  @Public()
  findAll(@Query('isActive') isActive?: boolean, @Req() req?: Request) {
    return this.advertisementService.findAll(isActive, req);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an advertisement by ID' })
  @ApiResponse({ status: 200, description: 'Advertisement retrieved successfully.', type: Object })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Token missing or invalid' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not Found - Advertisement does not exist' })
  @Public()
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req?: Request) {
    return this.advertisementService.findOne(id, req);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an advertisement' })
  @ApiResponse({ status: 200, description: 'The advertisement has been successfully updated.', type: Object })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation error or foreign key constraint violation' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Token missing or invalid' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not Found - Advertisement does not exist' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAdvertisementDto: UpdateAdvertisementDto,
    @Req() req?: Request,
  ) {
    const processedDto = {
      ...updateAdvertisementDto,
    };
    
    // Only update imageUrl if it was provided in the request
    if (updateAdvertisementDto.imageUrl) {
      processedDto.imageUrl = this.constructAbsoluteUrl(updateAdvertisementDto.imageUrl, req);
    }
    
    return this.advertisementService.update(id, processedDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an advertisement' })
  @ApiResponse({ status: 200, description: 'The advertisement has been successfully deleted.', type: Object })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Token missing or invalid' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not Found - Advertisement does not exist' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.advertisementService.remove(id);
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