import { prisma } from "../../common/database/prisma.js"

export class AuthRepository {
    async findUserByEmail(email: string) {
        return prisma.user.findUnique({
            where: {
                email,
            },
            include: {
                account: true,
            },
        });
    }

    async createAccountWithUser(data: {
        name: string; email: string; passwordHash: string;
    }) {
        return prisma.account.create({
            data: {
                name: data.name,
                users: {
                    create: {
                        email: data.email,
                        passwordHash: data.passwordHash,
                    }
                },
                include: {
                    users:true,
                }
            }
        })
    }
}