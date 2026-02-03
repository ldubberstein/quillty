-- Seed data for Quillty
-- Creates platform blocks and sample patterns for development/testing

-- First, create a platform system user (bypassing auth for seeding)
-- This user ID is fixed so we can reference it in seed data
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'platform@quillty.com',
  '$2a$10$PvPpXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', -- placeholder hash
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"quillty","display_name":"Quillty"}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- The trigger should create the public.users entry, but we'll ensure it exists
INSERT INTO public.users (id, username, display_name, bio, is_partner, avatar_url)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'quillty',
  'Quillty',
  'Official Quillty platform account. Traditional quilting blocks and patterns.',
  true,
  NULL
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio;

-- ============================================================================
-- PLATFORM BLOCKS - Traditional Quilting Patterns
-- ============================================================================

-- Nine Patch Block (3x3 grid, simple squares)
INSERT INTO public.blocks (id, creator_id, name, description, is_platform_block, grid_size, design_data, difficulty, piece_count, status, published_at, like_count)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Nine Patch',
  'A classic beginner-friendly block. The nine patch is one of the oldest and most versatile quilt blocks, perfect for using up scraps or creating bold color contrasts.',
  true,
  3,
  '{
    "gridSize": 3,
    "cells": [
      {"row": 0, "col": 0, "shape": "square", "rotation": 0, "colors": ["fabric_a"]},
      {"row": 0, "col": 1, "shape": "square", "rotation": 0, "colors": ["fabric_b"]},
      {"row": 0, "col": 2, "shape": "square", "rotation": 0, "colors": ["fabric_a"]},
      {"row": 1, "col": 0, "shape": "square", "rotation": 0, "colors": ["fabric_b"]},
      {"row": 1, "col": 1, "shape": "square", "rotation": 0, "colors": ["fabric_a"]},
      {"row": 1, "col": 2, "shape": "square", "rotation": 0, "colors": ["fabric_b"]},
      {"row": 2, "col": 0, "shape": "square", "rotation": 0, "colors": ["fabric_a"]},
      {"row": 2, "col": 1, "shape": "square", "rotation": 0, "colors": ["fabric_b"]},
      {"row": 2, "col": 2, "shape": "square", "rotation": 0, "colors": ["fabric_a"]}
    ],
    "fabricMapping": {"fabric_a": "#e85d04", "fabric_b": "#f5f5f5"}
  }'::jsonb,
  'beginner',
  9,
  'published',
  NOW() - INTERVAL '30 days',
  42
);

-- Pinwheel Block (2x2 grid, half-square triangles)
INSERT INTO public.blocks (id, creator_id, name, description, is_platform_block, grid_size, design_data, difficulty, piece_count, status, published_at, like_count)
VALUES (
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Pinwheel',
  'A playful spinning design made from half-square triangles. The pinwheel creates beautiful secondary patterns when blocks are placed together.',
  true,
  2,
  '{
    "gridSize": 2,
    "cells": [
      {"row": 0, "col": 0, "shape": "hst", "rotation": 0, "colors": ["fabric_a", "fabric_b"]},
      {"row": 0, "col": 1, "shape": "hst", "rotation": 90, "colors": ["fabric_a", "fabric_b"]},
      {"row": 1, "col": 0, "shape": "hst", "rotation": 270, "colors": ["fabric_a", "fabric_b"]},
      {"row": 1, "col": 1, "shape": "hst", "rotation": 180, "colors": ["fabric_a", "fabric_b"]}
    ],
    "fabricMapping": {"fabric_a": "#2563eb", "fabric_b": "#fef3c7"}
  }'::jsonb,
  'beginner',
  8,
  'published',
  NOW() - INTERVAL '28 days',
  67
);

