
-- Table to store encrypted API keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_type TEXT NOT NULL, -- e.g., 'deepseek', 'openai', etc.
  encrypted_key TEXT NOT NULL,
  iv TEXT NOT NULL, -- Initialization vector for decryption
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id and key_type for faster lookups
CREATE INDEX IF NOT EXISTS api_keys_user_id_key_type_idx ON api_keys (user_id, key_type);

-- Row-level security policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own API keys
CREATE POLICY api_keys_select_policy ON api_keys
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own API keys
CREATE POLICY api_keys_insert_policy ON api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own API keys
CREATE POLICY api_keys_update_policy ON api_keys
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own API keys
CREATE POLICY api_keys_delete_policy ON api_keys
  FOR DELETE USING (auth.uid() = user_id);
