import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import { IUserRepository } from '../users/application/interfaces/user.interface.repository';
import {
  IOtpRepository,
  OtpRepositoryName,
} from '../../otp/domain/interface/otp.repository';

import { ResetPasswordDto } from '../../otp/application/dtos/resetPassword.dto';
import { OtpType } from '../../otp/domain/otpType/verification.enum';
import { AuthService } from '../services/auth.service';
import { MailService } from '../../../common/email/email.service';
@Injectable()
export class ResetPasswordUsecase {
  private readonly logger = new Logger(ResetPasswordUsecase.name);

  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject(OtpRepositoryName)
    private readonly otpRepository: IOtpRepository,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
  ) {}
  async execute(dto: ResetPasswordDto) {
    try {
      this.logger.log(`Reset password attempt for email: ${dto.email}`);
      // 1. Vérifier utilisateur
      const user = await this.userRepository.findByEmail(dto.email);
      if (!user) {
        throw new BadRequestException('Utilisateur introuvable');
      }
      // 2. Vérifier mot de passe confirmé
      if (dto.newPassword !== dto.confirmPassword) {
        throw new BadRequestException('Les mots de passe ne correspondent pas');
      }
      // 3. Vérifier OTP valide
      const otp = await this.otpRepository.findValidOtp(
        dto.code,
        user.getId(),
        OtpType.RESET_PASSWORD,
      );

      if (!otp) {
        throw new BadRequestException('OTP invalide ou expiré');
      }

      if (otp.getIsUsed()) {
        throw new BadRequestException('OTP déjà utilisé');
      }
      if (otp.isExpired()) {
        throw new BadRequestException('OTP expiré');
      }
      // 4. Hasher nouveau mot de passe
      const hashedPassword = await this.authService.hashPassword(
        dto.newPassword,
      );
      // 5. Mettre à jour mot de passe user
      await this.userRepository.updatePassword(user.getId(), hashedPassword);
      // 6. Marquer OTP comme utilisé
      otp.markAsUsed();
      await this.otpRepository.markAsUsed(otp.getId());

      this.logger.log(`Password reset successful for user: ${user.getId()}`);
      await this.mailService.notifyPasswordChange(
        user.getEmail() ?? '',
        user.getName() ?? '',
      );
      return {
        success: true,
        message: 'Mot de passe réinitialisé avec succès',
      };
    } catch (error) {
      this.logger.error(
        `Reset password error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Erreur lors de la réinitialisation du mot de passe',
      );
    }
  }
}
