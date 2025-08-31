import sgMail from '@sendgrid/mail';

// Configure SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY not found in environment variables');
}

interface InvoiceEmailData {
  to: string;
  invoiceData: {
    invoiceNumber: string;
    customerName: string;
    businessName: string;
    subtotal: any;
    gst: any;
    total: any;
    lineItems: any;
    dueDate: any;
    createdAt: any;
  };
  paymentUrl: string;
  customMessage?: string;
  businessName: string;
}

class SendGridService {
  async sendInvoiceEmail(data: InvoiceEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        throw new Error('SendGrid API key not configured');
      }

      // Generate invoice PDF content (simplified HTML for demo)
      const invoiceHtml = this.generateInvoiceHtml(data.invoiceData);
      
      const msg = {
        to: data.to,
        from: {
          email: process.env.EMAIL_FROM || 'support@bluetradie.com',
          name: process.env.EMAIL_FROM_NAME || 'Blue Tradie Team'
        },
        subject: `Invoice ${data.invoiceData.invoiceNumber} from ${data.businessName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Invoice ${data.invoiceData.invoiceNumber}</h2>
            
            <p>Dear ${data.invoiceData.customerName},</p>
            
            <p>Please find your invoice attached below. You can view and pay your invoice online using the button below.</p>
            
            ${data.customMessage ? `<p><em>${data.customMessage}</em></p>` : ''}
            
            <div style="margin: 30px 0;">
              <a href="${data.paymentUrl}" 
                 style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                View & Pay Invoice
              </a>
            </div>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Invoice Summary</h3>
              <p><strong>Invoice Number:</strong> ${data.invoiceData.invoiceNumber}</p>
              <p><strong>Total Amount:</strong> $${data.invoiceData.total}</p>
              <p><strong>Due Date:</strong> ${data.invoiceData.dueDate ? new Date(data.invoiceData.dueDate).toLocaleDateString() : 'Upon receipt'}</p>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <div style="font-size: 14px; color: #6b7280;">
              <p>If you have any questions about this invoice, please contact us.</p>
              <p>Thank you for your business!</p>
              <p><strong>${data.businessName}</strong></p>
            </div>
          </div>
        `,
        attachments: [
          {
            content: Buffer.from(invoiceHtml).toString('base64'),
            filename: `Invoice-${data.invoiceData.invoiceNumber}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment'
          }
        ]
      };

      await sgMail.send(msg);
      console.log(`✅ Invoice email sent successfully to ${data.to}`);
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ SendGrid email error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send email' 
      };
    }
  }

  private generateInvoiceHtml(invoice: any): string {
    const lineItemsHtml = Array.isArray(invoice.lineItems) 
      ? invoice.lineItems.map((item: any) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.description || 'Service'}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity || 1}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.rate || item.amount}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.amount}</td>
          </tr>
        `).join('')
      : `<tr><td colspan="4" style="padding: 8px; text-align: center;">No line items available</td></tr>`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; }
          .invoice-header { background-color: #2563eb; color: white; padding: 20px; }
          .invoice-body { padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #f8fafc; padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; }
          .totals { margin-top: 20px; text-align: right; }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <h1>INVOICE</h1>
          <h2>${invoice.invoiceNumber}</h2>
        </div>
        
        <div class="invoice-body">
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div>
              <h3>From:</h3>
              <p><strong>${invoice.businessName}</strong></p>
            </div>
            <div>
              <h3>To:</h3>
              <p><strong>${invoice.customerName}</strong></p>
            </div>
          </div>
          
          <div style="margin-bottom: 30px;">
            <p><strong>Invoice Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Upon receipt'}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Rate</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${lineItemsHtml}
            </tbody>
          </table>
          
          <div class="totals">
            <p><strong>Subtotal: $${invoice.subtotal}</strong></p>
            <p><strong>GST: $${invoice.gst}</strong></p>
            <h3><strong>Total: $${invoice.total}</strong></h3>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

const sendgridService = new SendGridService();
export default sendgridService;