
-- Functions for validating database settings like RLS and constraints

-- Function to check if RLS is enabled on a table
CREATE OR REPLACE FUNCTION public.check_rls_enabled(table_name text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  is_enabled boolean;
BEGIN
  SELECT relrowsecurity INTO is_enabled 
  FROM pg_class 
  WHERE relname = table_name 
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
  
  RETURN COALESCE(is_enabled, false);
END;
$$;

-- Function to check if a policy exists on a table
CREATE OR REPLACE FUNCTION public.check_policy_exists(table_name text, policy_name text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  policy_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM pg_policy 
    WHERE polrelid = (SELECT oid FROM pg_class WHERE relname = table_name AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
    AND polname = policy_name
  ) INTO policy_exists;
  
  RETURN COALESCE(policy_exists, false);
END;
$$;

-- Function to check if a unique constraint exists on specified columns
CREATE OR REPLACE FUNCTION public.check_unique_constraint(table_name text, column_names text[])
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  constraint_exists boolean;
  column_list text;
BEGIN
  -- Convert array to comma-separated list for the query
  SELECT array_to_string(column_names, ',') INTO column_list;

  -- Check for unique constraint or unique index
  SELECT EXISTS (
    SELECT 1 
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = 'public' 
      AND c.conrelid = (table_name)::regclass
      AND c.contype = 'u'
      AND (
        -- This checks if the columns match exactly
        (SELECT array_agg(attname ORDER BY attnum) 
         FROM pg_attribute 
         WHERE attrelid = c.conrelid 
           AND attnum = ANY(c.conkey)) 
        = (SELECT array_agg(column_name ORDER BY array_position(column_names, column_name)) 
           FROM unnest(column_names) AS column_name)
      )
  ) OR EXISTS (
    -- Also check for primary key constraints
    SELECT 1 
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = 'public' 
      AND c.conrelid = (table_name)::regclass
      AND c.contype = 'p'
      AND (
        -- This checks if the columns match exactly
        (SELECT array_agg(attname ORDER BY attnum) 
         FROM pg_attribute 
         WHERE attrelid = c.conrelid 
           AND attnum = ANY(c.conkey)) 
        = (SELECT array_agg(column_name ORDER BY array_position(column_names, column_name)) 
           FROM unnest(column_names) AS column_name)
      )
  ) INTO constraint_exists;
  
  RETURN COALESCE(constraint_exists, false);
END;
$$;

-- Function to test inserting a row as the current user
CREATE OR REPLACE FUNCTION public.test_insert_permission(table_name text, test_data json)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
  query_text text;
BEGIN
  -- Create a dynamic query to insert the data
  query_text := format('INSERT INTO %I %s RETURNING *', 
                      table_name, 
                      test_data::text);
  
  -- Execute the query and capture the result
  EXECUTE query_text INTO result;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Successfully inserted test data',
    'data', result
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Function to check if specific RLS policies are set correctly for a user
CREATE OR REPLACE FUNCTION public.check_user_rls_permissions(
  table_name text,
  test_user_id uuid
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  can_insert boolean;
  can_select boolean;
  can_update boolean;
  can_delete boolean;
  row_count int;
BEGIN
  -- Check if the user can insert their own data
  BEGIN
    EXECUTE format('
      WITH test_insert AS (
        INSERT INTO %I (user_id) VALUES ($1) RETURNING true
      )
      SELECT count(*) FROM test_insert', table_name)
    USING test_user_id INTO row_count;
    
    can_insert := row_count > 0;
    
    -- Rollback the test insert
    RAISE EXCEPTION 'Rollback test transaction';
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM = 'Rollback test transaction' THEN
        -- This is our expected exception for rollback
        NULL;
      ELSE
        can_insert := false;
      END IF;
  END;

  -- Return the results
  RETURN json_build_object(
    'table', table_name,
    'user_id', test_user_id,
    'can_insert', can_insert,
    'permissions_ok', can_insert
  );
END;
$$;
