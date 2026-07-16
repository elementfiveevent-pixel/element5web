import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { Pool, PoolClient } from "pg";

const KEY_MAP: Record<string, string> = {
  userid: "userId",
  passwordhash: "passwordHash",
  fullname: "fullName",
  mobilenumber: "mobileNumber",
  profilephotourl: "profilePhotoUrl",
  reputationxp: "reputationXp",
  createdat: "createdAt",
  updatedat: "updatedAt",
  isactive: "isActive",
  isused: "isUsed",
  usedat: "usedAt",
  expiresat: "expiresAt",
  isverified: "isVerified",
  stagename: "stageName",
  portfoliourls: "portfolioUrls",
  availabilitystatus: "availabilityStatus",
  organizerid: "organizerId",
  registrationscount: "registrationsCount",
  startdate: "startDate",
  enddate: "endDate",
  registrationenddate: "registrationEndDate",
  ispaid: "isPaid",
  audienceprice: "audiencePrice",
  artistprice: "artistPrice",
  upiqrurl: "upiQrUrl",
  upivpa: "upiVpa",
  upiid: "upiId",
  artistqrurl: "artistQrUrl",
  audienceqrurl: "audienceQrUrl",
  termsconditions: "termsConditions",
  customfields: "customFields",
  viewscount: "viewsCount",
  paymentscreenshoturl: "paymentScreenshotUrl",
  paymentstatus: "paymentStatus",
  reviewedat: "reviewedAt",
  teamid: "teamId",
  isgroupbooking: "isGroupBooking",
  groupsize: "groupSize",
  baseamount: "baseAmount",
  addonsamount: "addonsAmount",
  totalamount: "totalAmount",
  registrationid: "registrationId",
  qrcode: "qrCode",
  audiovideourl: "audioVideoUrl",
  performanceorder: "performanceOrder",
  voterid: "voterId",
  submissionid: "submissionId",
  judgeid: "judgeId",
  originalityscore: "originalityScore",
  technicalityscore: "technicalityScore",
  engagementscore: "engagementScore",
  followerid: "followerId",
  followingid: "followingId",
  communityid: "communityId",
  joinedat: "joinedAt",
  authorid: "authorId",
  mediaurl: "mediaUrl",
  postid: "postId",
  senderid: "senderId",
  recipientid: "recipientId",
  isread: "isRead",
  ipaddress: "ipAddress",
  useragent: "userAgent",
  targettype: "targetType",
  targetid: "targetId",
  moderatorid: "moderatorId",
  actiontaken: "actionTaken",
  ticketid: "ticketId",
  verificationmethod: "verificationMethod",
  artistprofileid: "artistProfileId",
  totalscore: "totalScore"
};

function mapRowKeys(row: any): any {
  if (!row || typeof row !== "object" || row instanceof Date) return row;
  if (Array.isArray(row)) return row.map(mapRowKeys);

  const mapped: any = {};
  for (const [key, value] of Object.entries(row)) {
    const mappedKey = KEY_MAP[key.toLowerCase()] || key;
    mapped[mappedKey] = mapRowKeys(value);
  }
  return mapped;
}

export class PostgresModel {
  constructor(
    private pool: any,
    private tableName: string,
    private service: any
  ) {
    // Prevent wrapping pool.query multiple times when multiple PostgresModel
    // instances share the same pool (each constructor call would otherwise
    // stack another mapRowKeys layer, causing exponential re-mapping).
    if (!(this.pool as any).__e5_patched) {
      const originalQuery = this.pool.query.bind(this.pool);
      this.pool.query = (async (sql: any, values: any) => {
        const res = await originalQuery(sql, values);
        if (res && res.rows) {
          res.rows = res.rows.map(mapRowKeys);
        }
        return res;
      }) as any;
      (this.pool as any).__e5_patched = true;
    }
  }

  private tableColumns: string[] | null = null;

