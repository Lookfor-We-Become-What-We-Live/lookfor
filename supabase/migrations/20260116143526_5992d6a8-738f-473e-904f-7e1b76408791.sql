-- Create function to check experience capacity before enrollment
CREATE OR REPLACE FUNCTION check_experience_capacity()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_capacity INTEGER;
BEGIN
  -- Only check on INSERT or when updating status to 'joined'
  IF (TG_OP = 'INSERT' AND NEW.status = 'joined') OR 
     (TG_OP = 'UPDATE' AND NEW.status = 'joined' AND (OLD.status IS NULL OR OLD.status != 'joined')) THEN
    
    -- Get the experience capacity
    SELECT capacity INTO max_capacity
    FROM experiences
    WHERE id = NEW.experience_id;
    
    -- If no capacity limit, allow enrollment
    IF max_capacity IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Count current enrollments (excluding this user in case of update)
    SELECT COUNT(*) INTO current_count
    FROM enrollments
    WHERE experience_id = NEW.experience_id
      AND status = 'joined'
      AND user_id != NEW.user_id;
    
    -- Check if capacity would be exceeded
    IF current_count >= max_capacity THEN
      RAISE EXCEPTION 'CAPACITY_FULL: No spots left for this experience';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for capacity enforcement
CREATE TRIGGER enforce_experience_capacity
  BEFORE INSERT OR UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION check_experience_capacity();