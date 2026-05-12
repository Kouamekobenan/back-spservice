import {
  Controller,
  Get,
  Param,
  Query,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { FindAllAuditLogsUseCase } from '../../application/use-cases/find-all-audit-logs.use-case.js';
import { FindAuditLogByIdUseCase } from '../../application/use-cases/find-audit-log-by-id.use-case.js';
import { FilterAuditLogDto } from '../../application/dto/filter-audit-log.dto.js';
import { AuditLogResponseDto } from '../../application/dto/audit-log-response.dto.js';

@ApiTags('audit-logs')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditLogController {
  private readonly logger = new Logger(AuditLogController.name);

  constructor(
    private readonly findAllAuditLogsUseCase: FindAllAuditLogsUseCase,
    private readonly findAuditLogByIdUseCase: FindAuditLogByIdUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Paginate and filter audit logs',
    description: 'Retrieve a list of audit logs with pagination and filtering options.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated list of audit logs',
  })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query() filter: FilterAuditLogDto,
  ) {
    this.logger.log(`Fetching audit logs - Page: ${page}, Limit: ${limit}`);
    return await this.findAllAuditLogsUseCase.execute(
      Number(page),
      Number(limit),
      filter,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get audit log by ID',
    description: 'Retrieve detailed information about a specific audit log.',
  })
  @ApiParam({ name: 'id', description: 'Audit log UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: AuditLogResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Audit log not found' })
  async findById(@Param('id') id: string): Promise<AuditLogResponseDto> {
    this.logger.log(`Fetching audit log by ID: ${id}`);
    return await this.findAuditLogByIdUseCase.execute(id);
  }
}
