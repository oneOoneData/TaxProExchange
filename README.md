# TaxProExchange

A trusted directory for CPAs, EAs, and CTEC preparers to find each other for handoffs, overflow work, and representation.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Deployment**: Vercel (recommended)

## 📁 Project Structure

```
├── app/
│   ├── globals.css      # Global styles with Tailwind
│   ├── layout.tsx       # Root layout component
│   └── page.tsx         # Landing page
├── package.json         # Dependencies
├── tailwind.config.js   # Tailwind configuration
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

## 🔧 Configuration

### Tally Form Integration

Replace `REPLACE_WITH_TALLY_URL` in `app/page.tsx` with your actual Tally form URL:

```tsx
// In the waitlist section
src="https://tally.so/r/YOUR_ACTUAL_FORM_ID"
```

### Customization

- **Colors**: Modify `tailwind.config.js` for brand colors
- **Content**: Update text content in `app/page.tsx`
- **Styling**: Adjust Tailwind classes throughout components

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repository to Vercel
3. Deploy automatically

### Manual Build

```bash
npm run build
npm start
```

## 📝 Next Steps

This is Stage 0 (Landing & Waitlist). Future stages include:

- **Stage 1**: Onboarding & Verification
- **Stage 2**: Search & Profiles  
- **Stage 3**: Connections
- **Stage 4**: Growth & Polish

## 🤝 Contributing

Follow the build plan in `buildplan.md` for development priorities.
