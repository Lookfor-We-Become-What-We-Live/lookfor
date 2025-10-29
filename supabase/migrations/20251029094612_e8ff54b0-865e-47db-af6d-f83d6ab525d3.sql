-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  interests TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create experiences table
CREATE TABLE public.experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  date_time_start TIMESTAMP WITH TIME ZONE NOT NULL,
  location_address TEXT NOT NULL,
  location_lat DOUBLE PRECISION NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL,
  price NUMERIC(10,2),
  capacity INTEGER,
  image_url TEXT,
  host_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on experiences
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- Experiences policies
CREATE POLICY "Experiences are viewable by everyone"
  ON public.experiences FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create experiences"
  ON public.experiences FOR INSERT
  WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Users can update their own experiences"
  ON public.experiences FOR UPDATE
  USING (auth.uid() = host_user_id);

CREATE POLICY "Users can delete their own experiences"
  ON public.experiences FOR DELETE
  USING (auth.uid() = host_user_id);

-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'enrolled',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, experience_id)
);

-- Enable RLS on enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Enrollments policies
CREATE POLICY "Users can view their own enrollments"
  ON public.enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own enrollments"
  ON public.enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments"
  ON public.enrollments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enrollments"
  ON public.enrollments FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_experiences_updated_at
  BEFORE UPDATE ON public.experiences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample experiences
INSERT INTO public.experiences (title, description, category, tags, date_time_start, location_address, location_lat, location_lng, price, capacity, image_url, host_user_id) VALUES
('Sunset Yoga on the Beach', 'Join us for a peaceful yoga session as the sun sets over the ocean.', 'Wellness', ARRAY['yoga', 'outdoor', 'sunset'], '2025-11-15 18:00:00+00', 'Santa Monica Beach, CA', 34.0195, -118.4912, 25.00, 20, 'https://images.unsplash.com/photo-1506126613408-eca07ce68773', '00000000-0000-0000-0000-000000000000'),
('Street Art Walking Tour', 'Explore vibrant street art in the city with a local artist guide.', 'Art & Culture', ARRAY['art', 'walking', 'culture'], '2025-11-20 10:00:00+00', 'Downtown LA, CA', 34.0522, -118.2437, 15.00, 15, 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8', '00000000-0000-0000-0000-000000000000'),
('Farm-to-Table Cooking Class', 'Learn to cook seasonal dishes with fresh, local ingredients.', 'Food & Drink', ARRAY['cooking', 'food', 'farm'], '2025-11-18 14:00:00+00', 'Culver City, CA', 34.0211, -118.3965, 60.00, 12, 'https://images.unsplash.com/photo-1556910103-1c02745aae4d', '00000000-0000-0000-0000-000000000000'),
('Hiking & Meditation Retreat', 'A serene hiking experience followed by guided meditation.', 'Outdoor & Adventure', ARRAY['hiking', 'meditation', 'nature'], '2025-11-22 07:00:00+00', 'Griffith Park, CA', 34.1365, -118.2942, NULL, 25, 'https://images.unsplash.com/photo-1551632811-561732d1e306', '00000000-0000-0000-0000-000000000000'),
('Live Jazz Night', 'Enjoy an evening of live jazz music in an intimate venue.', 'Music & Nightlife', ARRAY['jazz', 'music', 'nightlife'], '2025-11-25 20:00:00+00', 'The Baked Potato, Studio City, CA', 34.1478, -118.3965, 20.00, 50, 'https://images.unsplash.com/photo-1511192336575-5a79af67a629', '00000000-0000-0000-0000-000000000000'),
('Beach Cleanup & BBQ', 'Help clean up the beach and enjoy a community BBQ afterwards.', 'Community & Volunteering', ARRAY['volunteering', 'community', 'beach'], '2025-11-17 09:00:00+00', 'Venice Beach, CA', 33.9850, -118.4695, NULL, 30, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19', '00000000-0000-0000-0000-000000000000'),
('Pottery Workshop', 'Get your hands dirty and create your own pottery masterpiece.', 'Creative Workshops', ARRAY['pottery', 'art', 'workshop'], '2025-11-19 13:00:00+00', 'Pasadena, CA', 34.1478, -118.1445, 45.00, 10, 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261', '00000000-0000-0000-0000-000000000000'),
('Golden Hour Photography Walk', 'Capture stunning photos during the golden hour with a pro photographer.', 'Photography', ARRAY['photography', 'outdoor', 'golden hour'], '2025-11-21 17:00:00+00', 'Malibu, CA', 34.0259, -118.7798, 30.00, 8, 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d', '00000000-0000-0000-0000-000000000000');