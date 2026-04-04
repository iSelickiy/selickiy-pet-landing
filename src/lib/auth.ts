import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user }) {
      const allowedEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())
      return allowedEmails.includes(user.email || '')
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
}
