-- Add length constraints to experiences table text fields
ALTER TABLE experiences 
  ADD CONSTRAINT check_title_length CHECK (length(title) <= 200),
  ADD CONSTRAINT check_description_length CHECK (length(description) <= 5000),
  ADD CONSTRAINT check_category_length CHECK (length(category) <= 100),
  ADD CONSTRAINT check_location_address_length CHECK (length(location_address) <= 500),
  ADD CONSTRAINT check_image_url_length CHECK (image_url IS NULL OR length(image_url) <= 2000);

-- Add constraint for tags array (limit individual tag length and array size)
ALTER TABLE experiences
  ADD CONSTRAINT check_tags_length CHECK (
    tags IS NULL OR (
      array_length(tags, 1) IS NULL OR 
      array_length(tags, 1) <= 20
    )
  );