-- Ohio Star Block (3x3 grid with quarter-square triangles)
INSERT INTO public.blocks (id, creator_id, name, description, is_platform_block, grid_size, design_data, difficulty, piece_count, status, published_at, like_count)
VALUES (
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'Ohio Star',
  'A stunning traditional star block featuring quarter-square triangles. The Ohio Star has been a quilter''s favorite since the 1800s.',
  true,
  3,
  '{
    "gridSize": 3,
    "cells": [
      {"row": 0, "col": 0, "shape": "square", "rotation": 0, "colors": ["fabric_b"]},
      {"row": 0, "col": 1, "shape": "qst", "rotation": 0, "colors": ["fabric_a", "fabric_b", "fabric_a", "fabric_b"]},
      {"row": 0, "col": 2, "shape": "square", "rotation": 0, "colors": ["fabric_b"]},
      {"row": 1, "col": 0, "shape": "qst", "rotation": 270, "colors": ["fabric_a", "fabric_b", "fabric_a", "fabric_b"]},
      {"row": 1, "col": 1, "shape": "square", "rotation": 0, "colors": ["fabric_a"]},
      {"row": 1, "col": 2, "shape": "qst", "rotation": 90, "colors": ["fabric_a", "fabric_b", "fabric_a", "fabric_b"]},
      {"row": 2, "col": 0, "shape": "square", "rotation": 0, "colors": ["fabric_b"]},
      {"row": 2, "col": 1, "shape": "qst", "rotation": 180, "colors": ["fabric_a", "fabric_b", "fabric_a", "fabric_b"]},
      {"row": 2, "col": 2, "shape": "square", "rotation": 0, "colors": ["fabric_b"]}
    ],
    "fabricMapping": {"fabric_a": "#dc2626", "fabric_b": "#fef2f2"}
  }'::jsonb,
  'intermediate',
  21,
  'published',
  NOW() - INTERVAL '25 days',
  89
);

-- Flying Geese Block (1x4 grid, half-square triangles)
INSERT INTO public.blocks (id, creator_id, name, description, is_platform_block, grid_size, design_data, difficulty, piece_count, status, published_at, like_count)
VALUES (
  '10000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'Flying Geese',
  'A classic rectangular unit that creates the illusion of geese flying in formation. Essential building block for many quilt designs.',
  true,
  4,
  '{
    "gridSize": 4,
    "cells": [
      {"row": 0, "col": 0, "shape": "hst", "rotation": 0, "colors": ["fabric_b", "fabric_a"]},
      {"row": 0, "col": 1, "shape": "hst", "rotation": 0, "colors": ["fabric_a", "fabric_b"]},
      {"row": 0, "col": 2, "shape": "hst", "rotation": 0, "colors": ["fabric_b", "fabric_a"]},
      {"row": 0, "col": 3, "shape": "hst", "rotation": 0, "colors": ["fabric_a", "fabric_b"]},
      {"row": 1, "col": 0, "shape": "hst", "rotation": 180, "colors": ["fabric_a", "fabric_b"]},
      {"row": 1, "col": 1, "shape": "hst", "rotation": 180, "colors": ["fabric_b", "fabric_a"]},
      {"row": 1, "col": 2, "shape": "hst", "rotation": 180, "colors": ["fabric_a", "fabric_b"]},
      {"row": 1, "col": 3, "shape": "hst", "rotation": 180, "colors": ["fabric_b", "fabric_a"]}
    ],
    "fabricMapping": {"fabric_a": "#16a34a", "fabric_b": "#f0fdf4"}
  }'::jsonb,
  'beginner',
  12,
  'published',
  NOW() - INTERVAL '22 days',
  53
);

-- Churn Dash Block (3x3 grid)
INSERT INTO public.blocks (id, creator_id, name, description, is_platform_block, grid_size, design_data, difficulty, piece_count, status, published_at, like_count)
VALUES (
  '10000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'Churn Dash',
  'Named after the tool used to make butter, this traditional block features half-square triangles and rectangles arranged around a center square.',
  true,
  3,
  '{
    "gridSize": 3,
    "cells": [
      {"row": 0, "col": 0, "shape": "hst", "rotation": 0, "colors": ["fabric_a", "fabric_b"]},
      {"row": 0, "col": 1, "shape": "square", "rotation": 0, "colors": ["fabric_a"]},
      {"row": 0, "col": 2, "shape": "hst", "rotation": 90, "colors": ["fabric_a", "fabric_b"]},
      {"row": 1, "col": 0, "shape": "square", "rotation": 0, "colors": ["fabric_a"]},
      {"row": 1, "col": 1, "shape": "square", "rotation": 0, "colors": ["fabric_b"]},
      {"row": 1, "col": 2, "shape": "square", "rotation": 0, "colors": ["fabric_a"]},
      {"row": 2, "col": 0, "shape": "hst", "rotation": 270, "colors": ["fabric_a", "fabric_b"]},
      {"row": 2, "col": 1, "shape": "square", "rotation": 0, "colors": ["fabric_a"]},
      {"row": 2, "col": 2, "shape": "hst", "rotation": 180, "colors": ["fabric_a", "fabric_b"]}
    ],
    "fabricMapping": {"fabric_a": "#7c3aed", "fabric_b": "#faf5ff"}
  }'::jsonb,
  'beginner',
  13,
  'published',
  NOW() - INTERVAL '20 days',
  45
);

