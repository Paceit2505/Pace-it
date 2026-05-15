-- Cole este script no SQL Editor do Supabase (https://app.supabase.com → SQL Editor)

-- TREINOS
CREATE TABLE IF NOT EXISTS treinos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL,
  tipo TEXT NOT NULL,
  duracao_min INTEGER NOT NULL,
  intensidade INTEGER NOT NULL,
  exercicios TEXT,
  calorias INTEGER,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own treinos" ON treinos FOR ALL USING (auth.uid() = user_id);

-- SONO
CREATE TABLE IF NOT EXISTS sono (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL,
  hora_dormir TIME NOT NULL,
  hora_acordar TIME NOT NULL,
  duracao_horas NUMERIC NOT NULL,
  qualidade INTEGER NOT NULL,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE sono ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sono" ON sono FOR ALL USING (auth.uid() = user_id);

-- EXAMES DE SANGUE
CREATE TABLE IF NOT EXISTS exames_sangue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL,
  laboratorio TEXT,
  resultados JSONB NOT NULL DEFAULT '[]',
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE exames_sangue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own exames" ON exames_sangue FOR ALL USING (auth.uid() = user_id);

-- BIOIMPEDÂNCIAS
CREATE TABLE IF NOT EXISTS bioimpedancias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL,
  peso NUMERIC NOT NULL,
  gordura_corporal NUMERIC NOT NULL,
  massa_muscular NUMERIC NOT NULL,
  agua NUMERIC NOT NULL,
  massa_ossea NUMERIC,
  metabolismo_basal INTEGER,
  idade_metabolica INTEGER,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE bioimpedancias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bioimpedancias" ON bioimpedancias FOR ALL USING (auth.uid() = user_id);

-- MEDIDAS CORPORAIS
CREATE TABLE IF NOT EXISTS medidas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL,
  peso NUMERIC NOT NULL,
  altura NUMERIC NOT NULL,
  imc NUMERIC,
  cintura NUMERIC,
  quadril NUMERIC,
  braco NUMERIC,
  coxa NUMERIC,
  panturrilha NUMERIC,
  peito NUMERIC,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE medidas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own medidas" ON medidas FOR ALL USING (auth.uid() = user_id);

-- NUTRIÇÃO
CREATE TABLE IF NOT EXISTS nutricao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL,
  agua_ml INTEGER NOT NULL,
  calorias INTEGER,
  proteinas NUMERIC,
  carboidratos NUMERIC,
  gorduras NUMERIC,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE nutricao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own nutricao" ON nutricao FOR ALL USING (auth.uid() = user_id);
