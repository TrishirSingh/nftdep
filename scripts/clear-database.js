/**
 * Script to clear all database collections
 * 
 * Usage:
 * 1. Set ADMIN_SECRET in .env.local
 * 2. Run: node scripts/clear-database.js
 * 
 * Or use the API endpoint:
 * curl -X POST http://localhost:3000/api/admin/clear-database \
 *   -H "x-admin-secret: YOUR_SECRET_KEY" \
 *   -H "Content-Type: application/json"
 */

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'dev-secret-change-in-production';
const API_URL = process.env.API_URL || 'https://nftdep.vercel.app';

async function clearDatabase() {
  try {
    console.log('🗑️  Clearing database...');
    console.log(`📡 Calling: ${API_URL}/api/admin/clear-database`);
    
    const response = await fetch(`${API_URL}/api/admin/clear-database`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': ADMIN_SECRET
      },
      body: JSON.stringify({ secret: ADMIN_SECRET })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error:', data.error || data.message);
      process.exit(1);
    }

    console.log('\n✅ Database cleared successfully!\n');
    console.log('📊 Results:');
    console.log('─'.repeat(50));
    
    if (data.results.cleared.length > 0) {
      console.log('\n🗑️  Cleared Collections:');
      data.results.cleared.forEach(item => {
        console.log(`   ✓ ${item.collection}: ${item.deletedCount} documents deleted`);
      });
    }

    if (data.results.notFound.length > 0) {
      console.log('\n📭 Empty/Not Found Collections:');
      data.results.notFound.forEach(item => {
        console.log(`   ○ ${item.collection}: ${item.message}`);
      });
    }

    if (data.results.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      data.results.errors.forEach(item => {
        console.log(`   ✗ ${item.collection}: ${item.error}`);
      });
    }

    console.log('\n📈 Final Counts:');
    console.log('─'.repeat(50));
    Object.entries(data.finalCounts).forEach(([collection, count]) => {
      const status = count === 0 ? '✓' : count === 'error' ? '✗' : '⚠';
      console.log(`   ${status} ${collection}: ${count}`);
    });

    console.log(`\n🕐 Timestamp: ${data.timestamp}\n`);
    console.log('✨ Database is now ready for deployment!\n');

  } catch (error) {
    console.error('❌ Failed to clear database:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. Your server is running (npm run dev)');
    console.error('   2. ADMIN_SECRET is set in .env.local');
    console.error('   3. MongoDB is connected\n');
    process.exit(1);
  }
}

// Run the script
clearDatabase();

