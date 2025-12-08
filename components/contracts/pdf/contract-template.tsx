/**
 * Contract PDF Template
 * Professional Arabic contract document with all legal proofs
 */

import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'

// Register Arabic font (you'll need to add this to public/fonts)
// For now, we'll use default fonts and RTL support

interface ContractData {
  // Basic Info
  contract_number: string
  created_at: string
  
  // Parties
  client_name: string
  client_email: string
  client_phone: string
  company_name?: string
  
  // Service Details
  service_type: string
  package_name: string
  service_description: string
  
  // Financial
  total_amount: number
  deposit_amount: number
  remaining_amount: number
  payment_method: string
  
  // Terms
  timeline: string
  deliverables: string[]
  notes?: string
  
  // Legal Proofs
  admin_signature?: string
  client_signature?: string
  admin_signature_at?: string
  client_signature_at?: string
  admin_id_card?: string
  client_id_card?: string
  payment_proof?: {
    proof_image_url: string
    transaction_reference?: string
    amount: number
    uploaded_at: string
  }
}

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    direction: 'rtl',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #2563eb',
    paddingBottom: 15,
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center',
    marginBottom: 10,
  },
  contractNumber: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10,
    backgroundColor: '#eff6ff',
    padding: 8,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
    width: '35%',
  },
  value: {
    fontSize: 11,
    color: '#1e293b',
    width: '65%',
  },
  divider: {
    borderBottom: '1 solid #e2e8f0',
    marginVertical: 15,
  },
  deliverableItem: {
    fontSize: 10,
    color: '#334155',
    marginBottom: 5,
    marginLeft: 15,
  },
  proofSection: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  signatureContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    padding: 10,
    border: '1 solid #cbd5e1',
    borderRadius: 8,
  },
  signatureImage: {
    width: '100%',
    height: 60,
    marginBottom: 8,
    objectFit: 'contain',
  },
  signatureLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 5,
  },
  signatureDate: {
    fontSize: 9,
    color: '#64748b',
  },
  idCardImage: {
    width: '100%',
    height: 150,
    marginTop: 10,
    objectFit: 'contain',
    border: '1 solid #e2e8f0',
    borderRadius: 4,
  },
  paymentProofImage: {
    width: '100%',
    height: 200,
    marginTop: 10,
    objectFit: 'contain',
    border: '1 solid #e2e8f0',
    borderRadius: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#94a3b8',
    borderTop: '1 solid #e2e8f0',
    paddingTop: 10,
  },
  badge: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontSize: 9,
    padding: '4 8',
    borderRadius: 4,
    marginLeft: 10,
  },
  amount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
})

