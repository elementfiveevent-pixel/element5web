import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class HighlightService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    // Return all highlights, sorted by newest first
    return this.prisma.highlight.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async create(imageUrl: string, description: string) {
    return this.prisma.highlight.create({
      data: {
        imageUrl,
        description,
      },
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.highlight.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException("Highlight not found");
    }
    return this.prisma.highlight.delete({
      where: { id },
    });
  }
}
