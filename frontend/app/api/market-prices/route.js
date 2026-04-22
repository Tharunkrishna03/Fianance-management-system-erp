import { NextResponse } from "next/server";
import { getDashboardMarketData } from "../../dashboard/market-data";

export async function GET() {
  const data = await getDashboardMarketData();
  return NextResponse.json(data);
}
