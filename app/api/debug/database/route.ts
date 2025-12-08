import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Debug endpoint للتحقق من حالة قاعدة البيانات
 * GET /api/debug/database
 */
export async function GET(request: NextRequest) {
  console.log("🔍 Starting database diagnosis...")
  
  try {
    const supabase = createAdminClient()
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: []
    }

    // Test 1: Check if contracts table exists and is accessible
    console.log("📋 Testing contracts table access...")
    try {
      const { data: contractsTest, error: contractsError } = await supabase
        .from("contracts")
        .select("id, client_email, contract_number")
        .limit(1)
      
      results.tests.push({
        test: "contracts_table_access",
        status: contractsError ? "failed" : "passed",
        error: contractsError,
        sampleData: contractsTest?.[0] || null
      })
      console.log("✅ Contracts table test:", contractsError ? "FAILED" : "PASSED")
    } catch (err) {
      results.tests.push({
        test: "contracts_table_access",
        status: "failed",
        error: err
      })
      console.error("❌ Contracts table test failed:", err)
    }

    // Test 2: Check if contract_otp table exists
    console.log("🔐 Testing contract_otp table access...")
    try {
      const { data: otpTest, error: otpError } = await supabase
        .from("contract_otp")
        .select("id, contract_id, otp_code, verified, created_at")
        .limit(5)
      
      results.tests.push({
        test: "contract_otp_table_access",
        status: otpError ? "failed" : "passed", 
        error: otpError,
        recordsCount: otpTest?.length || 0,
        sampleRecords: otpTest || []
      })
      console.log("✅ contract_otp table test:", otpError ? "FAILED" : "PASSED")
      console.log(`📊 Found ${otpTest?.length || 0} OTP records`)
    } catch (err) {
      results.tests.push({
        test: "contract_otp_table_access", 
        status: "failed",
        error: err
      })
      console.error("❌ contract_otp table test failed:", err)
    }

    // Test 3: Check RLS policies
    console.log("🛡️ Testing RLS policies...")
    try {
      // Test inserting a dummy OTP record
      const testContractId = "test-contract-id"
      const testOtpData = {
        contract_id: testContractId,
        email: "test@example.com",
        otp_code: "123456",
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        verified: false,
        attempts: 0
      }

      const { error: insertError } = await supabase
        .from("contract_otp")
        .insert(testOtpData)

      if (!insertError) {
        // Clean up test record
        await supabase
          .from("contract_otp")
          .delete()
          .eq("contract_id", testContractId)
      }

      results.tests.push({
        test: "rls_policies_insert",
        status: insertError ? "failed" : "passed",
        error: insertError
      })
      console.log("✅ RLS policies test:", insertError ? "FAILED" : "PASSED")
    } catch (err) {
      results.tests.push({
        test: "rls_policies_insert",
        status: "failed", 
        error: err
      })
      console.error("❌ RLS policies test failed:", err)
    }

    // Test 4: Environment variables check
    console.log("🔧 Checking environment variables...")
    const envCheck = {
      test: "environment_variables",
      status: "info",
      variables: {
        SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        RESEND_API_KEY: !!process.env.RESEND_API_KEY,
        NODE_ENV: process.env.NODE_ENV
      }
    }
    results.tests.push(envCheck)
    console.log("🔧 Environment check:", envCheck.variables)

    // Summary
    const passedTests = results.tests.filter((t: any) => t.status === "passed").length
    const failedTests = results.tests.filter((t: any) => t.status === "failed").length
    
    results.summary = {
      total: results.tests.length - 1, // Exclude env check
      passed: passedTests,
      failed: failedTests,
      overall: failedTests === 0 ? "healthy" : "issues_detected"
    }

    console.log(`🎯 Database diagnosis completed: ${passedTests}/${results.tests.length - 1} tests passed`)

    return NextResponse.json(results, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    console.error("❌ Critical error in database diagnosis:", error)
    return NextResponse.json({
      error: "Database diagnosis failed",
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