-- Bear's Paw Block (4x4 grid)
INSERT INTO public.blocks (id, creator_id, name, description, is_platform_block, grid_size, design_data, difficulty, piece_count, status, published_at, like_count)
VALUES (
  '10000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000001',
  'Bear''s Paw',
  'A beloved traditional block that creates the appearance of a bear''s paw print. Features four "toes" made of half-square triangles.',
  true,
  4,
  '{
    "gridSize": 4,
    "cells": [
      {"row": 0, "col": 0, "shape": "hst", "rotation": 0, "colors": ["fabric_a", "fabric_b"]},
      {"row": 0, "col": 1, "shape": "square", "rotation": 0, "colors": ["fabric_a"]},
      {"row": 0, "col": 2, "shape": "square", "rotation": 0, "colors": ["fabric_a"]},
      {"row": 0, "col": 3, "shape": "hst", "rotation": 90, "colors": ["fabric_a", "fabric_b"]},
      {"row": 1, "col": 0, "shape": "square", "rotation": 0, "colors": ["fabric_a"]},
      {"row": 1, "col": 1, "shape": "square", "rotation": 0, "colors": ["fabric_b"]},
      {"row": 1, "col": 2, "shape": "square", "rotation": 0, "colors": ["fabric_b"]},
      {"row": 1, "col": 3, "shape": "square", "rotation": 0, "colors": ["fabric_a"]},
      {"row": 2, "col": 0, "shape": "square", "rotation": 0, "colors": ["fabric_a"]},
      {"row": 2, "col": 1, "shape": "square", "rotation": 0, "colors": ["fabric_b"]},
      {"row": 2, "col": 2, "shape": "square", "rotation": 0, "colors": ["fabric_b"]},
      {"row": 2, "col": 3, "shape": "square", "rotation": 0, "colors": ["fabric_a"]},
      {"row": 3, "col": 0, "shape": "hst", "rotation": 270, "colors": ["fabric_a", "fabric_b"]},
      {"row": 3, "col": 1, "shape": "square", "rotation": 0, "colors": ["fabric_a"]},
      {"row": 3, "col": 2, "shape": "square", "rotation": 0, "colors": ["fabric_a"]},
      {"row": 3, "col": 3, "shape": "hst", "rotation": 180, "colors": ["fabric_a", "fabric_b"]}
    ],
    "fabricMapping": {"fabric_a": "#78350f", "fabric_b": "#fef3c7"}
  }'::jsonb,
  'intermediate',
  24,
  'published',
  NOW() - INTERVAL '18 days',
  72
);

