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
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiTags('Comments')
@Controller('comments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiResponse({
    status: 201,
    description: 'The comment has been successfully created.',
    type: Object,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Token missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Article does not exist',
  })
  create(@Body() createCommentDto: CreateCommentDto, @GetUser() user: any) {
    // Pass userId separately as required by the service method
    return this.commentService.create(user.id, createCommentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all comments with optional article filter' })
  @ApiResponse({
    status: 200,
    description: 'List of comments retrieved successfully.',
    type: [Object],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Token missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @Public()
  findAll() {
    return this.commentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a comment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Comment retrieved successfully.',
    type: Object,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Token missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Comment does not exist',
  })
  @Public()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.commentService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a comment' })
  @ApiResponse({
    status: 200,
    description: 'The comment has been successfully updated.',
    type: Object,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Token missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Comment does not exist',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @GetUser() user: any,
  ) {
    // Pass userId separately as required by the service method
    return this.commentService.update(id, user.id, updateCommentDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a comment (Admin/Editor only)' })
  @ApiResponse({
    status: 200,
    description: 'The comment has been successfully deleted.',
    type: Object,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Token missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Comment does not exist',
  })
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: any) {
    // Pass userId and role separately as required by the service method
    return this.commentService.remove(id, user.id, user.role);
  }

  @Delete('own/:id')
  @ApiOperation({ summary: 'Delete your own comment' })
  @ApiResponse({
    status: 200,
    description: 'The comment has been successfully deleted.',
    type: Object,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Token missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Comment does not exist',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  removeOwn(@Param('id', ParseIntPipe) id: number, @GetUser() user: any) {
    // Since there's no removeOwn method in the service, we'll use the remove method
    // with user's role to allow users to delete their own comments
    return this.commentService.remove(id, user.id, 'USER');
  }
}
