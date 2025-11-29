const { supabase } = require('../utils/supabase');

// Setup all required Supabase tables
async function setupCollections() {
  try {
    console.log('Setting up Supabase tables...');
    
    // Create indexes for common queries
    console.log('Creating indexes...');
    
    console.log('Setting up Supabase tables...');
    // Tables will be created automatically when data is inserted
    // This script is kept for reference but doesn't need to do anything
    
    console.log('Supabase tables setup completed!');
    console.log('\nNext steps:');
    console.log('1. Manually add admin users to the admins table');
    console.log('2. Add initial contest data if needed');
    console.log('3. Populate question banks for other games if needed');
    
  } catch (error) {
    console.error('Error setting up Supabase tables:', error);
  }
}

// Create sample admin user
async function createSampleAdmin() {
  try {
    console.log('Creating sample admin user...');
    
    // Note: In a real application, you would manually add admin users
    // to the Supabase Authentication and then to the admins table
    const adminData = {
      email: 'admin@skillbetarena.com',
      displayName: 'Admin User',
      role: 'super_admin', // super_admin, moderator, support
      createdAt: new Date(),
      lastLoginAt: new Date()
    };
    
    console.log('Sample admin data:', adminData);
    console.log('Remember to manually add this admin to Supabase Authentication');
    
  } catch (error) {
    console.error('Error creating sample admin:', error);
  }
}

// Create sample contests
async function createSampleContests() {
  try {
    console.log('Creating sample contests...');
    
    const sampleContests = [
      {
        name: 'Coding Challenge - Beginner',
        gameType: 'coding',
        difficulty: 'beginner',
        entryFee: 10,
        prizePool: 90, // 10 users, 10% platform fee
        maxPlayers: 10,
        currentPlayers: 0,
        startTime: new Date(Date.now() + 3600000), // 1 hour from now
        duration: 30, // minutes
        status: 'active',
        createdBy: 'system',
        createdAt: new Date()
      },
      {
        name: 'Maths Quiz - Intermediate',
        gameType: 'maths',
        difficulty: 'intermediate',
        entryFee: 20,
        prizePool: 180, // 10 users, 10% platform fee
        maxPlayers: 10,
        currentPlayers: 0,
        startTime: new Date(Date.now() + 7200000), // 2 hours from now
        duration: 15, // minutes
        status: 'active',
        createdBy: 'system',
        createdAt: new Date()
      },
      {
        name: 'Memory Pattern - Expert',
        gameType: 'memory',
        difficulty: 'expert',
        entryFee: 50,
        prizePool: 450, // 10 users, 10% platform fee
        maxPlayers: 10,
        currentPlayers: 0,
        startTime: new Date(Date.now() + 10800000), // 3 hours from now
        duration: 10, // minutes
        status: 'active',
        createdBy: 'system',
        createdAt: new Date()
      }
    ];
    
    for (const contest of sampleContests) {
      const { data, error } = await supabase
        .from('contests')
        .insert([contest]);
      
      if (error) {
        console.error('Error creating contest:', error);
      } else {
        console.log(`Created contest: ${contest.name}`);
      }
    }
    
  } catch (error) {
    console.error('Error creating sample contests:', error);
  }
}

// Run setup
async function runSetup() {
  await setupCollections();
  await createSampleAdmin();
  await createSampleContests();
  console.log('Setup completed!');
}

// Execute if run directly
if (require.main === module) {
  runSetup().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = {
  setupCollections,
  createSampleAdmin,
  createSampleContests
};