export const ContractPDF = ({ contract }: { contract: ContractData }) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('ar-EG')} ج.م`
  }

  return (
    <Document>
      {/* Page 1: Contract Details */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>عقد تقديم خدمات</Text>
          <Text style={styles.contractNumber}>
            رقم العقد: {contract.contract_number}
          </Text>
          <Text style={styles.contractNumber}>
            تاريخ الإصدار: {formatDate(contract.created_at)}
          </Text>
        </View>

        {/* Parties Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤝 أطراف العقد</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>الطرف الأول (مقدم الخدمة):</Text>
            <Text style={styles.value}>شركة روبوويب</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>الطرف الثاني (العميل):</Text>
            <Text style={styles.value}>{contract.client_name}</Text>
          </View>
          
          {contract.company_name && (
            <View style={styles.row}>
              <Text style={styles.label}>اسم الشركة:</Text>
              <Text style={styles.value}>{contract.company_name}</Text>
            </View>
          )}
          
          <View style={styles.row}>
            <Text style={styles.label}>البريد الإلكتروني:</Text>
            <Text style={styles.value}>{contract.client_email}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>رقم الهاتف:</Text>
            <Text style={styles.value}>{contract.client_phone}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Service Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 تفاصيل الخدمة</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>نوع الخدمة:</Text>
            <Text style={styles.value}>{contract.service_type}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>الباقة:</Text>
            <Text style={styles.value}>{contract.package_name}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>الوصف:</Text>
            <Text style={styles.value}>{contract.service_description}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>المدة الزمنية:</Text>
            <Text style={styles.value}>{contract.timeline}</Text>
          </View>
        </View>

        {/* Deliverables */}
        {contract.deliverables && contract.deliverables.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ المخرجات المتوقعة</Text>
            {contract.deliverables.map((item, index) => (
              <Text key={index} style={styles.deliverableItem}>
                • {item}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.divider} />

        {/* Financial Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 الشروط المالية</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>القيمة الإجمالية:</Text>
            <Text style={[styles.value, styles.amount]}>
              {formatCurrency(contract.total_amount)}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>المبلغ المقدم (العربون):</Text>
            <Text style={styles.value}>
              {formatCurrency(contract.deposit_amount)}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>المبلغ المتبقي:</Text>
            <Text style={styles.value}>
              {formatCurrency(contract.remaining_amount)}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>طريقة الدفع:</Text>
            <Text style={styles.value}>{contract.payment_method}</Text>
          </View>
        </View>

        {/* Notes */}
        {contract.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 ملاحظات إضافية</Text>
            <Text style={styles.value}>{contract.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          هذا العقد تم إنشاؤه إلكترونياً ومصدق رقمياً | جميع الحقوق محفوظة © {new Date().getFullYear()}
        </Text>
      </Page>

      {/* Page 2: Legal Proofs */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>الإثباتات القانونية</Text>
          <Text style={styles.contractNumber}>
            عقد رقم: {contract.contract_number}
          </Text>
        </View>

        {/* Signatures */}
        {(contract.admin_signature || contract.client_signature) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✍️ التوقيعات الإلكترونية</Text>
            
            <View style={styles.signatureContainer}>
              {/* Admin Signature */}
              {contract.admin_signature && (
                <View style={styles.signatureBox}>
                  <Text style={styles.signatureLabel}>توقيع المدير</Text>
                  <Image 
                    src={contract.admin_signature} 
                    style={styles.signatureImage}
                  />
                  {contract.admin_signature_at && (
                    <Text style={styles.signatureDate}>
                      التاريخ: {formatDate(contract.admin_signature_at)}
                    </Text>
                  )}
                </View>
              )}
              
              {/* Client Signature */}
              {contract.client_signature && (
                <View style={styles.signatureBox}>
                  <Text style={styles.signatureLabel}>توقيع العميل</Text>
                  <Image 
                    src={contract.client_signature} 
                    style={styles.signatureImage}
                  />
                  {contract.client_signature_at && (
                    <Text style={styles.signatureDate}>
                      التاريخ: {formatDate(contract.client_signature_at)}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.divider} />

        {/* ID Cards */}
        {(contract.admin_id_card || contract.client_id_card) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🪪 بطاقات الهوية</Text>
            
            {contract.admin_id_card && (
              <View style={styles.proofSection}>
                <Text style={styles.signatureLabel}>بطاقة هوية المدير</Text>
                <Image 
                  src={contract.admin_id_card} 
                  style={styles.idCardImage}
                />
              </View>
            )}
            
            {contract.client_id_card && (
              <View style={styles.proofSection}>
                <Text style={styles.signatureLabel}>بطاقة هوية العميل</Text>
                <Image 
                  src={contract.client_id_card} 
                  style={styles.idCardImage}
                />
              </View>
            )}
          </View>
        )}

        {/* Payment Proof */}
        {contract.payment_proof && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💳 إثبات الدفع</Text>
            
            <View style={styles.proofSection}>
              <View style={styles.row}>
                <Text style={styles.label}>المبلغ المدفوع:</Text>
                <Text style={[styles.value, styles.amount]}>
                  {formatCurrency(contract.payment_proof.amount)}
                </Text>
              </View>
              
              {contract.payment_proof.transaction_reference && (
                <View style={styles.row}>
                  <Text style={styles.label}>رقم المعاملة:</Text>
                  <Text style={styles.value}>
                    {contract.payment_proof.transaction_reference}
                  </Text>
                </View>
              )}
              
              <View style={styles.row}>
                <Text style={styles.label}>تاريخ الرفع:</Text>
                <Text style={styles.value}>
                  {formatDate(contract.payment_proof.uploaded_at)}
                </Text>
              </View>
              
              <Image 
                src={contract.payment_proof.proof_image_url} 
                style={styles.paymentProofImage}
              />
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          تم التحقق من صحة جميع الإثباتات القانونية | العقد ملزم قانونياً
        </Text>
      </Page>
    </Document>
  )
}
