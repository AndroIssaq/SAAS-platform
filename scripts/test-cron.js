#!/usr/bin/env node

/**
 * اختبار Cron Job محلياً
 * 
 * الاستخدام:
 * node scripts/test-cron.js
 * 
 * أو مع URL مخصص:
 * node scripts/test-cron.js https://your-domain.vercel.app
 */

const https = require('https');
const http = require('http');

// الحصول على URL من arguments أو استخدام localhost
const baseUrl = process.argv[2] || 'http://localhost:3000';
const url = `${baseUrl}/api/cron/keep-alive`;

console.log('🧪 اختبار Cron Job...');
console.log(`📍 URL: ${url}\n`);

const protocol = url.startsWith('https') ? https : http;

const startTime = Date.now();

protocol.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`⏱️  المدة: ${duration}ms`);
    console.log(`📊 Status Code: ${res.statusCode}\n`);

    try {
      const json = JSON.parse(data);
      console.log('📄 الاستجابة:');
      console.log(JSON.stringify(json, null, 2));

      if (json.success) {
        console.log('\n✅ الاختبار نجح!');
        console.log(`✅ ${json.queries_succeeded}/${json.total_queries} queries نجحت`);
      } else {
        console.log('\n❌ الاختبار فشل!');
        console.log(`❌ الخطأ: ${json.error}`);
        process.exit(1);
      }
    } catch (error) {
      console.log('❌ خطأ في تحليل JSON:');
      console.log(data);
      process.exit(1);
    }
  });
}).on('error', (error) => {
  console.log('❌ خطأ في الاتصال:');
  console.log(error.message);
  process.exit(1);
});
