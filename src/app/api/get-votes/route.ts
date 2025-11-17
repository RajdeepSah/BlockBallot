import { ethers, Contract, JsonRpcProvider } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import abi from "@abis/BlockBallotSingle.json";

type CandidateTally = {
  name: string;
  votes: string;
};

type PositionResult = {
  name: string;
  candidates: CandidateTally[];
};

export async function GET(request: NextRequest) {
  try {
    // Get contract address from query parameter
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get("contractAddress");

    if (!contractAddress) {
      return NextResponse.json(
        { message: "Contract address query parameter is required." },
        { status: 400 }
      );
    }

    // Get environment variables
    const rpcUrl = process.env.SEPOLIA_RPC_URL;

    if (!rpcUrl) {
      return NextResponse.json(
        { message: "Missing environment variable: SEPOLIA_RPC_URL must be set." },
        { status: 500 }
      );
    }

    // Create read-only provider and contract instance
    const provider = new JsonRpcProvider(rpcUrl);
    const contract = new Contract(contractAddress, abi.abi, provider);

    // Fetch the list of positions
    const positions: string[] = await contract.getPositionList();

    if (!positions || positions.length === 0) {
      return NextResponse.json({
        positions: [],
        message: "No positions found in contract."
      });
    }

    // Build results structure with positions and their candidates
    const results: PositionResult[] = [];

    // Loop through each position
    for (const positionName of positions) {
      // Get candidates for this position
      const candidates: string[] = await contract.getCandidateList(positionName);
      
      const candidateTallies: CandidateTally[] = [];

      // Loop through each candidate to get their tally
      for (const candidateName of candidates) {
        const tally: bigint = await contract.getTally(positionName, candidateName);
        candidateTallies.push({
          name: candidateName,
          votes: tally.toString() // Convert BigInt to string
        });
      }

      results.push({
        name: positionName,
        candidates: candidateTallies
      });
    }

    return NextResponse.json({ 
      positions: results,
      contractAddress 
    });
    
  } catch (error: any) {
    console.error("Error fetching votes:", error);
    
    let errorMessage = "Failed to fetch votes.";
    if (error.message) {
      errorMessage = `Failed to fetch votes: ${error.message}`;
    }
    
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}