-- Sawtooth Star Block (3x3 grid)
INSERT INTO public.blocks (id, creator_id, name, description, is_platform_block, grid_size, design_data, difficulty, piece_count, status, published_at, like_count)
VALUES (
  '10000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000001',
  'Sawtooth Star',
  'A variation of the classic star block with distinctive "sawtooth" points created by half-square triangles pointing outward.',
  true,
  3,
  '{
    "gridSize": 3,
    "cells": [
      {"row": 0, "col": 0, "shape": "square", "rotation": 0, "colors": ["fabric_b"]},
      {"row": 0, "col": 1, "shape": "hst", "rotation": 180, "colors": ["fabric_a", "fabric_b"]},
      {"row": 0, "col": 2, "shape": "square", "rotation": 0, "colors": ["fabric_b"]},
      {"row": 1, "col": 0, "shape": "hst", "rotation": 90, "colors": ["fabric_a", "fabric_b"]},
      {"row": 1, "col": 1, "shape": "square", "rotation": 0, "colors": ["fabric_a"]},
      {"row": 1, "col": 2, "shape": "hst", "rotation": 270, "colors": ["fabric_a", "fabric_b"]},
      {"row": 2, "col": 0, "shape": "square", "rotation": 0, "colors": ["fabric_b"]},
      {"row": 2, "col": 1, "shape": "hst", "rotation": 0, "colors": ["fabric_a", "fabric_b"]},
      {"row": 2, "col": 2, "shape": "square", "rotation": 0, "colors": ["fabric_b"]}
    ],
    "fabricMapping": {"fabric_a": "#0891b2", "fabric_b": "#ecfeff"}
  }'::jsonb,
  'beginner',
  13,
  'published',
  NOW() - INTERVAL '15 days',
  61
);

-- Friendship Star Block (3x3 grid)
INSERT INTO public.blocks (id, creator_id, name, description, is_platform_block, grid_size, design_data, difficulty, piece_count, status, published_at, like_count)
VALUES (
  '10000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000001',
  'Friendship Star',
  'A simple star block often exchanged between quilting friends. Easy to make and beautiful in any color combination.',
  true,
  3,
  '{
    "gridSize": 3,
    "cells": [
      {"row": 0, "col": 0, "shape": "square", "rotation": 0, "colors": ["fabric_b"]},
      {"row": 0, "col": 1, "shape": "hst", "rotation": 0, "colors": ["fabric_a", "fabric_b"]},
      {"row": 0, "col": 2, "shape": "square", "rotation": 0, "colors": ["fabric_b"]},
      {"row": 1, "col": 0, "shape": "hst", "rotation": 270, "colors": ["fabric_a", "fabric_b"]},
      {"row": 1, "col": 1, "shape": "square", "rotation": 0, "colors": ["fabric_a"]},
      {"row": 1, "col": 2, "shape": "hst", "rotation": 90, "colors": ["fabric_a", "fabric_b"]},
      {"row": 2, "col": 0, "shape": "square", "rotation": 0, "colors": ["fabric_b"]},
      {"row": 2, "col": 1, "shape": "hst", "rotation": 180, "colors": ["fabric_a", "fabric_b"]},
      {"row": 2, "col": 2, "shape": "square", "rotation": 0, "colors": ["fabric_b"]}
    ],
    "fabricMapping": {"fabric_a": "#db2777", "fabric_b": "#fdf2f8"}
  }'::jsonb,
  'beginner',
  13,
  'published',
  NOW() - INTERVAL '12 days',
  78
);

-- Rail Fence Block (3x3 grid, all squares)
INSERT INTO public.blocks (id, creator_id, name, description, is_platform_block, grid_size, design_data, difficulty, piece_count, status, published_at, like_count)
VALUES (
  '10000000-0000-0000-0000-000000000009',
  '00000000-0000-0000-0000-000000000001',
  'Rail Fence',
  'One of the simplest quilt blocks, using strips of fabric arranged like fence rails. Creates stunning zigzag patterns when blocks are rotated.',
  true,
  3,
  '{
    "gridSize": 3,
    "cells": [
      {"row": 0, "col": 0, "shape": "square", "rotation": 0, "colors": ["fabric_a"]},
      {"row": 0, "col": 1, "shape": "square", "rotation": 0, "colors": ["fabric_a"]},
      {"row": 0, "col": 2, "shape": "square", "rotation": 0, "colors": ["fabric_a"]},
      {"row": 1, "col": 0, "shape": "square", "rotation": 0, "colors": ["fabric_b"]},
      {"row": 1, "col": 1, "shape": "square", "rotation": 0, "colors": ["fabric_b"]},
      {"row": 1, "col": 2, "shape": "square", "rotation": 0, "colors": ["fabric_b"]},
      {"row": 2, "col": 0, "shape": "square", "rotation": 0, "colors": ["fabric_c"]},
      {"row": 2, "col": 1, "shape": "square", "rotation": 0, "colors": ["fabric_c"]},
      {"row": 2, "col": 2, "shape": "square", "rotation": 0, "colors": ["fabric_c"]}
    ],
    "fabricMapping": {"fabric_a": "#1e40af", "fabric_b": "#3b82f6", "fabric_c": "#93c5fd"}
  }'::jsonb,
  'beginner',
  9,
  'published',
  NOW() - INTERVAL '10 days',
  34
);

