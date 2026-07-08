"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const bcrypt = __importStar(require("bcrypt"));
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log("🌱 Starting database seeding...");
    const permissionsList = [
        { action: "user:view", description: "View user profiles" },
        { action: "user:edit", description: "Edit own user profile" },
        { action: "admin:moderate", description: "Moderate content and users" },
        { action: "event:create", description: "Create new events" },
        { action: "event:publish", description: "Publish draft events" },
        { action: "event:register", description: "Register for events" },
        { action: "ticket:checkin", description: "Check in attendees at venues" },
        { action: "vote:cast", description: "Cast votes for performers" },
        { action: "score:submit", description: "Submit judge score sheets" },
        { action: "community:post", description: "Write posts in guild channels" },
    ];
    console.log("Upserting permissions...");
    for (const perm of permissionsList) {
        await prisma.permission.upsert({
            where: { action: perm.action },
            update: { description: perm.description },
            create: perm,
        });
    }
    const achievements = [
        {
            title: "Rising Star",
            description: "Received over 100 votes in a single StageVerse show.",
            badgeIconUrl: "https://res.cloudinary.com/element5/image/upload/v1/badges/rising-star.png",
            xpReward: 100,
        },
        {
            title: "Mainstage Performer",
            description: "Successfully performed on a major festival stage.",
            badgeIconUrl: "https://res.cloudinary.com/element5/image/upload/v1/badges/mainstage.png",
            xpReward: 250,
        },
        {
            title: "Master Collaborator",
            description: "Completed 5 collaboration projects with other artists.",
            badgeIconUrl: "https://res.cloudinary.com/element5/image/upload/v1/badges/collaborator.png",
            xpReward: 150,
        },
        {
            title: "Crowd Favorite",
            description: "Achieved first place in an audience vote category.",
            badgeIconUrl: "https://res.cloudinary.com/element5/image/upload/v1/badges/crowd-fav.png",
            xpReward: 300,
        },
    ];
    console.log("Upserting achievements...");
    for (const ach of achievements) {
        await prisma.achievement.upsert({
            where: { title: ach.title },
            update: {
                description: ach.description,
                badgeIconUrl: ach.badgeIconUrl,
                xpReward: ach.xpReward,
            },
            create: ach,
        });
    }
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash("Element5AdminSecure2026!", salt);
    const userPasswordHash = await bcrypt.hash("Element5CreatorPass2026!", salt);
    console.log("Upserting seed users...");
    const superAdmin = await prisma.user.upsert({
        where: { email: "admin@element5.com" },
        update: {},
        create: {
            email: "admin@element5.com",
            passwordHash: adminPasswordHash,
            fullName: "Alex Sterling (Super Admin)",
            mobileNumber: "+1555019901",
            status: client_1.UserStatus.ACTIVE,
            roles: {
                create: { role: client_1.UserRole.SUPER_ADMIN },
            },
        },
    });
    const organizer = await prisma.user.upsert({
        where: { email: "organizer@element5.com" },
        update: {},
        create: {
            email: "organizer@element5.com",
            passwordHash: userPasswordHash,
            fullName: "Maya Lin (Event Organizer)",
            mobileNumber: "+1555019902",
            status: client_1.UserStatus.ACTIVE,
            roles: {
                create: { role: client_1.UserRole.ORG_ADMIN },
            },
        },
    });
    const artist1 = await prisma.user.upsert({
        where: { email: "artist1@element5.com" },
        update: {},
        create: {
            email: "artist1@element5.com",
            passwordHash: userPasswordHash,
            fullName: "DJ Zenith",
            mobileNumber: "+1555019903",
            status: client_1.UserStatus.ACTIVE,
            reputationXp: 120,
            roles: {
                create: { role: client_1.UserRole.ARTIST },
            },
            artistProfile: {
                create: {
                    stageName: "DJ Zenith",
                    biography: "Electronic music producer specializing in progressive house and techno.",
                    genres: ["Electronic", "Techno", "House"],
                    skills: ["Music Production", "DJing", "Ableton Live"],
                    languages: ["English"],
                    portfolioUrls: ["https://soundcloud.com/djzenith", "https://youtube.com/djzenith"],
                    isVerified: true,
                },
            },
        },
    });
    const artist2 = await prisma.user.upsert({
        where: { email: "artist2@element5.com" },
        update: {},
        create: {
            email: "artist2@element5.com",
            passwordHash: userPasswordHash,
            fullName: "Sarah Chen",
            mobileNumber: "+1555019904",
            status: client_1.UserStatus.ACTIVE,
            reputationXp: 80,
            roles: {
                create: { role: client_1.UserRole.ARTIST },
            },
            artistProfile: {
                create: {
                    stageName: "陈Sora",
                    biography: "Visual designer and 3D digital artist mapping cyberpunk aesthetics.",
                    genres: ["Visual Arts", "3D Modeling", "Digital Painting"],
                    skills: ["Blender", "Unreal Engine", "Substance Painter"],
                    languages: ["English", "Mandarin"],
                    portfolioUrls: ["https://artstation.com/sora_chen"],
                    isVerified: true,
                },
            },
        },
    });
    const judge = await prisma.user.upsert({
        where: { email: "judge@element5.com" },
        update: {},
        create: {
            email: "judge@element5.com",
            passwordHash: userPasswordHash,
            fullName: "Marcus Aurelius (Chief Judge)",
            mobileNumber: "+1555019905",
            status: client_1.UserStatus.ACTIVE,
            roles: {
                create: { role: client_1.UserRole.JUDGE },
            },
        },
    });
    const audience = await prisma.user.upsert({
        where: { email: "fan@element5.com" },
        update: {},
        create: {
            email: "fan@element5.com",
            passwordHash: userPasswordHash,
            fullName: "John Doe (Fan)",
            mobileNumber: "+1555019906",
            status: client_1.UserStatus.ACTIVE,
            roles: {
                create: { role: client_1.UserRole.AUDIENCE },
            },
        },
    });
    const categoriesList = [
        "Electronic Music",
        "Digital Art",
        "Street Dance",
        "Generative AI",
        "Indie Pop",
        "VJing & Lights",
    ];
    console.log("Upserting categories...");
    for (const catName of categoriesList) {
        await prisma.category.upsert({
            where: { name: catName },
            update: {},
            create: { name: catName },
        });
    }
    const tagsList = [
        "Cyberpunk",
        "LiveSet",
        "3DRendering",
        "FutureBass",
        "Interactive",
    ];
    console.log("Upserting tags...");
    for (const tagName of tagsList) {
        await prisma.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName },
        });
    }
    console.log("Upserting demo StageVerse Event...");
    const event = await prisma.event.upsert({
        where: { slug: "stageverse-nexus-2026" },
        update: {},
        create: {
            title: "StageVerse Nexus 2026",
            description: "The flagship electronic music and 3D visual competition of Element 5.",
            slug: "stageverse-nexus-2026",
            category: client_1.EventCategory.STAGEVERSE,
            startDate: new Date("2026-10-15T18:00:00Z"),
            endDate: new Date("2026-10-15T23:00:00Z"),
            registrationEndDate: new Date("2026-10-10T23:59:59Z"),
            isPaid: true,
            price: 25.00,
            upiVpa: "element5@upi",
            upiQrUrl: "https://res.cloudinary.com/element5/image/upload/v1/qr/demo-payment-qr.png",
            maxCapacity: 500,
            status: "PUBLISHED",
            organizerId: organizer.id,
            location: {
                create: {
                    venueName: "Nexus Digital Dome",
                    venueAddress: "404 Hyperplane Way, Sector 5",
                    city: "San Francisco",
                    state: "California",
                    latitude: 37.7749,
                    longitude: -122.4194,
                },
            },
            ticketCategories: {
                createMany: {
                    data: [
                        { name: "General Admission", price: 25.00, maxCapacity: 400 },
                        { name: "VIP Backstage Pass", price: 75.00, maxCapacity: 100 },
                    ],
                },
            },
        },
    });
    const dbCategory = await prisma.category.findUnique({ where: { name: "Electronic Music" } });
    if (dbCategory) {
        await prisma.categoryAssignment.upsert({
            where: { eventId_categoryId: { eventId: event.id, categoryId: dbCategory.id } },
            update: {},
            create: { eventId: event.id, categoryId: dbCategory.id },
        });
    }
    console.log("Upserting demo StageVerse Submission...");
    const submission = await prisma.stageVerseSubmission.upsert({
        where: { eventId_userId: { eventId: event.id, userId: artist1.id } },
        update: {},
        create: {
            eventId: event.id,
            userId: artist1.id,
            trackTitle: "Zenith Overdrive (Live Set)",
            audioVideoUrl: "https://res.cloudinary.com/element5/video/upload/v1/submissions/zenith-overdrive.mp4",
            performanceOrder: 1,
            status: "APPROVED",
        },
    });
    console.log("Upserting demo Judge Score...");
    await prisma.judgeScore.upsert({
        where: { submissionId_judgeId: { submissionId: submission.id, judgeId: judge.id } },
        update: {},
        create: {
            submissionId: submission.id,
            judgeId: judge.id,
            originalityScore: 9,
            technicalityScore: 8,
            engagementScore: 9,
            feedback: "Spectacular spatial audio mapping and drop transitions.",
        },
    });
    console.log("Upserting demo Vote...");
    await prisma.vote.upsert({
        where: { submissionId_voterId: { submissionId: submission.id, voterId: audience.id } },
        update: {},
        create: {
            submissionId: submission.id,
            voterId: audience.id,
            weight: 1,
        },
    });
    console.log("Upserting demo Community Guild & Post...");
    const community = await prisma.community.upsert({
        where: { name: "Audio Engineers" },
        update: {},
        create: {
            name: "Audio Engineers",
            description: "Discussions on synth architecture, mixing, and mastering.",
            createdById: superAdmin.id,
        },
    });
    await prisma.communityMember.upsert({
        where: { communityId_userId: { communityId: community.id, userId: artist1.id } },
        update: {},
        create: {
            communityId: community.id,
            userId: artist1.id,
            role: "MODERATOR",
        },
    });
    const post = await prisma.post.create({
        data: {
            communityId: community.id,
            authorId: artist1.id,
            title: "My custom patch library for StageVerse Live",
            content: "Sharing my Serum presets used in the Zenith Live Set. Drop your questions below!",
        },
    });
    await prisma.comment.create({
        data: {
            postId: post.id,
            authorId: artist2.id,
            content: "These wave tables are clean. Thanks for sharing sora!",
        },
    });
    console.log("🌱 Database seeding completed successfully!");
}
main()
    .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map