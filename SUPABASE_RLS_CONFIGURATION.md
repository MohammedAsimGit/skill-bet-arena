# Supabase RLS (Row Level Security) Configuration Guide

This guide details how to configure Row Level Security (RLS) policies to protect data in the SkillBet Arena application using Supabase.

## Overview

Row Level Security (RLS) is a PostgreSQL feature that enables fine-grained access control at the row level. With RLS, you can define policies that restrict which rows can be accessed by different users or roles.

## RLS Fundamentals

### 1. Enabling RLS

RLS must be enabled on each table that requires access control:

```sql
-- Enable RLS on a table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### 2. RLS Policy Types

Supabase supports several types of RLS policies:

- **SELECT** - Controls who can read rows
- **INSERT** - Controls who can create rows
- **UPDATE** - Controls who can modify rows
- **DELETE** - Controls who can delete rows
- **ALL** - Applies to all operations

### 3. Policy Syntax

```sql
CREATE POLICY policy_name ON table_name
FOR operation USING (condition) WITH CHECK (condition);
```

## RLS Policy Implementation

### 1. Users Table Policies

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" 
ON users FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" 
ON users FOR UPDATE 
USING (auth.uid() = id);

-- Users can insert their own data (for initial creation)
CREATE POLICY "Users can insert own data" 
ON users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Admins can read all user data
CREATE POLICY "Admins can read all user data" 
ON users FOR SELECT 
USING ( EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND u.subscription_type = 'admin'
));

-- Admins can update all user data
CREATE POLICY "Admins can update all user data" 
ON users FOR UPDATE 
USING ( EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND u.subscription_type = 'admin'
));
```

### 2. Wallets Table Policies

```sql
-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Users can read their own wallet
CREATE POLICY "Users can read own wallet" 
ON wallets FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own wallet
CREATE POLICY "Users can update own wallet" 
ON wallets FOR UPDATE 
USING (auth.uid() = user_id);

-- Admins can read all wallets
CREATE POLICY "Admins can read all wallets" 
ON wallets FOR SELECT 
USING ( EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND u.subscription_type = 'admin'
));

-- Admins can update all wallets
CREATE POLICY "Admins can update all wallets" 
ON wallets FOR UPDATE 
USING ( EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND u.subscription_type = 'admin'
));
```

### 3. Contests Table Policies

```sql
-- Enable RLS
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;

-- Everyone can read public contests
CREATE POLICY "Everyone can read public contests" 
ON contests FOR SELECT 
USING (is_private = false);

-- Users can read private contests they have access to
CREATE POLICY "Users can read accessible private contests" 
ON contests FOR SELECT 
USING (is_private = true AND access_code IS NOT NULL);

-- Authenticated users can create contests
CREATE POLICY "Authenticated users can create contests" 
ON contests FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Contest creators can update their own contests
CREATE POLICY "Contest creators can update their contests" 
ON contests FOR UPDATE 
USING (auth.uid() = created_by);

-- Admins can read all contests
CREATE POLICY "Admins can read all contests" 
ON contests FOR SELECT 
USING ( EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND u.subscription_type = 'admin'
));

-- Admins can update all contests
CREATE POLICY "Admins can update all contests" 
ON contests FOR UPDATE 
USING ( EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND u.subscription_type = 'admin'
));
```

### 4. Transactions Table Policies

```sql
-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own transactions
CREATE POLICY "Users can read own transactions" 
ON transactions FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can read all transactions
CREATE POLICY "Admins can read all transactions" 
ON transactions FOR SELECT 
USING ( EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND u.subscription_type = 'admin'
));
```

### 5. Results Table Policies

```sql
-- Enable RLS
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Users can read their own results
CREATE POLICY "Users can read own results" 
ON results FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own results
CREATE POLICY "Users can insert own results" 
ON results FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Everyone can read results for public contests
CREATE POLICY "Everyone can read public contest results" 
ON results FOR SELECT 
USING ( EXISTS (
  SELECT 1 FROM contests c 
  WHERE c.id = results.contest_id 
  AND c.is_private = false
));

-- Admins can read all results
CREATE POLICY "Admins can read all results" 
ON results FOR SELECT 
USING ( EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND u.subscription_type = 'admin'
));
```

### 6. Storage Bucket Policies

```sql
-- RLS Policies for avatars bucket
CREATE POLICY "Users can upload an avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can read avatars"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'avatars');

-- RLS Policies for game-assets bucket
CREATE POLICY "Admins can upload game assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'game-assets' 
  AND EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.subscription_type = 'admin'
  )
);

CREATE POLICY "Anyone can read game assets"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'game-assets');
```

## Advanced RLS Policies

### 1. Time-based Access Control

```sql
-- Users can only update their profile during business hours
CREATE POLICY "Users can update profile during business hours"
ON users FOR UPDATE
USING (
  auth.uid() = id 
  AND EXTRACT(HOUR FROM NOW()) BETWEEN 9 AND 17
);
```

### 2. Role-based Access Control

```sql
-- Different access levels based on user roles
CREATE POLICY "Moderators can update user status"
ON users FOR UPDATE
USING ( EXISTS (
  SELECT 1 FROM users u 
  WHERE u.id = auth.uid() 
  AND u.subscription_type IN ('moderator', 'admin')
));
```

### 3. Multi-tenant Access Control

```sql
-- Users can only access data belonging to their organization
CREATE POLICY "Users can access org data"
ON projects FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM user_organizations 
  WHERE user_id = auth.uid()
));
```

## RLS Policy Management

### 1. Viewing Existing Policies

```sql
-- View all policies on a table
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users';

-- View all policies in the database
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### 2. Dropping Policies

```sql
-- Drop a specific policy
DROP POLICY "Users can read own data" ON users;