-- Broken Dishes Block (2x2 grid, half-square triangles)
INSERT INTO public.blocks (id, creator_id, name, description, is_platform_block, grid_size, design_data, difficulty, piece_count, status, published_at, like_count)
VALUES (
  '10000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'Broken Dishes',
  'A simple but striking block made entirely of half-square triangles. The name comes from its resemblance to broken china pieces.',
  true,
  2,
  '{
    "gridSize": 2,
    "cells": [
      {"row": 0, "col": 0, "shape": "hst", "rotation": 0, "colors": ["fabric_a", "fabric_b"]},
      {"row": 0, "col": 1, "shape": "hst", "rotation": 270, "colors": ["fabric_a", "fabric_b"]},
      {"row": 1, "col": 0, "shape": "hst", "rotation": 90, "colors": ["fabric_a", "fabric_b"]},
      {"row": 1, "col": 1, "shape": "hst", "rotation": 180, "colors": ["fabric_a", "fabric_b"]}
    ],
    "fabricMapping": {"fabric_a": "#ea580c", "fabric_b": "#fff7ed"}
  }'::jsonb,
  'beginner',
  8,
  'published',
  NOW() - INTERVAL '8 days',
  29
);

-- ============================================================================
-- SAMPLE QUILT PATTERNS
-- ============================================================================

-- Nine Patch Garden Quilt
INSERT INTO public.quilt_patterns (id, creator_id, title, description, status, difficulty, category, size, design_data, like_count, save_count, comment_count, view_count, published_at)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Nine Patch Garden',
  'A charming beginner-friendly quilt featuring classic nine patch blocks in a cheerful garden color palette. Perfect for your first quilt project!',
  'published_free',
  'beginner',
  'Traditional',
  '60x72',
  '{
    "columns": 5,
    "rows": 6,
    "blockSize": 12,
    "blocks": [
      {"row": 0, "col": 0, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 0, "col": 1, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 0, "col": 2, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 0, "col": 3, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 0, "col": 4, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 1, "col": 0, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 1, "col": 1, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 1, "col": 2, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 1, "col": 3, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 1, "col": 4, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 2, "col": 0, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 2, "col": 1, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 2, "col": 2, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 2, "col": 3, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 2, "col": 4, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 3, "col": 0, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 3, "col": 1, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 3, "col": 2, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 3, "col": 3, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 3, "col": 4, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 4, "col": 0, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 4, "col": 1, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 4, "col": 2, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 4, "col": 3, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 4, "col": 4, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 5, "col": 0, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 5, "col": 1, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 5, "col": 2, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 5, "col": 3, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0},
      {"row": 5, "col": 4, "blockId": "10000000-0000-0000-0000-000000000001", "rotation": 0}
    ],
    "sashing": null,
    "borders": [],
    "fabricMapping": {"fabric_a": "#16a34a", "fabric_b": "#fef9c3"}
  }'::jsonb,
  156,
  89,
  0,
  1240,
  NOW() - INTERVAL '25 days'
);