  async getTableColumns(): Promise<string[]> {
    if (this.tableColumns) return this.tableColumns;
    const res = await this.pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
      [this.tableName]
    );
    const cols = res.rows.map((r: any) => r.column_name);
    this.tableColumns = cols;
    return cols;
  }

  private buildWhere(where: any) {
    if (!where || Object.keys(where).length === 0) {
      return { clause: "", values: [] };
    }

    const clauses: string[] = [];
    const values: any[] = [];
    let placeholderIndex = 1;

    for (const [key, value] of Object.entries(where)) {
      if (value === undefined) continue;

      if (key.includes("_") && typeof value === "object" && value !== null) {
        for (const [subKey, subVal] of Object.entries(value)) {
          clauses.push(`"${subKey}" = $${placeholderIndex++}`);
          values.push(subVal);
        }
      } else if (value === null) {
        clauses.push(`"${key}" IS NULL`);
      } else if (typeof value === "object" && value !== null && !(value instanceof Date)) {
        const operators = Object.keys(value);
        for (const op of operators) {
          const val = (value as any)[op];
          if (op === "in") {
            const placeholders = val.map(() => `$${placeholderIndex++}`).join(", ");
            clauses.push(`"${key}" IN (${placeholders})`);
            values.push(...val);
          } else if (op === "not") {
            if (val === null) {
              clauses.push(`"${key}" IS NOT NULL`);
            } else {
              clauses.push(`"${key}" <> $${placeholderIndex++}`);
              values.push(val);
            }
          } else if (op === "contains") {
            clauses.push(`"${key}" ILIKE $${placeholderIndex++}`);
            values.push(`%${val}%`);
          } else if (op === "mode") {
            // insensitive mode - ignored for simplicity
          } else if (op === "gte") {
            clauses.push(`"${key}" >= $${placeholderIndex++}`);
            values.push(val);
          } else if (op === "lte") {
            clauses.push(`"${key}" <= $${placeholderIndex++}`);
            values.push(val);
          }
        }
      } else {
        clauses.push(`"${key}" = $${placeholderIndex++}`);
        values.push(value);
      }
    }

    return {
      clause: clauses.length > 0 ? "WHERE " + clauses.join(" AND ") : "",
      values,
    };
  }

  private async loadIncludes(rows: any[], include: any) {
    if (!rows || rows.length === 0 || !include) return;

    for (const row of rows) {
      for (const [relation, includeVal] of Object.entries(include)) {
        if (!includeVal) continue;

        if (relation === "roles" && this.tableName === "User") {
          const res = await this.pool.query(
            `SELECT * FROM "RoleAssignment" WHERE "userId" = $1`,
            [row.id]
          );
          row.roles = res.rows;
        } else if (relation === "user" && this.tableName === "RefreshToken") {
          const userRes = await this.pool.query(
            `SELECT * FROM "User" WHERE "id" = $1`,
            [row.userId]
          );
          row.user = userRes.rows[0] || null;
          if (row.user && typeof includeVal === "object" && (includeVal as any).include) {
            await this.service.user.loadIncludes([row.user], (includeVal as any).include);
          }
        } else if (relation === "user" && this.tableName === "RoleAssignment") {
          const userRes = await this.pool.query(
            `SELECT * FROM "User" WHERE "id" = $1`,
            [row.userId]
          );
          row.user = userRes.rows[0] || null;
        } else if (relation === "location" && this.tableName === "Event") {
          const locRes = await this.pool.query(
            `SELECT * FROM "Location" WHERE "eventId" = $1`,
            [row.id]
          );
          row.location = locRes.rows[0] || null;
        } else if (relation === "ticketCategories" && this.tableName === "Event") {
          const catRes = await this.pool.query(
            `SELECT * FROM "TicketCategory" WHERE "eventId" = $1`,
            [row.id]
          );
          row.ticketCategories = catRes.rows;
        } else if (relation === "organizer" && this.tableName === "Event") {
          const orgRes = await this.pool.query(
            `SELECT * FROM "User" WHERE "id" = $1`,
            [row.organizerId]
          );
          row.organizer = orgRes.rows[0] || null;
        } else if (relation === "registrations" && this.tableName === "Event") {
          const regsRes = await this.pool.query(
            `SELECT * FROM "EventRegistration" WHERE "eventId" = $1`,
            [row.id]
          );
          row.registrations = regsRes.rows;
        } else if (relation === "tickets" && this.tableName === "Event") {
          const ticketsRes = await this.pool.query(
            `SELECT * FROM "EventTicket" WHERE "eventId" = $1`,
            [row.id]
          );
          row.tickets = ticketsRes.rows;
        } else if (relation === "checkInAuditLogs" && this.tableName === "Event") {
          const logsRes = await this.pool.query(
            `SELECT * FROM "CheckInAuditLog" WHERE "eventId" = $1 ORDER BY "createdAt" ASC`,
            [row.id]
          );
          row.checkInAuditLogs = logsRes.rows;
        } else if (relation === "event" && this.tableName === "EventRegistration") {
          const eventRes = await this.pool.query(
            `SELECT * FROM "Event" WHERE "id" = $1`,
            [row.eventId]
          );
          row.event = eventRes.rows[0] || null;
        } else if (relation === "user" && this.tableName === "EventRegistration") {
          const userRes = await this.pool.query(
            `SELECT * FROM "User" WHERE "id" = $1`,
            [row.userId]
          );
          row.user = userRes.rows[0] || null;
          if (row.user) {
            const rolesRes = await this.pool.query(
              `SELECT * FROM "RoleAssignment" WHERE "userId" = $1`,
              [row.user.id]
            );
            row.user.roles = rolesRes.rows;
          }
        } else if (relation === "tickets" && this.tableName === "EventRegistration") {
          const ticketsRes = await this.pool.query(
            `SELECT * FROM "EventTicket" WHERE "registrationId" = $1`,
            [row.id]
          );
          row.tickets = ticketsRes.rows;
        } else if (relation === "user" && this.tableName === "StageVerseSubmission") {
          const userRes = await this.pool.query(
            `SELECT * FROM "User" WHERE "id" = $1`,
            [row.userId]
          );
          row.user = userRes.rows[0] || null;
          if (row.user && typeof includeVal === "object" && (includeVal as any).include) {
            await this.service.user.loadIncludes([row.user], (includeVal as any).include);
          }
        } else if (relation === "artistProfile" && this.tableName === "User") {
          const profileRes = await this.pool.query(
            `SELECT * FROM "ArtistProfile" WHERE "userId" = $1`,
            [row.id]
          );
          row.artistProfile = profileRes.rows[0] || null;
        } else if (relation === "user" && this.tableName === "ArtistProfile") {
          const userRes = await this.pool.query(
            `SELECT * FROM "User" WHERE "id" = $1`,
            [row.userId]
          );
          row.user = userRes.rows[0] || null;
        } else if (relation === "achievements" && this.tableName === "ArtistProfile") {
          // ArtistAchievement join table — graceful empty array if table doesn't exist
          try {
            const achRes = await this.pool.query(
              `SELECT * FROM "ArtistAchievement" WHERE "artistProfileId" = $1`,
              [row.id]
            );
            row.achievements = achRes.rows;
          } catch {
            row.achievements = [];
          }
        } else if (relation === "performances" && this.tableName === "ArtistProfile") {
          // Performance records — graceful empty array if table doesn't exist
          try {
            const perfRes = await this.pool.query(
              `SELECT * FROM "Performance" WHERE "artistProfileId" = $1`,
              [row.id]
            );
            row.performances = perfRes.rows;
          } catch {
            row.performances = [];
          }
        } else if (relation === "submission" && this.tableName === "Vote") {
          const subRes = await this.pool.query(
            `SELECT * FROM "StageVerseSubmission" WHERE "id" = $1`,
            [row.submissionId]
          );
          row.submission = subRes.rows[0] || null;
        } else if (relation === "votes" && this.tableName === "StageVerseSubmission") {
          const votesRes = await this.pool.query(
            `SELECT * FROM "Vote" WHERE "submissionId" = $1`,
            [row.id]
          );
          row.votes = votesRes.rows;
        } else if ((relation === "judgeScores" || relation === "scores") && this.tableName === "StageVerseSubmission") {
          const scoresRes = await this.pool.query(
            `SELECT * FROM "JudgeScore" WHERE "submissionId" = $1`,
            [row.id]
          );
          // Support both alias names so callers using either "scores" or "judgeScores" work
          row.judgeScores = scoresRes.rows;
          row.scores = scoresRes.rows;
        } else if (relation === "reporter" && this.tableName === "ModerationReport") {
          const reporterRes = await this.pool.query(
            `SELECT * FROM "User" WHERE "id" = $1`,
            [row.reporterId]
          );
          row.reporter = reporterRes.rows[0] || null;
        } else if (relation === "moderator" && this.tableName === "ModerationReport") {
          if (row.moderatorId) {
            const modRes = await this.pool.query(
              `SELECT * FROM "User" WHERE "id" = $1`,
              [row.moderatorId]
            );
            row.moderator = modRes.rows[0] || null;
          } else {
            row.moderator = null;
          }
        } else if (relation === "user" && this.tableName === "AuditLog") {
          const userRes = await this.pool.query(
            `SELECT * FROM "User" WHERE "id" = $1`,
            [row.userId]
          );
          row.user = userRes.rows[0] || null;
        } else if (relation === "event" && this.tableName === "EventTicket") {
          const eventRes = await this.pool.query(
            `SELECT * FROM "Event" WHERE "id" = $1`,
            [row.eventId]
          );
          row.event = eventRes.rows[0] || null;
          if (row.event && typeof includeVal === "object" && (includeVal as any).include) {
            await this.service.event.loadIncludes([row.event], (includeVal as any).include);
          }
        } else if (relation === "registration" && this.tableName === "EventTicket") {
          const regRes = await this.pool.query(
            `SELECT * FROM "EventRegistration" WHERE "id" = $1`,
            [row.registrationId]
          );
          row.registration = regRes.rows[0] || null;
        } else if (relation === "user" && this.tableName === "EventTicket") {
          const userRes = await this.pool.query(
            `SELECT * FROM "User" WHERE "id" = $1`,
            [row.userId]
          );
          row.user = userRes.rows[0] || null;
        }
        // Gracefully skip unknown relations (sponsors, partners, announcements, media, etc.)
        // so callers don't crash when querying relations not yet modeled
      }
    }
  }

  async findUnique(args?: any) {
    const { clause, values } = this.buildWhere(args?.where);
    const sql = `SELECT * FROM "${this.tableName}" ${clause} LIMIT 1`;
    const res = await this.pool.query(sql, values);
    const row = res.rows[0] || null;
    if (row && args?.include) {
      await this.loadIncludes([row], args.include);
    }
    return row;
  }

  async findFirst(args?: any) {
    const { clause, values } = this.buildWhere(args?.where);
    let orderByClause = "";
    if (args?.orderBy) {
      const parts = Object.entries(args.orderBy).map(([k, v]) => `"${k}" ${String(v).toUpperCase()}`);
      orderByClause = `ORDER BY ${parts.join(", ")}`;
    }
    const sql = `SELECT * FROM "${this.tableName}" ${clause} ${orderByClause} LIMIT 1`;
    const res = await this.pool.query(sql, values);
    const row = res.rows[0] || null;
    if (row && args?.include) {
      await this.loadIncludes([row], args.include);
    }
    return row;
  }

  async findMany(args?: any) {
    const { clause, values } = this.buildWhere(args?.where);
    let orderByClause = "";
    if (args?.orderBy) {
      if (Array.isArray(args.orderBy)) {
        const parts = args.orderBy.map((o: any) => {
          const [k, v] = Object.entries(o)[0];
          return `"${k}" ${String(v).toUpperCase()}`;
        });
        orderByClause = `ORDER BY ${parts.join(", ")}`;
      } else {
        const parts = Object.entries(args.orderBy).map(([k, v]) => `"${k}" ${String(v).toUpperCase()}`);
        orderByClause = `ORDER BY ${parts.join(", ")}`;
      }
    }

    let limitOffset = "";
    const nextValues = [...values];
    if (args?.take !== undefined) {
      nextValues.push(args.take);
      limitOffset += ` LIMIT $${nextValues.length}`;
    }
    if (args?.skip !== undefined) {
      nextValues.push(args.skip);
      limitOffset += ` OFFSET $${nextValues.length}`;
    }

    const sql = `SELECT * FROM "${this.tableName}" ${clause} ${orderByClause} ${limitOffset}`;
    const res = await this.pool.query(sql, nextValues);
    const rows = res.rows;
    if (rows.length > 0 && args?.include) {
      await this.loadIncludes(rows, args.include);
    }
    return rows;
  }

  async create(args?: any) {
    const data = { ...args?.data };
    const cols = await this.getTableColumns();

    if (cols.includes("id") && !data.id) {
      const crypto = require("crypto");
      data.id = crypto.randomUUID();
    }
    if (cols.includes("createdAt") && !data.createdAt) {
      data.createdAt = new Date();
    }
    if (cols.includes("updatedAt") && !data.updatedAt) {
      data.updatedAt = new Date();
    }

    const columns: string[] = [];
    const values: any[] = [];
    const placeholders: string[] = [];
    let placeholderIndex = 1;

    let nestedCreation: (() => Promise<void>) | null = null;

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;

      if (typeof value === "object" && value !== null && !(value instanceof Date) && !Array.isArray(value) && (value as any).create) {
        if (key === "roles") {
          const roleVal = (value as any).create.role;
          nestedCreation = async () => {
            const rolesColsList = await this.service.roleAssignment.getTableColumns();
            const roleId = rolesColsList.includes("id") ? require("crypto").randomUUID() : undefined;
            const now = new Date();
            
            if (roleId) {
              await this.pool.query(
                `INSERT INTO "RoleAssignment" ("id", "userId", "role", "createdAt") VALUES ($1, $2, $3, $4)`,
                [roleId, insertedRow.id, roleVal, now]
              );
            } else {
              await this.pool.query(
                `INSERT INTO "RoleAssignment" ("userId", "role", "createdAt") VALUES ($1, $2, $3)`,
                [insertedRow.id, roleVal, now]
              );
            }
          };
        } else if (key === "location") {
          const locData = { ...(value as any).create };
          nestedCreation = async () => {
            const locColsList = await this.service.location.getTableColumns();
            if (locColsList.includes("id") && !locData.id) {
              const crypto = require("crypto");
              locData.id = crypto.randomUUID();
            }
            const locCols = Object.keys(locData).map(k => `"${k}"`).join(", ");
            const locVals = Object.values(locData);
            const locPlaces = locVals.map((_, i) => `$${i + 2}`).join(", ");
            await this.pool.query(
              `INSERT INTO "Location" ("eventId", ${locCols}) VALUES ($1, ${locPlaces})`,
              [insertedRow.id, ...locVals]
            );
          };
        } else if (key === "ticketCategories") {
          const catsData = (value as any).create;
          nestedCreation = async () => {
            const catColsList = await this.service.ticketCategory.getTableColumns();
            const cats = Array.isArray(catsData) ? catsData : [catsData];
            const now = new Date();
            for (const cat of cats) {
              const catItem = { ...cat };
              if (catColsList.includes("id") && !catItem.id) {
                const crypto = require("crypto");
                catItem.id = crypto.randomUUID();
              }
              if (catColsList.includes("createdAt") && !catItem.createdAt) {
                catItem.createdAt = now;
              }
              if (catColsList.includes("updatedAt") && !catItem.updatedAt) {
                catItem.updatedAt = now;
              }
              const catCols = Object.keys(catItem).map(k => `"${k}"`).join(", ");
              const catVals = Object.values(catItem);
              const catPlaces = catVals.map((_, i) => `$${i + 2}`).join(", ");
              await this.pool.query(
                `INSERT INTO "TicketCategory" ("eventId", ${catCols}) VALUES ($1, ${catPlaces})`,
                [insertedRow.id, ...catVals]
              );
            }
          };
        }
        continue;
      }

      columns.push(`"${key}"`);
      if (typeof value === "object" && value !== null && !(value instanceof Date)) {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
      placeholders.push(`$${placeholderIndex++}`);
    }

    const sql = `INSERT INTO "${this.tableName}" (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`;
    const res = await this.pool.query(sql, values);
    const insertedRow = res.rows[0];

    if (nestedCreation) {
      await nestedCreation();
    }

    if (insertedRow && args?.include) {
      await this.loadIncludes([insertedRow], args.include);
    }
    return insertedRow;
  }

  async update(args?: any) {
    const data = args?.data || {};
    const { clause, values: whereValues } = this.buildWhere(args?.where);
    
    const setClauses: string[] = [];
    const setValues: any[] = [];
    let placeholderIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      if (typeof value === "object" && value !== null && !(value instanceof Date) && !Array.isArray(value)) {
        const ops = Object.keys(value);
        if (ops.includes("increment")) {
          setClauses.push(`"${key}" = "${key}" + $${placeholderIndex++}`);
          setValues.push((value as any).increment);
        }
        continue;
      }
      setClauses.push(`"${key}" = $${placeholderIndex++}`);
      if (typeof value === "object" && value !== null && !(value instanceof Date)) {
        setValues.push(JSON.stringify(value));
      } else {
        setValues.push(value);
      }
    }

    const whereClauseRewritten = clause.replace(/\$(\d+)/g, (_, num) => {
      return `$${parseInt(num) + setValues.length}`;
    });

    const sql = `UPDATE "${this.tableName}" SET ${setClauses.join(", ")} ${whereClauseRewritten} RETURNING *`;
    const res = await this.pool.query(sql, [...setValues, ...whereValues]);
    const updatedRow = res.rows[0] || null;

    if (updatedRow && args?.include) {
      await this.loadIncludes([updatedRow], args.include);
    }
    return updatedRow;
  }

  async delete(args?: any) {
    const { clause, values } = this.buildWhere(args?.where);
    const sql = `DELETE FROM "${this.tableName}" ${clause} RETURNING *`;
    const res = await this.pool.query(sql, values);
    return res.rows[0] || null;
  }

  async upsert(args?: any) {
    const existing = await this.findUnique({ where: args.where });
    if (existing) {
      return this.update({ where: args.where, data: args.update });
    } else {
      return this.create({ data: { ...args.where, ...args.create } });
    }
  }

  async count(args?: any) {
    const { clause, values } = this.buildWhere(args?.where);
    const sql = `SELECT COUNT(*)::integer FROM "${this.tableName}" ${clause}`;
    const res = await this.pool.query(sql, values);
    return res.rows[0]?.count || 0;
  }

  async updateMany(args?: any) {
    const data = args?.data || {};
    const { clause, values: whereValues } = this.buildWhere(args?.where);

    const setClauses: string[] = [];
    const setValues: any[] = [];
    let placeholderIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      setClauses.push(`"${key}" = $${placeholderIndex++}`);
      if (typeof value === "object" && value !== null && !(value instanceof Date)) {
        setValues.push(JSON.stringify(value));
      } else {
        setValues.push(value);
      }
    }

    const whereClauseRewritten = clause.replace(/\$(\d+)/g, (_, num) => {
      return `$${parseInt(num) + setValues.length}`;
    });

    const sql = `UPDATE "${this.tableName}" SET ${setClauses.join(", ")} ${whereClauseRewritten}`;
    const res = await this.pool.query(sql, [...setValues, ...whereValues]);
    return { count: res.rowCount };
  }

  async deleteMany(args?: any) {
    const { clause, values } = this.buildWhere(args?.where);
    const sql = `DELETE FROM "${this.tableName}" ${clause}`;
    const res = await this.pool.query(sql, values);
    return { count: res.rowCount };
  }
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private pool: any;
  private dbConnected = false;

  user: PostgresModel;
  roleAssignment: PostgresModel;
  session: PostgresModel;
  refreshToken: PostgresModel;
  artistProfile: PostgresModel;
  event: PostgresModel;
  location: PostgresModel;
  ticketCategory: PostgresModel;
  eventRegistration: PostgresModel;
  eventTicket: PostgresModel;
  stageVerseSubmission: PostgresModel;
  vote: PostgresModel;
  judgeScore: PostgresModel;
  follow: PostgresModel;
  community: PostgresModel;
  communityMember: PostgresModel;
  post: PostgresModel;
  like: PostgresModel;
  comment: PostgresModel;
  message: PostgresModel;
  notification: PostgresModel;
  auditLog: PostgresModel;
  moderationReport: PostgresModel;
  checkInAuditLog: PostgresModel;
  leaderboardStanding: PostgresModel;
  highlight: PostgresModel;

  constructor() {
    const useSsl = process.env.DATABASE_URL?.includes("supabase.co") || 
                    process.env.DATABASE_URL?.includes("supabase.com") ||
                    process.env.NODE_ENV === "production";
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 5000,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    });

    this.user = new PostgresModel(this.pool, "User", this);
    this.roleAssignment = new PostgresModel(this.pool, "RoleAssignment", this);
    this.session = new PostgresModel(this.pool, "Session", this);
    this.refreshToken = new PostgresModel(this.pool, "RefreshToken", this);
    this.artistProfile = new PostgresModel(this.pool, "ArtistProfile", this);
    this.event = new PostgresModel(this.pool, "Event", this);
    this.location = new PostgresModel(this.pool, "Location", this);
    this.ticketCategory = new PostgresModel(this.pool, "TicketCategory", this);
    this.eventRegistration = new PostgresModel(this.pool, "EventRegistration", this);
    this.eventTicket = new PostgresModel(this.pool, "EventTicket", this);
    this.stageVerseSubmission = new PostgresModel(this.pool, "StageVerseSubmission", this);
    this.vote = new PostgresModel(this.pool, "Vote", this);
    this.judgeScore = new PostgresModel(this.pool, "JudgeScore", this);
    this.follow = new PostgresModel(this.pool, "Follow", this);
    this.community = new PostgresModel(this.pool, "Community", this);
    this.communityMember = new PostgresModel(this.pool, "CommunityMember", this);
    this.post = new PostgresModel(this.pool, "Post", this);
    this.like = new PostgresModel(this.pool, "Like", this);
    this.comment = new PostgresModel(this.pool, "Comment", this);
    this.message = new PostgresModel(this.pool, "Message", this);
    this.notification = new PostgresModel(this.pool, "Notification", this);
    this.auditLog = new PostgresModel(this.pool, "AuditLog", this);
    this.moderationReport = new PostgresModel(this.pool, "ModerationReport", this);
    this.checkInAuditLog = new PostgresModel(this.pool, "CheckInAuditLog", this);
    this.leaderboardStanding = new PostgresModel(this.pool, "LeaderboardStanding", this);
    this.highlight = new PostgresModel(this.pool, "Highlight", this);
  }

  async onModuleInit() {
    try {
      const client = await this.pool.connect();
      this.dbConnected = true;
      this.logger.log("✅ PostgreSQL connected directly using pg.Pool");

      // Auto-run schema migrations/alterations for social hub features
      try {
        await client.query(`
          ALTER TABLE "Community" ADD COLUMN IF NOT EXISTS "createdById" UUID REFERENCES "User"("id") ON DELETE SET NULL;
          ALTER TABLE "CommunityMember" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'MEMBER';
          ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "title" TEXT;
          ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "sponsors" JSONB DEFAULT '[]'::jsonb;

          CREATE TABLE IF NOT EXISTS "Highlight" (
            "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "imageUrl" TEXT NOT NULL,
            "description" TEXT NOT NULL,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);
        this.logger.log("✅ PostgreSQL schema updated with Community, Member, Post, Event sponsors, and Highlight table");
      } catch (migrationErr: any) {
        this.logger.warn(`⚠ PostgreSQL migration check failed: ${migrationErr.message}`);
      }

      client.release();
    } catch (err: any) {
      this.logger.warn(
        `⚠ PostgreSQL unavailable: ${err?.message ?? err}. Running without database.`
      );
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  isConnected(): boolean {
    return this.dbConnected;
  }

  async $queryRaw(query: TemplateStringsArray, ...values: any[]) {
    const strings = Array.from(query);
    let sql = "";
    for (let i = 0; i < strings.length; i++) {
      sql += strings[i];
      if (i < values.length) {
        sql += `$${i + 1}`;
      }
    }
    const res = await this.pool.query(sql, values);
    return res.rows;
  }

  async $transaction(callback: (tx: any) => Promise<any>) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      
      const transactionService = {
        pool: client,
        user: new PostgresModel(client, "User", this),
        roleAssignment: new PostgresModel(client, "RoleAssignment", this),
        session: new PostgresModel(client, "Session", this),
        refreshToken: new PostgresModel(client, "RefreshToken", this),
        artistProfile: new PostgresModel(client, "ArtistProfile", this),
        event: new PostgresModel(client, "Event", this),
        location: new PostgresModel(client, "Location", this),
        ticketCategory: new PostgresModel(client, "TicketCategory", this),
        eventRegistration: new PostgresModel(client, "EventRegistration", this),
        eventTicket: new PostgresModel(client, "EventTicket", this),
        stageVerseSubmission: new PostgresModel(client, "StageVerseSubmission", this),
        vote: new PostgresModel(client, "Vote", this),
        judgeScore: new PostgresModel(client, "JudgeScore", this),
        follow: new PostgresModel(client, "Follow", this),
        community: new PostgresModel(client, "Community", this),
        communityMember: new PostgresModel(client, "CommunityMember", this),
        post: new PostgresModel(client, "Post", this),
        like: new PostgresModel(client, "Like", this),
        comment: new PostgresModel(client, "Comment", this),
        message: new PostgresModel(client, "Message", this),
        notification: new PostgresModel(client, "Notification", this),
        auditLog: new PostgresModel(client, "AuditLog", this),
        moderationReport: new PostgresModel(client, "ModerationReport", this),
        checkInAuditLog: new PostgresModel(client, "CheckInAuditLog", this),
        leaderboardStanding: new PostgresModel(client, "LeaderboardStanding", this),
        highlight: new PostgresModel(client, "Highlight", this),
      };

      const result = await callback(transactionService);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}
