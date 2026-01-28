import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import type {
  EWalletChargeResponse,
  MidtransNotificationDto,
} from '../dto/ewallet.dto';

@Injectable()
export class MidtransService {
  private readonly serverKey: string;
  private readonly clientKey: string;
  private readonly merchantId: string;
  private readonly isProduction: boolean;
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    // 1. Ambil raw value
    const rawServerKey = this.configService.get<string>('SERVER_KEY') || '';
    const rawClientKey = this.configService.get<string>('CLIENT_KEY') || '';
    const rawMerchantId = this.configService.get<string>('MERCHANT_ID') || '';
    const rawNodeEnv = this.configService.get<string>('NODE_ENV') || '';
    const rawMidtransEnv =
      this.configService.get<string>('MIDTRANS_IS_PRODUCTION');

    // 2. Sanitasi (Hapus spasi dan tanda kutip yang tidak sengaja terbawa)
    this.serverKey = rawServerKey.replace(/['"\s]/g, '');
    this.clientKey = rawClientKey.replace(/['"\s]/g, '');
    this.merchantId = rawMerchantId.replace(/['"\s]/g, '');

    // 3. Tentukan Mode (Production vs Sandbox)
    // Prioritas: MIDTRANS_IS_PRODUCTION > NODE_ENV
    if (rawMidtransEnv !== undefined && rawMidtransEnv !== null) {
      // Cek string "true" (case insensitive) atau boolean true
      this.isProduction = String(rawMidtransEnv).toLowerCase() === 'true';
    } else {
      // Fallback ke NODE_ENV (juga bersihkan tanda kutipnya)
      const cleanNodeEnv = rawNodeEnv.replace(/['"\s]/g, '');
      this.isProduction = cleanNodeEnv === 'production';
    }

    this.apiUrl = this.isProduction
      ? 'https://api.midtrans.com'
      : 'https://api.sandbox.midtrans.com';

    // Log for debugging
    console.log('--- MIDTRANS CONFIG ---');
    console.log(`MODE       : ${this.isProduction ? 'PRODUCTION' : 'SANDBOX'}`);
    console.log(
      `SERVER KEY : ${
        this.serverKey
          ? this.serverKey.substring(0, 5) + '...' + this.serverKey.slice(-5)
          : 'MISSING'
      } (Length: ${this.serverKey.length})`,
    );
    console.log(`API URL    : ${this.apiUrl}`);
    console.log('-----------------------');
  }

  /**
   * Get Base64 encoded authorization header
   */
  private getAuthHeader(): string {
    const encoded = Buffer.from(this.serverKey + ':').toString('base64');
    return `Basic ${encoded}`;
  }

  /**
   * Create GoPay/E-Wallet charge
   */
  async createEWalletCharge(
    orderId: string,
    grossAmount: number,
    callbackUrl?: string,
  ): Promise<EWalletChargeResponse> {
    const url = `${this.apiUrl}/v2/charge`;

    interface GopayConfig {
      enable_callback: boolean;
      callback_url: string;
    }

    interface ChargePayload {
      payment_type: string;
      transaction_details: {
        order_id: string;
        gross_amount: number;
      };
      gopay?: GopayConfig;
    }

    const payload: ChargePayload = {
      payment_type: 'gopay',
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
    };

    // Add callback URL for mobile redirect
    if (callbackUrl) {
      payload.gopay = {
        enable_callback: true,
        callback_url: callbackUrl,
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: this.getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Midtrans API Error: ${response.status} - ${errorText}`);
    }

    return response.json() as Promise<EWalletChargeResponse>;
  }

  /**
   * Get transaction status from Midtrans
   */
  async getTransactionStatus(orderId: string): Promise<any> {
    const url = `${this.apiUrl}/v2/${orderId}/status`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Midtrans API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Cancel transaction
   */
  async cancelTransaction(orderId: string): Promise<any> {
    const url = `${this.apiUrl}/v2/${orderId}/cancel`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Midtrans API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Verify notification signature from Midtrans webhook
   */
  verifySignature(notification: MidtransNotificationDto): boolean {
    const { order_id, status_code, gross_amount, signature_key } = notification;

    if (!signature_key) return false;

    // Create hash: SHA512(order_id + status_code + gross_amount + ServerKey)
    const hash = crypto
      .createHash('sha512')
      .update(order_id + status_code + gross_amount + this.serverKey)
      .digest('hex');

    return hash === signature_key;
  }

  /**
   * Map Midtrans transaction status to our payment status
   */
  mapTransactionStatus(
    transactionStatus: string,
    fraudStatus?: string,
  ): 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'DECLINED' {
    // Handle fraud_status first
    if (fraudStatus === 'deny' || fraudStatus === 'challenge') {
      return 'DECLINED';
    }

    // Map transaction_status
    switch (transactionStatus) {
      case 'capture':
      case 'settlement':
        return 'CONFIRMED';
      case 'pending':
        return 'PENDING';
      case 'deny':
      case 'expire':
      case 'cancel':
        return 'CANCELLED';
      default:
        return 'PENDING';
    }
  }
}