-- Drop all policies on a table
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
-- ... drop other policies
```

### 3. Altering Policies

```sql
-- Alter an existing policy
ALTER POLICY "Users can read own data" ON users
USING (auth.uid() = id AND is_banned = false);
```

## Testing RLS Policies

### 1. Unit Tests

```javascript
// Test RLS policies
describe('RLS Policies', () => {
  test('users should only access their own data', async () => {
    // Login as regular user
    const { data: { user } } = await supabase.auth.signInWithPassword({
      email: 'user@example.com',
      password: 'password123'
    });
    
    // Try to access another user's data
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', 'another-user-id');
    
    // Should return empty result due to RLS
    expect(data).toHaveLength(0);
    expect(error).toBeNull();
  });
  
  test('admins should access all user data', async () => {
    // Login as admin
    const { data: { user } } = await supabase.auth.signInWithPassword({
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    // Access another user's data
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', 'regular-user-id');
    
    // Should return data due to admin policy
    expect(data).toHaveLength(1);
    expect(error).toBeNull();
  });
});
```

### 2. Integration Tests

```javascript
// Test complete RLS flow
describe('Complete RLS Flow', () => {
  test('should enforce proper access control throughout application', async () => {
    // 1. Regular user creates a wallet
    const { data: { user: regularUser } } = await supabase.auth.signInWithPassword({
      email: 'regular@example.com',
      password: 'password123'
    });
    
    const { data: regularWallet } = await supabase
      .from('wallets')
      .insert({ user_id: regularUser.id, balance: 100 })
      .select();
    
    // 2. Try to access wallet as different user
    await supabase.auth.signInWithPassword({
      email: 'other@example.com',
      password: 'other123'
    });
    
    const { data: otherAccess } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', regularWallet[0].id);
    
    // Should be denied due to RLS
    expect(otherAccess).toHaveLength(0);
    
    // 3. Admin accesses wallet
    await supabase.auth.signInWithPassword({
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const { data: adminAccess } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', regularWallet[0].id);
    
    // Should be allowed due to admin policy
    expect(adminAccess).toHaveLength(1);
  });
});
```

## Common RLS Patterns

### 1. User-owned Data Pattern

```sql
-- Most common pattern: users can only access their own data
CREATE POLICY "Owner access"
ON table_name FOR ALL
USING (auth.uid() = user_id);
```

### 2. Public Read, Owner Write Pattern

```sql
-- Public can read, only owner can write
CREATE POLICY "Public read, owner write"
ON table_name FOR SELECT
USING (true); -- Everyone can read

CREATE POLICY "Owner write"
ON table_name FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### 3. Team/Group Access Pattern

```sql
-- Users can access data shared with their team
CREATE POLICY "Team access"
ON table_name FOR ALL
USING (team_id IN (
  SELECT team_id FROM team_members 
  WHERE user_id = auth.uid()
));
```

### 4. Admin Override Pattern

```sql
-- Regular users have limited access, admins have full access
CREATE POLICY "User access"
ON table_name FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admin override"
ON table_name FOR ALL
USING ( EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() AND subscription_type = 'admin'
));
```

## Security Best Practices

### 1. Principle of Least Privilege

```sql
-- Only grant necessary permissions
-- Instead of granting full table access
GRANT ALL ON users TO authenticated;

-- Grant specific permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
```

### 2. Defense in Depth

```sql
-- Combine RLS with application-level checks
-- Application code should also validate permissions
async function updateUserProfile(userId, updates) {
  // Application-level check
  const currentUser = await supabase.auth.getUser();
  if (currentUser.data.user.id !== userId) {
    throw new Error('Unauthorized');
  }
  
  // Database-level check (RLS)
  return await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);
}
```

### 3. Regular Policy Audits

```sql
-- Regularly audit policies
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 4. Monitoring and Logging

```sql
-- Enable query logging for security auditing
-- In Supabase dashboard, enable detailed logging
-- Monitor for unauthorized access attempts
```

## Troubleshooting RLS Issues

### 1. Permission Denied Errors

**Symptom:** `permission denied for table`

**Solution:** 
1. Check if RLS is enabled on the table
2. Verify policies exist for the operation
3. Ensure user meets policy conditions

```sql
-- Check if RLS is enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'users';

-- Check existing policies
SELECT * FROM pg_policies 
WHERE tablename = 'users';
```

### 2. Empty Results

**Symptom:** Queries return empty results unexpectedly

**Solution:**
1. Verify policy conditions are correct
2. Check user authentication status
3. Test policies with simple queries

```sql
-- Test policy manually
SELECT * FROM users 
WHERE auth.uid() = 'user-id-here';
```

### 3. Performance Issues

**Symptom:** Slow queries with RLS enabled

**Solution:**
1. Add indexes on columns used in policy conditions
2. Simplify complex policy conditions
3. Use materialized views for complex joins

```sql
-- Add index for common policy condition
CREATE INDEX idx_users_auth_uid ON users(auth.uid());
```

## Migration Strategy

### 1. Gradual Rollout

1. **Phase 1:** Enable RLS with permissive policies
2. **Phase 2:** Implement restrictive policies
3. **Phase 3:** Test and refine policies
4. **Phase 4:** Monitor and audit

### 2. Backup and Recovery

```sql
-- Backup policies before changes
COPY (
  SELECT * FROM pg_policies WHERE schemaname = 'public'
) TO '/backup/policies_backup.csv' WITH CSV HEADER;
```

### 3. Testing in Staging

```sql
-- Test policies in staging environment first
-- Use separate Supabase project for staging
-- Gradually roll out to production
```

## Support

For issues with Supabase RLS configuration:
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [Supabase Discord](https://discord.supabase.com/)