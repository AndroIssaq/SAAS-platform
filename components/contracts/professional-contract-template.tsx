/**
 * Professional Contract Template Generator
 * Complete Arabic contract with all legal details
 */

import { ContractPDFData } from '@/lib/actions/contract-pdf'

export function generateProfessionalContractHTML(contract: ContractPDFData): string {
  // Helper functions
  const formatDate = (date: string | undefined) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('ar-EG')} جنيه مصري`
  }

  const contractUrl = contract.contract_link_token
    ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://roboweb.com'}/contracts/${contract.contract_link_token}`
    : ''

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>عقد رقم ${contract.contract_number}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', 'Cairo', 'Tajawal', Arial, sans-serif;
      line-height: 1.9;
      color: #1a202c;
      background: #ffffff;
      padding: 50px;
      max-width: 210mm;
      margin: 0 auto;
    }
    
    /* Header Styling */
    .contract-header {
      text-align: center;
      margin-bottom: 50px;
      padding: 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    }
    
    .contract-header h1 {
      font-size: 36px;
      margin-bottom: 15px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    
    .contract-meta {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-top: 20px;
      font-size: 16px;
    }
    
    .contract-meta-item {
      background: rgba(255,255,255,0.2);
      padding: 8px 16px;
      border-radius: 8px;
      backdrop-filter: blur(10px);
    }
    
    /* Section Styling */
    .section {
      margin-bottom: 35px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 24px;
      font-weight: bold;
      color: #2d3748;
      background: linear-gradient(to left, #f7fafc, #edf2f7);
      padding: 15px 20px;
      border-right: 5px solid #667eea;
      border-radius: 8px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .section-content {
      padding: 0 20px;
    }
    
    /* Info Row Styling */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .info-item {
      background: #f8fafc;
      padding: 15px;
      border-radius: 8px;
      border-right: 3px solid #cbd5e0;
    }
    
    .info-item.full-width {
      grid-column: 1 / -1;
    }
    
    .info-label {
      font-weight: 600;
      color: #4a5568;
      font-size: 14px;
      margin-bottom: 6px;
    }
    
    .info-value {
      color: #1a202c;
      font-size: 16px;
    }
    
    .highlight {
      background: linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%);
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: bold;
    }
    
    .amount {
      font-size: 22px;
      font-weight: bold;
      color: #059669;
    }
    
    /* List Styling */
    .styled-list {
      list-style: none;
      padding-right: 0;
    }
    
    .styled-list li {
      padding: 12px 20px;
      margin-bottom: 10px;
      background: #f8fafc;
      border-right: 4px solid #667eea;
      border-radius: 6px;
      position: relative;
    }
    
    .styled-list li:before {
      content: "✓";
      color: #667eea;
      font-weight: bold;
      font-size: 18px;
      margin-left: 12px;
    }
    
    /* Table Styling */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border-radius: 8px;
      overflow: hidden;
    }
    
    .data-table th {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px;
      text-align: right;
      font-weight: 600;
    }
    
    .data-table td {
      padding: 12px 15px;
      border-bottom: 1px solid #e2e8f0;
      text-align: right;
    }
    
    .data-table tr:last-child td {
      border-bottom: none;
    }
    
    .data-table tr:nth-child(even) {
      background: #f7fafc;
    }
    
    /* Divider */
    .divider {
      height: 3px;
      background: linear-gradient(to left, transparent, #cbd5e0, transparent);
      margin: 40px 0;
    }
    
    /* Signature Section */
    .signatures-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 25px;
      margin-top: 25px;
    }
    
    .signature-box {
      background: #f8fafc;
      padding: 20px;
      border-radius: 12px;
      border: 2px dashed #cbd5e0;
      text-align: center;
    }
    
    .signature-box h4 {
      color: #4a5568;
      margin-bottom: 15px;
      font-size: 18px;
    }
    
    .signature-image {
      max-width: 100%;
      max-height: 80px;
      margin: 15px auto;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      padding: 10px;
    }
    
    .signature-date {
      font-size: 13px;
      color: #718096;
      margin-top: 10px;
    }
    
    /* ID Card Section */
    .id-card-image {
      max-width: 100%;
      height: auto;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      margin: 15px 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    /* Footer */
    .contract-footer {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 3px solid #e2e8f0;
      text-align: center;
      color: #718096;
      font-size: 13px;
    }
    
    .footer-box {
      background: #f7fafc;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    
    /* Badge Styling */
    .badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      margin: 5px;
    }
    
    .badge-success {
      background: #d1fae5;
      color: #065f46;
    }
    
    .badge-warning {
      background: #fef3c7;
      color: #92400e;
    }
    
    .badge-info {
      background: #dbeafe;
      color: #1e40af;
    }
    
    /* Print Styling */
    @media print {
      body {
        padding: 15mm;
      }
      
      .section {
        page-break-inside: avoid;
      }
      
      .contract-header {
        box-shadow: none;
      }
    }
    
    @page {
      size: A4;
      margin: 15mm;
    }
  </style>
</head>
<body>

  <!-- Contract Header -->
  <div class="contract-header">
    <h1>عقد تقديم خدمات رقمية</h1>
    <div class="contract-meta">
      <div class="contract-meta-item">
        <strong>رقم العقد:</strong> ${contract.contract_number}
      </div>
      <div class="contract-meta-item">
        <strong>التاريخ:</strong> ${formatDate(contract.created_at)}
      </div>
    </div>
  </div>

  <!-- الطرف الأول (البائع) -->
  <div class="section">
    <h2 class="section-title">📋 الطرف الأول (مقدم الخدمة)</h2>
    <div class="section-content">
      <div class="info-grid">
        ${contract.provider_company_name ? `
        <div class="info-item">
          <div class="info-label">الاسم/الشركة:</div>
          <div class="info-value">${contract.provider_company_name}</div>
        </div>
        ` : ''}
        <div class="info-item">
          <div class="info-label">الممثل القانوني:</div>
          <div class="info-value">${contract.provider_name || contract.created_by || 'شركة روبوويب'}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- الطرف الثاني (المشتري) -->
  <div class="section">
    <h2 class="section-title">👤 الطرف الثاني (العميل)</h2>
    <div class="section-content">
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">الاسم:</div>
          <div class="info-value">${contract.client_name}</div>
        </div>
        <div class="info-item">
          <div class="info-label">البريد الإلكتروني:</div>
          <div class="info-value">${contract.client_email}</div>
        </div>
        <div class="info-item">
          <div class="info-label">الهاتف:</div>
          <div class="info-value">${contract.client_phone}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- مقدمة -->
  <div class="section">
    <div class="section-content">
      <p style="background: #fef3c7; padding: 20px; border-radius: 8px; border-right: 5px solid #f59e0b;">
        <strong>مقدمة:</strong> اتفق الطرفان المذكوران أعلاه على ما يلي لتقديم الخدمة الموضحة أدناه بالمقابل المذكور، وفقاً للشروط والأحكام المنصوص عليها في هذا العقد.
      </p>
    </div>
  </div>

  <div class="divider"></div>

  <!-- البند 1 — موضوع العقد -->
  <div class="section">
    <h2 class="section-title">📝 البند 1 — موضوع العقد</h2>
    <div class="section-content">
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">نوع الخدمة:</div>
          <div class="info-value"><span class="highlight">${contract.service_type}</span></div>
        </div>
        <div class="info-item">
          <div class="info-label">اسم الباقة:</div>
          <div class="info-value"><span class="highlight">${contract.package_name}</span></div>
        </div>
        <div class="info-item full-width">
          <div class="info-label">وصف الخدمة:</div>
          <div class="info-value">${contract.service_description}</div>
        </div>
      </div>
      
      ${contract.contract_terms?.services && Array.isArray(contract.contract_terms.services) && contract.contract_terms.services.length > 0 ? `
      <h3 style="margin-top: 25px; margin-bottom: 15px; color: #4a5568;">تفاصيل بنود الخدمة:</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>البند</th>
            <th>الوصف</th>
            <th>الكمية</th>
            <th>سعر الوحدة</th>
            <th>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${contract.contract_terms.services.map((svc: any) => `
          <tr>
            <td>${svc.title || '-'}</td>
            <td>${svc.desc || svc.description || '-'}</td>
            <td>${svc.qty || svc.quantity || 1}</td>
            <td>${svc.unit_price ? formatCurrency(svc.unit_price) : '-'}</td>
            <td>${svc.total ? formatCurrency(svc.total) : '-'}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}
    </div>
  </div>

  <!-- البند 2 — المبلغ وطرق الدفع -->
  <div class="section">
    <h2 class="section-title">💰 البند 2 — المبلغ وطرق الدفع</h2>
    <div class="section-content">
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">إجمالي قيمة العقد:</div>
          <div class="info-value amount">${formatCurrency(contract.total_amount)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">الدفع المبدئي (عند التوقيع):</div>
          <div class="info-value amount">${formatCurrency(contract.deposit_amount)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">المتبقي:</div>
          <div class="info-value amount">${formatCurrency(contract.remaining_amount)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">طريقة الدفع المتفق عليها:</div>
          <div class="info-value">${contract.payment_method}</div>
        </div>
      </div>
      
      ${contract.payment_schedule && Array.isArray(contract.payment_schedule) && contract.payment_schedule.length > 0 ? `
      <h3 style="margin-top: 25px; margin-bottom: 15px; color: #4a5568;">جدول الدفعات:</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>المبلغ</th>
            <th>الطريقة</th>
          </tr>
        </thead>
        <tbody>
          ${contract.payment_schedule.map((p: any) => `
          <tr>
            <td>${p.date || '-'}</td>
            <td>${p.amount ? formatCurrency(p.amount) : '-'}</td>
            <td>${p.method || '-'}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}
    </div>
  </div>

  <!-- البند 3 — مواعيد التسليم -->
  <div class="section">
    <h2 class="section-title">⏰ البند 3 — مواعيد التسليم والتسليمات</h2>
    <div class="section-content">
      <div class="info-item full-width" style="margin-bottom: 20px;">
        <div class="info-label">مدة التسليم / الجدول:</div>
        <div class="info-value">${contract.timeline}</div>
      </div>
      
      ${contract.deliverables && contract.deliverables.length > 0 ? `
      <h3 style="margin-bottom: 15px; color: #4a5568;">قائمة التسليمات:</h3>
      <ul class="styled-list">
        ${contract.deliverables.map((d: string) => `<li>${d}</li>`).join('')}
      </ul>
      ` : ''}
    </div>
  </div>

  ${contract.contract_terms?.revisions ? `
  <!-- البند 4 — التعديلات والدعم -->
  <div class="section">
    <h2 class="section-title">🔄 البند 4 — التعديلات والدعم</h2>
    <div class="section-content">
      <div class="info-item">
        <div class="info-label">عدد التعديلات المسموح بها:</div>
        <div class="info-value"><strong>${contract.contract_terms.revisions}</strong> تعديلات</div>
      </div>
      <p style="margin-top: 15px; color: #718096; font-size: 14px;">
        * أي عمل إضافي خارج نطاق التعديلات المتفق عليها يُحاسب حسب اتفاق جديد.
      </p>
    </div>
  </div>
  ` : ''}

  ${contract.admin_id_card || contract.client_id_card ? `
  <!-- البند 5 — إثبات الهوية -->
  <div class="section">
    <h2 class="section-title">🪪 البند 5 — إثبات الهوية</h2>
    <div class="section-content">
      ${contract.client_id_card ? `
      <div style="margin-bottom: 25px;">
        <h4 style="color: #4a5568; margin-bottom: 12px;">بطاقة هوية العميل:</h4>
        <img src="${contract.client_id_card}" class="id-card-image" alt="بطاقة هوية العميل" />
      </div>
      ` : ''}
      
      ${contract.admin_id_card ? `
      <div>
        <h4 style="color: #4a5568; margin-bottom: 12px;">بطاقة هوية مقدم الخدمة:</h4>
        <img src="${contract.admin_id_card}" class="id-card-image" alt="بطاقة هوية المدير" />
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  ${contract.payment_proof ? `
  <!-- البند 6 — إثبات الدفع -->
  <div class="section">
    <h2 class="section-title">💳 البند 6 — إثبات الدفع ومراجعته</h2>
    <div class="section-content">
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">المبلغ المدفوع:</div>
          <div class="info-value amount">${formatCurrency(contract.payment_proof.amount)}</div>
        </div>
        ${contract.payment_proof.transaction_reference ? `
        <div class="info-item">
          <div class="info-label">رقم المعاملة:</div>
          <div class="info-value">${contract.payment_proof.transaction_reference}</div>
        </div>
        ` : ''}
        <div class="info-item">
          <div class="info-label">تاريخ الرفع:</div>
          <div class="info-value">${formatDate(contract.payment_proof.uploaded_at)}</div>
        </div>
        ${contract.payment_proof.review_status ? `
        <div class="info-item">
          <div class="info-label">حالة المراجعة:</div>
          <div class="info-value">
            <span class="badge ${contract.payment_proof.review_status === 'approved' ? 'badge-success' : 'badge-warning'}">
              ${contract.payment_proof.review_status === 'approved' ? 'مقبول ✓' : contract.payment_proof.review_status === 'rejected' ? 'مرفوض ✗' : 'قيد المراجعة'}
            </span>
          </div>
        </div>
        ` : ''}
        ${contract.payment_proof.review_notes ? `
        <div class="info-item full-width">
          <div class="info-label">ملاحظات المراجعة:</div>
          <div class="info-value">${contract.payment_proof.review_notes}</div>
        </div>
        ` : ''}
      </div>
      
      <div style="margin-top: 20px;">
        <h4 style="color: #4a5568; margin-bottom: 12px;">صورة إثبات الدفع:</h4>
        <img src="${contract.payment_proof.proof_image_url}" class="id-card-image" alt="إثبات الدفع" />
      </div>
    </div>
  </div>
  ` : ''}

  ${contract.affiliate ? `
  <!-- البند 7 — عمولة المسوّق -->
  <div class="section">
    <h2 class="section-title">🤝 البند 7 — عمولة المسوّق (الإحالة)</h2>
    <div class="section-content">
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">اسم المسوّق:</div>
          <div class="info-value">${contract.affiliate.name || '-'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">نسبة العمولة:</div>
          <div class="info-value"><strong>${contract.affiliate.commission_rate}%</strong></div>
        </div>
        <div class="info-item">
          <div class="info-label">المبلغ الحسابي:</div>
          <div class="info-value amount">${formatCurrency(contract.affiliate.commission_amount || 0)}</div>
        </div>
      </div>
    </div>
  </div>
  ` : ''}

  <div class="divider"></div>

  <!-- البند 8 — التوقيعات -->
  <div class="section">
    <h2 class="section-title">✍️ البند 8 — توقيعات وأدلة التوثيق</h2>
    <div class="section-content">
      <div class="signatures-grid">
        ${contract.admin_signature ? `
        <div class="signature-box">
          <h4>توقيع الإدارة</h4>
          <img src="${contract.admin_signature}" class="signature-image" alt="توقيع الإدارة" />
          ${contract.admin_signature_at ? `
          <div class="signature-date">
            تم التوقيع: ${formatDate(contract.admin_signature_at)}
          </div>
          ` : ''}
        </div>
        ` : ''}
        
        ${contract.client_signature ? `
        <div class="signature-box">
          <h4>توقيع العميل</h4>
          <img src="${contract.client_signature}" class="signature-image" alt="توقيع العميل" />
          ${contract.client_signature_at ? `
          <div class="signature-date">
            تم التوقيع: ${formatDate(contract.client_signature_at)}
          </div>
          ` : ''}
        </div>
        ` : ''}
      </div>
    </div>
  </div>

  ${contract.notes ? `
  <!-- ملاحظات إضافية -->
  <div class="section">
    <h2 class="section-title">📌 ملاحظات إضافية</h2>
    <div class="section-content">
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-right: 4px solid #667eea;">
        ${contract.notes}
      </div>
    </div>
  </div>
  ` : ''}

  <!-- خاتمة وأحكام عامة -->
  <div class="section">
    <h2 class="section-title">⚖️ خاتمة وأحكام عامة</h2>
    <div class="section-content">
      <p style="line-height: 2; padding: 20px; background: #fef3c7; border-radius: 8px; border-right: 5px solid #f59e0b;">
        أي إشعارات تُرسل عبر البريد الإلكتروني أو داخل المنصة الإلكترونية تُعدُّ رسمية وملزمة للطرفين. 
        يخضع هذا العقد لقانون جمهورية مصر العربية. 
        في حالة حدوث أي نزاع بين الطرفين، يُحال إلى المحاكم المختصة.
      </p>
    </div>
  </div>

  <!-- المعرف والوثائق -->
  <div class="contract-footer">
    <div class="footer-box">
      <h3 style="margin-bottom: 20px; color: #4a5568;">📋 المعرفات والوثائق</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: right;">
        <div>
          <strong>UUID:</strong> <code style="background: white; padding: 4px 8px; border-radius: 4px;">${contract.id}</code>
        </div>
        ${contractUrl ? `
        <div>
          <strong>رابط العقد:</strong> <a href="${contractUrl}" style="color: #667eea;">${contractUrl}</a>
        </div>
        ` : ''}
      </div>
    </div>
    
    <p style="margin-top: 30px; font-size: 14px;">
      هذا العقد تم إنشاؤه إلكترونياً ومصدق رقمياً
    </p>
    <p style="margin-top: 10px;">
      جميع الحقوق محفوظة © ${new Date().getFullYear()} | شركة روبوويب
    </p>
  </div>

</body>
</html>
  `
}
