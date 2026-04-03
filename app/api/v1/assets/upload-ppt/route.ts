import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { created } from "@/lib/utils/api";
import { ValidationError, formatError } from "@/lib/utils/error";
import { addAsset, completeAssetTask, createAssetTask } from "@/lib/templateManagement/store";

export async function POST(request: NextRequest) {
  const auth = authMiddleware(request);
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ValidationError("Field 'file' is required");
    }

    if (!file.name.toLowerCase().endsWith(".pptx")) {
      throw new ValidationError("Only .pptx files are supported");
    }

    const task = await createAssetTask(file.name);

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), "uploads", "assets", "source-ppt");
    await mkdir(uploadDir, { recursive: true });
    const storedName = `${task.id}-${file.name}`;
    const storedPath = path.join(uploadDir, storedName);
    await writeFile(storedPath, buffer);

    // MVP extraction placeholder: record one extracted asset entry from uploaded source.
    await addAsset({
      type: "illustration",
      category: "uploaded-ppt",
      tags: ["uploaded", "ppt"],
      keywords: [file.name.replace(/\.pptx$/i, ""), "template"],
      description: `Extracted from ${file.name}`,
      filePath: `/uploads/assets/source-ppt/${storedName}`,
      fileFormat: "png",
      fileSize: file.size,
      width: 1920,
      height: 1080,
      aspectRatio: "16:9",
      sourcePage: 1,
      sourceFile: file.name,
    });

    const completedTask = await completeAssetTask(task.id);

    return created({
      taskId: task.id,
      status: completedTask?.status || "processing",
      fileName: file.name,
      message: "Upload accepted. Asset extraction task has been queued.",
    });
  } catch (error) {
    const formatted = formatError(error);
    const status = error instanceof ValidationError ? error.statusCode : 500;
    return NextResponse.json(formatted, { status });
  }
}
