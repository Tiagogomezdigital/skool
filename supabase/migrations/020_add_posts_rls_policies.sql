-- ============================================
-- Adicionar políticas RLS para INSERT, UPDATE e DELETE na tabela posts
-- ============================================

-- Garantir que RLS está habilitado na tabela posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Política para INSERT: Usuários autenticados podem criar posts
DROP POLICY IF EXISTS "Users can create posts" ON posts;
CREATE POLICY "Users can create posts"
    ON posts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: Usuários podem atualizar apenas seus próprios posts
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts"
    ON posts FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: Admins podem atualizar qualquer post
DROP POLICY IF EXISTS "Admins can update any post" ON posts;
CREATE POLICY "Admins can update any post"
    ON posts FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Política para DELETE: Usuários podem deletar apenas seus próprios posts
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Users can delete own posts"
    ON posts FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Política para DELETE: Admins podem deletar qualquer post
DROP POLICY IF EXISTS "Admins can delete any post" ON posts;
CREATE POLICY "Admins can delete any post"
    ON posts FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

