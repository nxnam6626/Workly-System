import { Injectable, Logger, OnModuleInit, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    // Ưu tiên sử dụng bộ biến NEXT_PUBLIC mà người dùng cung cấp để đồng nhất
    const supabaseUrl = this.configService.get<string>('NEXT_PUBLIC_SUPABASE_URL') || 
                        this.configService.get<string>('SUPABASE_URL');
    
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || 
                        this.configService.get<string>('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY') || 
                        this.configService.get<string>('SUPABASE_URL'); // Fallback if someone used SUPABASE_URL for the key
    
    this.bucketName = this.configService.get<string>('SUPABASE_CV_BUCKET') || 'cvs';

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('Supabase credentials missing in .env (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL)');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });
    this.logger.log(`Supabase client initialized with endpoint: ${supabaseUrl}`);
  }

  async uploadFile(buffer: Buffer, path: string, mimetype: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(path, buffer, {
        contentType: mimetype,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Error uploading file to Supabase: ${error.message}`);
      this.handleError(error);
    }

    const { data: publicUrlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }

  async deleteFile(path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([path]);

    if (error) {
      this.logger.error(`Error deleting file from Supabase: ${error.message}`);
      this.handleError(error);
    }
  }

  async downloadFile(path: string): Promise<Buffer> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .download(path);

    if (error) {
      this.logger.error(`Error downloading file from Supabase: ${error.message}`);
      this.handleError(error);
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  extractPathFromUrl(url: string): string | null {
    try {
      const parts = url.split(`${this.bucketName}/`);
      if (parts.length > 1) {
        return parts[1];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  private handleError(error: any): never {
    // Ép kiểu status sang số để tránh lỗi TypeError: Invalid status code: "403" trong Express
    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    if (error && error.status) {
      const parsedStatus = typeof error.status === 'string' ? parseInt(error.status, 10) : error.status;
      if (!isNaN(parsedStatus) && typeof parsedStatus === 'number') {
        status = parsedStatus;
      }
    }

    throw new HttpException(
      {
        message: error.message || 'Supabase operation failed',
        error: error.message,
        statusCode: status,
      },
      status,
    );
  }
}
