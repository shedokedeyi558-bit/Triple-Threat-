# BITLYFE - Deployment Guide

## Prerequisites
- Node.js 18+ installed
- Vercel account (free tier available at https://vercel.com)
- Paystack API keys (test and live)
- Backend API deployed and accessible

## Environment Variables

### Development (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_ff4b132ce70431fbd11c18ec3ef8b60c6bbdd45b
```

### Production (Vercel Dashboard)
Set these in your Vercel project settings → Environment Variables:
```
NEXT_PUBLIC_API_URL=https://api.bitlyfe.com (or your backend URL)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_your_production_key
```

## Deploy to Vercel

### Method 1: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy from project root:
```bash
vercel
```

4. Follow the prompts and set up environment variables

### Method 2: Using GitHub (Recommended for continuous deployment)

1. Push code to GitHub:
```bash
git add .
git commit -m "Ready for production deployment"
git push origin main
```

2. Connect to Vercel:
   - Go to https://vercel.com/new
   - Import from Git repository
   - Select your repository
   - Add environment variables
   - Click Deploy

## Backend API Integration

The frontend expects the backend API at `NEXT_PUBLIC_API_URL`. Currently returning empty data.

### API Endpoints needed:
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/games` - List available games
- `GET /api/games/:id` - Get game details
- `POST /api/games/:id/play` - Enter game
- `POST /api/payment/initialize` - Initialize Paystack payment

## Testing with Paystack

### Test Credentials:
- Card Number: `4111 1111 1111 1111`
- Expiry: Any future date
- CVC: Any 3 digits

Test keys are already configured in `.env.local`

## Post-Deployment

1. Verify environment variables are set in Vercel
2. Test authentication flow
3. Test with Paystack test API
4. Monitor logs in Vercel Dashboard
5. When ready for production, update to live Paystack keys

## Troubleshooting

### Build fails
- Check Node version: `node --version` (should be 18+)
- Clear cache: `vercel env pull`

### API errors
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend is running and accessible
- Review Vercel function logs

### Payment issues
- Confirm Paystack keys are correct
- Test with provided test card details
- Check Paystack dashboard for transaction details

## Production Checklist

- [ ] Backend API deployed and tested
- [ ] Paystack live keys obtained
- [ ] Environment variables set in Vercel
- [ ] SSL certificate configured
- [ ] Logging/monitoring setup
- [ ] Error tracking configured
- [ ] Rate limiting implemented
- [ ] CORS configured properly
- [ ] Security headers set
- [ ] Database migrations complete
