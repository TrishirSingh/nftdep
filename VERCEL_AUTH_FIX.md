# Fix Authentication on Vercel or any hosting service 

## The Problem
Even when signed in on Vercel, the app shows the sign-in page and you can't create NFTs or access protected pages. This works fine on localhost.

## Root Cause
The issue is usually caused by missing or incorrect environment variables on Vercel, particularly `NEXTAUTH_URL` and `NEXTAUTH_SECRET`.

