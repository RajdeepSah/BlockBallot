import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

// Load contract artifact
const contractPath = path.join(process.cwd(), 'artifacts', 'contracts', 'BlockBallotSingle.sol', 'BlockBallotSingle.json');
const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf-8'));

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { positions } = body;

    // Validate input
    if (!positions || !Array.isArray(positions) || positions.length === 0) {
      return NextResponse.json(
        { error: 'Positions array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Extract position names and candidates for each position
    const positionNames: string[] = [];
    const candidatesForPosition: string[][] = [];

    for (const position of positions) {
      if (!position.name) {
        return NextResponse.json(
          { error: 'All positions must have a name' },
          { status: 400 }
        );
      }

      if (!position.candidates || !Array.isArray(position.candidates) || position.candidates.length === 0) {
        return NextResponse.json(
          { error: `Position "${position.name}" must have at least one candidate` },
          { status: 400 }
        );
      }

      const candidateNames = position.candidates.map((c: any) => {
        if (!c.name) {
          throw new Error(`All candidates in "${position.name}" must have a name`);
        }
        return c.name;
      });

      positionNames.push(position.name);
      candidatesForPosition.push(candidateNames);
    }

    // Get environment variables
    const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL;
    const organizerPrivateKey = process.env.ORGANIZER_PRIVATE_KEY;

    if (!sepoliaRpcUrl || !organizerPrivateKey) {
      return NextResponse.json(
        { error: 'Missing environment variables: SEPOLIA_RPC_URL and ORGANIZER_PRIVATE_KEY must be set' },
        { status: 500 }
      );
    }

    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(sepoliaRpcUrl);
    const wallet = new ethers.Wallet(organizerPrivateKey, provider);

    // Create contract factory
    const contractFactory = new ethers.ContractFactory(
      contractArtifact.abi,
      contractArtifact.bytecode,
      wallet
    );

    // Deploy contract
    console.log('Deploying contract with positions:', positionNames);
    console.log('Candidates for each position:', candidatesForPosition);

    const contract = await contractFactory.deploy(positionNames, candidatesForPosition);
    
    // Wait for deployment
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();

    console.log('Contract deployed to:', contractAddress);

    // Generate Sepolia Etherscan URL
    const etherscanUrl = `https://sepolia.etherscan.io/address/${contractAddress}`;

    return NextResponse.json({
      success: true,
      contractAddress,
      etherscanUrl,
      message: 'Contract deployed successfully'
    });

  } catch (error: any) {
    console.error('Deployment error:', error);
    return NextResponse.json(
      {
        error: 'Failed to deploy contract',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

