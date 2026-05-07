import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber, IsString, IsUrl } from 'class-validator';

export class SendWhatsAppTicketRequestDto {
  @ApiProperty({
    example: '+2250102030405',
    description: 'Numéro de téléphone au format international',
  })
  @IsPhoneNumber()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({
    example: 'Festival des Arts de Grand-Bassam',
    description: "Nom de l'événement",
  })
  @IsString()
  @IsNotEmpty()
  eventName!: string;

  @ApiProperty({
    example: 'https://visaforculture.ci/tickets/abc123',
    description: 'Lien vers le ticket (QR Code)',
  })
  @IsUrl()
  @IsNotEmpty()
  ticketUrl!: string;
}
