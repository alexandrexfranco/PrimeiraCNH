-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  password TEXT,
  email TEXT,
  phone TEXT,
  registro TEXT,
  photo_url TEXT,
  status TEXT DEFAULT 'ACTIVE',
  category TEXT,
  observation TEXT,
  enrolled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS explícito com políticas de acesso
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas para users
DROP POLICY IF EXISTS "Permitir acesso total aos usuarios" ON public.users;
CREATE POLICY "Permitir select aos usuarios" ON public.users FOR SELECT USING (true);
CREATE POLICY "Permitir insert aos usuarios" ON public.users FOR INSERT WITH CHECK (current_role = 'anon' OR current_role = 'authenticated');
CREATE POLICY "Permitir update aos usuarios" ON public.users FOR UPDATE USING (current_role = 'anon' OR current_role = 'authenticated');
CREATE POLICY "Permitir delete aos usuarios" ON public.users FOR DELETE USING (current_role = 'anon' OR current_role = 'authenticated');

-- Criar tabela de veículos
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate TEXT UNIQUE NOT NULL,
  model TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'ACTIVE'
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Políticas para vehicles
DROP POLICY IF EXISTS "Permitir acesso total aos veiculos" ON public.vehicles;
CREATE POLICY "Permitir select aos veiculos" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Permitir insert aos veiculos" ON public.vehicles FOR INSERT WITH CHECK (current_role = 'anon' OR current_role = 'authenticated');
CREATE POLICY "Permitir update aos veiculos" ON public.vehicles FOR UPDATE USING (current_role = 'anon' OR current_role = 'authenticated');
CREATE POLICY "Permitir delete aos veiculos" ON public.vehicles FOR DELETE USING (current_role = 'anon' OR current_role = 'authenticated');

-- Criar tabela de aulas
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'SCHEDULED',
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  start_location JSONB,
  end_location JSONB,
  checklist JSONB,
  evaluation JSONB,
  cancel_reason TEXT,
  cancel_observations TEXT,
  initial_odometer INTEGER,
  final_odometer INTEGER,
  route TEXT,
  observation TEXT
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Políticas para classes
DROP POLICY IF EXISTS "Permitir acesso total as aulas" ON public.classes;
CREATE POLICY "Permitir select as aulas" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Permitir insert as aulas" ON public.classes FOR INSERT WITH CHECK (current_role = 'anon' OR current_role = 'authenticated');
CREATE POLICY "Permitir update as aulas" ON public.classes FOR UPDATE USING (current_role = 'anon' OR current_role = 'authenticated');
CREATE POLICY "Permitir delete as aulas" ON public.classes FOR DELETE USING (current_role = 'anon' OR current_role = 'authenticated');

-- Garantir que anon possua acesso
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;

-- Inserir dados mock iniciais caso necessário
-- IMPORTANTE: Para evitar duplicação, essa inserção usa um DO block.
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM public.users WHERE cpf = '000.000.000-03') THEN
     INSERT INTO public.users (id, role, name, cpf, password, status) VALUES
       ('11111111-1111-1111-1111-111111111111', 'ADMIN', 'Administrador Silva', '000.000.000-01', '123', 'ACTIVE'),
       ('33333333-3333-3333-3333-333333333333', 'INSTRUCTOR', 'Instrutor Carlos', '000.000.000-03', '123', 'ACTIVE'),
       ('44444444-4444-4444-4444-444444444444', 'STUDENT', 'João Aluno', '000.000.000-04', '123', 'IN_TRAINING'),
       ('55555555-5555-5555-5555-555555555555', 'STUDENT', 'Ana Aluna', '000.000.000-05', '123', 'IN_TRAINING');

     INSERT INTO public.vehicles (id, plate, model, category, status) VALUES
       ('11111111-1111-1111-1111-111111111111', 'ABC-1234', 'VW Gol', 'B', 'ACTIVE'),
       ('22222222-2222-2222-2222-222222222222', 'XYZ-9876', 'Honda CG 160', 'A', 'ACTIVE');
   END IF;
END $$;
