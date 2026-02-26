#!/bin/bash

echo "🚀 Setting up Debugg Dashboard Database..."

# Copy .env.example to .env
if [ ! -f .env ]; then
  echo "📝 Creating .env file..."
  cp .env.example .env
  echo "✅ .env file created"
else
  echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
bun run db:generate

# Run database migrations
echo "🗄️  Running database migrations..."
bun run db:migrate

echo ""
echo "✅ Dashboard setup complete!"
echo ""
echo "To start the dashboard:"
echo "  bun run dev"
echo ""
echo "Dashboard will be available at: http://localhost:3001"
