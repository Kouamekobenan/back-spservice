import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
  NotFoundException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CreateQuoteUseCase } from '../../application/usecases/create-quote.usecase.js';
import { FindAllQuotesUseCase } from '../../application/usecases/find-all-quotes.usecase.js';
import { FindQuoteByIdUseCase } from '../../application/usecases/find-quote-by-id.usecase.js';
import { UpdateQuoteUseCase } from '../../application/usecases/update-quote.usecase.js';
import { DeleteQuoteUseCase } from '../../application/usecases/delete-quote.usecase.js';
import { ConvertQuoteToSaleUseCase } from '../../application/usecases/convert-quote-to-sale.usecase.js';
import { GenerateQuotePdfUseCase } from '../../application/usecases/generate-quote-pdf.usecase.js';
import { CreateQuoteDto } from '../../application/dtos/create-quote.dto.js';
import { UpdateQuoteDto } from '../../application/dtos/update-quote.dto.js';
import { FilterQuoteDto } from '../../application/dtos/filter-quote.dto.js';
import { ConvertQuoteToSaleDto } from '../../application/dtos/convert-quote-to-sale.dto.js';
import {
  QuoteResponseDto,
  PaginatedQuoteResponseDto,
  toQuoteResponseDto,
} from '../../application/dtos/quote-response.dto.js';
import { toSaleResponseDto } from '../../../sale/application/dtos/sale-response.dto.js';

@ApiTags('Quotes (Devis / Proforma)')
@ApiBearerAuth()
@Controller('quotes')
export class QuoteController {
  constructor(
    private readonly createUseCase: CreateQuoteUseCase,
    private readonly findAllUseCase: FindAllQuotesUseCase,
    private readonly findByIdUseCase: FindQuoteByIdUseCase,
    private readonly updateUseCase: UpdateQuoteUseCase,
    private readonly deleteUseCase: DeleteQuoteUseCase,
    private readonly convertToSaleUseCase: ConvertQuoteToSaleUseCase,
    private readonly generatePdfUseCase: GenerateQuotePdfUseCase,
  ) {}

  // ── POST /quotes ──────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un nouveau devis (proforma) sans toucher au stock ni à la caisse',
    description:
      'Génère un devis basé sur les produits de la boutique. ' +
      'Si `unitPrice` est omis sur une ligne, le prix du produit en boutique (`sellingPrice` ou `wholeSalePrice`) est appliqué automatiquement. ' +
      'Aucun stock n’est soustrait et aucune session de caisse n’est impactée.',
  })
  @ApiBody({ type: CreateQuoteDto })
  @ApiResponse({ status: 201, description: 'Devis créé avec succès.', type: QuoteResponseDto })
  async create(@Body() dto: CreateQuoteDto): Promise<QuoteResponseDto> {
    const quote = await this.createUseCase.execute(dto);
    return toQuoteResponseDto(quote);
  }

  // ── GET /quotes ───────────────────────────────────────────────

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lister les devis paginés d’une boutique',
    description: 'Retourne les devis filtrés par boutique, statut, client, période ou recherche.',
  })
  @ApiQuery({ name: 'shopId', required: false, description: 'ID de la boutique' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'DRAFT | SENT | ACCEPTED | REJECTED | EXPIRED | CONVERTED',
  })
  @ApiQuery({ name: 'userId', required: false, description: 'Filtrer par auteur du devis' })
  @ApiQuery({ name: 'customerId', required: false, description: 'Filtrer par client' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Recherche sur le numéro de devis, nom ou téléphone du client',
  })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Date début ISO 8601' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Date fin ISO 8601' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: PaginatedQuoteResponseDto })
  async findAll(@Query() filters: FilterQuoteDto): Promise<PaginatedQuoteResponseDto> {
    return this.findAllUseCase.execute(filters);
  }

  // ── GET /quotes/:id/pdf ───────────────────────────────────────

  @Get(':id/pdf')
  @ApiOperation({
    summary: 'Télécharger le PDF du devis / facture proforma',
    description: 'Génère un document PDF A4 prêt à être imprimé ou envoyé au client.',
  })
  @ApiParam({ name: 'id', description: 'UUID du devis' })
  @ApiResponse({ status: 200, description: 'Fichier PDF du devis.' })
  async downloadPdf(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const { buffer, filename } = await this.generatePdfUseCase.execute(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  // ── GET /quotes/:id ───────────────────────────────────────────

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Récupérer les détails d’un devis par son ID' })
  @ApiParam({ name: 'id', description: 'UUID du devis' })
  @ApiResponse({ status: 200, type: QuoteResponseDto })
  @ApiResponse({ status: 404, description: 'Devis non trouvé.' })
  async findById(@Param('id') id: string): Promise<QuoteResponseDto> {
    const quote = await this.findByIdUseCase.execute(id);
    if (!quote) throw new NotFoundException(`Devis ${id} non trouvé`);
    return toQuoteResponseDto(quote);
  }

  // ── PATCH /quotes/:id ─────────────────────────────────────────

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Modifier un devis ou changer son statut (SENT, ACCEPTED, REJECTED...)',
    description: 'Met à jour les informations, le statut ou les lignes d’un devis non converti.',
  })
  @ApiParam({ name: 'id', description: 'UUID du devis' })
  @ApiBody({ type: UpdateQuoteDto })
  @ApiResponse({ status: 200, type: QuoteResponseDto })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(@Param('id') id: string, @Body() dto: UpdateQuoteDto): Promise<QuoteResponseDto> {
    const updated = await this.updateUseCase.execute(id, dto);
    return toQuoteResponseDto(updated);
  }

  // ── POST /quotes/:id/convert-to-sale ──────────────────────────

  @Post(':id/convert-to-sale')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Convertir un devis accepté en vraie vente en caisse',
    description:
      'Crée une vente réelle à partir des articles et prix du devis, déduit alors le stock, ' +
      'enregistre le paiement dans la caisse et passe le devis au statut CONVERTED.',
  })
  @ApiParam({ name: 'id', description: 'UUID du devis à convertir' })
  @ApiBody({ type: ConvertQuoteToSaleDto })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async convertToSale(@Param('id') id: string, @Body() dto: ConvertQuoteToSaleDto) {
    const { quote, sale } = await this.convertToSaleUseCase.execute(id, dto);
    return {
      quote: toQuoteResponseDto(quote),
      sale: toSaleResponseDto(sale),
    };
  }

  // ── DELETE /quotes/:id ────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un devis (non converti)' })
  @ApiParam({ name: 'id', description: 'UUID du devis' })
  @ApiResponse({ status: 204, description: 'Devis supprimé avec succès.' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteUseCase.execute(id);
  }
}
