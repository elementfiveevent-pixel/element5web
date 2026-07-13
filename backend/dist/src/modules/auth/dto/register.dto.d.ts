import { UserRole } from "../../../prisma-stub.ts";
export declare class RegisterDto {
    email: string;
    password: string;
    fullName: string;
    mobileNumber?: string;
    role?: UserRole;
}
