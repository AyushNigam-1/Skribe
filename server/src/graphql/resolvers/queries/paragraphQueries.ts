import jsPDF from "jspdf";
import { GraphQLError } from "graphql";
import { ParagraphRepository } from "../../../repositories/paragraphRepository";
import { ScriptRepository } from "../../../repositories/scriptRepository";

interface MyContext {
  redis: any;
  user: any;
  req: any;
}

const enforceRateLimit = async (redis: any, identifier: string, action: string, limit: number, windowSeconds: number) => {
  if (!redis) return;
  const key = `ratelimit:${action}:${identifier}`;
  const currentCount = await redis.incr(key);
  if (currentCount === 1) await redis.expire(key, windowSeconds);
  if (currentCount > limit) {
    throw new GraphQLError(`Too many requests for ${action}. Please try again later.`, {
      extensions: { code: "TOO_MANY_REQUESTS", http: { status: 429 } },
    });
  }
};

const toUnixString = (date: any) => {
  if (!date) return null;
  return new Date(date).getTime().toString();
};

export const paragraphQueries = {
  getParagraphById: async (_: any, { paragraphId }: { paragraphId: string }, context: MyContext) => {
    const ip = context.req?.ip || context.req?.socket?.remoteAddress || "unknown_ip";
    await enforceRateLimit(context.redis, ip, "get_paragraph", 120, 60);

    const cacheKey = `paragraph:${paragraphId}:v3`;
    const cachedParagraph = await context.redis.get(cacheKey);
    if (cachedParagraph) return JSON.parse(cachedParagraph);

    // 🚨 REPOSITORY CALL
    const paragraph = await ParagraphRepository.findByIdWithPopulate(paragraphId);

    if (!paragraph) throw new Error("Paragraph not found");

    const obj: any = paragraph.toObject({ virtuals: true });
    obj.likes = obj.likes?.map((id: any) => id.toString()) || [];
    obj.dislikes = obj.dislikes?.map((id: any) => id.toString()) || [];

    obj.createdAt = toUnixString(obj.createdAt);
    obj.updatedAt = toUnixString(obj.updatedAt);

    if (obj.author) {
      obj.author.createdAt = toUnixString(obj.author.createdAt);
      obj.author.updatedAt = toUnixString(obj.author.updatedAt);
    }

    if (obj.script) {
      obj.script.createdAt = toUnixString(obj.script.createdAt);
      obj.script.updatedAt = toUnixString(obj.script.updatedAt);
      if (obj.script.author) {
        obj.script.author.createdAt = toUnixString(obj.script.author.createdAt);
        obj.script.author.updatedAt = toUnixString(obj.script.author.updatedAt);
      }
    }

    if (obj.comments) {
      obj.comments = obj.comments.map((c: any) => ({
        ...c,
        createdAt: toUnixString(c.createdAt),
        updatedAt: toUnixString(c.updatedAt),
        author: c.author ? {
          ...c.author,
          createdAt: toUnixString(c.author.createdAt),
          updatedAt: toUnixString(c.author.updatedAt),
        } : null,
      }));
    }

    await context.redis.setEx(cacheKey, 3600, JSON.stringify(obj));
    return obj;
  },

  getFilteredRequests: async (_: any, { scriptId, userId, status }: { scriptId: string; userId?: string; status?: string }, context: MyContext) => {
    const ip = context.req?.ip || context.req?.socket?.remoteAddress || "unknown_ip";
    await enforceRateLimit(context.redis, ip, "get_filtered_requests", 60, 60);

    const cacheKey = `script:${scriptId}:reqs:${userId || "all"}:${status || "all"}:v2`;
    const cachedRequests = await context.redis.get(cacheKey);
    if (cachedRequests) return JSON.parse(cachedRequests);

    // 🚨 REPOSITORY CALL
    const paragraphs = await ParagraphRepository.findFilteredRequests(scriptId, userId, status);

    const formattedParagraphs = paragraphs.map((p: any) => ({
      ...p,
      id: p._id?.toString(),
      likes: p.likes?.map((id: any) => id.toString()) || [],
      dislikes: p.dislikes?.map((id: any) => id.toString()) || [],
      createdAt: toUnixString(p.createdAt),
      updatedAt: toUnixString(p.updatedAt),
      author: p.author ? {
        ...p.author,
        id: p.author._id?.toString(),
        createdAt: toUnixString(p.author.createdAt),
        updatedAt: toUnixString(p.author.updatedAt),
      } : null,
      comments: p.comments ? p.comments.map((c: any) => ({
        ...c,
        id: c._id?.toString(),
        createdAt: toUnixString(c.createdAt),
        updatedAt: toUnixString(c.updatedAt),
        author: c.author ? {
          ...c.author,
          id: c.author._id?.toString(),
          createdAt: toUnixString(c.author.createdAt),
          updatedAt: toUnixString(c.author.updatedAt),
        } : null
      })) : []
    }));

    await context.redis.setEx(cacheKey, 300, JSON.stringify(formattedParagraphs));
    return formattedParagraphs;
  },

  getCombinedText: async (_: any, { scriptId }: { scriptId: string }, context: MyContext) => {
    const ip = context.req?.ip || context.req?.socket?.remoteAddress || "unknown_ip";
    await enforceRateLimit(context.redis, ip, "get_combined_text", 120, 60);

    const cacheKey = `script:${scriptId}:combinedText`;
    const cachedText = await context.redis.get(cacheKey);
    if (cachedText) return cachedText;

    // 🚨 REPOSITORY CALL
    const script = await ScriptRepository.findByIdLean(scriptId);
    if (!script) throw new Error("Script not found");

    const text = script.combinedText || "";
    await context.redis.setEx(cacheKey, 3600, text);
    return text;
  },

  getPendingParagraphs: async (_: any, { scriptId }: { scriptId: string }, context: MyContext) => {
    const ip = context.req?.ip || context.req?.socket?.remoteAddress || "unknown_ip";
    await enforceRateLimit(context.redis, ip, "get_pending_paragraphs", 60, 60);

    const cacheKey = `script:${scriptId}:pending:v3`;
    const cachedPending = await context.redis.get(cacheKey);
    if (cachedPending) return JSON.parse(cachedPending);

    // 🚨 REPOSITORY CALL
    const paragraphs = await ParagraphRepository.findPendingByScript(scriptId);

    const formattedParagraphs = paragraphs.map((p: any) => ({
      ...p,
      id: p._id?.toString(),
      createdAt: toUnixString(p.createdAt),
      updatedAt: toUnixString(p.updatedAt),
      author: p.author ? {
        ...p.author,
        id: p.author._id?.toString(),
        createdAt: toUnixString(p.author.createdAt),
        updatedAt: toUnixString(p.author.updatedAt),
      } : null,
    }));

    await context.redis.setEx(cacheKey, 300, JSON.stringify(formattedParagraphs));
    return formattedParagraphs;
  },

  exportDocument: async (_: any, { scriptId, format }: { scriptId: string; format: string }, context: MyContext) => {
    const ip = context.req?.ip || context.req?.socket?.remoteAddress || "unknown_ip";
    await enforceRateLimit(context.redis, ip, "export_document", 10, 60);

    const cacheKey = `script:${scriptId}:exportData`;

    let script;
    const cachedScript = await context.redis.get(cacheKey);

    if (cachedScript) {
      script = JSON.parse(cachedScript);
    } else {
      // 🚨 REPOSITORY CALL
      script = await ScriptRepository.findByIdLean(scriptId);
      if (!script) throw new Error("Script not found");
      await context.redis.setEx(cacheKey, 3600, JSON.stringify(script));
    }

    const sanitizedTitle = script.title.replace(/[<>:"/\\|?*]+/g, "");

    if (format === "txt") {
      return {
        filename: `${sanitizedTitle}.txt`,
        content: script.combinedText || "",
        contentType: "text/plain",
      };
    }

    if (format === "md") {
      return {
        filename: `${sanitizedTitle}.md`,
        content: script.combinedText || "",
        contentType: "text/markdown",
      };
    }

    if (format === "pdf") {
      const doc = new jsPDF();
      const text = script.combinedText || "No content available";

      const pageWidth = doc.internal.pageSize.getWidth() - 20;
      const wrappedText = doc.splitTextToSize(text, pageWidth);
      doc.text(wrappedText, 10, 10);

      const pdfBase64 = doc.output("dataurlstring").split(",")[1];

      return {
        filename: `${sanitizedTitle}.pdf`,
        content: pdfBase64,
        contentType: "application/pdf",
      };
    }

    throw new Error("Invalid format");
  },
};