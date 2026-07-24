import dotenv from 'dotenv';

dotenv.config()

export const env = {
    port: Number(process.env.PORT) || 5000,
    jwtSecret: process.env.JWT_SECRET!,
    databaseUrl: process.env.DATABASE_URL!,
}