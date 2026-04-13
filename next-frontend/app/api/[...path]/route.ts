import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: { path: string[] } };

async function proxy(req: NextRequest, { params }: RouteParams) {
  try {
    const backendBase = process.env.BACKEND_API_URL?.trim();

    if (!backendBase) {
      return NextResponse.json(
        {
          error: "Endpoint is not migrated yet and BACKEND_API_URL is not configured.",
          path: `/api/${params.path.join("/")}`,
        },
        { status: 501 }
      );
    }

    const search = new URL(req.url).search;
    const targetUrl = `${backendBase.replace(/\/$/, "")}/api/${params.path.join("/")}${search}`;

    const headers = new Headers(req.headers);
    headers.delete("host");

    const init: RequestInit = {
      method: req.method,
      headers,
      redirect: "manual",
      body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer(),
    };

    const upstream = await fetch(targetUrl, init);
    const contentType = upstream.headers.get("content-type") || "application/json";
    const responseBody = await upstream.arrayBuffer();

    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: {
        "content-type": contentType,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, ctx: RouteParams) {
  return proxy(req, ctx);
}

export async function POST(req: NextRequest, ctx: RouteParams) {
  return proxy(req, ctx);
}

export async function PUT(req: NextRequest, ctx: RouteParams) {
  return proxy(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: RouteParams) {
  return proxy(req, ctx);
}

export async function DELETE(req: NextRequest, ctx: RouteParams) {
  return proxy(req, ctx);
}

export async function OPTIONS(req: NextRequest, ctx: RouteParams) {
  return proxy(req, ctx);
}