-- Spinning Stars Quilt
INSERT INTO public.quilt_patterns (id, creator_id, title, description, status, difficulty, category, size, design_data, like_count, save_count, comment_count, view_count, published_at)
VALUES (
  '20000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Spinning Stars',
  'Beautiful pinwheel blocks create a mesmerizing spinning effect across this throw-size quilt. The secondary patterns that emerge are magical!',
  'published_free',
  'beginner',
  'Modern',
  '48x48',
  '{
    "columns": 4,
    "rows": 4,
    "blockSize": 12,
    "blocks": [
      {"row": 0, "col": 0, "blockId": "10000000-0000-0000-0000-000000000002", "rotation": 0},
      {"row": 0, "col": 1, "blockId": "10000000-0000-0000-0000-000000000002", "rotation": 90},
      {"row": 0, "col": 2, "blockId": "10000000-0000-0000-0000-000000000002", "rotation": 0},
      {"row": 0, "col": 3, "blockId": "10000000-0000-0000-0000-000000000002", "rotation": 90},
      {"row": 1, "col": 0, "blockId": "10000000-0000-0000-0000-000000000002", "rotation": 270},
      {"row": 1, "col": 1, "blockId": "10000000-0000-0000-0000-000000000002", "rotation": 180},
      {"row": 1, "col": 2, "blockId": "10000000-0000-0000-0000-000000000002", "rotation": 270},
      {"row": 1, "col": 3, "blockId": "10000000-0000-0000-0000-000000000002", "rotation": 180},
      {"row": 2, "col": 0, "blockId": "10000000-0000-0000-0000-000000000002", "rotation": 0},
      {"row": 2, "col": 1, "blockId": "10000000-0000-0000-0000-000000000002", "rotation": 90},
      {"row": 2, "col": 2, "blockId": "10000000-0000-0000-0000-000000000002", "rotation": 0},
      {"row": 2, "col": 3, "blockId": "10000000-0000-0000-0000-000000000002", "rotation": 90},
      {"row": 3, "col": 0, "blockId": "10000000-0000-0000-0000-000000000002", "rotation": 270},
      {"row": 3, "col": 1, "blockId": "10000000-0000-0000-0000-000000000002", "rotation": 180},
      {"row": 3, "col": 2, "blockId": "10000000-0000-0000-0000-000000000002", "rotation": 270},
      {"row": 3, "col": 3, "blockId": "10000000-0000-0000-0000-000000000002", "rotation": 180}
    ],
    "sashing": null,
    "borders": [],
    "fabricMapping": {"fabric_a": "#7c3aed", "fabric_b": "#faf5ff"}
  }'::jsonb,
  203,
  134,
  0,
  1890,
  NOW() - INTERVAL '20 days'
);

-- Ohio Star Spectacular
INSERT INTO public.quilt_patterns (id, creator_id, title, description, status, difficulty, category, size, design_data, like_count, save_count, comment_count, view_count, published_at)
VALUES (
  '20000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'Ohio Star Spectacular',
  'Classic Ohio Star blocks arranged in a stunning queen-size quilt. This intermediate project showcases the timeless beauty of quarter-square triangles.',
  'published_free',
  'intermediate',
  'Traditional',
  '84x96',
  '{
    "columns": 7,
    "rows": 8,
    "blockSize": 12,
    "blocks": [
      {"row": 0, "col": 0, "blockId": "10000000-0000-0000-0000-000000000003", "rotation": 0},
      {"row": 0, "col": 1, "blockId": "10000000-0000-0000-0000-000000000003", "rotation": 0},
      {"row": 0, "col": 2, "blockId": "10000000-0000-0000-0000-000000000003", "rotation": 0},
      {"row": 0, "col": 3, "blockId": "10000000-0000-0000-0000-000000000003", "rotation": 0},
      {"row": 0, "col": 4, "blockId": "10000000-0000-0000-0000-000000000003", "rotation": 0},
      {"row": 0, "col": 5, "blockId": "10000000-0000-0000-0000-000000000003", "rotation": 0},
      {"row": 0, "col": 6, "blockId": "10000000-0000-0000-0000-000000000003", "rotation": 0}
    ],
    "sashing": null,
    "borders": [],
    "fabricMapping": {"fabric_a": "#dc2626", "fabric_b": "#fef2f2"}
  }'::jsonb,
  289,
  178,
  0,
  2450,
  NOW() - INTERVAL '15 days'
);

