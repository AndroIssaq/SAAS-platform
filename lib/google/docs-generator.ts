/**
 * Google Docs Contract Generator
 * Creates professional Arabic contracts using Google Docs API
 */

'use server'

import { google } from 'googleapis'
import { ContractPDFData } from '@/lib/actions/contract-pdf'

/**
 * Initialize Google Docs API
 */
function getDocsClient() {
  // Use service account for server-side authentication
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: [
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/drive.file',
    ],
  })

  const docs = google.docs({ version: 'v1', auth })
  const drive = google.drive({ version: 'v3', auth })

  return { docs, drive, auth }
}

/**
 * Create contract document
 */
export async function createContractDocument(
  contractData: ContractPDFData
): Promise<{
  success: boolean
  documentId?: string
  documentUrl?: string
  error?: string
}> {
  try {
    const { docs, drive } = getDocsClient()

    // Create new Google Doc using Drive API (more reliable)
    const fileMetadata = {
      name: `عقد رقم ${contractData.contract_number} - ${contractData.client_name}`,
      mimeType: 'application/vnd.google-apps.document',
    }

    const file = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    })

    const documentId = file.data.id

    if (!documentId) {
      throw new Error('Failed to create document')
    }

    // Build document content
    const requests = buildDocumentContent(contractData)

    // Batch update document with content
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests,
      },
    })

    // Make document readable by anyone with link
    await drive.permissions.create({
      fileId: documentId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`

    return {
      success: true,
      documentId,
      documentUrl,
    }
  } catch (error: any) {
    console.error('Error creating Google Doc:', error)
    
    // Provide more detailed error message
    let errorMessage = 'فشل في إنشاء المستند'
    
    if (error.code === 403) {
      errorMessage = 'خطأ في الصلاحيات - تأكد من تفعيل Google Docs API و Google Drive API'
    } else if (error.code === 401) {
      errorMessage = 'خطأ في المصادقة - تحقق من صحة بيانات Service Account'
    }
    
    return {
      success: false,
      error: `${errorMessage}\n\nتفاصيل: ${error.message}`,
    }
  }
}

/**
 * Build document content structure
 */
function buildDocumentContent(contract: ContractPDFData) {
  const requests: any[] = []
  let currentIndex = 1

  // Helper to add text
  const addText = (text: string, style?: any) => {
    requests.push({
      insertText: {
        location: { index: currentIndex },
        text: text + '\n',
      },
    })

    if (style) {
      requests.push({
        updateTextStyle: {
          range: {
            startIndex: currentIndex,
            endIndex: currentIndex + text.length,
          },
          textStyle: style,
          fields: Object.keys(style).join(','),
        },
      })
    }

    currentIndex += text.length + 1
  }

  // Helper to add heading
  const addHeading = (text: string, level: 1 | 2 | 3 = 1) => {
    const startIndex = currentIndex
    addText(text)
    requests.push({
      updateParagraphStyle: {
        range: {
          startIndex,
          endIndex: currentIndex - 1,
        },
        paragraphStyle: {
          namedStyleType: `HEADING_${level}`,
          alignment: 'END', // Right align for Arabic
        },
        fields: 'namedStyleType,alignment',
      },
    })
  }

  // Title
  addHeading('عقد تقديم خدمات', 1)
  addText(`رقم العقد: ${contract.contract_number}`)
  addText(`تاريخ الإصدار: ${formatDate(contract.created_at)}`)
  addText('\n')

  // Parties Section
  addHeading('أطراف العقد 🤝', 2)
  addText(`الطرف الأول (مقدم الخدمة): شركة روبوويب`)
  addText(`الطرف الثاني (العميل): ${contract.client_name}`)
  if (contract.company_name) {
    addText(`اسم الشركة: ${contract.company_name}`)
  }
  addText(`البريد الإلكتروني: ${contract.client_email}`)
  addText(`رقم الهاتف: ${contract.client_phone}`)
  addText('\n')

  // Service Details
  addHeading('تفاصيل الخدمة 📋', 2)
  addText(`نوع الخدمة: ${contract.service_type}`)
  addText(`الباقة: ${contract.package_name}`)
  addText(`الوصف: ${contract.service_description}`)
  addText(`المدة الزمنية: ${contract.timeline}`)
  addText('\n')

  // Deliverables
  if (contract.deliverables && contract.deliverables.length > 0) {
    addHeading('المخرجات المتوقعة ✅', 2)
    contract.deliverables.forEach((item) => {
      addText(`• ${item}`)
    })
    addText('\n')
  }

  // Financial Terms
  addHeading('الشروط المالية 💰', 2)
  addText(`القيمة الإجمالية: ${formatCurrency(contract.total_amount)}`, {
    bold: true,
    foregroundColor: { color: { rgbColor: { red: 0.02, green: 0.58, blue: 0.41 } } },
  })
  addText(`المبلغ المقدم (العربون): ${formatCurrency(contract.deposit_amount)}`)
  addText(`المبلغ المتبقي: ${formatCurrency(contract.remaining_amount)}`)
  addText(`طريقة الدفع: ${contract.payment_method}`)
  addText('\n')

  // Notes
  if (contract.notes) {
    addHeading('ملاحظات إضافية 📝', 2)
    addText(contract.notes)
    addText('\n')
  }

  // Legal Proofs Section
  addText('\n\n═══════════════════════════════════════════\n\n')
  addHeading('الإثباتات القانونية', 1)
  addText('\n')

  // Signatures
  if (contract.admin_signature || contract.client_signature) {
    addHeading('التوقيعات الإلكترونية ✍️', 2)
    
    if (contract.admin_signature) {
      addText('توقيع المدير:', { bold: true })
      addText(`الرابط: ${contract.admin_signature}`)
      if (contract.admin_signature_at) {
        addText(`التاريخ: ${formatDate(contract.admin_signature_at)}`)
      }
      addText('')
    }

    if (contract.client_signature) {
      addText('توقيع العميل:', { bold: true })
      addText(`الرابط: ${contract.client_signature}`)
      if (contract.client_signature_at) {
        addText(`التاريخ: ${formatDate(contract.client_signature_at)}`)
      }
      addText('')
    }
    addText('\n')
  }

  // ID Cards
  if (contract.admin_id_card || contract.client_id_card) {
    addHeading('بطاقات الهوية 🪪', 2)
    
    if (contract.admin_id_card) {
      addText('بطاقة هوية المدير:', { bold: true })
      addText(`الرابط: ${contract.admin_id_card}`)
      addText('')
    }

    if (contract.client_id_card) {
      addText('بطاقة هوية العميل:', { bold: true })
      addText(`الرابط: ${contract.client_id_card}`)
      addText('')
    }
    addText('\n')
  }

  // Payment Proof
  if (contract.payment_proof) {
    addHeading('إثبات الدفع 💳', 2)
    addText(`المبلغ المدفوع: ${formatCurrency(contract.payment_proof.amount)}`, {
      bold: true,
      foregroundColor: { color: { rgbColor: { red: 0.02, green: 0.58, blue: 0.41 } } },
    })
    
    if (contract.payment_proof.transaction_reference) {
      addText(`رقم المعاملة: ${contract.payment_proof.transaction_reference}`)
    }
    
    addText(`تاريخ الرفع: ${formatDate(contract.payment_proof.uploaded_at)}`)
    addText(`الرابط: ${contract.payment_proof.proof_image_url}`)
    addText('\n')
  }

  // Footer
  addText('\n\n')
  addText('═'.repeat(50))
  addText('هذا العقد تم إنشاؤه إلكترونياً ومصدق رقمياً', {
    italic: true,
    fontSize: { magnitude: 10, unit: 'PT' },
  })
  addText(`جميع الحقوق محفوظة © ${new Date().getFullYear()}`, {
    italic: true,
    fontSize: { magnitude: 10, unit: 'PT' },
  })

  return requests
}

/**
 * Format date for Arabic
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ar-EG')} جنيه مصري`
}

/**
 * Export contract as PDF from Google Docs
 */
export async function exportContractAsPDF(documentId: string): Promise<{
  success: boolean
  pdfUrl?: string
  error?: string
}> {
  try {
    const { drive } = getDocsClient()

    const response = await drive.files.export(
      {
        fileId: documentId,
        mimeType: 'application/pdf',
      },
      { responseType: 'stream' }
    )

    // In production, you would upload this to Supabase Storage
    // For now, return the Google Drive PDF link
    const pdfUrl = `https://docs.google.com/document/d/${documentId}/export?format=pdf`

    return {
      success: true,
      pdfUrl,
    }
  } catch (error: any) {
    console.error('Error exporting PDF:', error)
    return {
      success: false,
      error: error.message || 'فشل في تصدير PDF',
    }
  }
}
