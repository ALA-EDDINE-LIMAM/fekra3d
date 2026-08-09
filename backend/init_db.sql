-- Script SQL pour créer la base de données Fekra 3D (PostgreSQL)

-- Activer l'extension pour générer des UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des Catégories
CREATE TABLE "Categories" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table des Produits
CREATE TABLE "Products" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "image_url" VARCHAR(255),
    "stock" INTEGER DEFAULT 0,
    "category_id" UUID REFERENCES "Categories"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table des Variantes de Produits
CREATE TABLE "ProductVariants" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "product_id" UUID REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "color" VARCHAR(255),
    "size" VARCHAR(255),
    "material" VARCHAR(255),
    "price_modifier" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Type ENUM pour le statut des commandes
CREATE TYPE enum_Orders_status AS ENUM('pending', 'processing', 'delivered');

-- Table des Commandes
CREATE TABLE "Orders" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "full_name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "address" TEXT NOT NULL,
    "city" VARCHAR(255) NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL,
    "status" enum_Orders_status DEFAULT 'pending',
    "tracking_code" VARCHAR(255) UNIQUE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table des Articles de Commande (Liaison Commande - Produit)
CREATE TABLE "OrderItems" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "order_id" UUID REFERENCES "Orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "product_id" UUID REFERENCES "Products"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "customization" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insertion des Catégories (Inspiré de Makerworld / Fekra 3D)
INSERT INTO "Categories" ("id", "name") VALUES 
('11111111-1111-1111-1111-111111111111', 'Figurines & Articulés'),
('22222222-2222-2222-2222-222222222222', 'Décoration & Maison'),
('33333333-3333-3333-3333-333333333333', 'Éclairage & Lightbox'),
('44444444-4444-4444-4444-444444444444', 'Accessoires Gaming & Bureau');

-- Insertion des Produits (Inspiré de Makerworld / Fekra 3D)
INSERT INTO "Products" ("id", "name", "description", "price", "image_url", "stock", "category_id") VALUES 
('10000000-0000-0000-0000-000000000001', 'Dragon Articulé Flexi', 'Un magnifique dragon entièrement articulé, imprimé en 3D sans aucun assemblage. Idéal comme anti-stress ou décoration.', 35.00, 'https://images.unsplash.com/photo-1596752763365-d0c3260b9380?w=500', 15, '11111111-1111-1111-1111-111111111111'),
('10000000-0000-0000-0000-000000000002', 'Buste de Batman HD', 'Buste ultra-détaillé de Batman, imprimé en résine haute résolution. Prêt à être peint.', 60.00, 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=500', 5, '11111111-1111-1111-1111-111111111111'),
('10000000-0000-0000-0000-000000000003', 'Vase Low-Poly Géométrique', 'Vase au design géométrique minimaliste. Parfait pour votre intérieur moderne.', 25.00, 'https://images.unsplash.com/photo-1612152605347-f93296cb657d?w=500', 20, '22222222-2222-2222-2222-222222222222'),
('10000000-0000-0000-0000-000000000004', 'Pot de Plante Baby Groot', 'Adorable petit pot en forme de Baby Groot. Parfait pour les petites succulentes.', 20.00, 'https://images.unsplash.com/photo-1587588049187-ebbf41c107be?w=500', 30, '22222222-2222-2222-2222-222222222222'),
('10000000-0000-0000-0000-000000000005', 'Lampe Lune 3D Texturée', 'Réplique exacte de la lune basée sur les données de la NASA. Émet une lumière douce.', 55.00, 'https://images.unsplash.com/photo-1516104883492-35805566dcbc?w=500', 10, '33333333-3333-3333-3333-333333333333'),
('10000000-0000-0000-0000-000000000006', 'Lightbox Super Mario', 'Boîte lumineuse effet 3D magnifique avec le thème de Super Mario.', 35.00, 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500', 8, '33333333-3333-3333-3333-333333333333'),
('10000000-0000-0000-0000-000000000007', 'Support Casque Crâne', 'Support de casque audio en forme de crâne, parfait pour un setup Gaming.', 40.00, 'https://images.unsplash.com/photo-1615680022647-99c397cbcaaa?w=500', 12, '44444444-4444-4444-4444-444444444444'),
('10000000-0000-0000-0000-000000000008', 'Organisateur Nid d''Abeille', 'Système de rangement modulaire hexagonal pour le bureau.', 18.00, 'https://images.unsplash.com/photo-1521759249117-98782a222378?w=500', 25, '44444444-4444-4444-4444-444444444444');