-- Friendship Circle
INSERT INTO public.quilt_patterns (id, creator_id, title, description, status, difficulty, category, size, design_data, like_count, save_count, comment_count, view_count, published_at)
VALUES (
  '20000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'Friendship Circle',
  'Share the love of quilting with this friendship star design! Perfect for exchanging blocks with your quilting friends and creating a memory quilt.',
  'published_free',
  'beginner',
  'Traditional',
  '54x54',
  '{
    "columns": 3,
    "rows": 3,
    "blockSize": 18,
    "blocks": [
      {"row": 0, "col": 0, "blockId": "10000000-0000-0000-0000-000000000008", "rotation": 0},
      {"row": 0, "col": 1, "blockId": "10000000-0000-0000-0000-000000000008", "rotation": 0},
      {"row": 0, "col": 2, "blockId": "10000000-0000-0000-0000-000000000008", "rotation": 0},
      {"row": 1, "col": 0, "blockId": "10000000-0000-0000-0000-000000000008", "rotation": 0},
      {"row": 1, "col": 1, "blockId": "10000000-0000-0000-0000-000000000008", "rotation": 0},
      {"row": 1, "col": 2, "blockId": "10000000-0000-0000-0000-000000000008", "rotation": 0},
      {"row": 2, "col": 0, "blockId": "10000000-0000-0000-0000-000000000008", "rotation": 0},
      {"row": 2, "col": 1, "blockId": "10000000-0000-0000-0000-000000000008", "rotation": 0},
      {"row": 2, "col": 2, "blockId": "10000000-0000-0000-0000-000000000008", "rotation": 0}
    ],
    "sashing": null,
    "borders": [],
    "fabricMapping": {"fabric_a": "#db2777", "fabric_b": "#fdf2f8"}
  }'::jsonb,
  167,
  98,
  0,
  1340,
  NOW() - INTERVAL '10 days'
);

-- Rail Fence Runner
INSERT INTO public.quilt_patterns (id, creator_id, title, description, status, difficulty, category, size, design_data, like_count, save_count, comment_count, view_count, published_at)
VALUES (
  '20000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'Rail Fence Table Runner',
  'A quick and easy table runner perfect for beginners! Rail fence blocks create a striking zigzag pattern when rotated. Great for using up fabric strips.',
  'published_free',
  'beginner',
  'Home Decor',
  '18x54',
  '{
    "columns": 6,
    "rows": 2,
    "blockSize": 9,
    "blocks": [
      {"row": 0, "col": 0, "blockId": "10000000-0000-0000-0000-000000000009", "rotation": 0},
      {"row": 0, "col": 1, "blockId": "10000000-0000-0000-0000-000000000009", "rotation": 90},
      {"row": 0, "col": 2, "blockId": "10000000-0000-0000-0000-000000000009", "rotation": 0},
      {"row": 0, "col": 3, "blockId": "10000000-0000-0000-0000-000000000009", "rotation": 90},
      {"row": 0, "col": 4, "blockId": "10000000-0000-0000-0000-000000000009", "rotation": 0},
      {"row": 0, "col": 5, "blockId": "10000000-0000-0000-0000-000000000009", "rotation": 90},
      {"row": 1, "col": 0, "blockId": "10000000-0000-0000-0000-000000000009", "rotation": 90},
      {"row": 1, "col": 1, "blockId": "10000000-0000-0000-0000-000000000009", "rotation": 0},
      {"row": 1, "col": 2, "blockId": "10000000-0000-0000-0000-000000000009", "rotation": 90},
      {"row": 1, "col": 3, "blockId": "10000000-0000-0000-0000-000000000009", "rotation": 0},
      {"row": 1, "col": 4, "blockId": "10000000-0000-0000-0000-000000000009", "rotation": 90},
      {"row": 1, "col": 5, "blockId": "10000000-0000-0000-0000-000000000009", "rotation": 0}
    ],
    "sashing": null,
    "borders": [],
    "fabricMapping": {"fabric_a": "#1e40af", "fabric_b": "#3b82f6", "fabric_c": "#93c5fd"}
  }'::jsonb,
  92,
  67,
  0,
  890,
  NOW() - INTERVAL '5 days'
);

-- Update block usage counts based on patterns
UPDATE public.blocks SET usage_count = (
  SELECT COUNT(*) FROM public.quilt_patterns p,
  jsonb_array_elements(p.design_data->'blocks') AS block
  WHERE block->>'blockId' = blocks.id::text
);
