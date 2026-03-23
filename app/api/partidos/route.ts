import { NextRequest, NextResponse } from "next/server";

const API_KEY = "a19a9613464c44a8b8227a350b68a3c3";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ligaId = searchParams.get("liga");
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");

  try {
    const res = await fetch(
      `https://api.football-data.org/v4/competitions/${ligaId}/matches?dateFrom=${desde}&dateTo=${hasta}`,
      {
        headers: { "X-Auth-Token": API_KEY },
        cache: "no-store",
      }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Error al conectar con la API" }, { status: 500 });
  }
}